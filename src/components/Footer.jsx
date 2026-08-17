import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer>
      <div className="nav__content">
        <Link className="footer-link" to="/about">
          about me →
        </Link>
        <div className="footer-copy">
          NuelNexus &copy; 2026 ┬┴┬┴┤•ᴥ•ʔ├┬┴┬┴
        </div>
      </div>
    </footer>
  )
}
