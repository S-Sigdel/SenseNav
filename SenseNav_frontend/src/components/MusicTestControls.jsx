import React, { useState, useRef, useEffect } from 'react';

const MusicTestControls = ({ onAudioData }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [source, setSource] = useState(null);
  const [frequencyData, setFrequencyData] = useState(null);
  const audioRef = useRef();
  const animationRef = useRef();

  // Initialize audio context
  const initAudio = async () => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 256;
      
      setAudioContext(context);
      setAnalyser(analyserNode);
      
      const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
      setFrequencyData(dataArray);
      
      return { context, analyserNode, dataArray };
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return null;
    }
  };

  // Start microphone input for testing
  const startMicrophone = async () => {
    try {
      const audioSetup = await initAudio();
      if (!audioSetup) return;

      const { context, analyserNode, dataArray } = audioSetup;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sourceNode = context.createMediaStreamSource(stream);
      sourceNode.connect(analyserNode);
      
      setSource(sourceNode);
      setIsPlaying(true);
      
      // Start animation loop
      const animate = () => {
        analyserNode.getByteFrequencyData(dataArray);
        setFrequencyData([...dataArray]);
        
        if (onAudioData) {
          onAudioData(dataArray);
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
      
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('Microphone access is required for testing. Please allow microphone access and try again.');
    }
  };

  // Generate test tones
  const playTestTone = async (frequency = 440) => {
    try {
      const audioSetup = await initAudio();
      if (!audioSetup) return;

      const { context, analyserNode, dataArray } = audioSetup;
      
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(analyserNode);
      analyserNode.connect(context.destination);
      
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      
      oscillator.start();
      setIsPlaying(true);
      
      // Start animation loop
      const animate = () => {
        analyserNode.getByteFrequencyData(dataArray);
        setFrequencyData([...dataArray]);
        
        if (onAudioData) {
          onAudioData(dataArray);
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
      
      // Stop after 3 seconds
      setTimeout(() => {
        oscillator.stop();
        stopAudio();
      }, 3000);
      
    } catch (error) {
      console.error('Failed to play test tone:', error);
    }
  };

  // Stop audio
  const stopAudio = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (audioContext) {
      audioContext.close();
    }
    
    setIsPlaying(false);
    setAudioContext(null);
    setAnalyser(null);
    setSource(null);
  };

  // Calculate average intensity for display
  const getAverageIntensity = () => {
    if (!frequencyData) return 0;
    const sum = frequencyData.reduce((a, b) => a + b, 0);
    return Math.round((sum / frequencyData.length / 255) * 100);
  };

  // Get bass intensity
  const getBassIntensity = () => {
    if (!frequencyData) return 0;
    const bassData = frequencyData.slice(0, 32);
    const sum = bassData.reduce((a, b) => a + b, 0);
    return Math.round((sum / bassData.length / 255) * 100);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4">
      <h4 className="text-white font-semibold mb-3">Music Reactivity Test Controls</h4>
      
      {/* Test Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={startMicrophone}
          disabled={isPlaying}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors"
        >
          {isPlaying ? 'Recording...' : 'Test with Microphone'}
        </button>
        
        <button
          onClick={() => playTestTone(220)}
          disabled={isPlaying}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors"
        >
          Play Low Tone (220Hz)
        </button>
        
        <button
          onClick={() => playTestTone(880)}
          disabled={isPlaying}
          className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors"
        >
          Play High Tone (880Hz)
        </button>
        
        <button
          onClick={stopAudio}
          disabled={!isPlaying}
          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors"
        >
          Stop Audio
        </button>
      </div>

      {/* Audio Level Indicators */}
      {isPlaying && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm">Overall Intensity:</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 h-2 bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-100"
                  style={{ width: `${getAverageIntensity()}%` }}
                />
              </div>
              <span className="text-white text-xs w-8">{getAverageIntensity()}%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-white text-sm">Bass Intensity:</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 h-2 bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-100"
                  style={{ width: `${getBassIntensity()}%` }}
                />
              </div>
              <span className="text-white text-xs w-8">{getBassIntensity()}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-gray-700 rounded text-xs text-gray-300">
        <p className="font-semibold mb-1">How to test:</p>
        <ul className="space-y-1">
          <li>• <strong>Microphone:</strong> Click "Test with Microphone" and play music or make sounds</li>
          <li>• <strong>Test Tones:</strong> Click tone buttons to see sphere react to different frequencies</li>
          <li>• <strong>Watch the sphere:</strong> It should change colors and size based on audio input</li>
          <li>• <strong>Check indicators:</strong> The bars above show real-time audio levels</li>
        </ul>
      </div>
    </div>
  );
};

export default MusicTestControls;
