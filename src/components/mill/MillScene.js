// Real-time version of the Mill render: the Tripo windmill from the .blend
// (GLB) inside the ring of fur strands exported from the same scene.
// The camera matches the Blender camera (120mm lens, 13.04 units back), so
// the first frame lines up with the static render it replaces.

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import windmillUrl from '../../assets/mill/windmill.glb?url'
import furUrl from '../../assets/mill/fur.dat?url'
import {
  furVertex,
  furFragment,
  backdropVertex,
  backdropFragment,
} from './furShader.js'

const DESIGN_ASPECT = 1600 / 1000
const DESIGN_VFOV = THREE.MathUtils.radToDeg(2 * Math.atan(11.25 / 120))
const CAM_DIST = 13.04
const RING_R = 0.53
// the cap in the original render is turned a little off-axis
const CAP_YAW = -0.38

// fur palette, picked from the Cycles render (sRGB hex -> linear)
const C0 = new THREE.Color('#7a1208')
const C1 = new THREE.Color('#dc4630')
const C2 = new THREE.Color('#f5846a')
const TIP = new THREE.Color('#ffcdbb')

// key / fill positions from the Blender area lights (converted to Y-up)
const KEY_POS = new THREE.Vector3(-8.02, 1.97, 4.8)
const FILL_POS = new THREE.Vector3(3.46, -2.39, 4.8)

