import { useEffect, useState } from 'react'

const THEME_KEY = 'nuelnexus-theme'

function isDarkTheme() {
  return document.documentElement.classList.contains('dark-theme')
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(isDarkTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark-theme', dark)
    try {
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
    } catch {}
    window.dispatchEvent(new CustomEvent('themechange', { detail: { dark } }))
  }, [dark])

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      <i className={`ph ${dark ? 'ph-sun' : 'ph-moon'}`} />
    </button>
  )
}
