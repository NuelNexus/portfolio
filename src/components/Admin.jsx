import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Admin.css'
import {
  fetchAchievements,
  loadLocalAchievements,
  saveAchievements,
  saveLocalAchievements,
} from '../data/achievements-store.js'

const AUTH_KEY = 'nuelnexus-admin'
const USERNAME = 'nuelnexus'
const PASSWORD = 'Icreate_sites'
const DEFAULT_META = ['Category', 'Year', 'Organization']

function newAchievement(index) {
  return {
    id: crypto.randomUUID(),
    number: String(index + 1).padStart(2, '0'),
    title: ['', ''],
    description: '',
    meta: DEFAULT_META.map((label) => [label, '']),
    image: null,
  }
}

function processImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const width = Math.round(img.width * scale)
        const height = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function submit(e) {
    e.preventDefault()
    if (username === USERNAME && password === PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, '1')
      onLogin()
    } else {
      setError('wrong username or password')
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={submit}>
        <h1>achievements admin</h1>
        <label>
          username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error && <p className="admin-login__error">{error}</p>}
        <button type="submit">sign in</button>
      </form>
    </div>
  )
}

function AchievementForm({ draft, onChange, onSubmit, onCancel }) {
  function setField(path, value) {
    const next = { ...draft }
    if (path === 'meta') next.meta = value
    else if (path === 'title0') next.title = [value, draft.title[1]]
    else if (path === 'title1') next.title = [draft.title[0], value]
    else next[path] = value
    onChange(next)
  }

  function setMeta(i, side, value) {
    const meta = draft.meta.map((row, j) =>
      j === i ? (side === 0 ? [value, row[1]] : [row[0], value]) : row,
    )
    setField('meta', meta)
  }

  async function onFile(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await processImageFile(file)
      setField('image', dataUrl)
    } catch {}
  }

  return (
    <form
      className="admin-form"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(draft)
      }}
    >
      <div className="admin-form__row">
        <label>
          number
          <input
            type="text"
            value={draft.number}
            onChange={(e) => setField('number', e.target.value)}
          />
        </label>
        <label>
          image url (optional)
          <input
            type="text"
            value={
              draft.image && !draft.image.startsWith('data:')
                ? draft.image
                : ''
            }
            onChange={(e) =>
              setField('image', e.target.value.trim() || null)
            }
            placeholder="https://... or /images/..."
          />
        </label>
      </div>
      <label className="admin-form__upload">
        or upload a picture
        <input type="file" accept="image/*" onChange={onFile} />
      </label>
      {draft.image && (
        <div className="admin-form__image-preview">
          <img src={draft.image} alt="cover preview" />
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            onClick={() => setField('image', null)}
          >
            remove image
          </button>
        </div>
      )}
      <div className="admin-form__row">
        <label>
          title line 1
          <input
            type="text"
            value={draft.title[0]}
            onChange={(e) => setField('title0', e.target.value)}
          />
        </label>
        <label>
          title line 2
          <input
            type="text"
            value={draft.title[1]}
            onChange={(e) => setField('title1', e.target.value)}
          />
        </label>
      </div>
      <label>
        description
        <textarea
          rows="4"
          value={draft.description}
          onChange={(e) => setField('description', e.target.value)}
        />
      </label>
      <div className="admin-form__meta">
        <span className="admin-form__section-label">details</span>
        <div className="admin-form__meta-grid">
          {draft.meta.map(([label, value], i) => (
            <div className="admin-form__meta-row" key={i}>
              <input
                type="text"
                value={label}
                onChange={(e) => setMeta(i, 0, e.target.value)}
                aria-label={`meta label ${i + 1}`}
              />
              <input
                type="text"
                value={value}
                onChange={(e) => setMeta(i, 1, e.target.value)}
                aria-label={`meta value ${i + 1}`}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="admin-form__actions">
        <button type="submit" className="admin-btn admin-btn--primary">
          save
        </button>
        <button type="button" className="admin-btn" onClick={onCancel}>
          cancel
        </button>
      </div>
    </form>
  )
}

export default function Admin() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(AUTH_KEY) === '1',
  )
  const [items, setItems] = useState(loadLocalAchievements)
  const [draft, setDraft] = useState(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!authed) return
    let alive = true
    fetchAchievements().then((remote) => {
      if (!alive) return
      if (remote && remote.length) {
        setItems(remote)
      } else {
        setItems(loadLocalAchievements())
        setStatus('nothing on the server yet — saving will publish to supabase')
      }
    })
    return () => {
      alive = false
    }
  }, [authed])

  async function persist(next) {
    setItems(next)
    saveLocalAchievements(next)
    const ok = await saveAchievements(next)
    setStatus(ok ? 'published to supabase' : 'could not save to supabase')
    setTimeout(() => setStatus(''), 2500)
  }

  function startNew() {
    setDraft(newAchievement(items.length))
    setStatus('')
  }

  function startEdit(i) {
    setDraft(JSON.parse(JSON.stringify(items[i])))
    setStatus('')
  }

  function submitDraft(updated) {
    const next = items.some((it) => it.number === updated.number)
      ? items.map((it) => (it.number === updated.number ? updated : it))
      : [...items, updated]
    persist(next)
    setDraft(null)
  }

  function remove(i) {
    const next = items.filter((_, j) => j !== i)
    persist(next)
    if (draft && items[i] && draft.number === items[i].number) setDraft(null)
  }

  function exportJson() {
    const json = JSON.stringify(items, null, 2)
    navigator.clipboard
      .writeText(json)
      .then(() => setStatus('copied to clipboard'))
      .catch(() => setStatus('could not copy'))
    setTimeout(() => setStatus(''), 2500)
  }

  if (!authed) {
    return (
      <main className="admin">
        <Login onLogin={() => setAuthed(true)} />
      </main>
    )
  }

  return (
    <main className="admin">
      <header className="admin__header">
        <div>
          <h1>achievements admin</h1>
          <p>changes are saved in this browser and shown on the home page</p>
        </div>
        <div className="admin__header-actions">
          <button type="button" className="admin-btn" onClick={exportJson}>
            copy json
          </button>
          <Link to="/" className="admin-btn">
            view site
          </Link>
          <button
            type="button"
            className="admin-btn"
            onClick={() => {
              sessionStorage.removeItem(AUTH_KEY)
              setAuthed(false)
            }}
          >
            sign out
          </button>
        </div>
      </header>

      {status && <p className="admin__status">{status}</p>}

      <button
        type="button"
        className="admin-btn admin-btn--primary admin__new"
        onClick={startNew}
      >
        + new achievement
      </button>

      {draft && (
        <section className="admin__editor">
          <h2>
            {items.some((it) => it.number === draft.number)
              ? `editing ${draft.number}`
              : 'new achievement'}
          </h2>
          <AchievementForm
            draft={draft}
            onChange={setDraft}
            onSubmit={submitDraft}
            onCancel={() => setDraft(null)}
          />
        </section>
      )}

      <section className="admin__list">
        {items.map((item, i) => (
          <div className="admin-item" key={`${item.number}-${i}`}>
            {item.image && (
              <img
                className="admin-item__thumb"
                src={item.image}
                alt={`${item.title[0]} ${item.title[1]} cover`}
              />
            )}
            <div className="admin-item__text">
              <span className="admin-item__number">{item.number}</span>
              <strong>
                {item.title[0]} {item.title[1]}
              </strong>
              <p>{item.description}</p>
            </div>
            <div className="admin-item__actions">
              <button
                type="button"
                className="admin-btn"
                onClick={() => startEdit(i)}
              >
                edit
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                onClick={() => remove(i)}
              >
                delete
              </button>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