async function fetchFur(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fur ${res.status}`)
  let buf = await res.arrayBuffer()
  const head = new Uint8Array(buf, 0, 2)
  if (head[0] === 0x1f && head[1] === 0x8b) {
    const stream = new Blob([buf])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'))
    buf = await new Response(stream).arrayBuffer()
  }
  const dv = new DataView(buf)
  const magic = String.fromCharCode(...new Uint8Array(buf, 0, 4))
  if (magic !== 'MILF') throw new Error('bad fur file')
  const count = dv.getUint32(8, true)
  let off = 12
  const groups = []
  for (let g = 0; g < count; g++) {
    const n = dv.getUint32(off, true)
    const lo = [0, 1, 2].map((i) => dv.getFloat32(off + 4 + i * 4, true))
    const hi = [0, 1, 2].map((i) => dv.getFloat32(off + 16 + i * 4, true))
    const dscale = dv.getFloat32(off + 28, true)
    groups.push({ n, lo, hi, dscale })
    off += 32
  }
  const align = () => {
    off = (off + 3) & ~3
  }
  for (const g of groups) {
    align()
    const rq = new Uint16Array(buf, off, g.n * 3)
    off += g.n * 6
    align()
    g.deltas = new Int8Array(buf, off, g.n * 12)
    off += g.n * 12
    align()
    g.colors = new Uint8Array(buf, off, g.n)
    off += g.n
    const roots = new Float32Array(g.n * 3)
    for (let i = 0; i < g.n * 3; i++) {
      const a = i % 3
      roots[i] = g.lo[a] + (rq[i] / 65535) * (g.hi[a] - g.lo[a])
    }
    g.roots = roots
  }
  return groups
}

function ribbonTemplate(seg) {
  const pos = []
  const idx = []
  for (let i = 0; i <= seg; i++) {
    const t = i / seg
    pos.push(t, -1, 0, t, 1, 0)
  }
  for (let i = 0; i < seg; i++) {
    const a = i * 2
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
  }
  return { pos: new Float32Array(pos), idx }
}

function makeFur(group, seg, ring, uniforms) {
  const { pos, idx } = ribbonTemplate(seg)
  const g = new THREE.InstancedBufferGeometry()
  g.setIndex(idx)
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aRoot', new THREE.InstancedBufferAttribute(group.roots, 3))
  const inter = new THREE.InstancedInterleavedBuffer(group.deltas, 12, 1)
  g.setAttribute('aD1', new THREE.InterleavedBufferAttribute(inter, 3, 0, true))
  g.setAttribute('aD2', new THREE.InterleavedBufferAttribute(inter, 3, 3, true))
  g.setAttribute('aD3', new THREE.InterleavedBufferAttribute(inter, 3, 6, true))
  g.setAttribute('aD4', new THREE.InterleavedBufferAttribute(inter, 3, 9, true))
  g.setAttribute(
    'aCol',
    new THREE.InstancedBufferAttribute(group.colors, 1, true),
  )
  g.instanceCount = group.n
  const m = new THREE.ShaderMaterial({
    vertexShader: furVertex,
    fragmentShader: furFragment,
    side: THREE.DoubleSide,
    uniforms: {
      ...uniforms,
      uDScale: { value: group.dscale },
      uRing: { value: ring ? 1 : 0 },
      uBright: { value: ring ? 0.92 : 1.0 },
    },
  })
  const mesh = new THREE.Mesh(g, m)
  mesh.frustumCulled = false
  mesh.userData.max = group.n
  return mesh
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ reduced?: boolean, onReady?: () => void, onError?: (e) => void }} opts
 */
export function createMillScene(canvas, opts = {}) {
  const reduced = !!opts.reduced
  // ?mill-still renders single frames on demand (used for screenshots)
  const params = new URLSearchParams(location.search)
  const still = params.has('mill-still')
  const furFrac = Math.min(1, parseFloat(params.get('mill-fur')) || 1)
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = Math.min(window.innerWidth, window.innerHeight) < 700
  const light = coarse || small

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = parseFloat(params.get('mill-exp')) || 1
  renderer.outputColorSpace = THREE.SRGBColorSpace
  let dpr = Math.min(window.devicePixelRatio || 1, light ? 1.5 : 2)
  renderer.setPixelRatio(dpr)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTex
  scene.environmentIntensity = 0.35

  const camera = new THREE.PerspectiveCamera(DESIGN_VFOV, DESIGN_ASPECT, 1, 60)
  camera.position.set(0, 0, CAM_DIST)

  const key = new THREE.DirectionalLight(0xfff5ee, 2.6)
  key.position.copy(KEY_POS)
  const fill = new THREE.DirectionalLight(0xffe4d6, 0.6)
  fill.position.copy(FILL_POS)
  const back = new THREE.PointLight(0xffffff, 2.2, 0, 2)
  back.position.set(0, 0.05, -0.2)
  // warm bounce from the fur (Cycles GI in the original render)
  const bounce = new THREE.HemisphereLight(0xfff0ea, 0xff8a66, 0.75)
  scene.add(key, fill, back, bounce)

  const world = new THREE.Group()
  scene.add(world)

  // shared fur uniforms (objects are shared by reference between materials)
  const U = {
    uTime: { value: 0 },
    uWidth: { value: 2.4 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(99, 99) },
    uMouseVel: { value: new THREE.Vector2() },
    uMouseStr: { value: 0 },
    uMouseR: { value: 0.3 },
    uGustC: { value: new THREE.Vector2() },
    uGustAge: { value: 99 },
    uGustAmp: { value: 0 },
    uSpread: { value: 0 },
    uWind: { value: reduced ? 0 : 1 },
    uRingR: { value: RING_R },
    uLight: { value: new THREE.Vector3() },
    uC0: { value: C0 },
    uC1: { value: C1 },
    uC2: { value: C2 },
    uTip: { value: TIP },
    uFade: { value: 1 },
  }

  const state = {
    ready: false,
    active: true,
    disposed: false,
    frame: { x: 0, y: 0, w: 1, h: 1 },
    size: { w: 1, h: 1 },
    pointer: new THREE.Vector2(0, 0),
    pointerS: new THREE.Vector2(0, 0),
    hover: false,
    over: false,
    dragging: false,
    lastX: 0,
    lastY: 0,
    lastMove: 0,
    mouseWorld: new THREE.Vector2(99, 99),
    mouseWorldS: new THREE.Vector2(99, 99),
    mouseVel: new THREE.Vector2(),
    brush: 0,
    spin: reduced ? 0 : 0.85,
    boost: 0,
    bladeAngle: Math.PI / 2,
    capYaw: CAP_YAW,
    pop: 0,
    scroll: 0,
    scrollS: 0,
    gustT0: -99,
    t: 0,
    frames: 0,
    slowFrames: 0,
    tuned: 0,
  }

  let blades = null
  let cap = null
  let windmill = null
  let windmillBox = null
  const furMeshes = []
  const ray = new THREE.Raycaster()
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.08)
  const tmpV3 = new THREE.Vector3()
  const tmpV2 = new THREE.Vector2()

  // ---------- framing: map the 1600x1000 design frame onto a canvas rect
  function setFrame(rect, w, h) {
    state.frame = rect
    state.size = { w, h }
    renderer.setSize(w, h, false)
    camera.aspect = DESIGN_ASPECT
    camera.setViewOffset(rect.w, rect.h, -rect.x, -rect.y, w, h)
    camera.updateProjectionMatrix()
    const b = renderer.getDrawingBufferSize(tmpV2)
    U.uRes.value.set(b.x, b.y)
    // strand width follows how big the design frame is on screen
    U.uWidth.value = Math.max(1.2, 2.6 * (rect.w / 1600)) * dpr
    if (state.ready) render()
  }

  // ---------- loading
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  Promise.all([loader.loadAsync(windmillUrl), fetchFur(furUrl)])
    .then(([gltf, fur]) => {
      if (state.disposed) return
      windmill = gltf.scene
      windmill.traverse((o) => {
        if (o.isMesh) {
          o.material.envMapIntensity = 0.9
          o.frustumCulled = false
        }
      })
      world.add(windmill)
      windmill.updateMatrixWorld(true)
      cap = windmill.getObjectByName('tripo_part_6')
      blades = windmill.getObjectByName('tripo_part_1')
      if (cap && blades) {
        // spin around the blade hub (the pivot from the raw export)
        const pivot = new THREE.Object3D()
        pivot.position.set(0.0097, 0.0623, 0.3209)
        pivot.quaternion.set(0, 0, -0.6293, 0.7771)
        cap.add(pivot)
        pivot.updateMatrixWorld(true)
        pivot.attach(blades)
        blades = pivot
        state.bladeQ = pivot.quaternion.clone()
      }
      windmillBox = new THREE.Box3().setFromObject(windmill)

      const seg = light ? 6 : 8
      const [ring, backFur] = fur
      const ringMesh = makeFur(ring, seg, true, U)
      const backMesh = makeFur(backFur, seg, false, U)
      const lf = light ? 1 : 0
      ringMesh.geometry.instanceCount = Math.round(
        ring.n * (lf ? 0.45 : 1) * furFrac,
      )
      backMesh.geometry.instanceCount = Math.round(
        backFur.n * (lf ? 0.35 : 1) * furFrac,
      )
      furMeshes.push(ringMesh, backMesh)
      world.add(ringMesh, backMesh)

      // dark emitter plane behind the left-hand fur
      const bw = backFur.hi[0] - backFur.lo[0] + 0.3
      const bh = backFur.hi[1] - backFur.lo[1] + 0.3
      const backdrop = new THREE.Mesh(
        new THREE.PlaneGeometry(bw, bh),
        new THREE.ShaderMaterial({
          vertexShader: backdropVertex,
          fragmentShader: backdropFragment,
          uniforms: { uC0: { value: C0 }, uC1: { value: C1 } },
        }),
      )
      backdrop.position.set(
        (backFur.hi[0] + backFur.lo[0]) / 2 - 0.15,
        (backFur.hi[1] + backFur.lo[1]) / 2,
        backFur.lo[2] - 0.004,
      )
      world.add(backdrop)

      state.ready = true
      render()
      opts.onReady?.()
      if (still) {
        window.__millStep = (secs = 0, steps = 1) => {
          for (let i = 0; i < steps; i++) step(secs / steps)
          render()
        }
        window.__mill = api
        return
      }
      loop()
    })
    .catch((e) => {
      if (!state.disposed) opts.onError?.(e)
    })

  // ---------- interaction
  function toNdc(clientX, clientY) {
    const r = canvas.getBoundingClientRect()
    return new THREE.Vector2(
      ((clientX - r.left) / r.width) * 2 - 1,
      -((clientY - r.top) / r.height) * 2 + 1,
    )
  }

  function hitWindmill(ndc) {
    if (!windmillBox) return false
    ray.setFromCamera(ndc, camera)
    return ray.ray.intersectsBox(windmillBox)
  }

  function worldOnFur(ndc, out) {
    ray.setFromCamera(ndc, camera)
    if (ray.ray.intersectPlane(plane, tmpV3)) out.set(tmpV3.x, tmpV3.y)
    return out
  }

  function pointerMove(e) {
    const r = canvas.getBoundingClientRect()
    state.pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      ((e.clientY - r.top) / r.height) * 2 - 1,
    )
    const ndc = toNdc(e.clientX, e.clientY)
    const prev = state.mouseWorld.clone()
    worldOnFur(ndc, state.mouseWorld)
    const now = performance.now()
    const dt = Math.max(16, now - state.lastMove) / 1000
    state.lastMove = now
    if (prev.x < 50) {
      state.mouseVel.set(
        (state.mouseWorld.x - prev.x) / dt,
        (state.mouseWorld.y - prev.y) / dt,
      )
    }
    state.brush = Math.min(1, state.brush + state.mouseVel.length() * 0.35)
    state.over = hitWindmill(ndc)
    if (state.dragging) {
      const dx = e.clientX - state.lastX
      state.boost += dx * 0.045
      state.lastX = e.clientX
      state.lastY = e.clientY
    }
    state.hover = true
  }

  function pointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return
    state.dragging = true
    state.lastX = e.clientX
    state.lastY = e.clientY
    const ndc = toNdc(e.clientX, e.clientY)
    const onMill = hitWindmill(ndc)
    worldOnFur(ndc, tmpV2)
    U.uGustC.value.copy(onMill ? new THREE.Vector2(0, 0) : tmpV2)
    state.gustT0 = state.t
    U.uGustAmp.value = onMill ? 1.25 : 0.8
    if (onMill) {
      state.boost += 9
      state.pop = 1
    }
  }

  function pointerUp() {
    state.dragging = false
  }

  function pointerLeave() {
    state.hover = false
    state.dragging = false
    state.over = false
  }

  // ---------- frame loop
  let raf = 0
  let last = performance.now()
  const clock = { t: 0 }

  function loop() {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(tick)
  }

  function tick(now) {
    if (state.disposed) return
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (!state.active) return
    raf = requestAnimationFrame(tick)
    step(dt)
    render()
    tune(dt)
  }

  function step(dt) {
    clock.t += dt
    const t = clock.t
    state.t = t
    const k = 1 - Math.exp(-dt * 4)

    // pointer smoothing -> camera orbit
    const target = state.hover ? state.pointer : tmpV2.set(0, 0)
    state.pointerS.lerp(target, k * 0.6)
    const idleX = reduced ? 0 : Math.sin(t * 0.21) * 0.25
    const idleY = reduced ? 0 : Math.sin(t * 0.17 + 1.3) * 0.2
    const yaw = (state.pointerS.x + idleX * 0.4) * 0.11
    const pitch = (state.pointerS.y + idleY * 0.4) * 0.07

    // scroll (while the hero is pinned): dive in and swing round the mill
    state.scrollS += (state.scroll - state.scrollS) * Math.min(1, dt * 6)
    const sp = state.scrollS
    const e = sp * sp * (3 - 2 * sp)
    const dist = CAM_DIST * (1 - 0.52 * e)
    const yawS = yaw + e * 0.62
    const pitchS = pitch + e * 0.14
    camera.position.set(
      Math.sin(yawS) * Math.cos(pitchS) * dist,
      Math.sin(pitchS) * dist,
      Math.cos(yawS) * Math.cos(pitchS) * dist,
    )
    camera.lookAt(0, 0, 0)

    // blades
    state.boost *= Math.exp(-dt * 0.9)
    const w = state.spin + state.boost + e * 7
    state.bladeAngle += w * dt
    if (blades && state.bladeQ) {
      blades.quaternion
        .copy(state.bladeQ)
        .multiply(
          new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 0, -1),
            state.bladeAngle,
          ),
        )
    }
    // cap turns toward the cursor (plus the lazy sway from the .blend)
    if (cap) {
      const sway = CAP_YAW + (reduced ? 0 : Math.sin(t * 0.52) * 0.18)
      const want = sway + (state.hover ? state.pointerS.x * 0.45 : 0)
      state.capYaw += (want - state.capYaw) * k * 0.5
      cap.rotation.y = state.capYaw
    }
    // click pop
    state.pop *= Math.exp(-dt * 5)
    if (windmill) {
      const hov = state.over ? 1.025 : 1
      const s = hov + Math.sin(state.pop * Math.PI) * 0.04
      windmill.scale.setScalar(
        THREE.MathUtils.lerp(windmill.scale.x, s, Math.min(1, dt * 10)),
      )
    }

    // fur uniforms
    U.uTime.value = t
    state.mouseWorldS.lerp(state.mouseWorld, Math.min(1, dt * 14))
    U.uMouse.value.copy(state.mouseWorldS)
    state.mouseVel.multiplyScalar(Math.exp(-dt * 6))
    U.uMouseVel.value
      .copy(state.mouseVel)
      .clampLength(0, 2.5)
      .multiplyScalar(0.25)
    state.brush *= Math.exp(-dt * 1.6)
    const wantStr = state.hover ? 0.55 + state.brush * 0.9 : 0
    U.uMouseStr.value += (wantStr - U.uMouseStr.value) * Math.min(1, dt * 6)
    U.uGustAge.value = t - state.gustT0
    U.uSpread.value = e
    tmpV3.copy(KEY_POS).normalize().transformDirection(camera.matrixWorldInverse)
    U.uLight.value.copy(tmpV3)
  }

  function render() {
    renderer.render(scene, camera)
  }

  // drop resolution / strand count while the device can't keep up
  // (checked in 90-frame windows, at most three times)
  function tune(dt) {
    if (state.tuned >= 3) return
    state.frames++
    if (state.frames < 15) return
    if (dt > 1 / 45) state.slowFrames++
    if (state.frames >= 105) {
      const slow = state.slowFrames > 40
      state.frames = 0
      state.slowFrames = 0
      state.tuned = slow ? state.tuned + 1 : 3
      if (slow) {
        dpr = Math.max(1, dpr * 0.75)
        renderer.setPixelRatio(dpr)
        for (const m of furMeshes) {
          m.geometry.instanceCount = Math.round(m.geometry.instanceCount * 0.65)
        }
        setFrame(state.frame, state.size.w, state.size.h)
      }
    }
  }

  function setActive(on) {
    if (still) return
    if (state.active === on) return
    state.active = on
    if (on && state.ready) {
      last = performance.now()
      loop()
    }
  }

  function setScroll(p) {
    state.scroll = Math.max(0, Math.min(1, p))
  }

  function onLost(e) {
    e.preventDefault()
    opts.onError?.(new Error('webgl context lost'))
  }
  canvas.addEventListener('webglcontextlost', onLost)

  function dispose() {
    state.disposed = true
    cancelAnimationFrame(raf)
    canvas.removeEventListener('webglcontextlost', onLost)
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) {
        for (const key of Object.keys(o.material)) {
          const v = o.material[key]
          if (v && v.isTexture) v.dispose()
        }
        o.material.dispose()
      }
    })
    envTex.dispose()
    pmrem.dispose()
    renderer.dispose()
  }

  const api = {
    setFrame,
    setActive,
    setScroll,
    pointerMove,
    pointerDown,
    pointerUp,
    pointerLeave,
    dispose,
    isOverWindmill: () => state.over,
  }
  return api
}
