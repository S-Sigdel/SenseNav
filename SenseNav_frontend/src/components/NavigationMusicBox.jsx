import React from 'react';
// import Model3D from './Model3D';
import MusicTestControls from './MusicTestControls';

const NavigationMusicBox = ({ modelPath = "/models/soundhead.glb" }) => {
  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-high mb-4 text-white">Navigation Music Box</h2>
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-base font-bold text-white mb-3">3D Navigation Model</h3>
        <div className="bg-black border border-gray-600 rounded-lg overflow-hidden">
          {/* <Model3D 
            modelPath={modelPath}
            height="350px"
            scale={1}
            position={[0, 0, 0]}
            cameraPosition={[0, 0, 5]}
          /> */}
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-2"></div>
            <p className="text-white text-xs font-semibold">Model Loaded</p>
            <p className="text-gray-400 text-xs">Ready</p>
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
        
        {/* Music Test Controls */}
        <MusicTestControls />
      </div>
    </section>
  );
};

export default NavigationMusicBox;
