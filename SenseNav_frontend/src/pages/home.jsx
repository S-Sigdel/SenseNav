import React from 'react';

const Home = ({ setCurrentPage }) => {
  const handleNavigateToVisualization = () => {
    setCurrentPage('visualization');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            Making the world accessible for the visually impaired
          </h1>
          <p className="text-2xl text-gray-300 mb-8 leading-relaxed">
            Through OpenCV, Open3D, sound, and haptic feedback
          </p>
          <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">
            SenseNav is an assistive technology project designed to help visually impaired individuals 
            navigate their surroundings with greater confidence and independence. By combining hardware 
            sensors and software-driven auditory/haptic feedback, SenseNav provides a multi-sensory 
            "visualization" of the environment in real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleNavigateToVisualization}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full transition-colors duration-200 text-lg"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-4">🚀 Features</h2>
          <p className="text-gray-400 text-center mb-12 text-lg">
            Revolutionary technology that transforms how visually impaired individuals experience their environment
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">🌐 Real-Time Environmental Awareness</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• <span className="text-blue-400">Intel's Open Source Deep Learning Model MiDaS:</span> AI-powered real-time "range of vision"</li>
                <li>• <span className="text-blue-400">3D Mesh Reconstruction (Open3D):</span> Dynamic spatial models from camera data</li>
                <li>• <span className="text-blue-400">Auditory Visualization:</span> Converts spatial data into immersive binaural soundscapes</li>
              </ul>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">🎵 Auditory Guidance</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• <span className="text-blue-400">Headphones/Earbuds:</span> Real-time environmental soundscapes</li>
                <li>• <span className="text-blue-400">Binaural Audio:</span> Dimensional sound for spatial orientation</li>
                <li>• <span className="text-blue-400">Ambient Layer:</span> SUNO-generated music for intuitive navigation</li>
              </ul>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">⚡ Collision Avoidance System</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• <span className="text-blue-400">Ultrasound Sensors:</span> Wristbands and ankle bands detect objects</li>
                <li>• <span className="text-blue-400">Haptic Feedback:</span> Vibrations warn of nearby obstacles</li>
                <li>• <span className="text-blue-400">Localized Alerts:</span> Independent band vibrations per limb</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Components Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Hardware Components */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-white mb-6">🛠️ Hardware Components</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-white font-semibold">Ultrasonic Module</h4>
                    <h4 className="text-white font-semibold">Vibration Module</h4>
                    <p className="text-gray-400">Environmental scanning and AI depth estimation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-white font-semibold">Microcontroller/Processor</h4>
                    <p className="text-gray-400">Handles camera data and 3D mesh generation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-white font-semibold">Ultrasound Sensors</h4>
                    <p className="text-gray-400">Close-range object detection near limbs</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-white font-semibold">Haptic Feedback Modules</h4>
                    <p className="text-gray-400">Vibration motors in wrist/ankle bands</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-white font-semibold">Headphones/Earbuds</h4>
                    <p className="text-gray-400">Auditory visualization and ambient sound</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Software Components */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-white mb-6">💻 Software Components</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-white font-semibold">OpenCV & MiDaS AI Depth Estimation</h4>
                    <p className="text-gray-400">Real-time monocular depth maps and obstacle detection</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-white font-semibold">Open3D Mesh Processing</h4>
                    <p className="text-gray-400">Dynamic 3D spatial models with minimal latency</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-white font-semibold">Binaural Audio Engine</h4>
                    <p className="text-gray-400">Immersive soundscapes from 3D models</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-white font-semibold">SUNO Integration</h4>
                    <p className="text-gray-400">Background auditory cues and music generation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-white font-semibold">Collision Detection & Haptics</h4>
                    <p className="text-gray-400">Ultrasound processing and localized vibrations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Goals Section */}
      <section className="py-16 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-8">🎯 Our Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-300">Provide blind users with an <span className="text-blue-400 font-semibold">auditory form of vision</span></p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-300">Reduce collisions with <span className="text-blue-400 font-semibold">multi-sensor feedback</span></p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-300">Improve <span className="text-blue-400 font-semibold">confidence and independence</span> in navigation</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-300">Deliver an <span className="text-blue-400 font-semibold">intuitive, immersive</span> experience</p>
            </div>
          </div>
        </div>
      </section>

      {/* Applications & Users Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Applications */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-white mb-6">🌍 Applications</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-white font-semibold mb-1">Indoor Navigation</h4>
                  <p className="text-gray-400">Homes, offices, malls, and complex buildings</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="text-white font-semibold mb-1">Outdoor Navigation</h4>
                  <p className="text-gray-400">Parks, sidewalks, and open spaces</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="text-white font-semibold mb-1">Specialized Environments</h4>
                  <p className="text-gray-400">Where traditional tools may be less effective</p>
                </div>
              </div>
            </div>

            {/* Target Users */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-white mb-6">🧑‍🤝‍🧑 Target Users</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-white font-semibold mb-1">Visually Impaired Individuals</h4>
                  <p className="text-gray-400">Primary users seeking navigation independence</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="text-white font-semibold mb-1">Assistive Technology Researchers</h4>
                  <p className="text-gray-400">Advancing accessibility innovation</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="text-white font-semibold mb-1">Healthcare Organizations</h4>
                  <p className="text-gray-400">Supporting accessibility initiatives</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Navigation?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join us in making the world more accessible through innovative technology
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleNavigateToVisualization}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full transition-colors duration-200 text-lg"
            >
              See What We Offer!
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
