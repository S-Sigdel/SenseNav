import React, { useState } from 'react';
import humanBodyImage from '../assets/human body imagecut.png';
import SpatialAudioVisualization from '../components/SpatialAudioVisualization';
import NavigationMusicBox from '../components/NavigationMusicBox';

const Visualization = () => {
  // State to track which wristbands are active (for demo purposes)
  const [hapticFeedback, setHapticFeedback] = useState({
    leftHand: false,
    rightHand: false,
    leftFoot: false,
    rightFoot: false
  });

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

          {/* Live Video Feeds Section */}
          <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-high mb-4 text-white">Live Video Feeds</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h3 className="text-base font-bold text-white mb-3">LiDAR Environmental Scan</h3>
                <div className="bg-black border border-gray-600 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">Live LiDAR Feed</p>
                    <p className="text-gray-500 text-xs mt-1">Waiting for backend connection...</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h3 className="text-base font-bold text-white mb-3">3D Mesh Visualization</h3>
                <div className="bg-black border border-gray-600 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">3D Mesh Processing</p>
                    <p className="text-gray-500 text-xs mt-1">Waiting for backend connection...</p>
                  </div>
                </div>
              </div>
            </div>
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
          {/* Navigation Status Section */}
            <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-high mb-4 text-white">Navigation Status</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-white text-xs font-semibold">System Ready</p>
                  <p className="text-gray-400 text-xs">Active</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-white text-xs font-semibold">Navigation Active</p>
                  <p className="text-gray-400 text-xs">Tracking</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-white text-xs font-semibold">Audio Feedback</p>
                  <p className="text-gray-400 text-xs">Enabled</p>
                </div>
              </div>
            </div>
          </section>

          {/* Spatial Audio Detection Section */}
          <SpatialAudioVisualization />
        </main>
      </div>
    </div>
  );
};

export default Visualization;
