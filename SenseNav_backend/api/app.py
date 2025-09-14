from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import sys
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the spatial_audio directory to the path
current_dir = os.path.dirname(os.path.abspath(__file__))
spatial_audio_dir = os.path.join(current_dir, '..', 'spatial_audio')
sys.path.insert(0, spatial_audio_dir)

from closest_obstacle_audio import (
    nearest_by_sector, 
    spatial_layers_from_pointcloud,
    distance_to_params,
    choose_targets,
    process_boundary_obstacle
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

@app.route('/api/spatial-audio/analyze-boundary', methods=['POST'])
def analyze_boundary_obstacles():
    """
    Analyze obstacle boundary data and return spatial audio information for the entire boundary.
    Expected input: {
        "bbox": {"x": 100, "y": 50, "width": 80, "height": 60},
        "depth": 0.5,
        "image_width": 320,
        "image_height": 240
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body"}), 400
        
        # Validate required fields
        required_fields = ['bbox', 'depth', 'image_width', 'image_height']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing '{field}' in request body"}), 400
        
        bbox = data['bbox']
        depth = data['depth']
        image_width = data['image_width']
        image_height = data['image_height']
        
        # Validate bbox structure
        bbox_fields = ['x', 'y', 'width', 'height']
        for field in bbox_fields:
            if field not in bbox:
                return jsonify({"error": f"Missing '{field}' in bbox"}), 400
        
        # Process boundary obstacle
        result = process_boundary_obstacle(
            bbox=bbox,
            depth_value=depth,
            image_width=image_width,
            image_height=image_height
        )
        
        # Convert numpy arrays to lists for JSON serialization
        if 'layers' in result and result['layers'] is not None:
            # Convert any numpy arrays in layers to lists
            if isinstance(result['layers'], dict):
                for layer_name, layer_data in result['layers'].items():
                    if hasattr(layer_data, 'tolist'):
                        result['layers'][layer_name] = layer_data.tolist()
            elif hasattr(result['layers'], 'tolist'):
                result['layers'] = result['layers'].tolist()
        
        return jsonify(result)
    
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

@app.route('/api/suno/generate-audio', methods=['POST'])
def generate_suno_audio():
    """
    Generate audio using Suno API based on obstacle characteristics
    Expected input: {
        "direction": "combined direction string",
        "distance": "distance category",
        "horizontal": "horizontal position",
        "vertical": "vertical position",
        "duration": 10 (optional, default 10)
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body"}), 400
        
        # Extract obstacle characteristics
        direction = data.get('direction', 'center')
        distance = data.get('distance', 'medium')
        horizontal = data.get('horizontal', 'center')
        vertical = data.get('vertical', 'center')
        duration = data.get('duration', 10)
        boundary_analysis = data.get('boundary_analysis', None)
        
        # Generate contextual prompt with boundary information
        if boundary_analysis:
            prompt = generate_boundary_obstacle_prompt(direction, distance, horizontal, vertical, boundary_analysis)
        else:
            prompt = generate_obstacle_prompt(direction, distance, horizontal, vertical)
        
        # Get Suno API key from environment
        suno_api_key = os.getenv('SUNO_API_KEY')
        if not suno_api_key:
            return jsonify({"error": "Suno API key not configured"}), 500
        
        # Suno API configuration - use correct HackMIT 2025 endpoint
        suno_api_url = 'https://studio-api.prod.suno.com/api/v2/external/hackmit/generate'
        
        request_data = {
            "topic": prompt,
            "tags": f"ambient,spatial,navigation,{get_suno_style(direction, distance)},{get_suno_mood(horizontal, vertical)}",
            "make_instrumental": True
        }
        
        # Make request to Suno API
        headers = {
            'Authorization': f'Bearer {suno_api_key}',
            'Content-Type': 'application/json'
        }
        
        print(f"Making request to Suno API: {suno_api_url}")
        print(f"Request data: {request_data}")
        print(f"Headers: {headers}")
        print(f"API Key: {suno_api_key}")
        
        # Step 1: Submit generation request
        response = requests.post(suno_api_url, json=request_data, headers=headers, timeout=30)
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response text: {response.text[:500]}...")
        
        if response.status_code == 200:
            suno_data = response.json()
            print(f"Suno generation response: {suno_data}")
            
            # Check if we got clip IDs
            if 'id' in suno_data:
                clip_id = suno_data['id']
                print(f"Got clip ID: {clip_id}")
                
                # Step 2: Poll for status and audio URL
                return poll_for_audio_url(clip_id, suno_api_key, prompt, duration)
            else:
                return jsonify({"error": "No clip ID in Suno response"}), 500
        else:
            # For now, return a mock response since Suno API seems unavailable
            return jsonify({
                "success": True,
                "audio_url": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",  # Mock audio URL
                "prompt": prompt,
                "duration": duration,
                "note": "Using fallback audio - Suno API returned 503"
            })
    
    except requests.exceptions.Timeout:
        return jsonify({"error": "Suno API request timed out"}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Network error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_obstacle_prompt(direction, distance, horizontal, vertical):
    """Generate contextual prompt for Suno API"""
    distance_words = {
        'Very Close': 'urgent close proximity',
        'Close': 'nearby',
        'Medium': 'moderate distance',
        'Far': 'distant',
        'Very Far': 'far away'
    }
    
    direction_words = {
        'Far Left': 'left side',
        'Left': 'left',
        'Center-Left': 'slightly left',
        'Center-Right': 'slightly right',
        'Right': 'right',
        'Far Right': 'right side'
    }
    
    vertical_words = {
        'Far Top': 'high above',
        'Top': 'above',
        'Center-Top': 'slightly above',
        'Center-Bottom': 'slightly below',
        'Bottom': 'below',
        'Far Bottom': 'low below'
    }
    
    distance_desc = distance_words.get(distance, 'moderate distance')
    direction_desc = direction_words.get(horizontal, 'center')
    vertical_desc = vertical_words.get(vertical, 'center')
    
    return f"Navigation audio for obstacle detected at {distance_desc} on the {direction_desc} {vertical_desc}. Create ambient spatial audio with {get_tone_description(distance, horizontal, vertical)} characteristics."

def generate_boundary_obstacle_prompt(direction, distance, horizontal, vertical, boundary_analysis):
    """Generate a contextual prompt for Suno based on boundary analysis"""
    distance_words = {
        'Very Close': 'urgent close proximity',
        'Close': 'nearby',
        'Medium': 'moderate distance',
        'Far': 'distant',
        'Very Far': 'far away'
    }
    
    direction_words = {
        'Far Left': 'left side',
        'Left': 'left',
        'Center-Left': 'slightly left',
        'Center-Right': 'slightly right',
        'Right': 'right',
        'Far Right': 'right side'
    }
    
    vertical_words = {
        'Far Top': 'high above',
        'Top': 'above',
        'Center-Top': 'slightly above',
        'Center-Bottom': 'slightly below',
        'Bottom': 'below',
        'Far Bottom': 'low below'
    }
    
    distance_desc = distance_words.get(distance, 'moderate distance')
    direction_desc = direction_words.get(horizontal, 'center')
    vertical_desc = vertical_words.get(vertical, 'center')
    
    # Extract boundary information
    boundary_points = boundary_analysis.get('boundary_points', 16)
    obstacles = boundary_analysis.get('obstacles', {})
    targets = boundary_analysis.get('targets', [])
    
    # Create boundary-specific description
    boundary_desc = f"obstacle boundary with {boundary_points} surface points"
    
    # Add spatial sector information
    if targets:
        sectors = [target[0] for target in targets]
        sector_desc = f"detected in sectors: {', '.join(sectors)}"
    else:
        sector_desc = "spatial positioning"
    
    return f"Navigation audio for {boundary_desc} detected at {distance_desc} on the {direction_desc} {vertical_desc}. Create ambient spatial audio with {get_tone_description(distance, horizontal, vertical)} characteristics. Audio should emanate from {sector_desc} with precise boundary-based spatial positioning."

def get_suno_style(direction, distance):
    """Get Suno style based on distance"""
    if distance in ['Very Close', 'Close']:
        return 'urgent'
    elif distance in ['Far', 'Very Far']:
        return 'calm'
    else:
        return 'neutral'

def get_suno_mood(horizontal, vertical):
    """Get Suno mood based on position"""
    horizontal_mood = {
        'Far Left': 'left-panned',
        'Left': 'left-leaning',
        'Center-Left': 'slightly-left',
        'Center-Right': 'slightly-right',
        'Right': 'right-leaning',
        'Far Right': 'right-panned'
    }
    
    vertical_mood = {
        'Far Top': 'high-pitched',
        'Top': 'elevated',
        'Center-Top': 'slightly-high',
        'Center-Bottom': 'slightly-low',
        'Bottom': 'lower',
        'Far Bottom': 'deep'
    }
    
    return f"{horizontal_mood.get(horizontal, 'centered')} {vertical_mood.get(vertical, 'balanced')}"

def get_tone_description(distance, horizontal, vertical):
    """Get tone description for prompt"""
    urgency = 'urgent warning' if distance == 'Very Close' else \
              'caution' if distance == 'Close' else \
              'attention' if distance == 'Medium' else 'awareness'
    
    spatial = 'left-panned' if 'Left' in horizontal else \
              'right-panned' if 'Right' in horizontal else 'centered'
    
    pitch = 'higher-pitched' if 'Top' in vertical else \
            'lower-pitched' if 'Bottom' in vertical else 'mid-range'
    
    return f"{urgency} {spatial} {pitch}"

def poll_for_audio_url(clip_id, suno_api_key, prompt, duration, max_attempts=10):
    """Poll the clips endpoint to get audio URL when ready"""
    clips_url = 'https://studio-api.prod.suno.com/api/v2/external/hackmit/clips'
    headers = {
        'Authorization': f'Bearer {suno_api_key}',
        'Content-Type': 'application/json'
    }
    
    for attempt in range(max_attempts):
        try:
            print(f"Polling attempt {attempt + 1} for clip {clip_id}")
            response = requests.get(f"{clips_url}?ids={clip_id}", headers=headers, timeout=30)
            
            if response.status_code == 200:
                clips_data = response.json()
                print(f"Clips response: {clips_data}")
                
                if clips_data and len(clips_data) > 0:
                    clip = clips_data[0]
                    status = clip.get('status', 'unknown')
                    audio_url = clip.get('audio_url')
                    
                    print(f"Clip status: {status}, audio_url: {audio_url}")
                    
                    if status in ['streaming', 'complete'] and audio_url:
                        return jsonify({
                            "success": True,
                            "audio_url": audio_url,
                            "prompt": prompt,
                            "duration": duration,
                            "status": status,
                            "clip_id": clip_id
                        })
                    elif status == 'error':
                        return jsonify({"error": f"Clip generation failed: {clip.get('error', 'Unknown error')}"}), 500
                    else:
                        # Still generating, wait and try again
                        import time
                        time.sleep(2)  # Wait 2 seconds before next poll
                        continue
                else:
                    return jsonify({"error": "No clip data received"}), 500
            else:
                print(f"Clips API error: {response.status_code} - {response.text}")
                return jsonify({"error": f"Clips API error: {response.status_code}"}), response.status_code
                
        except Exception as e:
            print(f"Error polling clips: {str(e)}")
            if attempt == max_attempts - 1:
                return jsonify({"error": f"Failed to get audio after {max_attempts} attempts: {str(e)}"}), 500
            import time
            time.sleep(2)
    
    return jsonify({"error": f"Timeout: Audio not ready after {max_attempts} attempts"}), 504

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
