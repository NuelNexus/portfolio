import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Landing from './components/Landing.jsx'
import Achievements from './components/Achievements.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import About from './components/About.jsx'
import Admin from './components/Admin.jsx'
import Skills from './components/Skills.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'

function Home() {
  return (
    <>
      <Landing />
      <Achievements />
      <Skills />
      <Contact />
      <Footer />
    </>
  )
}

function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}

function App() {
  return (
    <>
      <ThemeToggle />
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </>
  )
}

export default App
