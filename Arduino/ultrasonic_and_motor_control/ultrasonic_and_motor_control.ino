
// === Pin Assignments ===
// Ultrasonic sensors
const int trigPins[4] = {2, 5, 8, 11};
const int echoPins[4] = {3, 6, 9, 12};
// Motors controlled by NPN transistor
const int motorPins[4] = {4, 7, 10, 13};

// Distance threshold (in meters) for detection
const float DETECT_THRESHOLD = 1.0;  // 1m

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 4; i++) {
    pinMode(trigPins[i], OUTPUT);
    pinMode(echoPins[i], INPUT);
    pinMode(motorPins[i], OUTPUT);
    digitalWrite(motorPins[i], LOW);
  }
}

float getDistance(int trigPin, int echoPin) {
  // Trigger ultrasonic pulse
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout
  float distance = (duration * 0.0343) / 2.0;    // distance in cm
  return distance / 100.0;                       // convert to meters
}

void loop() {
  byte sensorBits = 0;

  for (int i = 0; i < 4; i++) {
    float dist = getDistance(trigPins[i], echoPins[i]);
    bool detected = (dist > 0 && dist <= DETECT_THRESHOLD);

    if (detected) {
      sensorBits |= (1 << i); // Set bit if obstacle detected
    }

    // Motor control
    digitalWrite(motorPins[i], detected ? HIGH : LOW);
  }

  // Print as binary string
  for (int i = 3; i >= 0; i--) {
    Serial.print((sensorBits >> i) & 1);
  }
  Serial.println();

  delay(200); // Refresh rate
}
