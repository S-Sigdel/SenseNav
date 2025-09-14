import React from 'react';
import Model3D from './Model3D';

export default function ExampleModelUsage() {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center">3D Model Examples</h1>
      
      {/* Basic model display */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Basic Model</h2>
        <Model3D 
          modelPath="/models/your-model.glb"
          height="400px"
        />
      </div>
      
      {/* Scaled and positioned model */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Scaled Model</h2>
        <Model3D 
          modelPath="/models/your-model.glb"
          height="300px"
          scale={0.5}
          position={[0, -1, 0]}
          cameraPosition={[3, 3, 3]}
        />
      </div>
      
      {/* Side-by-side models */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Multiple Models</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Model3D 
            modelPath="/models/your-model.glb"
            height="250px"
            scale={0.8}
          />
          <Model3D 
            modelPath="/models/your-model.glb"
            height="250px"
            scale={1.2}
            cameraPosition={[-3, 2, 3]}
          />
        </div>
      </div>
    </div>
  );
}
