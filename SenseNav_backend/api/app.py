from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import sys
import os

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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
