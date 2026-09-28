import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './MillHero.css'
import render1600 from '../assets/mill/mill-render-1600.webp'
import render960 from '../assets/mill/mill-render-960.webp'

// Hero copy — change the words here. (The original concept read
// "AIR / FORM / LAB" and "MOVE / WITH / US".)
const MARK = ['NUEL', 'NEXUS']
const HEADLINE = ['MOVE', 'WITH', 'ME']

const NAV = [
  { label: 'Work', href: '#achievements' },
  { label: 'Skills', href: '#skills' },
  { label: 'About', to: '/about' },
  { label: 'Contact', href: '#contact' },
]

// Deterministic "random" so the letter reveal looks scattered but is the
// same on every load.
function rand(n) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

function Letters({ text, seed }) {
  return [...text].map((ch, i) => (
    <span
      key={i}
      className="mill__ch"
      style={{
        '--d': `${Math.round(150 + rand(seed + i) * 950)}ms`,
        '--r': `${Math.round((rand(seed + i + 40) - 0.5) * 50)}deg`,
      }}
    >
      {ch}
    </span>
  ))
}

// Where the 1600x1000 render sits inside the hero (object-fit + CSS scale),
// so the 3D camera can frame the scene exactly like the poster image.
function designFrame(hero, img) {
  const cs = getComputedStyle(img)
  const box = {
    x: img.offsetLeft,
    y: img.offsetTop,
    w: img.offsetWidth,
    h: img.offsetHeight,
  }
  let r = { ...box }
  if (cs.objectFit === 'cover') {
    const s = Math.max(box.w / 1600, box.h / 1000)
    const w = 1600 * s
    const h = 1000 * s
    const [px, py] = cs.objectPosition
      .split(' ')
      .map((v) => (v.endsWith('%') ? parseFloat(v) / 100 : 0.5))
    r = { x: box.x + (box.w - w) * px, y: box.y + (box.h - h) * py, w, h }
  }
  const scale =
    parseFloat(getComputedStyle(hero).getPropertyValue('--mill-scale')) || 1
  const [ox, oy] = cs.transformOrigin.split(' ').map(parseFloat)
  const fx = box.x + (ox || 0)
  const fy = box.y + (oy || 0)
  return {
    x: fx + (r.x - fx) * scale,
    y: fy + (r.y - fy) * scale,
    w: r.w * scale,
    h: r.h * scale,
  }
}

