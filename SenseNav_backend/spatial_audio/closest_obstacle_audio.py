import numpy as np
from scipy.signal import resample
from scipy.io.wavfile import write
import sounddevice as sd

# ---------- geometry ----------
def nearest_by_sector(points, ignore_behind=False):
    """
    Nearest obstacles by sector:
      'FL' (front-left), 'FR' (front-right),
      'BL' (back-left),  'BR' (back-right),
      'UP', 'DOWN'
    """
    if points.size == 0:
        return {}

    P = points.copy()
    if ignore_behind:
        P = P[P[:,0] > 0]

    if P.size == 0:
        return {}

    d  = np.linalg.norm(P, axis=1)
    az = np.arctan2(P[:,1], P[:,0])                       # + left, - right
    el = np.arctan2(P[:,2], np.hypot(P[:,0], P[:,1]))     # + up, - down

    # 25° elevation deadband for "level" sectors
    el_band = np.deg2rad(25)

    sectors = {
        "FL": lambda a,e: (P[:,0] > 0) & (a >=  0) & (np.abs(e) < el_band),
        "FR": lambda a,e: (P[:,0] > 0) & (a <   0) & (np.abs(e) < el_band),
        "BL": lambda a,e: (P[:,0] <= 0) & (a >= 0) & (np.abs(e) < el_band),
        "BR": lambda a,e: (P[:,0] <= 0) & (a <  0) & (np.abs(e) < el_band),
        "UP":   lambda a,e: (e >=  el_band),
        "DOWN": lambda a,e: (e <= -el_band),
    }

    out = {}
    for name, mask_fn in sectors.items():
        mask = mask_fn(az, el)
        if np.any(mask):
            sel = np.where(mask)[0][np.argmin(d[mask])]
            out[name] = (d[sel], az[sel], el[sel])
    return out

# Legacy function for backward compatibility
def nearest_obstacle(points):
    sectors = nearest_by_sector(points, ignore_behind=False)
    if not sectors:
        return None, None, None
    # Return the closest obstacle from any sector
    closest = min(sectors.values(), key=lambda x: x[0])
    return closest

