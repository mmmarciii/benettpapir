import './App.css'
import { useState } from 'react'
import { AboutSection } from './components/AboutSection'
import { ContactSection } from './components/ContactSection'
import { FooterSection } from './components/FooterSection'
import { HeroSection } from './components/HeroSection'
import { InstagramSection } from './components/InstagramSection'
import { SpecialOfferSection } from './components/MenuSection'

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <main className="app-shell" id="top">
        <header className="topbar">
          <a href="#top" className="brand">
            <img src="/benettlogouj.png" alt="Benett logo" className="brand-logo" />
          </a>

          <button
            type="button"
            className={`menu-toggle ${menuOpen ? 'is-open' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={`nav-links ${menuOpen ? 'is-open' : ''}`}>

            <a href="#" onClick={() => setMenuOpen(false)}>Kezdőlap</a>
            <a href="#about" onClick={() => setMenuOpen(false)}>Rólunk</a>
            <a href="#kontakt" onClick={() => setMenuOpen(false)}>Kapcsolat</a>

          </nav>
        </header>

        <HeroSection />
        <SpecialOfferSection />
        <AboutSection />
        <InstagramSection />
        <ContactSection />
      </main>

      <FooterSection />
    </>
  )
}

export default App
