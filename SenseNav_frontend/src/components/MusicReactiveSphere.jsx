import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MusicReactiveSphere = ({ radius = 3, musicData = null }) => {
  const sphereRef = useRef();
  const materialRef = useRef();
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [dataArray, setDataArray] = useState(null);
  
  // Color palette for music reactivity
  const colors = [
    '#ff0080', // Pink
    '#00ff80', // Green
    '#8000ff', // Purple
    '#ff8000', // Orange
    '#0080ff', // Blue
    '#ff0040', // Red
    '#40ff00', // Lime
    '#ff4000'  // Red-Orange
  ];

  // Initialize audio context for music analysis
  useEffect(() => {
    const initAudio = async () => {
      try {
        // This would connect to your server's audio stream
        // For now, we'll simulate with a demo audio context
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const analyserNode = context.createAnalyser();
        analyserNode.fftSize = 256;
        
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        setAudioContext(context);
        setAnalyser(analyserNode);
        setDataArray(dataArray);
      } catch (error) {
        console.log('Audio context not available, using demo mode');
      }
    };

    initAudio();
    
    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  // Animation loop for music reactivity
  useFrame((state) => {
    if (!sphereRef.current || !materialRef.current) return;

    let intensity = 0.5;
    let colorIndex = 0;

    if (analyser && dataArray) {
      // Get real audio data
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average intensity from frequency data
      const sum = dataArray.reduce((a, b) => a + b, 0);
      intensity = (sum / dataArray.length) / 255;
      
      // Use bass frequencies for color selection
      const bassIntensity = dataArray.slice(0, 32).reduce((a, b) => a + b, 0) / 32;
      colorIndex = Math.floor((bassIntensity / 255) * colors.length);
    } else {
      // Demo mode - simulate music with sine waves
      const time = state.clock.elapsedTime;
      intensity = (Math.sin(time * 2) + Math.sin(time * 3.7) + Math.sin(time * 5.3)) / 3;
      intensity = (intensity + 1) / 2; // Normalize to 0-1
      colorIndex = Math.floor((Math.sin(time * 1.5) + 1) / 2 * colors.length);
    }

    // Clamp values
    intensity = Math.max(0.2, Math.min(1, intensity));
    colorIndex = Math.max(0, Math.min(colors.length - 1, colorIndex));

    // Update sphere scale based on music intensity
    const scale = 1 + intensity * 0.3;
    sphereRef.current.scale.setScalar(scale);

    // Update material color and opacity
    materialRef.current.color.set(colors[colorIndex]);
    materialRef.current.opacity = 0.3 + intensity * 0.4;

    // Rotate the sphere
    sphereRef.current.rotation.y += 0.005;
    sphereRef.current.rotation.x += 0.002;
  });

  return (
    <mesh ref={sphereRef} position={[0, 0, 0]}>
      <sphereGeometry args={[radius, 32, 16]} />
      <meshBasicMaterial
        ref={materialRef}
        color={colors[0]}
        wireframe={true}
        transparent={true}
        opacity={0.5}
      />
    </mesh>
  );
};

export default MusicReactiveSphere;
