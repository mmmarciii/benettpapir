import { FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa6'

export function FooterSection() {
  return (
    <footer className="footer-section">
      <div className="footer-inner">
        <div className="footer-brand">
          <p className="section-label">Benett Papír</p>
          <h3>Papír írószer és kreatív bolt</h3>
          <p className="footer-copy">
            Minőségi papír- és írószerek, iskolai felszerelések, valamint kreatív alkotóeszközök széles választéka mindennapi tanuláshoz, irodai munkához és az ötletek megvalósításához.
          </p>
        </div>

        <div className="footer-columns">
          <div>
            <h4>Oldalak</h4>
            <div className="footer-links">
              <a href="#menu">Ajánlatok</a>
              <a href="#about">Rólunk</a>
              <a href="#kontakt">Kapcsolat</a>
              <a href="#instagram">Instagram</a>
              <a href="#">ÁSZF</a>
              <a href="#">Adatvédelem</a>
            </div>
          </div>

          <div>
            <h4>Kövess minket</h4>
            <div className="footer-socials" aria-label="Social links">
              <a href="https://www.facebook.com/papir.benett" target="_blank" rel="noreferrer" aria-label="Facebook">
                <FaFacebook size={18} />
              </a>
              <a href="https://www.instagram.com/papirbenett/" target="_blank" rel="noreferrer" aria-label="Instagram">
                <FaInstagram size={18} />
              </a>
              <a href="https://www.tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok">
                <FaTiktok size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
