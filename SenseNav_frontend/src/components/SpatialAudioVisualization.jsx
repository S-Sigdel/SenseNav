import React, { useState, useEffect } from 'react';

const SpatialAudioVisualization = () => {
  const [spatialData, setSpatialData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration - replace with actual API calls
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
      }
    },
    targets: [
      {
        sector: "UP",
        distance: 1.5,
        azimuth_deg: 10.0,
        elevation_deg: 35.0,
        audio_params: { frequency: 800, tremolo_rate: 5.0, gain: 0.9 }
      },
      {
        sector: "FR",
        distance: 1.8,
        azimuth_deg: -30.0,
        elevation_deg: 5.0,
        audio_params: { frequency: 720, tremolo_rate: 4.1, gain: 0.8 }
      }
    ],
    total_obstacles: 3
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Obstacle Detection Grid */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-base font-bold text-white mb-3">Detected Obstacles</h3>
            <div className="space-y-3">
              {Object.entries(spatialData.obstacles).map(([sector, data]) => (
                <div key={sector} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getSectorColor(sector)}`}></div>
                      <span className="text-white font-medium">{getSectorName(sector)}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {data.distance.toFixed(1)}m
                    </span>
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
          </div>

          {/* Priority Targets */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-base font-bold text-white mb-3">Priority Targets</h3>
            <div className="space-y-3">
              {spatialData.targets.map((target, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-3 border-l-4 border-red-500">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <span className="text-white font-medium">{getSectorName(target.sector)}</span>
                    </div>
                    <span className="text-xs text-red-400 font-bold">
                      PRIORITY
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                    <div>
                      <span className="text-gray-400">Distance:</span> {target.distance.toFixed(1)}m
                    </div>
                    <div>
                      <span className="text-gray-400">Direction:</span> {target.azimuth_deg.toFixed(0)}°
                    </div>
                    <div>
                      <span className="text-gray-400">Audio Freq:</span> {target.audio_params.frequency.toFixed(0)}Hz
                    </div>
                    <div>
                      <span className="text-gray-400">Tremolo:</span> {target.audio_params.tremolo_rate.toFixed(1)}Hz
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">
              {spatialData ? `${spatialData.total_obstacles} obstacles detected` : 'Waiting for data...'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpatialAudioVisualization;
