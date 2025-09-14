from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import numpy as np
import sys
import os
import io
from scipy.io.wavfile import write

# Add the spatial_audio directory to the path
current_dir = os.path.dirname(os.path.abspath(__file__))
spatial_audio_dir = os.path.join(current_dir, '..', 'spatial_audio')
sys.path.insert(0, spatial_audio_dir)

from closest_obstacle_audio import (
    nearest_by_sector, 
    spatial_layers_from_pointcloud,
    distance_to_params,
    choose_targets
)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "SenseNav backend is running"})

@app.route('/api/spatial-audio/analyze', methods=['POST'])
def analyze_obstacles():
    """
    Analyze point cloud data and return spatial audio information
    Expected input: {"points": [[x, y, z], [x, y, z], ...]}
    """
    try:
        data = request.get_json()
        if not data or 'points' not in data:
            return jsonify({"error": "Missing 'points' in request body"}), 400
        
        points = np.array(data['points'])
        if points.size == 0:
            return jsonify({
                "obstacles": {},
                "targets": [],
                "message": "No obstacles detected"
            })
        
        # Get obstacles by sector
        obstacles = nearest_by_sector(points, ignore_behind=data.get('ignore_behind', False))
        
        # Get prioritized targets
        targets = choose_targets(obstacles, max_targets=data.get('max_targets', 3))
        
        # Format response
        response_data = {
            "obstacles": {},
            "targets": [],
            "total_obstacles": len(obstacles)
        }
        
        # Format obstacles data
        for sector, (distance, azimuth, elevation) in obstacles.items():
            rate, freq, gain = distance_to_params(distance)
            response_data["obstacles"][sector] = {
                "distance": float(distance),
                "azimuth_deg": float(np.degrees(azimuth)),
                "elevation_deg": float(np.degrees(elevation)),
                "azimuth_rad": float(azimuth),
                "elevation_rad": float(elevation),
                "audio_params": {
                    "frequency": float(freq),
                    "tremolo_rate": float(rate),
                    "gain": float(gain)
                }
            }
        
        # Format targets data
        for name, distance, azimuth, elevation in targets:
            rate, freq, gain = distance_to_params(distance)
            response_data["targets"].append({
                "sector": name,
                "distance": float(distance),
                "azimuth_deg": float(np.degrees(azimuth)),
                "elevation_deg": float(np.degrees(elevation)),
                "azimuth_rad": float(azimuth),
                "elevation_rad": float(elevation),
                "audio_params": {
                    "frequency": float(freq),
                    "tremolo_rate": float(rate),
                    "gain": float(gain)
                }
            })
        
        return jsonify(response_data)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/spatial-audio/sectors', methods=['GET'])
def get_sector_info():
    """Get information about the spatial audio sectors"""
    sectors = {
        "FL": {"name": "Front-Left", "description": "Warm sawtooth + vibrato"},
        "FR": {"name": "Front-Right", "description": "Metallic square + chorus"},
        "BL": {"name": "Back-Left", "description": "Dark warm + deep vibrato"},
        "BR": {"name": "Back-Right", "description": "Very dark metallic + long chorus"},
        "UP": {"name": "Above", "description": "Ascending chirp"},
        "DOWN": {"name": "Below", "description": "Descending pulse + sub-bass"}
    }
    
    return jsonify({
        "sectors": sectors,
        "elevation_deadband_deg": 25,
        "distance_range": {"min": 0.3, "max": 4.0}
    })

