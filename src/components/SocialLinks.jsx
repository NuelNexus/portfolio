import { socials } from '../data/socials.js'

export default function SocialLinks() {
  return (
    <nav className="social-links" aria-label="Social links">
      {socials.map(({ name, href, path }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          title={name}
          aria-label={name}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={path} />
          </svg>
        </a>
      ))}
    </nav>
  )
}
