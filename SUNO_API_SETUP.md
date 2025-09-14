# Suno API Integration Setup

## Overview
The SenseNav application now includes integration with the Suno AI API for advanced spatial audio generation. This allows the system to generate more sophisticated and contextual audio based on obstacle detection.

## Setup Instructions

### 1. Get Your Suno API Key
1. Visit the [Suno HackMIT 2025 API Documentation](https://suno-ai.notion.site/Suno-HackMIT-2025-API-Docs-a47928f8b7ca4b7ab8e0af8a1323ebf1)
2. Follow the instructions to obtain your API key
3. Copy the API key for the next step

### 2. Configure Environment Variables
1. In the `SenseNav_frontend` directory, create a `.env` file:
   ```bash
   cd SenseNav_frontend
   touch .env
   ```

2. Add your Suno API key to the `.env` file:
   ```
   REACT_APP_SUNO_API_KEY=your-actual-suno-api-key-here
   ```

3. Replace `your-actual-suno-api-key-here` with your actual API key from Suno

### 3. Restart the Development Server
After adding the API key, restart your development server:
```bash
npm run dev
```

## Features

### Real-time Audio Generation
- **Suno AI Mode**: Generates contextual audio based on obstacle direction, distance, and position
- **Basic Mode**: Falls back to Web Audio API for simple tone generation
- **Toggle Control**: Switch between Suno AI and basic audio generation

### Audio Characteristics
The system generates audio with the following characteristics based on obstacle detection:

- **Distance-based urgency**: Very Close → urgent, Far → calm
- **Directional panning**: Left/Right positioning in stereo field
- **Vertical pitch**: Top → higher pitch, Bottom → lower pitch
- **Contextual prompts**: AI-generated descriptions for natural audio

### Test Cases
The Spatial Audio Detection section includes test cases that work with both:
- **Suno AI**: Generates contextual audio for each test scenario
- **Basic Audio**: Simple tone generation for testing

## Usage

1. **Enable Suno API**: Use the toggle switch in the audio generation section
2. **Detect Obstacles**: Move objects in front of the camera
3. **Generate Audio**: Click "Generate AI Audio (Suno)" to create contextual audio
4. **Test Scenarios**: Use the test cases in the Spatial Audio Detection section

## Fallback Behavior
If the Suno API is unavailable or fails:
- The system automatically falls back to basic Web Audio API generation
- Error messages are logged to the console
- The user experience remains uninterrupted

## API Integration Details

### Request Format
```javascript
{
  prompt: "Navigation audio for obstacle detected at nearby on the left slightly above...",
  duration: 10,
  style: "urgent",
  mood: "left-leaning elevated",
  genre: "ambient",
  lyrics: false,
  custom_audio: false
}
```

### Response Handling
- Audio URL is received from Suno API
- Audio is played using HTML5 Audio API
- Automatic cleanup and state management
- Fallback timeout protection

## Troubleshooting

### Common Issues
1. **API Key Not Working**: Ensure the key is correctly set in `.env` file
2. **Audio Not Playing**: Check browser audio permissions
3. **Network Errors**: Verify internet connection and API endpoint availability

### Debug Information
- Check browser console for detailed error messages
- API requests and responses are logged for debugging
- Fallback behavior is automatically triggered on errors

