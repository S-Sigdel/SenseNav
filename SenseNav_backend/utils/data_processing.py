import numpy as np
from typing import List, Dict, Tuple, Optional

def validate_point_cloud(points: List[List[float]]) -> np.ndarray:
    """
    Validate and convert point cloud data to numpy array
    
    Args:
        points: List of [x, y, z] coordinates
        
    Returns:
        numpy array of shape (N, 3)
        
    Raises:
        ValueError: If points format is invalid
    """
    if not points:
        return np.array([]).reshape(0, 3)
    
    try:
        points_array = np.array(points)
        if points_array.ndim != 2 or points_array.shape[1] != 3:
            raise ValueError("Points must be a list of [x, y, z] coordinates")
        return points_array
    except Exception as e:
        raise ValueError(f"Invalid point cloud format: {str(e)}")

def filter_points_by_distance(points: np.ndarray, min_distance: float = 0.1, max_distance: float = 10.0) -> np.ndarray:
    """
    Filter points by distance from origin
    
    Args:
        points: numpy array of shape (N, 3)
        min_distance: minimum distance threshold
        max_distance: maximum distance threshold
        
    Returns:
        filtered numpy array
    """
    if points.size == 0:
        return points
    
    distances = np.linalg.norm(points, axis=1)
    mask = (distances >= min_distance) & (distances <= max_distance)
    return points[mask]

def convert_to_visualization_format(obstacles: Dict, targets: List) -> Dict:
    """
    Convert spatial audio data to format suitable for frontend visualization
    
    Args:
        obstacles: Dictionary of obstacles by sector
        targets: List of prioritized targets
        
    Returns:
        Dictionary formatted for frontend consumption
    """
    visualization_data = {
        "obstacle_markers": [],
        "audio_zones": [],
        "priority_targets": []
    }
    
    # Convert obstacles to visualization markers
    for sector, data in obstacles.items():
        # Convert spherical to cartesian for visualization
        distance = data["distance"]
        azimuth = data["azimuth_rad"]
        elevation = data["elevation_rad"]
        
        # Convert to cartesian coordinates
        x = distance * np.cos(elevation) * np.cos(azimuth)
        y = distance * np.cos(elevation) * np.sin(azimuth)
        z = distance * np.sin(elevation)
        
        visualization_data["obstacle_markers"].append({
            "id": f"obstacle_{sector}",
            "sector": sector,
            "position": {"x": float(x), "y": float(y), "z": float(z)},
            "distance": distance,
            "audio_frequency": data["audio_params"]["frequency"],
            "intensity": data["audio_params"]["gain"]
        })
    
    # Convert targets to priority visualization
    for i, target in enumerate(targets):
        sector = target["sector"]
        distance = target["distance"]
        azimuth = target["azimuth_rad"]
        elevation = target["elevation_rad"]
        
        # Convert to cartesian coordinates
        x = distance * np.cos(elevation) * np.cos(azimuth)
        y = distance * np.cos(elevation) * np.sin(azimuth)
        z = distance * np.sin(elevation)
        
        visualization_data["priority_targets"].append({
            "id": f"target_{i}",
            "sector": sector,
            "priority": i + 1,
            "position": {"x": float(x), "y": float(y), "z": float(z)},
            "distance": distance,
            "audio_frequency": target["audio_params"]["frequency"]
        })
    
    return visualization_data
