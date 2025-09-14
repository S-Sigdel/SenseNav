# Python Serial Communication

This Python script communicates with the Arduino ultrasonic sensor system via serial port to read binary sensor data and convert it to integer values for further processing.

## Overview

The script reads binary data from the Arduino that represents the state of 4 ultrasonic sensors. Each bit in the binary string indicates whether an obstacle is detected by the corresponding sensor (1 = obstacle detected, 0 = no obstacle).

## Features

- **Serial Communication**: Connects to Arduino via USB serial port
- **Binary Data Processing**: Reads 4-bit binary strings (e.g., "0101")
- **Data Conversion**: Converts binary strings to integer values
- **Error Handling**: Graceful handling of serial connection errors
- **Real-time Monitoring**: Continuous reading with configurable refresh rate

## Requirements

### Python Dependencies
```bash
pip install pyserial
```

### Hardware Requirements
- Arduino Uno with ultrasonic sensor system
- USB connection between Arduino and computer
- Proper serial port permissions (Linux)

## Configuration

Edit the configuration variables at the top of `pythonserial.py`:

```python
SERIAL_PORT = "/dev/ttyUSB0"  # Change to your port
BAUD_RATE = 9600
```

### Common Serial Ports
- **Linux**: `/dev/ttyUSB0`, `/dev/ttyACM0`
- **Windows**: `COM3`, `COM4`, etc.
- **macOS**: `/dev/cu.usbmodem*`, `/dev/cu.usbserial*`

## Usage

### 1. Connect Arduino
Ensure your Arduino is connected and the ultrasonic sensor sketch is uploaded.

### 2. Find Serial Port
```bash
# Linux
ls /dev/tty*

# Or use Arduino CLI
arduino-cli board list
```

### 3. Run the Script
```bash
python pythonserial.py
```

### 4. Expected Output
```
Reading sensor binary data...
Binary: 0101
As Integer: 5
Binary: 0000
As Integer: 0
Binary: 1111
As Integer: 15
```

## Data Format

The Arduino sends 4-bit binary strings where each bit represents a sensor:

| Bit Position | Sensor | Meaning |
|--------------|--------|---------|
| 3 (MSB) | Sensor 4 | Right sensor |
| 2 | Sensor 3 | Back sensor |
| 1 | Sensor 2 | Left sensor |
| 0 (LSB) | Sensor 1 | Front sensor |

### Example Interpretations
- `"0000"` = No obstacles detected (Integer: 0)
- `"0001"` = Front obstacle only (Integer: 1)
- `"0101"` = Front and back obstacles (Integer: 5)
- `"1111"` = All sensors detect obstacles (Integer: 15)

## Troubleshooting

### Permission Denied (Linux)
```bash
# Add user to dialout group
sudo usermod -a -G dialout $USER
# Log out and back in, or run:
newgrp dialout
```

### Port Not Found
1. Check if Arduino is connected: `ls /dev/tty*`
2. Verify Arduino IDE can see the port
3. Try different port names (USB0 vs ACM0)

### No Data Received
1. Verify Arduino sketch is running
2. Check baud rate matches (9600)
3. Ensure Arduino is not in bootloader mode
4. Try unplugging and reconnecting USB

### Connection Errors
- Close other programs using the serial port (Arduino IDE Serial Monitor)
- Check USB cable (data cable, not just power)
- Try a different USB port

## Integration

This script can be integrated into larger systems:

```python
import serial
import time

def read_sensor_data():
    ser = serial.Serial("/dev/ttyUSB0", 9600, timeout=1)
    time.sleep(2)
    
    while True:
        line = ser.readline().decode('utf-8').strip()
        if line:
            sensor_value = int(line, 2)
            # Process sensor data here
            return sensor_value
        time.sleep(0.1)
```

## Future Enhancements

- **JSON Output**: Format data as JSON for web APIs
- **Data Logging**: Save sensor readings to files
- **Threshold Detection**: Alert when specific patterns are detected
- **WebSocket Integration**: Stream data to web applications
- **Configuration File**: External config for port and baud rate

## License

MIT License