export default function MillHero() {
  const ref = useRef(null)
  const pinRef = useRef(null)
  const imgRef = useRef(null)
  // hold the intro until the render has loaded (or 1.5s, whichever first)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (imgRef.current?.complete) {
      setReady(true)
      return
    }
    const t = setTimeout(() => setReady(true), 1500)
    return () => clearTimeout(t)
  }, [])

  // 3D scene: loads after the poster, then cross-fades in over it.
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const [live, setLive] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!ready) return
    const el = ref.current
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!el || !canvas || !img) return
    if (navigator.connection?.saveData) return

    let cancelled = false
    let scene = null
    let ro = null
    let io = null
    let scrollRaf = 0
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const frame = () => {
      if (!scene) return
      scene.setFrame(designFrame(el, img), el.clientWidth, el.clientHeight)
    }
    const onScroll = () => {
      if (scrollRaf) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0
        // progress through the pinned stretch (0 = top, 1 = about to leave)
        const pin = pinRef.current
        if (!pin) return
        const r = pin.getBoundingClientRect()
        const span = Math.max(1, r.height - window.innerHeight)
        scene?.setScroll(-r.top / span)
      })
    }
    const down = (e) => {
      if (e.target.closest('a, button')) return
      setTouched(true)
      scene?.pointerDown(e)
    }
    const move = (e) => scene?.pointerMove(e)
    const up = () => scene?.pointerUp()
    const leave = () => scene?.pointerLeave()

    const start = async () => {
      try {
        const { createMillScene } = await import('./mill/MillScene.js')
        if (cancelled) return
        scene = createMillScene(canvas, {
          reduced,
          onReady: () => !cancelled && setLive(true),
          onError: () => {
            if (cancelled) return
            setLive(false)
            scene?.dispose()
            scene = null
          },
        })
        sceneRef.current = scene
        frame()
        ro = new ResizeObserver(frame)
        ro.observe(el)
        io = new IntersectionObserver(([entry]) =>
          scene?.setActive(entry.isIntersecting),
        )
        io.observe(el)
        el.addEventListener('pointermove', move)
        el.addEventListener('pointerdown', down)
        window.addEventListener('pointerup', up)
        el.addEventListener('pointerleave', leave)
        el.addEventListener('pointercancel', leave)
        window.addEventListener('scroll', onScroll, { passive: true })
        onScroll()
      } catch {
        // no WebGL2 (or the chunk failed) — the static render stays
      }
    }

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 1200 })
      : setTimeout(start, 300)

    return () => {
      cancelled = true
      if (window.cancelIdleCallback && window.requestIdleCallback) {
        window.cancelIdleCallback(idle)
      } else {
        clearTimeout(idle)
      }
      cancelAnimationFrame(scrollRaf)
      ro?.disconnect()
      io?.disconnect()
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('pointercancel', leave)
      window.removeEventListener('scroll', onScroll)
      scene?.dispose()
      sceneRef.current = null
    }
  }, [ready])

  return (
    <div className="mill-pin" ref={pinRef}>
      <section
        className={[
          'mill',
          ready && 'is-ready',
          live && 'is-live',
          touched && 'is-touched',
        ]
          .filter(Boolean)
          .join(' ')}
        ref={ref}
        aria-label="Intro"
      >
        <div className="mill__render">
          <img
            ref={imgRef}
            onLoad={() => setReady(true)}
            onError={() => setReady(true)}
            srcSet={`${render960} 960w, ${render1600} 1600w`}
            sizes="100vw"
            src={render1600}
            width="1600"
            height="1000"
            alt="3D render of a clay windmill inside a ring of orange fur"
            fetchPriority="high"
            decoding="async"
          />
          <canvas className="mill__canvas" ref={canvasRef} aria-hidden="true" />
        </div>

        <div className="mill__frame" aria-hidden="true" />

        <div className="mill__ui">
          <nav className="mill__nav" aria-label="Sections">
            {NAV.map(({ label, href, to }, i) =>
              to ? (
                <Link key={label} to={to} style={{ '--i': i }}>
                  {label}
                </Link>
              ) : (
                <a key={label} href={href} style={{ '--i': i }}>
                  {label}
                </a>
              ),
            )}
          </nav>

          <div className="mill__mark">
            <span className="mill__sr">{MARK.join(' ')}</span>
            <svg
              className="mill__arrow"
              viewBox="0 0 60 60"
              aria-hidden="true"
            >
              <path
                transform="translate(9.4 3.7)"
                d="M40.84 27.03C40.98 26.95 41.09 26.83 41.16 26.69C41.24 26.55 41.28 26.4 41.28 26.24C41.28 26.08 41.24 25.93 41.16 25.79C41.09 25.65 40.98 25.53 40.84 25.45L1.08 0.1C0.96 0.02 0.81 -0.01 0.67 0C0.52 0.02 0.38 0.08 0.28 0.19C0.18 0.29 0.11 0.43 0.09 0.57C0.08 0.72 0.11 0.87 0.19 0.99L15.51 25.38C15.67 25.64 15.76 25.94 15.76 26.24C15.76 26.54 15.67 26.84 15.51 27.09L0.15 51.55C-0.3 52.25 0.35 52.85 0.86 52.52L40.84 27.03Z"
              />
            </svg>
            <p className="mill__type mill__mark-text" aria-hidden="true">
              {MARK.map((word, w) => (
                <span className="mill__line" key={word}>
                  <Letters text={word} seed={w * 17 + 3} />
                  {w === MARK.length - 1 && (
                    <svg
                      className="mill__copy"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <circle cx="24" cy="24" r="21.8" />
                      <path d="M30.36 17.64A9 9 0 1 0 30.36 30.36" />
                    </svg>
                  )}
                </span>
              ))}
            </p>
          </div>

          <p className="mill__headline">
            <span className="mill__sr">{HEADLINE.join(' ')}</span>
            <span className="mill__type" aria-hidden="true">
              {HEADLINE.map((word, w) => (
                <span className="mill__line" key={word}>
                  {w === HEADLINE.length - 1 && (
                    <svg
                      className="mill__block"
                      viewBox="0 0 155 50"
                      aria-hidden="true"
                    >
                      <path d="M155 20C155 36.57 141.57 50 125 50L87.3 50L85.83 33.5L94.66 42.5L98.33 38.75L85.1 25L87.3 25L87.29 24.49C87.15 21.94 85.97 19.64 84.36 18L98.33 3.75L94.41 0L79.22 15.5C78.48 15.25 77.99 15.25 77.25 15.25C76.52 15.25 76.03 15.25 75.29 15.5L60.59 0L56.67 3.75L70.64 18C68.92 19.75 67.7 22.25 67.7 25L69.9 25L56.67 38.5L60.59 42.5L69.41 33.5L67.7 50L0 50L0 0L155 0L155 20ZM77.5 37.5C78.97 37.5 79.95 38.5 79.95 40L79.95 45L75.05 45L75.05 40C75.05 38.5 76.03 37.5 77.5 37.5Z" />
                    </svg>
                  )}
                  <Letters text={word} seed={w * 23 + 101} />
                </span>
              ))}
            </span>
          </p>

          <p className="mill__hint" aria-hidden="true">
            drag to spin · click the mill
          </p>

          <a className="mill__cta" href="#intro">
            <span>Discover</span>
            <svg viewBox="0 0 50 50" aria-hidden="true">
              <path d="M25 0C25 22.07 23.09 22.77 8.68 6.03C23.09 22.77 22.07 24.57 0 21.3C22.07 24.57 22.42 26.6 3.02 38.67C22.42 26.6 23.98 27.93 16.32 50C23.98 27.93 26.02 27.93 33.68 50C26.02 27.93 27.58 26.6 46.98 38.67C27.58 26.6 27.93 24.57 50 21.3C27.93 24.57 26.91 22.77 41.32 6.03C26.91 22.77 25 22.07 25 0Z" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  )
}
