# Spatial Audio Obstacle Detection System

A real-time 3D spatial audio system that converts point cloud obstacle data into binaural audio cues for enhanced navigation and accessibility.

## 🎯 Overview

This system processes 3D point cloud data to detect obstacles in a full 360° environment and generates distinctive spatial audio cues that help users understand their surroundings through sound. Originally designed for assistive navigation, it has applications in VR/AR, robotics, and spatial awareness systems.

## ✨ Key Features

### 360° Spatial Detection
- **6-Sector Coverage**: Front-Left (FL), Front-Right (FR), Back-Left (BL), Back-Right (BR), Up (UP), Down (DOWN)
- **Full spherical awareness** including obstacles behind and above/below the user
- **Elevation detection** with configurable deadband for level vs vertical obstacles

### Advanced Audio Processing
- **Binaural positioning** with HRTF-inspired panning for precise localization
- **Unique sector timbres** using different waveforms, harmonics, and effects
- **Distance-based parameters** affecting frequency, beep rate, and volume
- **Psychoacoustic design** optimized for human spatial perception

### Multi-Obstacle Handling
- **Sequential Mode** (default): Plays obstacles one-by-one with salience scoring
- **Priority Mode**: Focuses on most critical obstacle with background presence
- **Unified Mode**: Rhythmic patterns for multiple obstacles
- **All Mode**: Simultaneous playback of all detected obstacles

### Accessibility Features
- **Count pings** announce number of obstacles before sequential playback
- **Salience scoring** prioritizes closer, frontal obstacles
- **Configurable parameters** for different user needs and environments
- **Pleasant audio design** avoiding harsh or startling sounds

## 🚀 Quick Start

### Prerequisites
```bash
pip install numpy scipy sounddevice
```

### Basic Usage
```python
import numpy as np
from closest_obstacle_audio import spatial_layers_from_pointcloud

# Create sample obstacle data (x, y, z coordinates)
obstacles = np.array([
    [2.0, -1.0, 0.0],   # Front-left at 2m
    [1.5, 1.0, 0.0],    # Front-right at 1.8m  
    [1.0, 0.0, 2.0]     # Above at 2.2m
])

# Generate and play spatial audio
spatial_layers_from_pointcloud(
    obstacles, 
    fs=48000,           # Sample rate
    dur=2.5,           # Duration in seconds
    mode="sequential"   # Playback mode
)
```

### Run Demo
```bash
python demo_script.py
```

The demo showcases all system capabilities with 9 different scenarios, from basic single obstacles to complex 360° multi-obstacle environments.

## 🔧 Technical Architecture

### Core Components

#### 1. Obstacle Detection (`nearest_by_sector`)
- Categorizes 3D points into spatial sectors
- Applies elevation deadband (±1.0m) to separate level vs up/down
- Returns nearest obstacle per sector with distance, azimuth, elevation

#### 2. Audio Synthesis (`generate_tone_for_sector`)
- **Front sectors**: Sawtooth waves with vibrato and chorus
- **Back sectors**: Square waves with "darken" effect (low-pass + reverb)
- **Up sector**: Ascending frequency chirps
- **Down sector**: Descending pulses with sub-bass

#### 3. Spatial Processing (`pan_stereo`)
- Binaural panning based on azimuth angle
- Elevation filtering for up/down positioning
- HRTF-inspired frequency response adjustments

#### 4. Multi-Obstacle Modes
- **Sequential**: Salience-scored playback with 600ms segments
- **Priority**: Primary obstacle + attenuated background
- **Unified**: Rhythmic temporal patterns
- **All**: Direct simultaneous mixing

### Audio Parameters

| Parameter | Range | Effect |
|-----------|-------|--------|
| Distance | 0.3-4.0m | Beep rate (6-1 Hz), Frequency (800-300 Hz), Gain (0.9-0.4) |
| Azimuth | ±180° | Stereo panning, L/R balance |
| Elevation | ±90° | Frequency filtering, up/down cues |
| Sector | 6 types | Unique timbres and effects |

### Salience Scoring
```
Score = (1/distance) + frontal_bias + elevation_bonus
```
- **Distance weight**: Closer obstacles prioritized
- **Frontal bias**: +0.5 for front sectors (navigation priority)
- **Elevation bonus**: +0.3 for up/down (safety priority)