def generate_boundary_points(bbox, depth_value, num_points=16):
    """
    Generate points ONLY along the bounding box boundary surface for spatial audio.
    These points represent the actual surface area of the obstacle boundary.
    
    Args:
        bbox: dict with 'x', 'y', 'width', 'height' (in pixels)
        depth_value: depth value for the obstacle
        num_points: number of points to generate around the boundary
    
    Returns:
        numpy array of 3D points ONLY on the boundary surface
    """
    if not bbox or bbox['width'] <= 0 or bbox['height'] <= 0:
        return np.array([])
    
    x, y, w, h = bbox['x'], bbox['y'], bbox['width'], bbox['height']
    
    # Generate points ONLY on the boundary perimeter (surface area)
    points = []
    
    # Calculate points per edge (ensure we have at least 4 points total)
    points_per_edge = max(1, num_points // 4)
    
    # Top edge (y = y, x varies from x to x+w)
    for i in range(points_per_edge):
        if points_per_edge == 1:
            px = x + w/2  # Center of top edge
        else:
            px = x + (w * i / (points_per_edge - 1))
        points.append([px, y, depth_value])
    
    # Right edge (x = x+w, y varies from y to y+h)
    for i in range(points_per_edge):
        if points_per_edge == 1:
            py = y + h/2  # Center of right edge
        else:
            py = y + (h * i / (points_per_edge - 1))
        points.append([x + w, py, depth_value])
    
    # Bottom edge (y = y+h, x varies from x+w to x)
    for i in range(points_per_edge):
        if points_per_edge == 1:
            px = x + w/2  # Center of bottom edge
        else:
            px = x + w - (w * i / (points_per_edge - 1))
        points.append([px, y + h, depth_value])
    
    # Left edge (x = x, y varies from y+h to y)
    for i in range(points_per_edge):
        if points_per_edge == 1:
            py = y + h/2  # Center of left edge
        else:
            py = y + h - (h * i / (points_per_edge - 1))
        points.append([x, py, depth_value])
    
    return np.array(points)

def process_boundary_obstacle(bbox, depth_value, image_width, image_height, focal_length=None):
    """
    Process obstacle boundary data and return spatial audio information.
    Audio will ONLY come from the boundary surface area points.
    
    Args:
        bbox: dict with 'x', 'y', 'width', 'height' (in pixels)
        depth_value: depth value for the obstacle
        image_width: width of the image
        image_height: height of the image
        focal_length: focal length for 3D projection (optional)
    
    Returns:
        dict with spatial audio information ONLY for boundary surface points
    """
    if not bbox or bbox['width'] <= 0 or bbox['height'] <= 0:
        return {"obstacles": {}, "targets": [], "message": "Invalid bounding box"}
    
    # Generate boundary surface points ONLY
    boundary_points = generate_boundary_points(bbox, depth_value, num_points=16)
    
    if boundary_points.size == 0:
        return {"obstacles": {}, "targets": [], "message": "No boundary surface points generated"}
    
    # Convert pixel coordinates to 3D coordinates
    # Assuming camera is at origin looking down +Z axis
    if focal_length is None:
        focal_length = max(image_width, image_height)  # Simple focal length estimate
    
    # Convert to 3D coordinates (camera coordinate system)
    # X: left-right, Y: up-down, Z: depth
    cx, cy = image_width / 2, image_height / 2
    
    # Convert pixel coordinates to normalized coordinates, then to 3D
    # ONLY using boundary surface points
    normalized_points = boundary_points.copy()
    normalized_points[:, 0] = (boundary_points[:, 0] - cx) / focal_length  # X
    normalized_points[:, 1] = (boundary_points[:, 1] - cy) / focal_length  # Y
    normalized_points[:, 2] = depth_value  # Z (depth)
    
    # Find nearest obstacles by sector using ONLY boundary surface points
    obstacles = nearest_by_sector(normalized_points, ignore_behind=False)
    
    if not obstacles:
        return {"obstacles": {}, "targets": [], "message": "No obstacles detected in boundary surface"}
    
    # Generate spatial audio layers from boundary surface points ONLY
    layers = spatial_layers_from_pointcloud(normalized_points)
    
    # Choose targets for audio generation from boundary surface
    targets = choose_targets(obstacles, max_targets=3)
    
    return {
        "obstacles": obstacles,
        "targets": targets,
        "layers": layers,
        "boundary_surface_points": len(boundary_points),
        "message": f"Processed {len(boundary_points)} boundary surface points ONLY"
    }

# ---------- cue mapping ----------
def distance_to_params(r, r_min=0.3, r_max=4.0):
    r = np.clip(r, r_min, r_max)
    # closer -> higher beep rate, higher pitch, louder
    rate_hz = np.interp(r, [r_min, r_max], [2.0, 0.5])   # reduced beep rate (less pulsing)
    freq_hz = np.interp(r, [r_min, r_max], [800, 300])   # reduced pitch range
    gain    = np.interp(r, [r_min, r_max], [0.9, 0.4])
    return rate_hz, freq_hz, gain

# ---------- simple binaural panner (ILD + ITD) ----------
def pan_stereo(signal, az, el, fs, head_width=0.18):
    """
    az: radians (0 = straight ahead; + left, - right)
    el: radians (0 = ear level; + up, - down)
    ILD: cosine law; ITD: simple head-shadow delay; elevation filtering
    """
    # Improved Interaural Level Difference (ILD)
    # Convert azimuth to pan value: negative az = right, positive az = left
    pan = -np.sin(az)  # Flip sign: negative az (right) -> positive pan (right channel)
    
    # Equal power panning: pan = -1 (left), pan = 0 (center), pan = 1 (right)
    theta = (pan + 1.0) * (np.pi / 4.0)  # Map [-1,1] to [0, pi/2]
    left_gain = np.cos(theta)   # Higher when pan < 0 (left)
    right_gain = np.sin(theta)  # Higher when pan > 0 (right)

    # Elevation effects
    elevation_factor = np.cos(el)  # Reduces volume for extreme up/down
    
    # Frequency filtering for elevation cues
    if el > 0.1:  # Above (positive elevation)
        # Gentler high-pass filter effect (less harsh)
        from scipy.signal import butter, filtfilt
        b, a = butter(2, 1500, btype='high', fs=fs)  # Lower cutoff, gentler slope
        signal = filtfilt(b, a, signal)
        elevation_factor *= (1.0 + 0.2 * np.sin(el))  # Reduced volume boost
    elif el < -0.1:  # Below (negative elevation)
        # Aggressive low-pass + bass boost for "underground" feel
        from scipy.signal import butter, filtfilt
        # Very low cutoff for muffled effect
        b_low, a_low = butter(4, 800, btype='low', fs=fs)
        signal = filtfilt(b_low, a_low, signal)
        
        # Add bass resonance for "underground" rumble
        b_bass, a_bass = butter(2, [100, 300], btype='band', fs=fs)
        bass_signal = filtfilt(b_bass, a_bass, signal)
        signal = 0.6 * signal + 0.4 * bass_signal  # Mix in bass
        
        elevation_factor *= (0.4 + 0.2 * np.cos(abs(el)))  # Much quieter

    # Interaural Time Difference (ITD)
    c = 343.0
    itd = head_width * np.sin(az) / c  # seconds
    delay_samples = int(np.round(abs(itd) * fs))

    # Apply gains with elevation factor
    left = left_gain * signal * elevation_factor
    right = right_gain * signal * elevation_factor
    
    # Apply delay to the ear farther from source
    if itd > 0:  # source to left -> delay right ear
        right = np.pad(right, (delay_samples, 0))
        right = right[:len(signal)]
    elif itd < 0:  # source to right -> delay left ear
        left = np.pad(left, (delay_samples, 0))
        left = left[:len(signal)]

    stereo = np.stack([left, right], axis=1)
    # normalize to avoid clipping
    m = np.max(np.abs(stereo))
    if m > 1e-6:
        stereo /= (m * 1.05)
    return stereo

# ---------- tone generator ----------
def make_beep(freq=800, dur=0.4, fs=48000, rise_fall=0.02):
    t = np.linspace(0, dur, int(fs*dur), endpoint=False)
    s = np.sin(2*np.pi*freq*t)
    # apply short attack/release to avoid clicks
    rf = int(fs*rise_fall)
    env = np.ones_like(s)
    env[:rf] = np.linspace(0, 1, rf)
    env[-rf:] = np.linspace(1, 0, rf)
    return (s * env).astype(np.float32)

# ---------- tone generators by sector ----------
def tone_left(freq, dur=0.5, fs=48000):
    """Left sector tone - warm sawtooth wave"""
    t = np.linspace(0, dur, int(fs*dur), endpoint=False)
    # Sawtooth-like wave with warm harmonics
    tone = np.sin(2*np.pi*freq*t)
    for h in range(2, 4):  # reduced harmonics for cleaner sound
        tone += (0.2/h) * np.sin(2*np.pi*freq*h*t)  # reduced harmonic strength
    tone *= 0.5  # slightly louder
    return apply_fade(tone, fs)

def tone_right(freq, dur=0.5, fs=48000):
    """Right sector tone - square wave (digital/metallic)"""
    t = np.linspace(0, dur, int(fs*dur), endpoint=False)
    # Square wave approximation with odd harmonics
    tone = np.sin(2*np.pi*freq*t)
    for h in range(3, 6, 2):  # reduced odd harmonics for cleaner sound
        tone += (0.25/h) * np.sin(2*np.pi*freq*h*t)  # reduced harmonic strength
    tone *= 0.4  # slightly louder
    return apply_fade(tone, fs)

def tone_up(freq, dur=0.5, fs=48000):
    """Up sector tone - constant frequency with sparkly harmonics"""
    t = np.linspace(0, dur, int(fs*dur), endpoint=False)
    # Constant frequency (no sweep)
    phase = 2*np.pi * freq * t
    tone = np.sin(phase)
    # Add sparkly harmonics
    tone += 0.2 * np.sin(phase * 2) + 0.1 * np.sin(phase * 4)
    tone *= 0.5
    return apply_fade(tone, fs)

def tone_down(freq, dur=0.5, fs=48000):
    """Down sector tone - descending pulse with sub-bass"""
    t = np.linspace(0, dur, int(fs*dur), endpoint=False)
    # Frequency sweep downward
    freq_sweep = freq * (1 - 0.4 * t / dur)  # 40% frequency decrease
    phase = 2*np.pi * np.cumsum(freq_sweep) / fs
    tone = np.sin(phase)
    # Add deep sub-bass pulse
    pulse_rate = 3  # Hz
    pulse = 0.5 + 0.5 * np.sin(2*np.pi*pulse_rate*t)
    sub_bass = 0.6 * np.sin(2*np.pi*(freq*0.25)*t) * pulse
    tone = tone + sub_bass
    tone *= 0.4
    return apply_fade(tone, fs)

def apply_fade(tone, fs, fade_dur=0.05):
    """Apply fade in/out to avoid clicks"""
    fade_samples = int(fs * fade_dur)
    fade_in = np.linspace(0, 1, fade_samples)
    fade_out = np.linspace(1, 0, fade_samples)
    
    tone[:fade_samples] *= fade_in
    tone[-fade_samples:] *= fade_out
    
    return tone.astype(np.float32)

def tremolo(signal, fs, rate):
    """Apply tremolo modulation"""
    t = np.linspace(0, len(signal)/fs, len(signal), endpoint=False)
    mod = 0.5 + 0.5 * np.sin(2*np.pi*rate*t)
    return signal * mod

def darken(sig, fs, cutoff=1200):
    """Darken tone for behind sectors with reverb-like effect"""
    from scipy.signal import butter, filtfilt
    # Low-pass filter
    b, a = butter(2, cutoff, btype='low', fs=fs)
    filtered = filtfilt(b, a, sig)
    
    # Add subtle reverb/echo effect for "behind" feeling
    delay_samples = int(0.08 * fs)  # 80ms delay
    echo = np.zeros_like(filtered)
    echo[delay_samples:] = filtered[:-delay_samples] * 0.3
    
    # Mix original filtered + echo
    result = filtered + echo
    return result * 0.8  # Reduce overall volume

def add_vibrato(sig, fs, rate=4.5, depth=0.15):
    """Add vibrato effect for more distinction"""
    t = np.linspace(0, len(sig)/fs, len(sig), endpoint=False)
    vibrato_mod = 1 + depth * np.sin(2*np.pi*rate*t)
    
    # Simple vibrato approximation by amplitude modulation
    return sig * vibrato_mod

def add_chorus(sig, fs, delay_ms=15, depth=0.3):
    """Add chorus effect for richer sound"""
    delay_samples = int(delay_ms * fs / 1000)
    chorus = np.zeros_like(sig)
    
    if delay_samples < len(sig):
        chorus[delay_samples:] = sig[:-delay_samples] * depth
    
    return sig + chorus

# Legacy function for backward compatibility
def sustained_tone(base_freq, total_dur=3.0, fs=48000, tremolo_rate=None, elevation=0.0):
    """Generate sustained tone with elevation-specific characteristics"""
    if elevation > 0.1:
        tone = tone_up(base_freq, total_dur, fs)
    elif elevation < -0.1:
        tone = tone_down(base_freq, total_dur, fs)
    else:
        tone = tone_left(base_freq, total_dur, fs)
    
    if tremolo_rate is not None:
        tone = tremolo(tone, fs, tremolo_rate)
    
    return tone

# ---------- mixing utilities ----------
def mix_and_limit(stems, limit_db=-3):
    """Mix multiple stereo stems and apply limiting"""
    if not stems:
        return np.zeros((1024, 2), dtype=np.float32)
    
    # Ensure all stems have same length
    max_len = max(len(stem) for stem in stems)
    padded = []
    for stem in stems:
        if len(stem) < max_len:
            pad = np.zeros((max_len - len(stem), stem.shape[1]), dtype=stem.dtype)
            stem = np.vstack([stem, pad])
        padded.append(stem)
    
    # Sum all stems
    mix = np.sum(padded, axis=0)
    
    # Apply soft limiting
    limit_linear = 10**(limit_db/20)
    peak = np.max(np.abs(mix))
    if peak > limit_linear:
        mix *= limit_linear / peak
    
    return mix.astype(np.float32)

# ---------- salience scoring and target selection ----------
def obstacle_score(r, az, el):
    """
    Higher score = more important.
    - Distance: 1/r (closer = higher)
    - Frontal bias: cos(az) clipped at 0 (behind gets 0 frontal weight)
    - Small bonus for elevation cues (UP/DOWN)
    """
    frontal = max(np.cos(az), 0.0)  # 1 front .. 0 side/back
    elevation_bonus = 0.1 if abs(el) > np.deg2rad(25) else 0.0
    return (1.0 / max(r, 1e-6)) * (0.7 + 0.3*frontal) + elevation_bonus

def choose_targets(picked, max_targets=3):
    """
    picked: dict sector -> (r, az, el)
    return: list of (name, r, az, el) sorted by salience (desc)
    """
    scored = []
    for name, (r, az, el) in picked.items():
        scored.append((obstacle_score(r, az, el), name, r, az, el))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [(name, r, az, el) for (_, name, r, az, el) in scored[:max_targets]]

def count_ping(n, fs, gap_ms=120):
    """Announce how many items are in the sweep with n short taps."""
    if n <= 1:
        return np.zeros((0,2), dtype=np.float32)
    dur = 0.08; f = 420
    t = np.linspace(0, dur, int(fs*dur), endpoint=False)
    sig = 0.2*np.sin(2*np.pi*f*t).astype(np.float32)
    sig[:int(0.01*fs)] *= np.linspace(0,1,int(0.01*fs))
    sig[-int(0.02*fs):] *= np.linspace(1,0,int(0.02*fs))
    stereo = np.stack([sig, sig], axis=1)
    gap = np.zeros((int(fs*gap_ms/1000), 2), dtype=np.float32)
    out = []
    for _ in range(n):
        out.append(stereo); out.append(gap)
    return np.concatenate(out, axis=0)

def _sequential_mode_audio(picked, fs, dur, max_targets=3, seg_dur=2.0, gap_ms=300, announce_count=True):
    """
    Plays top-K obstacles one-by-one in a short sweep.
    seg_dur = per-obstacle segment length (seconds)
    """
    targets = choose_targets(picked, max_targets=max_targets)
    k = len(targets)
    if k == 0:
        print("No obstacles to announce.")
        return

    print(f"🧭 SEQUENTIAL MODE: {k} target(s); {seg_dur*1000:.0f} ms each")

    segments = []
    # Optional count preamble
    if announce_count and k > 1:
        segments.append(count_ping(k, fs, gap_ms=gap_ms))

    for (name, r, az, el) in targets:
        rate, f, g = distance_to_params(r)
        # short, distinct cue
        if name == "FL":
            sig = tremolo(tone_left(f, seg_dur, fs), fs, rate) * g
        elif name == "FR":
            sig = tremolo(tone_right(f, seg_dur, fs), fs, rate) * g
        elif name == "BL":
            sig = tremolo(tone_left(max(200, 0.9*f), seg_dur, fs), fs, 0.8*rate) * (0.9*g)
            sig = darken(sig, fs, cutoff=900)
        elif name == "BR":
            sig = tremolo(tone_right(max(180, 0.85*f), seg_dur, fs), fs, 0.7*rate) * (0.85*g)
            sig = darken(sig, fs, cutoff=700)
        elif name == "UP":
            sig = tone_up(max(f, 500), seg_dur, fs) * (0.9*g)
        elif name == "DOWN":
            sig = tone_down(max(200, 0.8*f), seg_dur, fs) * (0.85*g)
        else:
            sig = tremolo(tone_left(f, seg_dur, fs), fs, rate) * g

        stereo = pan_stereo(sig, az=az, el=0, fs=fs)
        segments.append(stereo)
        segments.append(np.zeros((int(fs*gap_ms/1000), 2), dtype=np.float32))

        print(f"{name:5s} | r={r:.2f}m, az={np.degrees(az):+5.1f}°, el={np.degrees(el):+5.1f}°")

    sweep = np.concatenate(segments, axis=0)
    peak = np.max(np.abs(sweep))
    if peak > 0.95:
        sweep *= 0.95 / peak

    print("Playing sequential sweep…")
    sd.play(sweep, fs); sd.wait()
    return sweep

# ---------- 360° spatial audio system ----------
def spatial_layers_from_pointcloud(points, fs=48000, dur=8.0, ignore_behind=False, mode="priority"):
    """Generate spatial audio for detected obstacle sectors.

    Modes:
      - "sequential": top-K, one-by-one short cues (recommended for accessibility)
      - "priority":   focus on the single most critical obstacle (+soft background)
      - "unified":    sequential rhythmic slots for each obstacle (kept for testing)
      - "all":        mix all sectors simultaneously (can be overwhelming)
    """
    picked = nearest_by_sector(points, ignore_behind=ignore_behind)
    if not picked:
        print("No obstacles in sectors.")
        return

    if mode == "sequential":
        # Use sequential mode for both single and multiple obstacles
        return _sequential_mode_audio(
            picked, fs,
            dur=dur,
            max_targets=6,   # Allow all sectors to be heard
            seg_dur=2.0,     # 2000 ms per cue
            gap_ms=300,      # 300ms gap
            announce_count=len(picked) > 1  # Only announce count for multiple
        )

    if mode == "priority" and len(picked) > 1:
        return _priority_mode_audio(picked, fs, dur)
    elif mode == "unified" and len(picked) > 1:
        return _unified_mode_audio(picked, fs, dur)

    # Single obstacle or explicit "all"
    stems = []
    for name, (r, az, el) in picked.items():
        rate, f, g = distance_to_params(r)

        if name == "FL":
            sig = tremolo(tone_left(f, dur, fs), fs, rate * 0.3) * g  # reduced tremolo
            sig = add_vibrato(sig, fs, rate=2.0, depth=0.1)  # reduced vibrato
        elif name == "FR":
            sig = tremolo(tone_right(f, dur, fs), fs, rate * 0.3) * g  # reduced tremolo
            sig = add_chorus(sig, fs, delay_ms=8, depth=0.2)  # reduced chorus
        elif name == "BL":
            sig = tremolo(tone_left(0.9*f, dur, fs), fs, 0.3*rate) * (0.9*g)  # reduced tremolo
            sig = darken(sig, fs, cutoff=900)
        elif name == "BR":
            sig = tremolo(tone_right(0.85*f, dur, fs), fs, 0.3*rate) * (0.85*g)  # reduced tremolo
            sig = darken(sig, fs, cutoff=700)
        elif name == "UP":
            sig = tone_up(max(f, 500), dur, fs) * (0.9*g)
        elif name == "DOWN":
            sig = tone_down(max(200, 0.8*f), dur, fs) * (0.85*g)
        else:
            continue

        stereo = pan_stereo(sig, az=az, el=0, fs=fs)  # Use az for panning, el handled by tone
        stems.append(stereo)

        # Enhanced sector descriptions
        sector_desc = {
            "FL": "Front-Left (warm sawtooth + vibrato)",
            "FR": "Front-Right (metallic square + chorus)", 
            "BL": "Back-Left (dark warm + deep vibrato)",
            "BR": "Back-Right (very dark metallic + long chorus)",
            "UP": "Above (ascending chirp)",
            "DOWN": "Below (descending pulse + sub-bass)"
        }
        
        print(f"{name:5s} | r={r:.2f}m az={np.degrees(az):+5.1f}° "
              f"el={np.degrees(el):+5.1f}° | {sector_desc.get(name, name)}")
        print(f"      | {f:.0f}Hz, trem {rate:.1f}Hz, gain {g:.2f}")

    mix = mix_and_limit(stems)
    print("Playing 360° spatial cue…")
    sd.play(mix, fs); sd.wait()
    return mix

def _priority_mode_audio(picked, fs, dur):
    """Priority mode: Focus on the most critical obstacle"""
    # Priority order: closest first, then UP > DOWN > FL > FR > BL > BR
    priority_order = ["UP", "DOWN", "FL", "FR", "BL", "BR"]
    
    # Find closest obstacle
    closest_name = min(picked.keys(), key=lambda k: picked[k][0])
    closest_r, closest_az, closest_el = picked[closest_name]
    
    # If closest is very close (< 1m), prioritize it regardless
    if closest_r < 1.0:
        primary = closest_name
    else:
        # Otherwise use priority order among available sectors
        primary = next((sector for sector in priority_order if sector in picked), closest_name)
    
    r, az, el = picked[primary]
    rate, f, g = distance_to_params(r)
    
    # Generate primary audio with enhanced prominence
    if primary == "FL":
        sig = tremolo(tone_left(f, dur, fs), fs, rate) * g * 1.2
        sig = add_vibrato(sig, fs, rate=3.5)
    elif primary == "FR":
        sig = tremolo(tone_right(f, dur, fs), fs, rate) * g * 1.2
        sig = add_chorus(sig, fs, delay_ms=12)
    elif primary == "BL":
        sig = tremolo(tone_left(f*0.9, dur, fs), fs, rate*0.7) * g * 1.2
        sig = darken(sig, fs, cutoff=800)
        sig = add_vibrato(sig, fs, rate=2.5, depth=0.25)
    elif primary == "BR":
        sig = tremolo(tone_right(f*0.85, dur, fs), fs, rate*0.6) * g * 1.2
        sig = darken(sig, fs, cutoff=600)
        sig = add_chorus(sig, fs, delay_ms=25, depth=0.4)
    elif primary == "UP":
        sig = tone_up(max(f, 500), dur, fs) * (g*1.1)
    elif primary == "DOWN":
        sig = tone_down(max(200, f*0.8), dur, fs) * (g*1.0)
    
    # Add subtle background indication of other obstacles
    background_level = 0.15
    other_obstacles = [name for name in picked.keys() if name != primary]
    
    if other_obstacles:
        # Create a gentle background "presence" tone
        bg_freq = 200  # Low background frequency
        t = np.linspace(0, dur, int(fs*dur), endpoint=False)
        bg_tone = background_level * np.sin(2*np.pi*bg_freq*t)
        
        # Modulate based on number of other obstacles
        mod_rate = len(other_obstacles) * 0.5  # Faster pulse = more obstacles
        bg_mod = 0.7 + 0.3 * np.sin(2*np.pi*mod_rate*t)
        bg_tone *= bg_mod
        
        sig = sig + apply_fade(bg_tone, fs)
    
    stereo = pan_stereo(sig, az=az, el=0, fs=fs)
    
    print(f"🎯 PRIORITY MODE: Focusing on {primary}")
    print(f"{primary:5s} | r={r:.2f}m az={np.degrees(az):+5.1f}° el={np.degrees(el):+5.1f}°")
    if other_obstacles:
        print(f"      | Background presence: {len(other_obstacles)} other obstacle(s)")
    
    print("Playing priority spatial cue…")
    sd.play(stereo, fs); sd.wait()
    return stereo

def _unified_mode_audio(picked, fs, dur):
    """Unified mode: Sequential rhythmic pattern of obstacles"""
    obstacle_count = len(picked)
    
    # Sort obstacles by priority: closest first, then by sector importance
    priority_order = ["UP", "DOWN", "FL", "FR", "BL", "BR"]
    sorted_obstacles = sorted(picked.items(), key=lambda x: (x[1][0], priority_order.index(x[0]) if x[0] in priority_order else 999))
    
    print(f"🌐 UNIFIED MODE: {obstacle_count} obstacles in rhythmic sequence")
    
    # Create rhythmic pattern: each obstacle gets a time slot
    segment_dur = dur / obstacle_count  # Equal time for each obstacle
    total_samples = int(fs * dur)
    unified_audio = np.zeros((total_samples, 2), dtype=np.float32)
    
    for i, (name, (r, az, el)) in enumerate(sorted_obstacles):
        rate, f, g = distance_to_params(r)
        
        # Calculate time window for this obstacle
        start_sample = int(i * segment_dur * fs)
        end_sample = int((i + 1) * segment_dur * fs)
        segment_samples = end_sample - start_sample
        segment_time = segment_samples / fs
        
        # Generate shorter audio segment for this obstacle
        if name == "FL":
            sig = tremolo(tone_left(f, segment_time, fs), fs, rate) * g
            sig = add_vibrato(sig, fs, rate=3.5)
        elif name == "FR":
            sig = tremolo(tone_right(f, segment_time, fs), fs, rate) * g
            sig = add_chorus(sig, fs, delay_ms=12)
        elif name == "BL":
            sig = tremolo(tone_left(f*0.9, segment_time, fs), fs, rate*0.7) * g
            sig = darken(sig, fs, cutoff=800)
            sig = add_vibrato(sig, fs, rate=2.5, depth=0.25)
        elif name == "BR":
            sig = tremolo(tone_right(f*0.85, segment_time, fs), fs, rate*0.6) * g
            sig = darken(sig, fs, cutoff=600)
            sig = add_chorus(sig, fs, delay_ms=25, depth=0.4)
        elif name == "UP":
            sig = tone_up(max(f, 500), segment_time, fs) * (g*0.9)
        elif name == "DOWN":
            sig = tone_down(max(200, f*0.8), segment_time, fs) * (g*0.8)
        else:
            continue
        
        # Pan to actual direction
        stereo_seg = pan_stereo(sig, az=az, el=0, fs=fs)
        
        # Ensure segment fits exactly
        if len(stereo_seg) > segment_samples:
            stereo_seg = stereo_seg[:segment_samples]
        elif len(stereo_seg) < segment_samples:
            pad = np.zeros((segment_samples - len(stereo_seg), 2), dtype=np.float32)
            stereo_seg = np.vstack([stereo_seg, pad])
        
        # Place in unified timeline
        unified_audio[start_sample:end_sample] = stereo_seg
        
        print(f"{name:5s} | r={r:.2f}m az={np.degrees(az):+5.1f}° | Time: {i*segment_dur:.1f}-{(i+1)*segment_dur:.1f}s")
    
    print(f"      | Sequential pattern: {segment_dur:.1f}s per obstacle")
    print("Playing unified spatial cue…")
    sd.play(unified_audio, fs); sd.wait()
    return unified_audio

# Legacy function for backward compatibility
def play_cue_from_pointcloud(points, fs=48000):
    """Legacy single-obstacle audio cue"""
    r, az, el = nearest_obstacle(points)
    if r is None:
        print("No obstacle ahead.")
        return
    
    rate, freq, gain = distance_to_params(r)
    print(f"Nearest obstacle: {r:.2f}m away")
    print(f"Direction: {np.degrees(az):.1f}° (azimuth), {np.degrees(el):.1f}° (elevation)")
    print(f"Audio cue: sustained {freq:.0f}Hz tone, tremolo {rate:.1f}Hz, {gain:.2f} volume")
    
    # Generate sustained tone with tremolo rate based on distance
    mono = sustained_tone(freq, total_dur=3.0, fs=fs, tremolo_rate=rate, elevation=el) * gain
    stereo = pan_stereo(mono, az=az, el=el, fs=fs)
    
    print("Playing sustained spatial audio cue...")
    sd.play(stereo, fs)
    sd.wait()
    print("Audio cue finished.")

# ---- demo with fake data (replace with your LiDAR Nx3 points) ----
if __name__ == "__main__":
    # Test scenarios for 360° spatial audio
    test_scenarios = [
        # Single obstacle tests
        ("Front-left obstacle", np.array([[2.0, 1.5, 0.0]])),
        ("Front-right obstacle", np.array([[2.0, -1.5, 0.0]])),
        ("Back-left obstacle", np.array([[-2.0, 1.5, 0.0]])),
        ("Back-right obstacle", np.array([[-2.0, -1.5, 0.0]])),
        ("Overhead obstacle", np.array([[1.5, 0.0, 2.0]])),
        ("Underground obstacle", np.array([[1.5, 0.0, -1.0]])),
        
        # Multi-obstacle scenarios
        ("Multiple obstacles - front corners", np.array([
            [2.0, 1.5, 0.0],   # FL
            [2.5, -1.2, 0.0],  # FR
        ])),
        ("Multiple obstacles - all corners", np.array([
            [2.0, 1.5, 0.0],   # FL
            [2.5, -1.2, 0.0],  # FR  
            [-1.8, 1.0, 0.0],  # BL
            [-2.2, -0.8, 0.0], # BR
        ])),
        ("Complex 3D scenario", np.array([
            [1.5, 1.0, 0.0],   # FL
            [-2.0, -1.0, 0.0], # BR
            [1.0, 0.0, 2.5],   # UP
            [2.0, 0.0, -0.8],  # DOWN
        ])),
    ]
    
    print("=== 360° Spatial Audio Obstacle Detection Demo ===")
    print("Use headphones for best spatial audio experience!\n")
    
    for i, (desc, cloud) in enumerate(test_scenarios):
        print(f"\n--- Scenario {i+1}: {desc} ---")
        print(f"Obstacles at: {[pt.tolist() for pt in cloud]}")
        
        # Use sequential mode for all scenarios - cycles through all detected sectors
        spatial_layers_from_pointcloud(cloud, fs=48000, mode="sequential")
        print("\n" + "="*50)


