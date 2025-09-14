import React, { useState, useEffect } from 'react';
import humanBodyImage from '../assets/human body imagecut.png';
import SpatialAudioVisualization from '../components/SpatialAudioVisualization';
import NavigationMusicBox from '../components/NavigationMusicBox';
import WebRTCCamera from '../components/WebRTCCamera';
import DirectCameraFeed from '../components/DirectCameraFeed';
import SimpleMeshVisualization from '../components/SimpleMeshVisualization';
import DepthEstimationView from '../components/DepthEstimationView';

// Helper functions for directional audio mapping
const getDirectionalPan = (horizontal) => {
  const panMap = {
    'Far Left': 'Hard Left (-1.0)',
    'Left': 'Left (-0.6)',
    'Center-Left': 'Slight Left (-0.3)',
    'Center-Right': 'Slight Right (+0.3)',
    'Right': 'Right (+0.6)',
    'Far Right': 'Hard Right (+1.0)'
  };
  return panMap[horizontal] || 'Center (0.0)';
};

const getDirectionalPitch = (vertical) => {
  const pitchMap = {
    'Far Top': 'Very High (800Hz)',
    'Top': 'High (600Hz)',
    'Center-Top': 'Mid-High (500Hz)',
    'Center-Bottom': 'Mid-Low (400Hz)',
    'Bottom': 'Low (300Hz)',
    'Far Bottom': 'Very Low (200Hz)'
  };
  return pitchMap[vertical] || 'Medium (400Hz)';
};

const getDirectionalVolume = (distance) => {
  const volumeMap = {
    'Very Close': 'Loud (0.9)',
    'Close': 'Medium-High (0.7)',
    'Medium': 'Medium (0.5)',
    'Far': 'Low (0.3)',
    'Very Far': 'Very Low (0.1)'
  };
  return volumeMap[distance] || 'Medium (0.5)';
};

const getDirectionalTone = (combined) => {
  // Map specific combinations to unique tones
  if (combined.includes('Far Left')) return 'Bass Left';
  if (combined.includes('Far Right')) return 'Bass Right';
  if (combined.includes('Far Top')) return 'Treble High';
  if (combined.includes('Far Bottom')) return 'Bass Low';
  if (combined.includes('Center')) return 'Balanced';
  if (combined.includes('Very Close')) return 'Sharp';
  if (combined.includes('Very Far')) return 'Muffled';
  return 'Standard';
};

