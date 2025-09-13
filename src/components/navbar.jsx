import React from 'react';

const Navbar = ({ currentPage, setCurrentPage }) => {
  const handleNavClick = (page) => {
    setCurrentPage(page);
  };

  return (
    <nav className="bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - SenseNav branding */}
          <div className="flex-1">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-wide">
              SenseNav
            </div>
          </div>
          
          {/* Center - Navigation Links */}
          <div className="flex space-x-8">
            <button 
              onClick={() => handleNavClick('home')}
              className={`text-base transition-colors duration-200 font-medium ${
                currentPage === 'home' 
                  ? 'text-blue-400 font-bold' 
                  : 'text-gray-300 hover:text-blue-400'
              }`}
            >
              Home
            </button>
            <button 
              onClick={() => handleNavClick('visualization')}
              className={`text-base transition-colors duration-200 font-medium ${
                currentPage === 'visualization' 
                  ? 'text-blue-400 font-bold' 
                  : 'text-gray-300 hover:text-blue-400'
              }`}
            >
              Visualization
            </button>
          </div>
          
          {/* Right side - empty for now */}
          <div className="flex-1"></div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
