import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [useSunoAPI, setUseSunoAPI] = useState(true);
  const [currentAudio, setCurrentAudio] = useState(null);

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
    console.log('Stop audio called, currentAudio:', currentAudio, 'isPlayingAudio:', isPlayingAudio);
    
    if (currentAudio) {
      try {
        // Stop the audio
        currentAudio.pause();
        currentAudio.currentTime = 0;
        
        // Remove event listeners to prevent conflicts
        currentAudio.onended = null;
        currentAudio.onerror = null;
        
        console.log('Audio element stopped and cleaned up');
      } catch (error) {
        console.error('Error stopping audio element:', error);
      }
      
      setCurrentAudio(null);
    }
    
    // Always reset the playing and loading states
    setIsPlayingAudio(false);
    setIsLoadingAudio(false);
    console.log('Audio stopped, isPlayingAudio and isLoadingAudio set to false');
  };

  // Debug centroid data updates (reduced frequency)
  useEffect(() => {
    if (centroidData && Math.random() < 0.1) { // Only log 10% of updates
      console.log('Centroid data received in visualization:', centroidData);
    }
  }, [centroidData]);

  // Generate audio using Suno API via backend
  const generateSunoAudio = async () => {
    if (!centroidData || isPlayingAudio) return;

    try {
      console.log('Starting Suno audio generation, setting loading state');
      setIsLoadingAudio(true);
      setIsPlayingAudio(true);
      
      // Prepare data for backend API
      const requestData = {
        direction: centroidData.direction.combined,
        distance: centroidData.direction.distance,
        horizontal: centroidData.direction.horizontal,
        vertical: centroidData.direction.vertical,
        duration: 10
      };

      console.log('Generating Suno audio via backend:', requestData);
      
      // Call backend API with timeout
      const response = await axios.post('http://localhost:5001/api/suno/generate-audio', requestData, {
        timeout: 30000 // 30 second timeout
      });

      if (response.data && response.data.success && response.data.audio_url) {
        // Create and preload audio for faster playback
        const audio = new Audio(response.data.audio_url);
        setCurrentAudio(audio);
        console.log('Audio element created, preloading...');
        
        // Set up audio event handlers
        audio.onended = () => {
          console.log('Suno audio playback ended, setting isPlayingAudio to false');
          setIsPlayingAudio(false);
          setCurrentAudio(null);
        };
        
        audio.onerror = (error) => {
          console.error('Suno audio playback error:', error);
          setIsPlayingAudio(false);
          setCurrentAudio(null);
        };
        
        // Preload audio for faster playback
        audio.preload = 'auto';
        
        // Wait for audio to be ready, then start playback
        const startPlayback = async () => {
          try {
            // Wait for audio to be ready
            if (audio.readyState < 2) {
              await new Promise((resolve, reject) => {
                audio.oncanplay = resolve;
                audio.onerror = reject;
                // Fallback timeout
                setTimeout(() => resolve(), 2000);
              });
            }
            
            console.log('Audio ready, starting playback...');
            await audio.play();
            console.log('Suno audio started playing successfully');
            setIsLoadingAudio(false);
          } catch (playError) {
            console.error('Error starting Suno audio playback:', playError);
            setIsPlayingAudio(false);
            setIsLoadingAudio(false);
            setCurrentAudio(null);
          }
        };
        
        startPlayback();
        
        // Fallback timeout
        setTimeout(() => {
          console.log('Suno audio timeout reached, stopping audio');
          setIsPlayingAudio(false);
          setIsLoadingAudio(false);
          setCurrentAudio(null);
        }, 15000); // 15 seconds max
        
      } else {
        throw new Error('No audio URL received from backend');
      }

    } catch (error) {
      console.error('Error generating Suno audio:', error);
      setIsLoadingAudio(false);
      // Fallback to basic audio generation
      generateBasicAudio();
    }
  };

  // Generate spatial audio from boundary surface points ONLY
  const generateBoundarySpatialAudio = async () => {
    if (!centroidData || isPlayingAudio) return;

    try {
      console.log('Starting boundary spatial audio generation');
      setIsPlayingAudio(true);
      
      // Prepare boundary data for backend API
      const requestData = {
        bbox: centroidData.bbox,
        depth: 0.5, // Use a default depth value
        image_width: 320, // Default image width
        image_height: 240 // Default image height
      };

      console.log('Generating boundary spatial audio via backend:', requestData);
      
      // Call boundary analysis API
      const response = await axios.post('http://localhost:5001/api/spatial-audio/analyze-boundary', requestData);

      if (response.data && response.data.obstacles) {
        console.log('Boundary spatial audio analysis result:', response.data);
        
        // Generate Suno audio with boundary-specific spatial positioning
        const sunoRequestData = {
          direction: centroidData.direction.combined,
          distance: centroidData.direction.distance,
          horizontal: centroidData.direction.horizontal,
          vertical: centroidData.direction.vertical,
          duration: 10,
          // Add boundary-specific information for spatial positioning
          boundary_analysis: {
            obstacles: response.data.obstacles,
            targets: response.data.targets,
            boundary_points: response.data.boundary_surface_points
          }
        };

        const sunoResponse = await axios.post('http://localhost:5001/api/suno/generate-audio', sunoRequestData);
        
        if (sunoResponse.data && sunoResponse.data.success && sunoResponse.data.audio_url) {
          // Create audio element with spatial positioning based on boundary analysis
          const audio = new Audio(sunoResponse.data.audio_url);
          
          // Set up spatial audio context for boundary positioning
          if (audioContext) {
            try {
              await audioContext.resume();
              
              // Create spatial audio nodes for boundary positioning
              const source = audioContext.createMediaElementSource(audio);
              const gainNode = audioContext.createGain();
              const pannerNode = audioContext.createPanner();
              
              // Configure panner for boundary-based spatial positioning
              pannerNode.panningModel = 'HRTF';
              pannerNode.distanceModel = 'exponential';
              pannerNode.rolloffFactor = 1;
              pannerNode.coneInnerAngle = 360;
              pannerNode.coneOuterAngle = 0;
              pannerNode.coneOuterGain = 0;
              
              // Position audio based on boundary analysis
              if (response.data.targets && response.data.targets.length > 0) {
                const target = response.data.targets[0]; // Use first target
                const [sector, distance, azimuth, elevation] = target;
                
                // Convert spherical coordinates to Cartesian for Web Audio API
                const x = distance * Math.cos(elevation) * Math.sin(azimuth);
                const y = distance * Math.sin(elevation);
                const z = distance * Math.cos(elevation) * Math.cos(azimuth);
                
                pannerNode.positionX.value = x;
                pannerNode.positionY.value = y;
                pannerNode.positionZ.value = z;
                
                console.log(`Positioning Suno audio at boundary sector ${sector}:`, { x, y, z, distance, azimuth, elevation });
              }
              
              // Connect audio graph for spatial positioning
              source.connect(gainNode);
              gainNode.connect(pannerNode);
              pannerNode.connect(audioContext.destination);
              
              // Set volume based on distance
              if (response.data.targets && response.data.targets.length > 0) {
                const target = response.data.targets[0];
                const distance = target[1];
                const volume = Math.max(0.1, Math.min(1.0, 1.0 / (distance + 0.1)));
                gainNode.gain.value = volume;
                console.log(`Setting boundary audio volume to ${volume} based on distance ${distance}`);
              }
              
            } catch (audioError) {
              console.warn('Spatial audio setup failed, falling back to regular playback:', audioError);
            }
          }
          
          setCurrentAudio(audio);
          console.log('Starting boundary-based spatial audio playback');
          audio.play();
          
          audio.onended = () => {
            console.log('Boundary spatial audio playback ended');
            setIsPlayingAudio(false);
            setCurrentAudio(null);
          };
          
          audio.onerror = (error) => {
            console.error('Boundary spatial audio playback error:', error);
            setIsPlayingAudio(false);
            setCurrentAudio(null);
          };
        }
      } else {
        console.error('Invalid response from boundary analysis API:', response.data);
        setIsPlayingAudio(false);
      }
    } catch (error) {
      console.error('Error generating boundary spatial audio:', error);
      setIsPlayingAudio(false);
    }
  };

  // Fallback to basic Web Audio API generation
  const generateBasicAudio = async () => {
    if (!audioContext) return;

    try {
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
        setCurrentAudio(null);
      }, 2000);

    } catch (error) {
      console.error('Error generating basic audio:', error);
      setIsPlayingAudio(false);
    }
  };

  // Generate and play spatial audio based on obstacle direction
  const generateAndPlayAudio = async () => {
    if (!centroidData || isPlayingAudio) return;
    
    if (useSunoAPI) {
      // Try Suno API first, fallback to basic audio
      await generateSunoAudio();
    } else {
      // Use basic Web Audio API
      await generateBasicAudio();
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
                  <h4 className="text-white text-sm font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Live Obstacle Centroid Detection
                  </h4>
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
                  <h5 className="text-blue-200 text-xs font-semibold mb-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    Directional Classification
                  </h5>
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
                  <h5 className="text-blue-200 text-xs font-semibold mb-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                    Directional Audio Parameters
                  </h5>
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
          <NavigationMusicBox modelPath="/models/soundhead.glb" />
          {/* Directed Obstacle Direction & Audio Generation Section */}
            <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-high mb-4 text-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Directed Obstacle Direction
            </h2>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              {centroidData ? (
                <div className="space-y-4">
                  {/* Current Direction Display */}
                  <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
                    <h3 className="text-white text-lg font-semibold mb-3">Current Obstacle Direction</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-800 rounded-lg p-3 text-center">
                        <div className="flex justify-center mb-2">
                          <svg className="w-6 h-6 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-white text-sm font-semibold">Direction</p>
                        <p className="text-blue-300 text-lg font-bold">{centroidData.direction.combined}</p>
                      </div>
                      <div className="bg-blue-800 rounded-lg p-3 text-center">
                        <div className="flex justify-center mb-2">
                          <svg className="w-6 h-6 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-white text-sm font-semibold">Position</p>
                        <p className="text-blue-300 text-lg font-bold">({centroidData.x}, {centroidData.y})</p>
                      </div>
                      <div className="bg-blue-800 rounded-lg p-3 text-center">
                        <div className="flex justify-center mb-2">
                          <svg className="w-6 h-6 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-white text-sm font-semibold">Area</p>
                        <p className="text-blue-300 text-lg font-bold">{centroidData.area}px²</p>
                      </div>
                    </div>
                  </div>

                  {/* Audio Generation Button */}
                  <div className="bg-gradient-to-br from-emerald-800 via-green-800 to-teal-900 border border-emerald-600 rounded-xl p-6 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                      <svg className="w-6 h-6 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                      </svg>
                      Generate Spatial Audio
                    </h3>
                    <div className="text-center">
                      <p className="text-emerald-200 text-sm mb-6 leading-relaxed">
                        Generate spatial audio based on the current obstacle direction and position.
                      </p>
                      
                      {/* API Toggle */}
                      <div className="mb-6 flex items-center justify-center gap-4">
                        <span className={`text-sm font-medium transition-colors ${!useSunoAPI ? 'text-white' : 'text-emerald-300'}`}>Basic Audio</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useSunoAPI}
                            onChange={(e) => setUseSunoAPI(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-12 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-green-600 shadow-lg"></div>
                        </label>
                        <span className={`text-sm font-medium transition-colors ${useSunoAPI ? 'text-white' : 'text-emerald-300'}`}>Suno AI</span>
                      </div>
                      
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={generateAndPlayAudio}
                          disabled={isPlayingAudio || isLoadingAudio}
                          className={`flex-1 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                            isPlayingAudio || isLoadingAudio
                              ? 'bg-gray-600 cursor-not-allowed'
                              : useSunoAPI
                              ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transform hover:scale-105'
                              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:scale-105'
                          }`}
                        >
                          {isLoadingAudio ? (
                            <>
                              <svg className="w-5 h-5 mr-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating Audio...
                            </>
                          ) : isPlayingAudio 
                            ? (
                              <>
                                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                                </svg>
                                Playing Audio...
                              </>
                            )
                            : useSunoAPI 
                            ? (
                              <>
                                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                                </svg>
                                Generate AI Audio
                              </>
                            )
                            : (
                              <>
                                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                                </svg>
                                Generate Basic Audio
                              </>
                            )
                          }
                        </button>
                        
                        {/* Boundary Spatial Audio Button */}
                        <button
                          onClick={generateBoundarySpatialAudio}
                          disabled={!centroidData || isPlayingAudio || isLoadingAudio}
                          className={`flex-1 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                            !centroidData || isPlayingAudio || isLoadingAudio
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:scale-105'
                          }`}
                        >
                          <svg className="w-5 h-5 mr-3 inline" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                          </svg>
                          Generate Boundary Audio
                        </button>
                        
                        {isPlayingAudio && (
                          <button
                            onClick={stopAudio}
                            className="px-6 py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 transition-all duration-200"
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                            </svg>
                            Stop Audio
                          </button>
                        )}
                      </div>
                      
                      {/* Stop button - only show when audio is playing */}
                      {isPlayingAudio && (
                        <div className="mt-4">
                          <button
                            onClick={stopAudio}
                            className="px-6 py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                            </svg>
                            Stop Audio
                          </button>
                        </div>
                      )}
                      
                      {useSunoAPI && (
                        <p className="text-emerald-300 text-sm mt-4 text-center font-medium">
                          Using Suno AI for advanced spatial audio generation
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                </div>
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
