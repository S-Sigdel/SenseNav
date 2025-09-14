// import React, { Suspense, useState } from 'react';
// import { Canvas } from '@react-three/fiber';
// import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
// import MusicReactiveSphere from './MusicReactiveSphere';

// // Component to load and display the GLB model
// function Model({ modelPath, scale = 1, position = [0, 0, 0], onError }) {
//   const { scene } = useGLTF(modelPath);
  
//   return (
//     <primitive 
//       object={scene} 
//       scale={scale} 
//       position={position}
//     />
//   );
// }

// // Loading fallback component
// function Loader() {
//   return (
//     <mesh>
//       <boxGeometry args={[1, 1, 1]} />
//       <meshStandardMaterial color="gray" />
//     </mesh>
//   );
// }

// // Main 3D scene component
// export default function Model3D({ 
//   modelPath = "/models/your-model.glb", 
//   width = "100%", 
//   height = "400px",
//   scale = 1,
//   position = [0, 0, 0],
//   cameraPosition = [0, 0, 5]
// }) {
//   const handleError = (e) => console.error(e);

//   return (
//     <div style={{ width, height }}>
//       <Canvas
//         camera={{ position: cameraPosition, fov: 75 }}
//         style={{ background: '#000000' }}
//         onError={handleError}
//       >
//         {/* Lighting */}
//         <ambientLight intensity={0.5} />
//         <directionalLight position={[10, 10, 5]} intensity={1} />
        
//         {/* Environment for better reflections */}
//         <Environment preset="studio" />
        
//         {/* 3D Model with loading fallback */}
//         <Suspense fallback={<Loader />}>
//           <Model 
//             modelPath={modelPath} 
//             scale={scale} 
//             position={position} 
//             onError={handleError}
//           />
//           {/* Music Reactive Sphere around the model */}
//           <MusicReactiveSphere radius={2.5} />
//         </Suspense>
        
//         {/* Camera controls */}
//         <OrbitControls 
//           enablePan={true}
//           enableZoom={true}
//           enableRotate={true}
//         />
//       </Canvas>
//     </div>
//   );
// }
