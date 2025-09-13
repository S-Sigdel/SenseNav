import { useState } from 'react'
import Navbar from './components/navbar'
import Home from './pages/home'
import Visualization from './pages/visualization'
import './App.css'

export default function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const renderPage = () => {
    switch(currentPage) {
      case 'home':
        return <Home setCurrentPage={setCurrentPage} />
      case 'visualization':
        return <Visualization />
      default:
        return <Home setCurrentPage={setCurrentPage} />
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {renderPage()}
    </div>
  )
}