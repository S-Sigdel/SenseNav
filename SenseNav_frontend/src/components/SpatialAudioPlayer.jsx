import React, { useState, useRef, useEffect } from 'react';

const SpatialAudioPlayer = () => {
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);

  // Test scenarios from the spatial audio system
  const testScenarios = [
    {
      id: 0,
      name: "Front-left obstacle",
      description: "Single obstacle at front-left position",
      points: [[2.0, 1.5, 0.0]],
      expectedSectors: ["FL"]
    },
    {
      id: 1,
      name: "Front-right obstacle", 
      description: "Single obstacle at front-right position",
      points: [[2.0, -1.5, 0.0]],
      expectedSectors: ["FR"]
    },
    {
      id: 2,
      name: "Back-left obstacle",
      description: "Single obstacle behind and to the left",
      points: [[-2.0, 1.5, 0.0]],
      expectedSectors: ["BL"]
    },
    {
      id: 3,
      name: "Back-right obstacle",
      description: "Single obstacle behind and to the right", 
      points: [[-2.0, -1.5, 0.0]],
      expectedSectors: ["BR"]
    },
    {
      id: 4,
      name: "Overhead obstacle",
      description: "Single obstacle above the user",
      points: [[1.5, 0.0, 2.0]],
      expectedSectors: ["UP"]
    },
    {
      id: 5,
      name: "Underground obstacle",
      description: "Single obstacle below ground level",
      points: [[1.5, 0.0, -1.0]],
      expectedSectors: ["DOWN"]
    },
    {
      id: 6,
      name: "Multiple obstacles - front corners",
      description: "Two obstacles at front corners",
      points: [[2.0, 1.5, 0.0], [2.5, -1.2, 0.0]],
      expectedSectors: ["FL", "FR"]
    },
    {
      id: 7,
      name: "Multiple obstacles - all corners",
      description: "Four obstacles at all corner positions",
      points: [[2.0, 1.5, 0.0], [2.5, -1.2, 0.0], [-1.8, 1.0, 0.0], [-2.2, -0.8, 0.0]],
      expectedSectors: ["FL", "FR", "BL", "BR"]
    },
    {
      id: 8,
      name: "Complex 3D scenario",
      description: "Multi-level obstacles with elevation",
      points: [[1.5, 1.0, 0.0], [-2.0, -1.0, 0.0], [1.0, 0.0, 2.5], [2.0, 0.0, -0.8]],
      expectedSectors: ["FL", "BR", "UP", "DOWN"]
    }
  ];

  const generateAudio = async () => {
    setIsLoading(true);
    try {
      const scenario = testScenarios[selectedScenario];
      const response = await fetch('http://localhost:5001/api/spatial-audio/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points: scenario.points,
          mode: "sequential",
          duration: 3.0,
          sample_rate: 48000
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      } else {
        console.error('Failed to generate audio');
      }
    } catch (error) {
      console.error('Error generating audio:', error);
    }
    setIsLoading(false);
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      const handleEnded = () => setIsPlaying(false);
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, [audioUrl]);

  const currentScenario = testScenarios[selectedScenario];

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-high mb-4 text-white">Spatial Audio Test Player</h2>
      
      {/* Scenario Selection */}
      <div className="mb-6">
        <label className="block text-white text-sm font-medium mb-2">
          Select Test Scenario:
        </label>
        <select
          value={selectedScenario}
          onChange={(e) => {
            setSelectedScenario(parseInt(e.target.value));
            setAudioUrl(null); // Hide audio controls when selecting new scenario
            setIsPlaying(false);
          }}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          {testScenarios.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
        </select>
      </div>

      {/* Scenario Details */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
        <h3 className="text-white font-semibold mb-2">{currentScenario.name}</h3>
        <p className="text-gray-400 text-sm mb-3">{currentScenario.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-white text-sm font-medium mb-2">Obstacle Positions:</h4>
            <div className="space-y-1">
              {currentScenario.points.map((point, index) => (
                <div key={index} className="text-xs text-gray-300 font-mono">
                  [{point[0].toFixed(1)}, {point[1].toFixed(1)}, {point[2].toFixed(1)}]
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white text-sm font-medium mb-2">Expected Sectors:</h4>
            <div className="flex flex-wrap gap-1">
              {currentScenario.expectedSectors.map((sector) => (
                <span
                  key={sector}
                  className="bg-blue-500 text-white text-xs px-2 py-1 rounded"
                >
                  {sector}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Audio Generation */}
      <div className="mb-4">
        <button
          onClick={generateAudio}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generating Audio...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              Generate Spatial Audio
            </>
          )}
        </button>
      </div>

      {/* Audio Controls */}
      {audioUrl && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={playAudio}
              disabled={isPlaying}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white px-3 py-2 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15a2 2 0 012 2v0a2 2 0 01-2 2h-1.586a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 0010 14H9a2 2 0 01-2-2v0a2 2 0 012-2z" />
              </svg>
            </button>
            
            <button
              onClick={pauseAudio}
              disabled={!isPlaying}
              className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-white px-3 py-2 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              </svg>
            </button>
            
            <button
              onClick={stopAudio}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
              </svg>
            </button>

            <div className="flex items-center gap-2 ml-4">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728" />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20"
              />
              <span className="text-white text-xs">{Math.round(volume * 100)}%</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-green-400 text-sm">
              🎧 Use headphones for proper spatial audio experience
            </p>
          </div>
        </div>
      )}

      {/* Hidden audio element */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="auto" />
      )}
    </section>
  );
};

export default SpatialAudioPlayer;
