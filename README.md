# SenseNav - Spatial Audio Navigation System

A comprehensive navigation system that combines LiDAR obstacle detection with spatial audio feedback for enhanced accessibility and navigation assistance.

## Project Structure

```
SenseNav/
├── SenseNav_frontend/          # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── SpatialAudioVisualization.jsx
│   │   │   └── NavigationMusicBox.jsx
│   │   └── pages/
│   │       └── visualization.jsx
│   └── package.json
├── SenseNav_backend/           # Python backend API
│   ├── spatial_audio/
│   │   └── closest_obstacle_audio.py
│   ├── api/
│   │   └── app.py
│   ├── utils/
│   │   └── data_processing.py
│   └── requirements.txt
└── README.md
```

## Features

### Spatial Audio System
- **360° Obstacle Detection**: Divides space into 6 sectors (Front-Left, Front-Right, Back-Left, Back-Right, Up, Down)
- **Distance-Based Audio Cues**: Closer obstacles trigger higher frequency tones and faster tremolo rates
- **Directional Audio**: Binaural panning with Interaural Level Difference (ILD) and Interaural Time Difference (ITD)
- **Priority Targeting**: Automatically prioritizes the most critical obstacles
- **Sector-Specific Tones**: Each sector has unique audio characteristics for easy identification

### Frontend Visualization
- **Real-time Obstacle Display**: Visual representation of detected obstacles
- **Priority Target Highlighting**: Shows the most important obstacles to avoid
- **Audio Parameter Visualization**: Displays frequency, intensity, and direction data
- **Connection Status**: Shows backend connectivity and data flow status

## Installation & Setup

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd SenseNav_backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```bash
   cd api
   python app.py
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd SenseNav_frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns backend status

### Spatial Audio Analysis
- **POST** `/api/spatial-audio/analyze`
- **Body**: `{"points": [[x, y, z], ...]}`
- **Response**: Obstacle detection data with audio parameters

### Sector Information
- **GET** `/api/spatial-audio/sectors`
- Returns information about spatial audio sectors

## Usage

1. Start both backend and frontend servers
2. Navigate to the visualization page
3. The system will automatically detect obstacles and generate spatial audio cues
4. View real-time obstacle data in the "Spatial Audio Detection" section

## Audio Sector Characteristics

| Sector | Audio Signature | Description |
|--------|----------------|-------------|
| FL (Front-Left) | Warm sawtooth + vibrato | Gentle, musical tone |
| FR (Front-Right) | Metallic square + chorus | Sharp, digital sound |
| BL (Back-Left) | Dark warm + deep vibrato | Muffled, behind feeling |
| BR (Back-Right) | Very dark metallic + long chorus | Very muffled, distant |
| UP (Above) | Ascending chirp | Rising frequency sweep |
| DOWN (Below) | Descending pulse + sub-bass | Falling tone with bass |

## Integration with LiDAR Data

The system expects point cloud data in the format:
```json
{
  "points": [
    [x, y, z],  // 3D coordinates in meters
    [x, y, z],
    ...
  ]
}
```

## Development Notes

- The frontend includes mock data for testing when the backend is unavailable
- Audio parameters are automatically calculated based on obstacle distance
- The system supports real-time updates through polling
- All spatial calculations use standard coordinate systems (x=forward, y=left, z=up)

## Future Enhancements

- WebSocket support for real-time streaming
- Audio playback integration in the browser
- 3D visualization of obstacle positions
- Machine learning-based obstacle classification
- Mobile app integration
