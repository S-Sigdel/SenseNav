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
          <h2 className="text-4xl font-bold text-white text-center mb-4 flex items-center justify-center gap-3">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Features
          </h2>
          <p className="text-gray-400 text-center mb-12 text-lg">
            Revolutionary technology that transforms how visually impaired individuals experience their environment
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Real-Time Environmental Awareness
              </h3>
              <ul className="text-gray-300 space-y-2">
                <li>• <span className="text-blue-400">Intel's Open Source Deep Learning Model MiDaS:</span> AI-powered real-time "range of vision"</li>
                <li>• <span className="text-blue-400">3D Mesh Reconstruction (Open3D):</span> Dynamic spatial models from camera data</li>
                <li>• <span className="text-blue-400">Auditory Visualization:</span> Converts spatial data into immersive binaural soundscapes</li>
              </ul>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
                Auditory Guidance
              </h3>
              <ul className="text-gray-300 space-y-2">
                <li>• <span className="text-blue-400">Headphones/Earbuds:</span> Real-time environmental soundscapes</li>
                <li>• <span className="text-blue-400">Binaural Audio:</span> Dimensional sound for spatial orientation</li>
                <li>• <span className="text-blue-400">Ambient Layer:</span> SUNO-generated music for intuitive navigation</li>
              </ul>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Collision Avoidance System
              </h3>
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
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Hardware Components
              </h2>
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
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                  <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V9a1 1 0 00-1-1h-1v-1z" />
                </svg>
                Software Components
              </h2>
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
          <h2 className="text-4xl font-bold text-white mb-8 flex items-center justify-center gap-3">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Our Goals
          </h2>
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
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                </svg>
                Applications
              </h2>
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
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                Target Users
              </h2>
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
