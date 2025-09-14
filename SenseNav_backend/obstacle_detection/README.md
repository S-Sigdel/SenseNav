# Depth Estimation & Obstacle Detection System

A real-time AI-powered depth estimation and obstacle detection system using MiDaS (Mixed Dataset for Monocular Depth Estimation) and OpenCV. This project provides multiple visualization modes including 2D depth maps, 3D point clouds, and obstacle centroid tracking.

## 🚀 Features

### Core Functionality
- **Real-time Depth Estimation**: AI-powered monocular depth estimation using MiDaS models
- **Live Camera Feed**: Real-time RGB video capture and processing
- **Multiple Visualization Modes**: 2D depth maps, 3D point clouds, and obstacle tracking
- **Obstacle Detection**: Automatic detection and centroid tracking of the closest objects
- **High Performance**: Optimized for real-time processing with configurable frame skipping

### Visualization Options
- **2D Depth Visualization**: Side-by-side RGB and colorized depth maps
- **3D Point Cloud**: Real-time 3D point cloud generation and visualization
- **3D Mesh Reconstruction**: Surface reconstruction from point clouds
- **Obstacle Centroid Tracking**: Real-time tracking of the most intense blue (closest) objects

## 📁 Project Structure

```
Python/
├── README.md                    # This file
├── opencv.py                    # Core depth estimation utilities
├── simple_depth.py              # 2D depth visualization (recommended)
├── depth_centroid.py            # Obstacle centroid detection
├── depth_with_mesh.py           # 3D mesh visualization (Open3D)
├── depth_with_mesh_save.py      # 3D mesh saving to files
├── depth_with_pyvista.py        # 3D visualization (PyVista)
├── test_opencv.py               # Basic functionality testing
└── minimal-python.py            # UDP point cloud data receiver
```

## 🛠️ Installation

### Prerequisites
- Python 3.7+
- macOS (tested on macOS 14.0.0)
- Camera access permissions

### Required Packages
```bash
pip3 install opencv-python
pip3 install numpy
pip3 install torch
pip3 install torchvision
pip3 install timm
pip3 install open3d
pip3 install pyvista
```

### Environment Setup
```bash
# Fix OpenMP threading issues on macOS
export OMP_NUM_THREADS=1
```

## 🎯 Quick Start

### 1. Basic 2D Depth Visualization (Recommended)
```bash
export OMP_NUM_THREADS=1 && python3 simple_depth.py --skip 3
```

### 2. Obstacle Centroid Detection
```bash
export OMP_NUM_THREADS=1 && python3 depth_centroid.py --skip 3 --min_area 50 --debug
```

### 3. 3D Point Cloud Visualization
```bash
export OMP_NUM_THREADS=1 && python3 depth_with_mesh.py --skip 3 --mesh_skip 15
```

## 📖 Script Documentation

### `simple_depth.py` - 2D Depth Visualization
**Purpose**: Real-time 2D depth estimation with optimized performance.

**Features**:
- Side-by-side RGB and depth visualization
- Configurable frame skipping for performance
- Real-time FPS monitoring
- Reduced resolution for faster processing

**Usage**:
```bash
python3 simple_depth.py [options]
```

**Options**:
- `--skip N`: Process every Nth frame (default: 2)
- `--width W`: Camera width (default: 320)
- `--height H`: Camera height (default: 240)
- `--model MODEL`: MiDaS model type (default: MiDaS_small)

### `depth_centroid.py` - Obstacle Detection
**Purpose**: Detect and track the centroid of the closest objects in real-time.

**Features**:
- Most intense blue color detection (closest objects)
- Real-time centroid tracking
- Configurable area thresholds
- Debug mode for detailed output
- Coordinate mapping for side-by-side display

**Usage**:
```bash
python3 depth_centroid.py [options]
```

**Options**:
- `--skip N`: Process every Nth frame (default: 3)
- `--min_area N`: Minimum obstacle area in pixels (default: 50)
- `--debug`: Enable debug output
- `--width W`: Camera width (default: 320)
- `--height H`: Camera height (default: 240)

**Output**:
- Green circle with red ring marking the centroid
- Console output with coordinates, depth, and area
- Real-time tracking of the most intense blue regions

### `opencv.py` - Core Utilities
**Purpose**: Contains utility functions for depth estimation and visualization.

**Key Functions**:
- `load_midas()`: Load MiDaS depth estimation model
- `colorize_depth()`: Convert depth map to colorized visualization
- `make_intrinsics()`: Create camera intrinsic matrix
- `backproject()`: Convert depth map to 3D point cloud

