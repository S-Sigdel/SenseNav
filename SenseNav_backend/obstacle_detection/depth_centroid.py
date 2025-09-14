#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import argparse
import time
import cv2
import numpy as np
import torch
from opencv import load_midas, colorize_depth, make_intrinsics, backproject

def find_most_intense_blue_centroid(depth_map, min_area=50, debug=False,
                                    inverse_depth=True,  # True for MiDaS: larger = closer
                                    top_percent=1.0,     # take closest X% of pixels
                                    morph_kernel=3):
    """
    Find centroid of the *closest* region in a depth-like map.
    Works whether values are inverse-depth (MiDaS) or metric depth.

    Returns: (cx, cy, depth_val, area, bbox) or None
    """
    d = depth_map.astype(np.float32)
    if not np.isfinite(d).any():
        return None

    # Normalize ignoring NaN/inf
    finite = np.isfinite(d)
    if not finite.any():
        return None
    dmin, dmax = np.nanmin(d), np.nanmax(d)
    if dmax - dmin < 1e-6:
        return None

    # "Closeness" scalar: higher = closer
    # MiDaS (inverse depth): closer → larger values → use d directly
    # Metric depth: closer → smaller values → use -d
    closeness = d if inverse_depth else (-d)

    # Threshold by percentile: keep top X% as "closest band"
    thr = np.nanpercentile(closeness[finite], 100.0 - top_percent)
    mask = (closeness >= thr) & finite

    # Morphological cleanup
    if morph_kernel and morph_kernel > 1:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (morph_kernel, morph_kernel))
        mask = cv2.morphologyEx(mask.astype(np.uint8)*255, cv2.MORPH_OPEN, k, iterations=1)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k, iterations=1)
    else:
        mask = (mask.astype(np.uint8) * 255)

    # Connected components (more stable than contours for noisy masks)
    num, labels, stats, centroids = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if num <= 1:
        return None

    # Skip label 0 (background); pick largest by area
    areas = stats[1:, cv2.CC_STAT_AREA]
    best_idx_rel = np.argmax(areas)
    area = int(areas[best_idx_rel])
    if area < min_area:
        return None

    best_idx = best_idx_rel + 1
    cx, cy = centroids[best_idx]
    cx_i, cy_i = int(round(cx)), int(round(cy))

    # Bounding box (x, y, w, h)
    x, y, w, h = stats[best_idx, cv2.CC_STAT_LEFT], stats[best_idx, cv2.CC_STAT_TOP], \
                 stats[best_idx, cv2.CC_STAT_WIDTH], stats[best_idx, cv2.CC_STAT_HEIGHT]

    # Depth value at centroid (fall back to median inside bbox if NaN)
    depth_val = depth_map[cy_i, cx_i]
    if not np.isfinite(depth_val):
        roi = depth_map[y:y+h, x:x+w]
        depth_val = np.nanmedian(roi[np.isfinite(roi)]) if np.isfinite(roi).any() else float("nan")

    if debug:
        print(f"[blue] area={area}, centroid=({cx_i},{cy_i}), depth={depth_val:.4f}, "
              f"thr={thr:.4f}, inverse_depth={inverse_depth}")

    return cx_i, cy_i, float(depth_val), area, (int(x), int(y), int(w), int(h))

def main():
    parser = argparse.ArgumentParser(description='Real-time depth estimation with obstacle centroid detection')
    parser.add_argument('--camera', type=int, default=0, help='Camera index')
    parser.add_argument('--width', type=int, default=320, help='Camera width')
    parser.add_argument('--height', type=int, default=240, help='Camera height')
    parser.add_argument('--model', type=str, default='MiDaS_small', help='MiDaS model type')
    parser.add_argument('--skip', type=int, default=3, help='Process every Nth frame')
    parser.add_argument('--min_depth', type=float, default=0.05, help='Minimum depth threshold (meters) - not used in relative mode')
    parser.add_argument('--max_depth', type=float, default=5.0, help='Maximum depth threshold (meters) - not used in relative mode')
    parser.add_argument('--min_area', type=int, default=50, help='Minimum obstacle area (pixels)')
    parser.add_argument('--debug', action='store_true', help='Enable debug output')
    
    args = parser.parse_args()
    
    # Set device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")
    
    # Load MiDaS model
    model, transform = load_midas(args.model, device=device)
    
    # Initialize camera
    cap = cv2.VideoCapture(args.camera)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, args.width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, args.height)
    
    if not cap.isOpened():
        print("Error: Could not open camera")
        return
    
    # Create intrinsic matrix
    K = make_intrinsics(args.width, args.height)
    
    frame_count = 0
    last_depth = None
    start_time = time.time()
    
    print("Starting depth estimation with obstacle centroid detection...")
    print("Press ESC to quit")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_count += 1
        
        # Process depth every Nth frame
        if frame_count % args.skip == 0:
            # Preprocess frame
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb_resized = cv2.resize(rgb, (384, 384))
            rgb_tensor = transform(rgb_resized).to(device)
            
            # Run depth estimation
            with torch.no_grad():
                depth = model(rgb_tensor)
                depth = depth.squeeze().cpu().numpy()
                depth = cv2.resize(depth, (args.width, args.height))
            
            last_depth = depth
        
        if last_depth is not None:
            centroid_info = find_most_intense_blue_centroid(
                last_depth,
                min_area=args.min_area,
                debug=args.debug,
                inverse_depth=True,     # MiDaS: True; set False for metric depth maps
                top_percent=1.0,        # try 0.5–2.0 depending on noise
                morph_kernel=3
            )

            depth_colored = colorize_depth(last_depth)
            frame_resized = cv2.resize(frame, (args.width, args.height))
            combined = np.hstack([frame_resized, depth_colored])

            if centroid_info:
                cx, cy, depth, area, (bx, by, bw, bh) = centroid_info

                # IMPORTANT: draw on the depth panel (right half) => add x-offset
                xoff = args.width
                cv2.circle(combined, (cx + xoff, cy), 10, (0, 255, 0), -1)
                cv2.circle(combined, (cx + xoff, cy), 15, (0, 0, 255), 2)
                cv2.rectangle(combined, (bx + xoff, by), (bx + xoff + bw, by + bh), (0, 255, 255), 2)

                cv2.putText(combined, f"Centroid: ({cx},{cy})", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.putText(combined, f"Depth: {depth:.2f}", (10, 60),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.putText(combined, f"Area: {area}px", (10, 90),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            else:
                # Fallback: closest pixel (remember the x-offset too)
                if np.isfinite(last_depth).any():
                    min_idx = np.nanargmax(last_depth) if True else np.nanargmin(last_depth)
                    # ^ use argmax for MiDaS (inverse_depth=True), argmin for metric depth
                    yy, xx = np.unravel_index(min_idx, last_depth.shape)
                    xoff = args.width
                    cv2.circle(combined, (xx + xoff, yy), 8, (255, 0, 255), -1)
                    cv2.circle(combined, (xx + xoff, yy), 12, (255, 255, 0), 2)
                    cv2.putText(combined, f"Closest: ({xx},{yy})", (10, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 255), 2)
            
            # Calculate and display FPS
            if frame_count % 30 == 0:
                elapsed_time = time.time() - start_time
                fps = frame_count / elapsed_time
                print(f"FPS: {fps:.1f}")
            
            # Display
            cv2.imshow('RGB | Depth with Centroid', combined)
        
        # Check for exit
        if cv2.waitKey(1) & 0xFF == 27:  # ESC key
            break
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
