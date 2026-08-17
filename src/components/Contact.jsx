import { socials } from '../data/socials.js'

const email = 'immanuelgeorge534@gmail.com'

export default function Contact() {
  return (
    <section className="section" id="contact" aria-labelledby="contact-title">
      <h2 className="section__title" id="contact-title">
        Let&apos;s <em>talk</em>
      </h2>
      <p className="section__lede">
        Got a project in mind, or just want to say hi? My inbox is always
        open.
      </p>
      <a className="email-link" href={`mailto:${email}`}>
        {email}
      </a>
      <div className="contact-links">
        {socials.map(({ name, href, path }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d={path} />
            </svg>
            {name}
          </a>
        ))}
      </div>
    </section>
  )
}