## 📊 Performance Characteristics

- **Latency**: ~50ms audio generation + system audio latency
- **Sample Rate**: 48kHz (professional audio quality)
- **Bit Depth**: 32-bit float processing, 16-bit output
- **Memory**: ~2MB for 2.5s stereo audio buffer
- **CPU**: Optimized NumPy operations, real-time capable

## 🎮 Configuration Options

### Playback Modes
```python
# Sequential mode (recommended for multiple obstacles)
mode="sequential"

# Priority mode (focus on most important)
mode="priority" 

# Unified mode (rhythmic patterns)
mode="unified"

# All mode (simultaneous playback)
mode="all"
```

### Audio Parameters
```python
spatial_layers_from_pointcloud(
    points,
    fs=48000,              # Sample rate (Hz)
    dur=2.5,              # Total duration (seconds)
    ignore_behind=False,   # Include rear obstacles
    mode="sequential",     # Playback mode
    max_targets=3,        # Max obstacles in sequential mode
    seg_dur=0.6,          # Segment duration (seconds)
    gap_ms=120,           # Gap between segments (ms)
    announce_count=True   # Count ping preamble
)
```

## 🧪 Testing

### Test Scenarios
The system includes comprehensive test cases:

```python
# Run built-in tests
python closest_obstacle_audio.py
```

Test scenarios cover:
- Single obstacles in all 6 sectors
- Multi-obstacle configurations
- Edge cases (very close/far, behind user)
- Elevation scenarios (overhead, ground level)

### Validation with Headphones
For proper binaural audio testing:
1. Use quality headphones (not speakers)
2. Ensure L/R channels are correctly positioned
3. Test with eyes closed to focus on spatial cues
4. Verify obstacles sound positioned correctly in 3D space

## 🔬 Research & Design Principles

### Psychoacoustic Considerations
- **Frequency separation**: Different base frequencies per sector avoid masking
- **Temporal patterns**: Sequential playback reduces cognitive load
- **Amplitude modulation**: Tremolo and vibrato aid localization
- **Spectral shaping**: Filtering enhances front/back and up/down distinction

### Accessibility Design
- **Non-startling audio**: Gentle onset/offset envelopes
- **Predictable patterns**: Consistent timing and structure
- **Scalable complexity**: Modes from simple to comprehensive
- **User control**: Configurable parameters for different needs

### Safety Considerations
- **Volume limiting**: Automatic gain control prevents hearing damage
- **Pleasant timbres**: Avoid harsh or annoying sounds for extended use
- **Clear prioritization**: Most dangerous obstacles emphasized
- **Redundant cues**: Multiple audio dimensions for robust perception

## 🚀 Applications

### Primary Use Cases
- **Assistive Navigation**: Spatial awareness for visually impaired users
- **Robotics**: Audio feedback for autonomous navigation systems
- **VR/AR**: Immersive spatial audio interfaces
- **Training**: Spatial awareness skill development

### Integration Examples
- **Mobile apps**: Real-time camera/LiDAR processing
- **Smart glasses**: Lightweight spatial audio overlay
- **Robotic systems**: Audio feedback for human-robot interaction
- **Gaming**: Enhanced spatial awareness in virtual environments

## 📈 Future Enhancements

### Planned Features
- **Dynamic adaptation**: Auto-adjust parameters based on environment
- **User preferences**: Customizable audio profiles and sector mappings
- **Multi-user support**: Different audio signatures for multiple users
- **Real-time visualization**: Debug display for obstacle detection

### Research Directions
- **Machine learning**: Adaptive salience scoring based on user behavior
- **Advanced HRTF**: Personalized spatial audio processing
- **Haptic integration**: Combined audio-tactile feedback
- **Predictive audio**: Anticipatory cues based on movement patterns

## 🤝 Contributing

This project was developed for HackMIT 2024. Contributions welcome for:
- Additional audio effects and timbres
- Performance optimizations
- New playback modes
- Integration examples
- User studies and validation

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- HackMIT 2024 organizing team
- Spatial audio research community
- Accessibility technology advocates
- Beta testers and feedback providers

---

**For technical questions or collaboration opportunities, please reach out to the development team.**
