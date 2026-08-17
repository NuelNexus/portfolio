import { useEffect, useRef, useState, Fragment } from 'react'
import * as THREE from 'three'
import './Achievements.css'
import AchievementDoor from './AchievementDoor.jsx'
import {
  fetchAchievements,
  loadLocalAchievements,
} from '../data/achievements-store.js'

const SPACING_X = 45

function isDarkTheme() {
  return document.documentElement.classList.contains('dark-theme')
}

function palette(dark) {
  return {
    bg: dark ? 0x141417 : 0xf7f7f5,
    outline: dark ? 0x8a8a90 : 0x222222,
    line: dark ? 0x2b2b30 : 0xdddddd,
  }
}

function createPlaceholderTexture(i, dark) {
  const width = 512
  const height = 640
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const hues = [214, 330, 150, 24]
  const hue = hues[i % hues.length]
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  if (dark) {
    gradient.addColorStop(0, `hsl(${hue} 35% 22%)`)
    gradient.addColorStop(1, `hsl(${hue} 40% 13%)`)
  } else {
    gradient.addColorStop(0, `hsl(${hue} 40% 90%)`)
    gradient.addColorStop(1, `hsl(${hue} 45% 70%)`)
  }
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = dark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(255, 255, 255, 0.28)'
  ctx.lineWidth = 2
  for (let x = -height; x < width; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + height, height)
    ctx.stroke()
  }

  const ink = dark ? 'rgba(240, 240, 240, 0.9)' : 'rgba(17, 17, 17, 0.9)'
  const frame = dark ? 'rgba(240, 240, 240, 0.55)' : 'rgba(17, 17, 17, 0.55)'

  ctx.fillStyle = ink
  ctx.font = '600 180px "Playfair Display", Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(i + 1).padStart(2, '0'), width / 2, height / 2)

  ctx.strokeStyle = frame
  ctx.lineWidth = 6
  ctx.strokeRect(16, 16, width - 32, height - 32)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export default function Achievements() {
  const sectionRef = useRef(null)
  const canvasHostRef = useRef(null)
  const uiRef = useRef(null)
  const [items, setItems] = useState(loadLocalAchievements)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let alive = true
    fetchAchievements().then((remote) => {
      if (alive && remote && remote.length) setItems(remote)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    const host = canvasHostRef.current
    const ui = uiRef.current
    const totalWidth = items.length * SPACING_X
    const maxScroll = totalWidth * 2

    const scene = new THREE.Scene()
    const colors = palette(isDarkTheme())
    scene.background = new THREE.Color(colors.bg)
    scene.fog = new THREE.Fog(colors.bg, 10, 110)

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    )
    camera.position.set(0, 0, 30)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5)
    dirLight.position.set(10, 20, 10)
    scene.add(dirLight)

    const galleryGroup = new THREE.Group()
    scene.add(galleryGroup)

    const textureLoader = new THREE.TextureLoader()
    const planeGeo = new THREE.PlaneGeometry(14, 18)
    const paintingGroups = []
    const paintingMeshes = []
    const outlineMats = []
    const lineMats = []
    const placeholderTextures = []

    items.forEach((item, i) => {
      const group = new THREE.Group()
      group.position.set(i * SPACING_X, 0, 0)

      const texture = item.image
        ? textureLoader.load(item.image)
        : createPlaceholderTexture(i, isDarkTheme())
      const mat = new THREE.MeshBasicMaterial({ map: texture })
      if (!item.image) placeholderTextures.push({ index: i, mat })
      const mesh = new THREE.Mesh(planeGeo, mat)
      paintingMeshes.push({ mesh, index: i })

      const edges = new THREE.EdgesGeometry(planeGeo)
      const outlineMat = new THREE.LineBasicMaterial({ color: colors.outline })
      outlineMats.push(outlineMat)
      const outline = new THREE.LineSegments(edges, outlineMat)

      const shadowGeo = new THREE.PlaneGeometry(14, 18)
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.15,
      })
      const shadow = new THREE.Mesh(shadowGeo, shadowMat)
      shadow.position.set(0.8, -0.8, -0.5)

      const lineZ = -1
      const lineLen = SPACING_X
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-lineLen / 2, 14, lineZ),
        new THREE.Vector3(lineLen / 2, 14, lineZ),
        new THREE.Vector3(-lineLen / 2, -14, lineZ),
        new THREE.Vector3(lineLen / 2, -14, lineZ),
      ])
      const lineMat = new THREE.LineBasicMaterial({ color: colors.line })
      lineMats.push(lineMat)
      const lines = new THREE.LineSegments(lineGeo, lineMat)

      group.add(shadow)
      group.add(mesh)
      group.add(outline)
      group.add(lines)

      galleryGroup.add(group)
      paintingGroups.push(group)
    })

    galleryGroup.rotation.y = -0.25
    galleryGroup.position.x = 8

    const applyTheme = (dark) => {
      const p = palette(dark)
      scene.background.setHex(p.bg)
      scene.fog.color.setHex(p.bg)
      outlineMats.forEach((m) => m.color.setHex(p.outline))
      lineMats.forEach((m) => m.color.setHex(p.line))
      placeholderTextures.forEach(({ index, mat }) => {
        const next = createPlaceholderTexture(index, dark)
        if (mat.map) mat.map.dispose()
        mat.map = next
        mat.needsUpdate = true
      })
    }
    const onThemeChange = (e) => applyTheme(e.detail.dark)
    window.addEventListener('themechange', onThemeChange)

    const slideEls = Array.from(ui.querySelectorAll('.slide-content'))
    let currentScroll = 0
    let targetScroll = 0
    const mouse = { x: 0, y: 0 }

    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const meshes = paintingMeshes.map((p) => p.mesh)
    const hitIndex = (e) => {
      const rect = renderer.domElement.getBoundingClientRect()
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(ndc, camera)
      const hit = raycaster.intersectObjects(meshes)[0]
      if (!hit) return null
      const painting = paintingMeshes.find((p) => p.mesh === hit.object)
      return painting ? painting.index : null
    }

    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
      renderer.domElement.style.cursor = hitIndex(e) !== null ? 'pointer' : ''
    }

    const onClick = (e) => {
      const index = hitIndex(e)
      if (index !== null) setSelected(index)
    }

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('click', onClick)
    window.addEventListener('resize', onResize)

    let raf
    const animate = () => {
      raf = requestAnimationFrame(animate)

      const rect = section.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable))
      targetScroll = progress * maxScroll

      currentScroll += (targetScroll - currentScroll) * 0.08

      const wallAngleY = galleryGroup.rotation.y
      camera.position.x = currentScroll * Math.cos(wallAngleY)
      camera.position.z = 30 - currentScroll * Math.sin(wallAngleY)

      paintingGroups.forEach((group, i) => {
        const originalX = i * SPACING_X
        const distFromCam = currentScroll - originalX
        const shift = Math.round(distFromCam / totalWidth) * totalWidth
        group.position.x = originalX + shift
      })

      camera.rotation.x = mouse.y * 0.05
      camera.rotation.y = -mouse.x * 0.05

      const rawIndex = Math.round(currentScroll / SPACING_X)
      const safeIndex =
        ((rawIndex % items.length) + items.length) % items.length
      slideEls.forEach((el, i) =>
        el.classList.toggle('active', i === safeIndex),
      )

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('themechange', onThemeChange)
      paintingGroups.forEach((group) => {
        group.children.forEach((child) => {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            const mats = Array.isArray(child.material)
              ? child.material
              : [child.material]
            mats.forEach((mat) => {
              if (mat.map) mat.map.dispose()
              mat.dispose()
            })
          }
        })
      })
      renderer.dispose()
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement)
      }
    }
  }, [items])

  return (
    <section
      className="achievements"
      id="achievements"
      ref={sectionRef}
      aria-label="Achievements gallery"
    >
      <div className="achievements__viewport">
        <div className="achievements__logo">NuelNexus — Achievements</div>
        <div className="achievements__canvas" ref={canvasHostRef} />
        <div className="achievements__ui" ref={uiRef}>
          {items.map((item, i) => (
            <button
              type="button"
              className="slide-content"
              key={item.number}
              onClick={() => setSelected(i)}
            >
              <span className="catalogue-number">
                {item.number} / Achievement
              </span>
              <h1>
                {item.title[0]} <br /> {item.title[1]}
              </h1>
              <div className="description">{item.description}</div>
              <div className="meta-grid">
                {item.meta.map(([label, value]) => (
                  <Fragment key={label}>
                    <span className="meta-label">{label}</span>
                    <span className="meta-value">{value}</span>
                  </Fragment>
                ))}
              </div>
            </button>
          ))}
        </div>
        <div className="achievements__hint">Click a painting to open</div>
      </div>
      {selected !== null && (
        <AchievementDoor
          achievement={items[selected]}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  )
}
