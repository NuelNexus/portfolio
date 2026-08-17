import { useEffect, useState } from 'react'
import './AchievementDoor.css'
import SkinViewer from './SkinViewer.jsx'
import backVideo from '../../back.mp4'

const TOTAL_MS = 5000

function SquigglyDefs() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
      <defs>
        {[0, 1, 2, 3, 4].map((seed) => (
          <filter key={seed} id={`squiggly-${seed}`}>
            <feTurbulence
              baseFrequency="0.01"
              numOctaves="3"
              result="noise"
              seed={seed}
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={seed % 2 === 0 ? 2 : 3}
            />
          </filter>
        ))}
      </defs>
    </svg>
  )
}

function McMenu() {
  return (
    <div className="mc-menu" aria-hidden="true">
      <div className="mc-button full">
        <div className="title">Singleplayer</div>
      </div>
      <div className="mc-button full">
        <div className="title">Multiplayer</div>
      </div>
      <div className="mc-button full">
        <div className="title">Minecraft Realms</div>
      </div>
      <div className="double">
        <div className="mc-button full">
          <div className="title">Options</div>
        </div>
        <div className="mc-button full">
          <div className="title">Quit Game</div>
        </div>
      </div>
      <div className="mc-button full lang">
        <div className="title">
          <img
            src="https://i.ibb.co/99187Lk/lang.png"
            alt="Language"
          />
        </div>
      </div>
    </div>
  )
}

export default function AchievementDoor({ achievement, onClose }) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), TOTAL_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className={`door-overlay${revealed ? ' is-revealed' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={achievement.title.join(' ')}
      onClick={(e) => {
        if (revealed && e.target === e.currentTarget) onClose()
      }}
    >
      <SquigglyDefs />
      <video
        className="door-reveal__bg"
        src={backVideo}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="door-stage" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div className="door" key={i}>
            <div className="face">
              <div className="right" />
            </div>
          </div>
        ))}
      </div>
      <SkinViewer />
      <div className="door-reveal-layout">
        <div className="door-reveal">
          <span className="door-reveal__number">
            {achievement.number} / Achievement
          </span>
          {achievement.image && (
            <img
              className="door-reveal__image"
              src={achievement.image}
              alt={`${achievement.title[0]} ${achievement.title[1]}`}
            />
          )}
          <h2 className="door-reveal__title">
            {achievement.title[0]}
            <br />
            {achievement.title[1]}
          </h2>
          <p className="door-reveal__desc">{achievement.description}</p>
          <div className="door-reveal__meta">
            {achievement.meta.map(([label, value]) => (
              <div className="door-reveal__meta-row" key={label}>
                <span className="door-reveal__meta-label">{label}</span>
                <span className="door-reveal__meta-value">{value}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="door-reveal__close"
            onClick={onClose}
          >
            close
          </button>
        </div>
        <McMenu />
      </div>
    </div>
  )
}
