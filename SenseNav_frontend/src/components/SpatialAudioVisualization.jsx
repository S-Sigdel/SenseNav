import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SpatialAudioVisualization = ({ centroidData }) => {
  const [spatialData, setSpatialData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [useSunoAPI, setUseSunoAPI] = useState(true);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [currentOscillators, setCurrentOscillators] = useState([]);

  // Initialize audio context
  useEffect(() => {
    const initAudio = async () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        setAudioContext(ctx);
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };
    initAudio();
  }, []);

  // Stop current audio
  const stopAudio = () => {
    // Stop HTML audio element
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    
    // Stop all Web Audio API oscillators
    currentOscillators.forEach(oscillator => {
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });
    setCurrentOscillators([]);
    
    setIsPlayingAudio(false);
    setSelectedTestCase(null);
  };

  // Debug centroid data (reduced frequency)
  useEffect(() => {
    if (centroidData && Math.random() < 0.1) { // Only log 10% of updates
      console.log('SpatialAudioVisualization received centroid:', centroidData);
    }
  }, [centroidData]);

  // Enhanced mock data with more test cases
  const mockSpatialData = {
    obstacles: {
      FL: {
        distance: 2.3,
        azimuth_deg: 45.0,
        elevation_deg: 0.0,
        audio_params: { frequency: 650, tremolo_rate: 3.2, gain: 0.7 }
      },
      FR: {
        distance: 1.8,
        azimuth_deg: -30.0,
        elevation_deg: 5.0,
        audio_params: { frequency: 720, tremolo_rate: 4.1, gain: 0.8 }
      },
      UP: {
        distance: 1.5,
        azimuth_deg: 10.0,
        elevation_deg: 35.0,
        audio_params: { frequency: 800, tremolo_rate: 5.0, gain: 0.9 }
      },
      BL: {
        distance: 3.2,
        azimuth_deg: 135.0,
        elevation_deg: -10.0,
        audio_params: { frequency: 450, tremolo_rate: 2.8, gain: 0.5 }
      },
      BR: {
        distance: 2.8,
        azimuth_deg: -120.0,
        elevation_deg: -5.0,
        audio_params: { frequency: 520, tremolo_rate: 3.5, gain: 0.6 }
      },
      DOWN: {
        distance: 1.2,
        azimuth_deg: 0.0,
        elevation_deg: -45.0,
        audio_params: { frequency: 300, tremolo_rate: 6.0, gain: 0.9 }
      }
    },
    total_obstacles: 6
  };

  // Test cases for different scenarios
  const testCases = [
    {
      id: 'left_front',
      name: 'Left Front',
      description: 'Audio for front-left obstacle',
      data: {
        distance: 2.0,
        azimuth_deg: -45.0,
        elevation_deg: 0.0,
        audio_params: { frequency: 600, tremolo_rate: 1.0, gain: 0.7 }
      }
    },
    {
      id: 'left_back',
      name: 'Left Back',
      description: 'Audio for back-left obstacle',
      data: {
        distance: 2.5,
        azimuth_deg: -135.0,
        elevation_deg: 0.0,
        audio_params: { frequency: 500, tremolo_rate: 0.8, gain: 0.6 }
      }
    },
    {
      id: 'right_front',
      name: 'Right Front',
      description: 'Audio for front-right obstacle',
      data: {
        distance: 2.0,
        azimuth_deg: 45.0,
        elevation_deg: 0.0,
        audio_params: { frequency: 600, tremolo_rate: 1.0, gain: 0.7 }
      }
    },
    {
      id: 'right_back',
      name: 'Right Back',
      description: 'Audio for back-right obstacle',
      data: {
        distance: 2.5,
        azimuth_deg: 135.0,
        elevation_deg: 0.0,
        audio_params: { frequency: 500, tremolo_rate: 0.8, gain: 0.6 }
      }
    },
    {
      id: 'close_center',
      name: 'Close',
      description: 'High frequency, high intensity audio for nearby obstacle',
      data: {
        distance: 0.8,
        azimuth_deg: 0.0,
        elevation_deg: 0.0,
        audio_params: { frequency: 900, tremolo_rate: 2.0, gain: 1.0 }
      }
    },
    {
      id: 'far_center',
      name: 'Far',
      description: 'Low frequency, low intensity audio for distant obstacle',
      data: {
        distance: 5.0,
        azimuth_deg: 0.0,
        elevation_deg: 0.0,
        audio_params: { frequency: 200, tremolo_rate: 0.5, gain: 0.3 }
      }
    }
  ];

  const testConnection = async () => {
    setLoading(true);
    try {
      // Try to connect to backend
      const response = await fetch('http://localhost:5001/api/health');
      if (response.ok) {
        setIsConnected(true);
        // Load mock data for demonstration
        setSpatialData(mockSpatialData);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      setIsConnected(false);
      // Use mock data when backend is not available
      setSpatialData(mockSpatialData);
    }
    setLoading(false);
  };

  useEffect(() => {
    testConnection();
    // Set up polling for real-time updates
    const interval = setInterval(testConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const getSectorColor = (sector) => {
    const colors = {
      FL: 'bg-blue-500',
      FR: 'bg-green-500',
      BL: 'bg-yellow-500',
      BR: 'bg-red-500',
      UP: 'bg-purple-500',
      DOWN: 'bg-orange-500'
    };
    return colors[sector] || 'bg-gray-500';
  };

  const getSectorName = (sector) => {
    const names = {
      FL: 'Front-Left',
      FR: 'Front-Right',
      BL: 'Back-Left',
      BR: 'Back-Right',
      UP: 'Above',
      DOWN: 'Below'
    };
    return names[sector] || sector;
  };

  const getIntensityLevel = (gain) => {
    if (gain > 0.8) return 'High';
    if (gain > 0.5) return 'Medium';
    return 'Low';
  };

  // Generate and play spatial audio for test cases
  const generateTestAudio = async (testCase) => {
    if (!audioContext || isPlayingAudio) return;

    try {
      setIsPlayingAudio(true);
      setSelectedTestCase(testCase.id);
      
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create oscillator for the main tone
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const pannerNode = audioContext.createPanner();

      // Track the oscillator for stopping
      setCurrentOscillators([oscillator]);

      // Set up the audio graph
      oscillator.connect(gainNode);
      gainNode.connect(pannerNode);
      pannerNode.connect(audioContext.destination);

      // Configure oscillator
      oscillator.frequency.setValueAtTime(testCase.data.audio_params.frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      // Configure panning based on azimuth
      const panValue = Math.sin(testCase.data.azimuth_deg * Math.PI / 180);
      pannerNode.panningModel = 'equalpower';
      pannerNode.setPosition(panValue, 0, 0);

      // Configure volume
      const volume = testCase.data.audio_params.gain;
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 2);

      // Play the audio
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2);

      // Reset playing state after audio finishes
      setTimeout(() => {
        setIsPlayingAudio(false);
        setSelectedTestCase(null);
        setCurrentAudio(null);
        setCurrentOscillators([]);
      }, 2000);

    } catch (error) {
      console.error('Error generating test audio:', error);
      setIsPlayingAudio(false);
      setSelectedTestCase(null);
    }
  };

  // Generate audio for detected obstacles
  const generateObstacleAudio = async (sector, obstacleData) => {
    if (!audioContext || isPlayingAudio) return;

    try {
      setIsPlayingAudio(true);
      
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create oscillator for the main tone
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const pannerNode = audioContext.createPanner();

      // Track the oscillator for stopping
      setCurrentOscillators([oscillator]);

      // Set up the audio graph
      oscillator.connect(gainNode);
      gainNode.connect(pannerNode);
      pannerNode.connect(audioContext.destination);

      // Configure oscillator
      oscillator.frequency.setValueAtTime(obstacleData.audio_params.frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      // Configure panning based on azimuth
      const panValue = Math.sin(obstacleData.azimuth_deg * Math.PI / 180);
      pannerNode.panningModel = 'equalpower';
      pannerNode.setPosition(panValue, 0, 0);

      // Configure volume
      const volume = obstacleData.audio_params.gain;
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 2);

      // Play the audio
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2);

      // Reset playing state after audio finishes
      setTimeout(() => {
        setIsPlayingAudio(false);
        setCurrentOscillators([]);
      }, 2000);

    } catch (error) {
      console.error('Error generating obstacle audio:', error);
      setIsPlayingAudio(false);
      setCurrentOscillators([]);
    }
  };

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-high text-white">Spatial Audio Detection</h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-400">
            {isConnected ? 'Backend Connected' : 'Using Mock Data'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading spatial data...</span>
        </div>
      ) : spatialData ? (
        <div className="space-y-6">
          {/* Test Cases Section */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-base font-bold text-white mb-4">Audio Test Cases</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {testCases.map((testCase) => (
                <div key={testCase.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white text-sm font-semibold">{testCase.name}</h4>
                    <button
                      onClick={() => generateTestAudio(testCase)}
                      disabled={isPlayingAudio}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                        isPlayingAudio && selectedTestCase === testCase.id
                          ? 'bg-blue-600 text-white cursor-not-allowed'
                          : isPlayingAudio
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isPlayingAudio && selectedTestCase === testCase.id ? 'Playing...' : 'Test Audio'}
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mb-2">{testCase.description}</p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-300">
                    <div><span className="text-gray-400">Freq:</span> {testCase.data.audio_params.frequency}Hz</div>
                    <div><span className="text-gray-400">Gain:</span> {testCase.data.audio_params.gain}</div>
                    <div><span className="text-gray-400">Azimuth:</span> {testCase.data.azimuth_deg}°</div>
                    <div><span className="text-gray-400">Elevation:</span> {testCase.data.elevation_deg}°</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Obstacles Grid
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-base font-bold text-white mb-3">Detected Obstacles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(spatialData.obstacles).map(([sector, data]) => (
                <div key={sector} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getSectorColor(sector)}`}></div>
                      <span className="text-white font-medium">{getSectorName(sector)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {data.distance.toFixed(1)}m
                      </span>
                      <button
                        onClick={() => generateObstacleAudio(sector, data)}
                        disabled={isPlayingAudio}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                          isPlayingAudio
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                    <div>
                      <span className="text-gray-400">Direction:</span> {data.azimuth_deg.toFixed(0)}°
                    </div>
                    <div>
                      <span className="text-gray-400">Elevation:</span> {data.elevation_deg.toFixed(0)}°
                    </div>
                    <div>
                      <span className="text-gray-400">Frequency:</span> {data.audio_params.frequency.toFixed(0)}Hz
                    </div>
                    <div>
                      <span className="text-gray-400">Intensity:</span> {getIntensityLevel(data.audio_params.gain)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-3 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-gray-400">No spatial audio data available</p>
          <p className="text-gray-500 text-sm mt-1">Start the backend server to see live obstacle detection</p>
        </div>
      )}


      {/* Audio Status Indicator */}
      <div className="mt-4 bg-gray-800 border border-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm">Spatial Audio System</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${centroidData ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-xs text-green-400">
              {centroidData ? `Connected to depth detection` : 'Waiting for depth detection...'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpatialAudioVisualization;