const Visualization = () => {
  // State to track which wristbands are active (for demo purposes)
  const [hapticFeedback, setHapticFeedback] = useState({
    leftHand: false,
    rightHand: false,
    leftFoot: false,
    rightFoot: false
  });

  // State for depth estimation data
  const [centroidData, setCentroidData] = useState(null);
  
  // State for audio generation
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioContext, setAudioContext] = useState(null);

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

  // Debug centroid data updates (reduced frequency)
  useEffect(() => {
    if (centroidData && Math.random() < 0.1) { // Only log 10% of updates
      console.log('Centroid data received in visualization:', centroidData);
    }
  }, [centroidData]);

  // Generate and play spatial audio based on obstacle direction
  const generateAndPlayAudio = async () => {
    if (!centroidData || !audioContext || isPlayingAudio) return;

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

      // Set up the audio graph
      oscillator.connect(gainNode);
      gainNode.connect(pannerNode);
      pannerNode.connect(audioContext.destination);

      // Configure oscillator based on vertical position
      const frequency = getFrequencyFromDirection(centroidData.direction.vertical);
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      // Configure panning based on horizontal position
      const panValue = getPanValueFromDirection(centroidData.direction.horizontal);
      pannerNode.panningModel = 'equalpower';
      pannerNode.setPosition(panValue, 0, 0);

      // Configure volume based on distance
      const volume = getVolumeFromDirection(centroidData.direction.distance);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 2);

      // Play the audio
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2);

      // Reset playing state after audio finishes
      setTimeout(() => {
        setIsPlayingAudio(false);
      }, 2000);

    } catch (error) {
      console.error('Error generating audio:', error);
      setIsPlayingAudio(false);
    }
  };

  // Helper functions for audio parameters
  const getFrequencyFromDirection = (vertical) => {
    const freqMap = {
      'Far Top': 800,
      'Top': 600,
      'Center-Top': 500,
      'Center-Bottom': 400,
      'Bottom': 300,
      'Far Bottom': 200
    };
    return freqMap[vertical] || 400;
  };

  const getPanValueFromDirection = (horizontal) => {
    const panMap = {
      'Far Left': -1.0,
      'Left': -0.6,
      'Center-Left': -0.3,
      'Center-Right': 0.3,
      'Right': 0.6,
      'Far Right': 1.0
    };
    return panMap[horizontal] || 0;
  };

  const getVolumeFromDirection = (distance) => {
    const volumeMap = {
      'Very Close': 0.9,
      'Close': 0.7,
      'Medium': 0.5,
      'Far': 0.3,
      'Very Far': 0.1
    };
    return volumeMap[distance] || 0.5;
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-important mb-4 text-white">Data Visualization</h1>
          <p className="text-body text-gray-400">
            Interactive visualizations and data insights for your HackMIT project.
          </p>
        </header>
        
        <main>

          {/* Depth Estimation Section */}
          <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-high mb-4 text-white">Depth Estimation & Obstacle Detection</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-base font-bold text-white mb-3">RGB Camera | Depth Map with Centroid Tracking</h3>
              <div className="bg-black border border-gray-600 rounded-lg h-96 overflow-hidden">
                <DepthEstimationView onCentroidUpdate={setCentroidData} />
              </div>
            </div>
            
            {/* Dynamic Centroid Data Display - Right Below Camera */}
            {centroidData && (
              <div className="mt-4 bg-blue-900 border border-blue-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white text-sm font-semibold">🎯 Live Obstacle Centroid Detection</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Live</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-800 rounded-lg p-3">
                    <h5 className="text-blue-200 text-xs font-semibold mb-2">Position</h5>
                    <p className="text-white text-lg font-mono">
                      X: {centroidData.x}px
                    </p>
                    <p className="text-white text-lg font-mono">
                      Y: {centroidData.y}px
                    </p>
                  </div>
                  <div className="bg-blue-800 rounded-lg p-3">
                    <h5 className="text-blue-200 text-xs font-semibold mb-2">Area</h5>
                    <p className="text-white text-lg font-mono">
                      {centroidData.area}px²
                    </p>
                    <p className="text-blue-300 text-xs">
                      Bounding Box: {centroidData.bbox.width}×{centroidData.bbox.height}
                    </p>
                  </div>
                </div>
                
                {/* Directional Classification */}
                <div className="mt-3 bg-blue-800 rounded-lg p-3">
                  <h5 className="text-blue-200 text-xs font-semibold mb-2">🎯 Directional Classification</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-blue-300">Horizontal:</span>
                      <span className="text-white ml-1 font-semibold">{centroidData.direction.horizontal}</span>
                    </div>
                    <div>
                      <span className="text-blue-300">Vertical:</span>
                      <span className="text-white ml-1 font-semibold">{centroidData.direction.vertical}</span>
                    </div>
                    <div>
                      <span className="text-blue-300">Distance:</span>
                      <span className="text-white ml-1 font-semibold">{centroidData.direction.distance}</span>
                    </div>
                    <div>
                      <span className="text-blue-300">Combined:</span>
                      <span className="text-white ml-1 font-semibold text-xs">{centroidData.direction.combined}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 bg-blue-800 rounded-lg p-3">
                  <h5 className="text-blue-200 text-xs font-semibold mb-2">🎵 Directional Audio Parameters</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-blue-300">Pan (L/R):</span>
                      <span className="text-white ml-1 font-semibold">{getDirectionalPan(centroidData.direction.horizontal)}</span>
                    </div>
                    <div>
                      <span className="text-blue-300">Pitch (T/B):</span>
                      <span className="text-white ml-1 font-semibold">{getDirectionalPitch(centroidData.direction.vertical)}</span>
                    </div>
                    <div>
                      <span className="text-blue-300">Volume:</span>
                      <span className="text-white ml-1 font-semibold">{getDirectionalVolume(centroidData.direction.distance)}</span>
                    </div>
                    <div>
                      <span className="text-blue-300">Tone:</span>
                      <span className="text-white ml-1 font-semibold">{getDirectionalTone(centroidData.direction.combined)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Haptic Feedback Section */}
          <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-high mb-4 text-white">Haptic Feedback Status</h2>
            <div className="flex flex-col items-center">
              <div className="relative">
                {/* Human Body PNG Image */}
                <img 
                  src={humanBodyImage} 
                  alt="Human Body Silhouette" 
                  className="w-64 h-auto"
                />

                {/* Haptic Feedback Bands */}
                {/* Hands */}
                <div 
                  className={`absolute w-6 h-4 rounded-full  transition-all duration-300 ${
                    hapticFeedback.leftHand 
                      ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/50' 
                      : 'bg-white border-gray-400'
                  }`}
                  style={{ top: 'calc(52% - 35px)', left: '22%' }}
                />
                <div 
                  className={`absolute w-6 h-4 rounded-full  transition-all duration-300 ${
                    hapticFeedback.rightHand 
                      ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/50' 
                      : 'bg-white border-gray-400'
                  }`}
                  style={{ top: 'calc(52% - 35px)', right: '22%' }}
                />

                {/* Feet */}
                <div 
                  className={`absolute w-6 h-4 rounded-full  transition-all duration-300 ${
                    hapticFeedback.leftFoot 
                      ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/50' 
                      : 'bg-white border-gray-400'
                  }`}
                  style={{ top: 'calc(88% - 10px)', left: '33%' }}
                />
                <div 
                  className={`absolute w-6 h-4 rounded-full transition-all duration-300 ${
                    hapticFeedback.rightFoot 
                      ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/50' 
                      : 'bg-white border-gray-400'
                  }`}
                  style={{ top: 'calc(88% - 10px)', right: '32%' }}
                />
              </div>

              {/* Status Indicators */}
              <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="bg-gray-800 rounded-lg p-3">
                  <h4 className="text-white font-semibold text-sm mb-2">Left Hand</h4>
                  <div className={`w-3 h-3 rounded-full ${hapticFeedback.leftHand ? 'bg-red-500' : 'bg-gray-600'}`}></div>
                  <p className="text-xs text-gray-400 mt-1">
                    {hapticFeedback.leftHand ? 'Active' : 'Inactive'}
                  </p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-3">
                  <h4 className="text-white font-semibold text-sm mb-2">Right Hand</h4>
                  <div className={`w-3 h-3 rounded-full ${hapticFeedback.rightHand ? 'bg-red-500' : 'bg-gray-600'}`}></div>
                  <p className="text-xs text-gray-400 mt-1">
                    {hapticFeedback.rightHand ? 'Active' : 'Inactive'}
                  </p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-3">
                  <h4 className="text-white font-semibold text-sm mb-2">Left Foot</h4>
                  <div className={`w-3 h-3 rounded-full ${hapticFeedback.leftFoot ? 'bg-red-500' : 'bg-gray-600'}`}></div>
                  <p className="text-xs text-gray-400 mt-1">
                    {hapticFeedback.leftFoot ? 'Active' : 'Inactive'}
                  </p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-3">
                  <h4 className="text-white font-semibold text-sm mb-2">Right Foot</h4>
                  <div className={`w-3 h-3 rounded-full ${hapticFeedback.rightFoot ? 'bg-red-500' : 'bg-gray-600'}`}></div>
                  <p className="text-xs text-gray-400 mt-1">
                    {hapticFeedback.rightFoot ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              {/* Demo Buttons (for testing - can be removed when backend is connected) */}
              <div className="mt-6">
                <p className="text-gray-400 text-sm mb-3">Demo Controls (for testing):</p>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setHapticFeedback(prev => ({...prev, leftHand: !prev.leftHand}))}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded transition-colors"
                  >
                    Toggle Left Hand
                  </button>
                  <button 
                    onClick={() => setHapticFeedback(prev => ({...prev, rightHand: !prev.rightHand}))}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded transition-colors"
                  >
                    Toggle Right Hand
                  </button>
                  <button 
                    onClick={() => setHapticFeedback(prev => ({...prev, leftFoot: !prev.leftFoot}))}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded transition-colors"
                  >
                    Toggle Left Foot
                  </button>
                  <button 
                    onClick={() => setHapticFeedback(prev => ({...prev, rightFoot: !prev.rightFoot}))}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded transition-colors"
                  >
                    Toggle Right Foot
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Navigation Music Box Section */}
          {/* <NavigationMusicBox modelPath="/models/soundhead.glb" /> */}
          {/* Directed Obstacle Direction & Audio Generation Section */}
          <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-high mb-4 text-white">🎯 Directed Obstacle Direction</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              {centroidData ? (
                <div className="space-y-4">
                  {/* Current Direction Display */}
                  <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
                    <h3 className="text-white text-lg font-semibold mb-3">Current Obstacle Direction</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-800 rounded-lg p-3 text-center">
                        <div className="text-2xl mb-2">🎯</div>
                        <p className="text-white text-sm font-semibold">Direction</p>
                        <p className="text-blue-300 text-lg font-bold">{centroidData.direction.combined}</p>
                      </div>
                      <div className="bg-blue-800 rounded-lg p-3 text-center">
                        <div className="text-2xl mb-2">📍</div>
                        <p className="text-white text-sm font-semibold">Position</p>
                        <p className="text-blue-300 text-lg font-bold">({centroidData.x}, {centroidData.y})</p>
                      </div>
                      <div className="bg-blue-800 rounded-lg p-3 text-center">
                        <div className="text-2xl mb-2">📏</div>
                        <p className="text-white text-sm font-semibold">Area</p>
                        <p className="text-blue-300 text-lg font-bold">{centroidData.area}px²</p>
                      </div>
                    </div>
                  </div>

                  {/* Audio Generation Button */}
                  <div className="bg-green-900 border border-green-700 rounded-lg p-4">
                    <h3 className="text-white text-lg font-semibold mb-3">🎵 Generate Spatial Audio</h3>
                    <div className="text-center">
                      <p className="text-green-300 text-sm mb-4">
                        Generate spatial audio based on the current obstacle direction and position.
                      </p>
                      <button
                        onClick={generateAndPlayAudio}
                        disabled={isPlayingAudio}
                        className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                          isPlayingAudio
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                        }`}
                      >
                        {isPlayingAudio ? '🔊 Playing Audio...' : '🎵 Generate & Play Audio'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-white text-lg font-semibold mb-2">No Obstacle Detected</h3>
                  <p className="text-gray-400">Move an object in front of the camera to see directional classification and generate spatial audio.</p>
                </div>
              )}
            </div>
          </section>

          {/* Spatial Audio Detection Section */}
          <SpatialAudioVisualization centroidData={centroidData} />
        </main>
      </div>
    </div>
  );
};

export default Visualization;