### `depth_with_mesh.py` - 3D Mesh Visualization
**Purpose**: Real-time 3D point cloud and mesh visualization using Open3D.

**Features**:
- Live 3D point cloud generation
- Surface reconstruction (Poisson, Delaunay)
- Mesh optimization and subsampling
- Separate thread for 3D visualization

**Note**: May have compatibility issues on macOS due to Open3D GUI threading.

### `depth_with_pyvista.py` - Alternative 3D Visualization
**Purpose**: 3D visualization using PyVista as an alternative to Open3D.

**Features**:
- PyVista-based 3D visualization
- Threading for responsive UI
- Delaunay mesh generation
- Better macOS compatibility

**Note**: May still encounter GUI threading issues on macOS.

### `depth_with_mesh_save.py` - 3D Data Export
**Purpose**: Save 3D point clouds and meshes to files instead of real-time visualization.

**Features**:
- Export point clouds to `.ply` files
- Export meshes to `.ply` files
- Timestamped file naming
- Bypasses GUI threading issues

## 🎮 Controls

- **ESC**: Quit any running script
- **Camera Access**: Grant camera permissions when prompted on macOS

## 🔧 Configuration

### Performance Tuning
- **Frame Skipping**: Increase `--skip` value for better performance
- **Resolution**: Reduce `--width` and `--height` for faster processing
- **Model Selection**: Use `MiDaS_small` for faster inference

### Obstacle Detection Tuning
- **Min Area**: Adjust `--min_area` to filter out small objects
- **Debug Mode**: Use `--debug` to see detailed detection information
- **Threshold**: The system automatically finds the closest 1% of objects

## 🐛 Troubleshooting

### Common Issues

1. **Segmentation Fault on macOS**
   ```bash
   export OMP_NUM_THREADS=1
   ```

2. **Camera Access Denied**
   - Grant camera permissions in System Preferences > Security & Privacy > Camera

3. **Import Errors**
   ```bash
   pip3 install timm opencv-python torch torchvision
   ```

4. **3D Visualization Issues**
   - Use `simple_depth.py` for stable 2D visualization
   - Use `depth_with_mesh_save.py` to export 3D data to files

### Performance Issues
- Increase frame skipping: `--skip 5`
- Reduce resolution: `--width 240 --height 180`
- Use smaller model: `--model MiDaS_small`

## 📊 Output Examples

### Console Output (Debug Mode)
```
[blue] area=512, centroid=(261,143), depth=814.4830, thr=801.6143, inverse_depth=True
FPS: 14.8
MOST INTENSE BLUE - Centroid: (261, 143), Depth: 814.48m, Area: 512px
```

### Visual Output
- **Left Side**: Live RGB camera feed
- **Right Side**: Colorized depth map (blue = close, red = far)
- **Green Circle**: Centroid of detected obstacle
- **Red Ring**: Visual indicator around centroid

## 🔬 Technical Details

### Depth Estimation
- **Model**: MiDaS (Mixed Dataset for Monocular Depth Estimation)
- **Input**: RGB camera frames
- **Output**: Relative depth maps
- **Processing**: Real-time inference with PyTorch

### Obstacle Detection Algorithm
1. **Normalization**: Convert depth map to 0-1 range
2. **Thresholding**: Find closest 1% of pixels
3. **Morphological Operations**: Clean up noisy masks
4. **Connected Components**: Find largest connected region
5. **Centroid Calculation**: Compute center of mass

### Coordinate System
- **Origin**: Top-left corner of image
- **X-axis**: Horizontal (left to right)
- **Y-axis**: Vertical (top to bottom)
- **Depth**: Relative values (larger = closer for MiDaS)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on macOS
5. Submit a pull request

## 📄 License

This project is open source. Please ensure you have proper camera permissions and follow local regulations when using camera-based applications.

## 🙏 Acknowledgments

- **MiDaS**: Intel's Mixed Dataset for Monocular Depth Estimation
- **OpenCV**: Computer vision library
- **Open3D**: 3D data processing library
- **PyVista**: 3D plotting and mesh analysis

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Verify all dependencies are installed
3. Ensure camera permissions are granted
4. Try the basic `simple_depth.py` script first

---

**Note**: This system is designed for real-time depth estimation and obstacle detection. The 3D visualization features may have compatibility issues on macOS due to GUI threading restrictions. The 2D depth visualization (`simple_depth.py`) provides the most stable experience.
