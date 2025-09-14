
import serial
import time

# === CONFIGURATION ===
SERIAL_PORT = "/dev/ttyUSB0"  # Change to your port (Linux: "/dev/ttyUSB0")
BAUD_RATE = 9600

def main():
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        time.sleep(2)  # Allow Arduino reset

        print("Reading sensor binary data...")
        while True:
            line = ser.readline().decode('utf-8').strip()
            if line:
                # Example: "0101"
                print(f"Binary: {line}")
                value = int(line, 2)
                print(f"As Integer: {value}")
            time.sleep(0.1)
    except serial.SerialException as e:
        print(f"Error: {e}")
    except KeyboardInterrupt:
        print("\nExiting...")

if __name__ == "__main__":
    main()