@app.route('/api/spatial-audio/generate-audio', methods=['POST'])
def generate_audio():
    """
    Generate spatial audio WAV file from point cloud data
    Expected input: {
        "points": [[x, y, z], ...],
        "mode": "sequential",
        "duration": 3.0,
        "sample_rate": 48000
    }
    """
    try:
        data = request.get_json()
        if not data or 'points' not in data:
            return jsonify({"error": "Missing 'points' in request body"}), 400
        
        points = np.array(data['points'])
        mode = data.get('mode', 'sequential')
        duration = data.get('duration', 3.0)
        sample_rate = data.get('sample_rate', 48000)
        
        if points.size == 0:
            return jsonify({"error": "No points provided"}), 400
        
        # Generate spatial audio using the existing function
        # We need to modify the function to return audio data instead of playing it
        audio_data = generate_spatial_audio_data(points, sample_rate, duration, mode)
        
        if audio_data is None:
            return jsonify({"error": "Failed to generate audio"}), 500
        
        # Convert to WAV format in memory
        buffer = io.BytesIO()
        
        # Ensure audio data is in the right format for WAV
        if audio_data.dtype != np.int16:
            # Convert from float32 to int16
            audio_data = (audio_data * 32767).astype(np.int16)
        
        write(buffer, sample_rate, audio_data)
        buffer.seek(0)
        
        return send_file(
            buffer,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='spatial_audio.wav'
        )
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_spatial_audio_data(points, fs=48000, dur=3.0, mode="sequential"):
    """
    Modified version of spatial_layers_from_pointcloud that returns audio data instead of playing it
    """
    try:
        from closest_obstacle_audio import (
            nearest_by_sector, 
            choose_targets,
            distance_to_params,
            tone_left, tone_right, tone_up, tone_down,
            tremolo, darken, add_vibrato, add_chorus,
            pan_stereo, mix_and_limit, apply_fade,
            count_ping
        )
        
        picked = nearest_by_sector(points, ignore_behind=False)
        if not picked:
            # Return silence if no obstacles
            return np.zeros((int(fs * dur), 2), dtype=np.float32)
        
        # Use sequential mode for consistent results
        if mode == "sequential":
            return generate_sequential_audio(picked, fs, dur)
        else:
            # Fallback to simple mixed audio
            return generate_mixed_audio(picked, fs, dur)
            
    except Exception as e:
        print(f"Error generating spatial audio: {e}")
        return None

def generate_sequential_audio(picked, fs, dur, max_targets=6, seg_dur=2.0, gap_ms=300):
    """Generate sequential audio for multiple obstacles"""
    from closest_obstacle_audio import (
        choose_targets, distance_to_params, tone_left, tone_right, 
        tone_up, tone_down, tremolo, darken, pan_stereo, count_ping
    )
    
    targets = choose_targets(picked, max_targets=max_targets)
    k = len(targets)
    if k == 0:
        return np.zeros((int(fs * dur), 2), dtype=np.float32)
    
    segments = []
    
    # Optional count preamble
    if k > 1:
        segments.append(count_ping(k, fs, gap_ms=gap_ms))
    
    for (name, r, az, el) in targets:
        rate, f, g = distance_to_params(r)
        
        # Generate tone based on sector
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
    
    # Concatenate all segments
    audio = np.concatenate(segments, axis=0)
    
    # Ensure it fits the requested duration
    target_samples = int(fs * dur)
    if len(audio) > target_samples:
        audio = audio[:target_samples]
    elif len(audio) < target_samples:
        pad = np.zeros((target_samples - len(audio), 2), dtype=np.float32)
        audio = np.vstack([audio, pad])
    
    # Apply limiting
    peak = np.max(np.abs(audio))
    if peak > 0.95:
        audio *= 0.95 / peak
    
    return audio

def generate_mixed_audio(picked, fs, dur):
    """Generate mixed audio for all obstacles simultaneously"""
    from closest_obstacle_audio import (
        distance_to_params, tone_left, tone_right, tone_up, tone_down,
        tremolo, darken, pan_stereo, mix_and_limit
    )
    
    stems = []
    for name, (r, az, el) in picked.items():
        rate, f, g = distance_to_params(r)
        
        if name == "FL":
            sig = tremolo(tone_left(f, dur, fs), fs, rate) * g
        elif name == "FR":
            sig = tremolo(tone_right(f, dur, fs), fs, rate) * g
        elif name == "BL":
            sig = tremolo(tone_left(0.9*f, dur, fs), fs, 0.8*rate) * (0.9*g)
            sig = darken(sig, fs, cutoff=900)
        elif name == "BR":
            sig = tremolo(tone_right(0.85*f, dur, fs), fs, 0.7*rate) * (0.85*g)
            sig = darken(sig, fs, cutoff=700)
        elif name == "UP":
            sig = tone_up(max(f, 500), dur, fs) * (0.9*g)
        elif name == "DOWN":
            sig = tone_down(max(200, 0.8*f), dur, fs) * (0.85*g)
        else:
            continue
        
        stereo = pan_stereo(sig, az=az, el=0, fs=fs)
        stems.append(stereo)
    
    return mix_and_limit(stems)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
