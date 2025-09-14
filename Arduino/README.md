

# Arduino Ultrasonic Sensor & Motor Control System

This Arduino project uses **4 ultrasonic distance sensors** (HC-SR04) and **4 motors** to detect obstacles and provide haptic feedback. The system outputs binary data via serial communication for integration with Python applications.

---

## Features
- **4 Ultrasonic Sensors** (HC-SR04) for obstacle detection
- **4 Motors** (controlled via NPN transistors) for haptic feedback
- **Serial Communication** - outputs 4-bit binary data
- **Real-time Processing** - 200ms refresh rate
- **Distance Threshold** - configurable detection range (default: 1 meter)

---

## Pin Mapping (Arduino Uno)

| Sensor | TRIG Pin | ECHO Pin | Motor Pin |
|--------|----------|----------|-----------|
| Sensor 1 | 2  | 3  | 4  |
| Sensor 2 | 5  | 6  | 7  |
| Sensor 3 | 8  | 9  | 10 |
| Sensor 4 | 11 | 12 | 13 |

---

## Hardware Notes
- Use **transistors or MOSFETs** to drive vibration motors (do NOT connect motors directly to Arduino pins).
- Add **flyback diodes** across motors for safety.
- Power motors separately if needed; connect grounds together.

---

## Project Structure
```
Arduino/
├── README.md                                    # This file
├── ultrasonic_and_motor_control/
│   └── ultrasonic_and_motor_control.ino        # Main Arduino sketch
└── python_serial/
    ├── pythonserial.py                         # Python serial communication
    └── README.md                               # Python serial documentation
```

---

## Setup on Arch Linux

### 1. Install Arduino CLI
```bash
sudo pacman -S arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:avr
````

### 2. Connect Your Arduino

Check your board:

```bash
arduino-cli board list
```

Example output:

``
Port         Protocol Type              Board Name  FQBN
/dev/ttyACM0 serial   Serial Port (USB) Arduino Uno arduino:avr:uno
```

### 3. Compile & Upload

```bash
arduino-cli compile --fqbn arduino:avr:uno ~/Arduino/ultrasonic_and_motor_control
arduino-cli upload -p /dev/ttyACM0 --fqbn arduino:avr:uno ~/Arduino/ultrasonic_and_motor_control
```

### 4. Open Serial Monitor (Optional)

```bash
arduino-cli monitor -p /dev/ttyACM0 -c baudrate=9600
```

---

## How It Works

1. **Distance Measurement**: Each ultrasonic sensor measures distance to nearby objects
2. **Obstacle Detection**: Objects within 1 meter trigger the corresponding sensor
3. **Motor Control**: When an obstacle is detected, the corresponding motor is activated
4. **Binary Output**: The system outputs a 4-bit binary string via serial:
   - Each bit represents one sensor (1 = obstacle detected, 0 = no obstacle)
   - Example: "0101" means sensors 1 and 3 detect obstacles
5. **Real-time Updates**: System refreshes every 200ms for responsive feedback

---

## Serial Communication

The Arduino outputs 4-bit binary strings via serial port (9600 baud):

- **Format**: 4-character binary string (e.g., "0101")
- **Bit Mapping**: Each bit represents one sensor (MSB = Sensor 4, LSB = Sensor 1)
- **Values**: 1 = obstacle detected, 0 = no obstacle
- **Refresh Rate**: Every 200ms

### Example Output
```
0101  # Sensors 1 and 3 detect obstacles
0000  # No obstacles detected
1111  # All sensors detect obstacles
```

## Integration with Python

Use the included Python script (`python_serial/pythonserial.py`) to read and process the binary data:

```bash
cd python_serial
python pythonserial.py
```

## Future Improvements

* **Non-blocking Motor Control**: Allow independent motor operation
* **Variable Distance Thresholds**: Per-sensor distance configuration
* **Data Logging**: Save sensor readings for analysis
* **Wireless Communication**: Add Bluetooth or WiFi modules
* **Power Optimization**: Sleep modes for battery-powered operation

---

## License

MIT License


