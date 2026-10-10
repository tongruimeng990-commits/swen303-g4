import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { clubBySlug } from '../content/clubs'
import { flyFlyer, flyPoster, makeFlyer } from '../lib/shortlist'
import { GolemChat } from './GolemChat'
import { inNoGo, leftSide, measureGround, nearestGroundPoint, rowIndexAt, rowRectAt, topGroundPoint } from './ground'
import { hoverPrompts } from './guide'
import { announcePileHit, HOVER_EVENT, type GolemHandle, type GolemPerformer, type GolemScene } from './useGolem'
import './golem.css'

/**
 * A small stone companion. Lives on a transparent, click-through canvas that
 * covers the viewport; one world unit is one CSS pixel, so the character is
 * placed with screen coordinates. It keeps to the "ground" of the white page
 * (the row lines in the margins beside the list, the floor under it) and
 * never stands in the reading column. All motion
 * is procedural: a spring toward a target point, plus blended pose values.
 */

export type GolemMode = 'pointer' | 'touch'

export interface GolemProps {
  handle: MutableRefObject<GolemHandle>
  /** Where the character digs out: the point the pointer crossed into the white page. */
  origin: { x: number; y: number }
  mode: GolemMode
  /** Viewport y of the border between the dark hero and the white page. */
  boundaryTop: () => number
  /** Where the character sits when there is no pointer to follow (touch). */
  restingSpot: () => { x: number; y: number }
  /** Called once, when the character has finished digging out. */
  onEmerged?: () => void
}

/** `vanishing` is the first half of a teleport: he sinks away in a puff, then `emerging` again elsewhere. */
type Phase = 'emerging' | 'walking' | 'sitting' | 'busy' | 'vanishing'
type Finish = 'kick' | 'throw' | 'fumble'

/** Standing height in CSS px. The rig is modelled at 52; it is drawn at this. */
const HEIGHT = 44
const RIG_HEIGHT = 52
const IDLE_AFTER_MS = 1000
/** The pointer must have been still this long before he moves or fidgets. */
const SETTLE_MS = 1500
/** How he is drawn when nobody is dealing with him. */
const RESTING_OPACITY = 0.8
const WALK_K = 60
const WALK_SPEED = 500
const RUN_K = 420
const RUN_SPEED = 1600
/** Longest frame we simulate; slower frames (background tab, software GL) are integrated in sub-steps. */
const MAX_DT = 0.25
const STEP_DT = 1 / 60
/** The character keeps at least this far from the pointer. */
const PERSONAL_SPACE = 44
/** Re-target only after the pointer has moved this far. */
const RETARGET_DISTANCE = 60
/** Farther than this from the photo and he doesn't fetch it — it comes to him. */
const NEAR_REACH = 220
/** Following: he only sets off when his proper place is this far from his feet. */
const FOLLOW_DEADZONE = 160
const STROLL_K = 24
const STROLL_SPEED = 240
/** Farther than this and he does not walk — he fades out and fades in over there. */
const TELEPORT_DISTANCE = 380
/** Pointer this close to the column's right edge (or beyond) is the only thing that takes him to the right margin. */
const RIGHT_SIDE_FROM = 120
const RETARGET_CHECK_MS = 80
/** Session flag: '1' when he has been asked to tag along. Default is to stay put. */
const FOLLOW_KEY = 'vuwclubs:golem-follow'
const BUBBLE_HALF_WIDTH = 150

interface Pose {
  /** 0 = invisible, 1 = drawn; used for the teleport fade */
  fade: number
  sit: number
  lift: number
  kick: number
  lean: number
  blink: number
  scale: number
  reach: number
  glance: number
  yawn: number
  hop: number
}

interface Debris {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  spin: number
}

interface Brain {
  phase: Phase
  phaseStart: number
  pos: { x: number; y: number }
  vel: { x: number; y: number }
  target: { x: number; y: number }
  springK: number
  maxSpeed: number
  pointer: { x: number; y: number } | null
  pointerMovedAt: number
  /** pointer position used for the last ground re-target, and the row it was over */
  retargetPointer: { x: number; y: number } | null
  retargetRow: number
  nextRetargetCheck: number
  facing: number
  walkPhase: number
  speed: number
  pose: Pose
  poseTarget: Pose
  nextBlinkAt: number
  nextGlanceAt: number
  debris: Debris[]
  chain: Promise<void>
  awake: boolean
  /** Fired by the frame loop the moment emerging finishes; then cleared. */
  onEmerged: (() => void) | null
  /** Told to wait: stays on `waitSpot` instead of following. */
  wait: boolean
  waitSpot: { x: number; y: number } | null
  /** Someone is dealing with him (bubble open, pointer on him): drawn at full strength. */
  engaged: boolean
  /** Ambling over to a hovered row rather than walking at full pace. */
  stroll: boolean
  /** Where the teleport in progress lands. */
  teleportTo: { x: number; y: number } | null
  scrollY: number
  lastScrollChange: number
  lastFinish: Finish | null
}

const restPose = (): Pose => ({
  fade: 1,
  sit: 0,
  lift: 0,
  kick: 0,
  lean: 0,
  blink: 0,
  scale: 1,
  reach: 0,
  glance: 0,
  yawn: 0,
  hop: 0,
})

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

/** A fresh puff of crumbs at `at`: used when he digs out, vanishes, and pops out again. */
function burstDebris(debris: Debris[], at: { x: number; y: number }) {
  for (let i = 0; i < debris.length; i++) {
    const angle = -Math.PI * (0.25 + (0.5 * i) / Math.max(1, debris.length - 1)) + (Math.random() - 0.5) * 0.3
    const speed = 160 + Math.random() * 140
    debris[i] = {
      x: at.x + (Math.random() - 0.5) * 16,
      y: at.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.55 + Math.random() * 0.25,
      spin: (Math.random() - 0.5) * 12,
    }
  }
}

function approach(current: number, target: number, rate: number, dt: number) {
  const k = 1 - Math.exp(-rate * dt)
  return current + (target - current) * k
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

/** Waiting is the default; only an explicit "follow me" (this session) changes it. */
const readWait = () => {
  try {
    return sessionStorage.getItem(FOLLOW_KEY) !== '1'
  } catch {
    return true
  }
}

const writeWait = (value: boolean) => {
  try {
    if (value) sessionStorage.removeItem(FOLLOW_KEY)
    else sessionStorage.setItem(FOLLOW_KEY, '1')
  } catch {
    // storage unavailable: forgetting is fine
  }
}

const HINT_KEY = 'vuwclubs:golem-hinted'
const HINT = 'I’ll be over here. click me to talk — or to have me tag along.'
const readHinted = () => {
  try {
    return localStorage.getItem(HINT_KEY) === '1'
  } catch {
    return true
  }
}
const writeHinted = () => {
  try {
    localStorage.setItem(HINT_KEY, '1')
  } catch {
    // fine
  }
}
/** Clicking farther than this from any ground is not "put him there". */
const PARK_REACH = 140

/** Keep the orthographic camera mapped 1:1 onto CSS pixels. */
function PixelCamera() {
  const { camera, size } = useThree()
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera
    cam.left = 0
    cam.right = size.width
    cam.top = 0
    cam.bottom = -size.height
    cam.near = -1000
    cam.far = 1000
    cam.position.set(0, 0, 500)
    cam.updateProjectionMatrix()
  }, [camera, size])
  return null
}

function makeShadowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(20,20,24,0.32)')
    gradient.addColorStop(1, 'rgba(20,20,24,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

interface RigProps {
  brain: MutableRefObject<Brain>
  boundaryTop: () => number
  restingSpot: () => { x: number; y: number }
  mode: GolemMode
  /** DOM pieces that ride along with the character. */
  hitRef: MutableRefObject<HTMLButtonElement | null>
  anchorRef: MutableRefObject<HTMLDivElement | null>
  layerRef: MutableRefObject<HTMLDivElement | null>
}

function StoneMan({ brain, boundaryTop, restingSpot, mode, hitRef, anchorRef, layerRef }: RigProps) {
  const root = useRef<THREE.Group>(null)
  const figure = useRef<THREE.Group>(null)
  const body = useRef<THREE.Mesh>(null)
  const head = useRef<THREE.Group>(null)
  const eyeL = useRef<THREE.Group>(null)
  const eyeR = useRef<THREE.Group>(null)
  const pupilL = useRef<THREE.Mesh>(null)
  const pupilR = useRef<THREE.Mesh>(null)
  const mouth = useRef<THREE.Mesh>(null)
  const legL = useRef<THREE.Mesh>(null)
  const legR = useRef<THREE.Mesh>(null)
  const armL = useRef<THREE.Mesh>(null)
  const armR = useRef<THREE.Mesh>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const debrisRefs = useRef<Array<THREE.Mesh | null>>([])
  const lastDom = useRef({ x: Infinity, y: Infinity })
  const lastAlpha = useRef(-1)
  const setFrameloop = useThree((state) => state.setFrameloop)

  const bodyGeometry = useMemo(() => new RoundedBoxGeometry(30, 26, 24, 4, 9), [])
  const shadowTexture = useMemo(() => makeShadowTexture(), [])
  const stone = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#a7a195', roughness: 0.92, metalness: 0 }),
    [],
  )
  const stoneDark = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#8f8a7f', roughness: 0.95, metalness: 0 }),
    [],
  )
  const moss = useMemo(() => new THREE.MeshStandardMaterial({ color: '#86a66b', roughness: 1 }), [])
  const eyeWhite = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbfbf8', roughness: 0.5 }), [])
  const ink = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1d1c1a', roughness: 0.6 }), [])
  const debrisMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#8f8a7f', roughness: 1, transparent: true }),
    [],
  )

  useEffect(
    () => () => {
      bodyGeometry.dispose()
      shadowTexture.dispose()
      for (const material of [stone, stoneDark, moss, eyeWhite, ink, debrisMaterial]) material.dispose()
    },
    [bodyGeometry, shadowTexture, stone, stoneDark, moss, eyeWhite, ink, debrisMaterial],
  )

  useFrame((_, rawDt) => {
    const b = brain.current
    const dt = Math.min(rawDt || 1 / 60, MAX_DT)
    const now = performance.now()
    const vw = window.innerWidth
    const vh = window.innerHeight

    // ---- ride with the page when it scrolls ----------------------------------
    const scrollY = window.scrollY
    if (scrollY !== b.scrollY) {
      const shift = b.scrollY - scrollY
      b.pos.y += shift
      b.target.y += shift
      if (b.waitSpot) b.waitSpot.y += shift
      if (b.teleportTo) b.teleportTo.y += shift
      b.scrollY = scrollY
      b.lastScrollChange = now
      b.retargetPointer = null
    }

    // ---- decide where to go ------------------------------------------------
    if (b.phase === 'walking' || b.phase === 'sitting') {
      if (mode === 'touch') {
        b.target = restingSpot()
      } else if (b.wait && b.waitSpot) {
        // Scrolled far away from where it was left: catch up to the nearest line.
        if (b.waitSpot.y < -80 || b.waitSpot.y > vh + 80) {
          const spot = nearestGroundPoint(measureGround(), { x: b.waitSpot.x, y: clamp(b.waitSpot.y, 60, vh - 20) })
          if (spot) b.waitSpot = { x: spot.x, y: spot.y }
        }
        b.target = { ...b.waitSpot }
      } else if (
        b.pointer &&
        now >= b.nextRetargetCheck &&
        now - b.lastScrollChange > 120 &&
        // While you are reading (the pointer is moving) he does not move at
        // all; only once it has been still for a while does he come over.
        now - b.pointerMovedAt > SETTLE_MS
      ) {
        b.nextRetargetCheck = now + RETARGET_CHECK_MS
        const p = b.pointer
        const moved = !b.retargetPointer || Math.hypot(p.x - b.retargetPointer.x, p.y - b.retargetPointer.y) > RETARGET_DISTANCE
        const row = rowIndexAt(p.y)
        if (moved || row !== b.retargetRow) {
          const measured = measureGround()
          // He keeps to the left side of the page; only a pointer out at the
          // right edge of a row (the time, the catch button) or beyond draws
          // him over to the right margin.
          const rightSide = measured.column !== null && p.x >= measured.column.right - RIGHT_SIDE_FROM
          const ground = rightSide ? measured : leftSide(measured)
          const top = boundaryTop()
          // Not on the line of the row you are reading: one line lower, so he
          // is never on the same horizontal as the text your eyes are on.
          const rowRect = rowRectAt(p.y)
          // (unless that line is below the window — then the row's own line,
          // or the one above it when even that is off)
          const onScreen = (y: number) => y <= vh - 8
          const lineFor = (r: DOMRect) =>
            onScreen(r.bottom + r.height) ? r.bottom + r.height : onScreen(r.bottom) ? r.bottom : r.top
          const ideal = rowRect ? { x: p.x, y: lineFor(rowRect) } : p
          const avoid = { x: p.x, y: p.y, distance: PERSONAL_SPACE }
          let spot = p.y < top ? topGroundPoint(ground, rightSide ? p.x : 0) : nearestGroundPoint(ground, ideal, avoid)
          // The right margin is often taken by the preview; if the only spot
          // there is rows away from where you are, the left side is better.
          if (rightSide && p.y >= top && spot && Math.abs(spot.y - ideal.y) > 130) {
            spot = nearestGroundPoint(leftSide(measured), ideal, avoid) ?? spot
          }
          const next = spot ? { x: spot.x, y: spot.y } : { x: p.x + 30, y: Math.max(p.y, top) + 46 }
          // Small cursor movements do not move him: he only sets off when
          // the place he should be is a good way from where he stands — and
          // then at a stroll.
          if (Math.hypot(next.x - b.pos.x, next.y - b.pos.y) > FOLLOW_DEADZONE) {
            b.target = next
            b.stroll = true
          }
          b.retargetPointer = { x: p.x, y: p.y }
          b.retargetRow = row
        }
      }
      b.springK = b.stroll ? STROLL_K : WALK_K
      b.maxSpeed = b.stroll ? STROLL_SPEED : WALK_SPEED
      // Keep the character on screen.
      b.target.x = clamp(b.target.x, 24, vw - 24)
      b.target.y = clamp(b.target.y, HEIGHT + 8, vh - 8)
    }

    // ---- far to go? don't walk across the page — fade out, fade in there ----
    if ((b.phase === 'walking' || b.phase === 'sitting') && Math.hypot(b.target.x - b.pos.x, b.target.y - b.pos.y) > TELEPORT_DISTANCE) {
      b.teleportTo = { ...b.target }
      b.phase = 'vanishing'
      b.phaseStart = now
      b.vel = { x: 0, y: 0 }
    }

    // ---- move ---------------------------------------------------------------
    if (b.phase !== 'emerging' && b.phase !== 'vanishing') {
      const k = b.springK
      const c = 2 * Math.sqrt(k)
      // fixed sub-steps keep the spring stable however long the frame was
      for (let remaining = dt; remaining > 1e-4; remaining -= STEP_DT) {
        const h = Math.min(STEP_DT, remaining)
        const ax = k * (b.target.x - b.pos.x) - c * b.vel.x
        const ay = k * (b.target.y - b.pos.y) - c * b.vel.y
        b.vel.x += ax * h
        b.vel.y += ay * h
        const s = Math.hypot(b.vel.x, b.vel.y)
        if (s > b.maxSpeed) {
          b.vel.x *= b.maxSpeed / s
          b.vel.y *= b.maxSpeed / s
        }
        b.pos.x += b.vel.x * h
        b.pos.y += b.vel.y * h
      }
    }
    b.speed = Math.hypot(b.vel.x, b.vel.y)
    const walking = b.speed > 12
    if (walking) b.walkPhase += dt * Math.min(18, 4 + b.speed * 0.045)
    else b.walkPhase = approach(b.walkPhase, Math.round(b.walkPhase / Math.PI) * Math.PI, 12, dt)
    const facingTarget = Math.abs(b.vel.x) > 10 ? Math.sign(b.vel.x) : b.facing
    b.facing = approach(b.facing, facingTarget, 8, dt)

    // ---- phase: walking vs sitting -------------------------------------------
    if (b.phase === 'walking' || b.phase === 'sitting') {
      const arrived = Math.hypot(b.target.x - b.pos.x, b.target.y - b.pos.y) < 4 && b.speed < 20
      if (arrived) b.stroll = false
      const restful = mode === 'touch' || b.wait || now - b.pointerMovedAt > IDLE_AFTER_MS
      b.phase = arrived && restful ? 'sitting' : 'walking'
    }

    // ---- pose targets from phase --------------------------------------------
    const pt = b.poseTarget
    if (b.phase === 'sitting') pt.sit = 1
    else if (b.phase === 'walking') pt.sit = 0

    if (b.phase === 'vanishing') {
      // gone quietly: fade out here, reappear there, fade in
      pt.fade = 0
      if (b.pose.fade < 0.04 && b.teleportTo) {
        const to = b.teleportTo
        b.teleportTo = null
        b.pos = { ...to }
        b.target = { ...to }
        b.vel = { x: 0, y: 0 }
        b.phase = 'walking'
        b.stroll = false
        pt.fade = 1
      }
    } else if (b.phase === 'emerging') {
      const t = Math.min(1, (now - b.phaseStart) / 620)
      // pop out with an overshoot, then settle
      const s = t < 0.55 ? (t / 0.55) * 1.18 : 1.18 - ((t - 0.55) / 0.45) * 0.18
      b.pose.scale = s
      b.pos.y = b.target.y + (1 - Math.min(1, t / 0.55)) * 26
      if (t >= 1) {
        b.pose.scale = 1
        b.phase = 'walking'
        b.pointerMovedAt = now
        if (b.wait && !b.waitSpot) {
          const spot = nearestGroundPoint(measureGround(), b.pos)
          b.waitSpot = spot ? { x: spot.x, y: spot.y } : { ...b.pos }
        }
        const emerged = b.onEmerged
        b.onEmerged = null
        emerged?.()
      }
    } else {
      b.pose.scale = approach(b.pose.scale, pt.scale, 10, dt)
    }

    // blink
    if (now >= b.nextBlinkAt) {
      pt.blink = 1
      b.nextBlinkAt = now + 3000 + Math.random() * 2200
      window.setTimeout(() => {
        brain.current.poseTarget.blink = 0
      }, 110)
    }
    // sitting: glance about now and then, rarely yawn
    const pointerSettled = !b.pointer || now - b.pointerMovedAt > SETTLE_MS
    if (b.phase === 'sitting' && pointerSettled && now >= b.nextGlanceAt) {
      b.nextGlanceAt = now + 4000 + Math.random() * 3000
      if (Math.random() < 0.18) {
        pt.yawn = 1
        window.setTimeout(() => {
          brain.current.poseTarget.yawn = 0
        }, 420)
      } else {
        pt.glance = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5)
        window.setTimeout(() => {
          brain.current.poseTarget.glance = 0
        }, 600 + Math.random() * 400)
      }
    } else if (b.phase !== 'sitting' || !pointerSettled) {
      pt.glance = 0
      pt.yawn = 0
    }

    const p = b.pose
    p.sit = approach(p.sit, pt.sit, 9, dt)
    p.lift = approach(p.lift, pt.lift, 14, dt)
    p.kick = approach(p.kick, pt.kick, 18, dt)
    p.lean = approach(p.lean, pt.lean, 10, dt)
    p.blink = approach(p.blink, pt.blink, 40, dt)
    p.reach = approach(p.reach, pt.reach, 16, dt)
    p.glance = approach(p.glance, pt.glance, 6, dt)
    p.yawn = approach(p.yawn, pt.yawn, 7, dt)
    p.hop = approach(p.hop, pt.hop, 22, dt)
    p.fade = approach(p.fade, pt.fade, 11, dt)

    // ---- apply to the rig ---------------------------------------------------
    const bob = walking ? Math.abs(Math.sin(b.walkPhase)) * 2 : 0
    const stepL = Math.max(0, Math.sin(b.walkPhase)) * 5
    const stepR = Math.max(0, Math.sin(b.walkPhase + Math.PI)) * 5

    if (root.current) root.current.position.set(b.pos.x, -b.pos.y, 0)
    const drawScale = p.scale * (HEIGHT / RIG_HEIGHT)
    if (figure.current) {
      figure.current.scale.setScalar(drawScale)
      figure.current.rotation.y = b.facing * 0.45 + p.glance * 0.35
      figure.current.rotation.z = p.lean * 0.18 - (walking ? Math.sin(b.walkPhase) * 0.03 : 0)
      figure.current.position.y = bob - p.sit * 8 + p.kick * 3 + p.hop * 10
    }
    if (body.current) {
      body.current.scale.set(1 + p.sit * 0.08, 1 - p.sit * 0.12, 1 + p.sit * 0.06)
      body.current.position.y = 19 - p.sit * 2
    }
    if (head.current) {
      head.current.position.y = 44 - p.sit * 5 + p.lift * 1.5 - p.yawn * 1.5
      head.current.rotation.x = -p.lift * 0.25 + p.sit * 0.05 - p.yawn * 0.18 - p.reach * 0.1
      head.current.rotation.y = p.glance * 0.4
      head.current.rotation.z = -p.lean * 0.1
    }
    const look = b.pointer ? clamp((b.pointer.x - b.pos.x) / 160, -1, 1) : 0
    const lookY = b.pointer ? clamp((b.pointer.y - (b.pos.y - 44)) / 160, -1, 1) : 0
    for (const pupil of [pupilL.current, pupilR.current]) {
      if (!pupil) continue
      pupil.position.x = look * 1.6 * (1 - Math.abs(p.glance)) + p.glance * 1.4
      pupil.position.y = -lookY * 1.2
    }
    for (const eye of [eyeL.current, eyeR.current]) {
      if (!eye) continue
      eye.scale.y = (1 - p.blink * 0.92) * (1 - p.yawn * 0.6)
    }
    if (mouth.current) {
      mouth.current.scale.set(2.6 - p.yawn * 1.2, 0.7 + p.yawn * 2.6, 0.6 + p.yawn * 0.4)
      mouth.current.position.y = -4.5 - p.yawn * 1.5
    }
    // legs: walk, tuck when sitting, right leg kicks
    // (the camera is orthographic, so "legs forward" is sold by spreading and
    // enlarging them rather than by moving them along z)
    if (legL.current) {
      legL.current.position.set(-8 - p.sit * 5, 6 + stepL * (1 - p.sit) - p.sit * 4, p.sit * 8)
      legL.current.scale.setScalar(1 + p.sit * 0.3)
    }
    if (legR.current) {
      const kickSwing = Math.sin(Math.min(1, p.kick) * Math.PI)
      legR.current.position.set(
        8 + p.sit * 5,
        6 + stepR * (1 - p.sit) - p.sit * 4 + kickSwing * 14,
        p.sit * 8 + kickSwing * 16 - p.kick * 2,
      )
      legR.current.scale.setScalar(1 + p.sit * 0.3)
    }
    // arms: swing with the walk, go up to lift, the near one reaches out
    const swing = walking ? Math.sin(b.walkPhase) * 4 : 0
    const reachR = b.facing >= 0 ? p.reach : 0
    const reachL = b.facing < 0 ? p.reach : 0
    if (armL.current) {
      armL.current.position.set(
        -19 + p.lift * 4 - reachL * 13,
        20 + swing + p.lift * 26 - p.sit * 3 + reachL * 7,
        p.lift * 4 + reachL * 6,
      )
    }
    if (armR.current) {
      armR.current.position.set(
        19 - p.lift * 4 + reachR * 13,
        20 - swing + p.lift * 26 - p.sit * 3 + reachR * 7,
        p.lift * 4 + reachR * 6,
      )
    }
    if (shadow.current) {
      const lift = Math.max(0, bob + p.kick * 3 + p.hop * 10)
      shadow.current.scale.set((1 - lift * 0.03) * (HEIGHT / RIG_HEIGHT), (1 - lift * 0.03) * (HEIGHT / RIG_HEIGHT), 1)
      shadow.current.position.set(0, 1, -40)
      ;(shadow.current.material as THREE.MeshBasicMaterial).opacity = p.scale * (0.9 - lift * 0.05)
    }

    // ---- how strongly he is drawn: faint unless someone is dealing with him ---
    const layer = layerRef.current
    if (layer) {
      const engaged = b.phase === 'busy' || b.engaged
      const alpha = p.fade * (engaged ? 1 : RESTING_OPACITY)
      if (Math.abs(alpha - lastAlpha.current) > 0.004) {
        lastAlpha.current = alpha
        layer.style.opacity = alpha.toFixed(3)
      }
    }

    // ---- DOM pieces follow (only when actually moved) ------------------------
    const hit = hitRef.current
    if (hit && hit.hidden !== (b.phase === 'emerging')) hit.hidden = b.phase === 'emerging'
    if (Math.abs(b.pos.x - lastDom.current.x) > 0.5 || Math.abs(b.pos.y - lastDom.current.y) > 0.5) {
      lastDom.current = { x: b.pos.x, y: b.pos.y }
      if (hit) hit.style.transform = `translate(${Math.round(b.pos.x - 24)}px, ${Math.round(b.pos.y - HEIGHT - 8)}px)`
      const anchor = anchorRef.current
      if (anchor) {
        const ax = clamp(b.pos.x, BUBBLE_HALF_WIDTH + 12, vw - BUBBLE_HALF_WIDTH - 12)
        anchor.style.transform = `translate(${Math.round(ax)}px, ${Math.round(b.pos.y)}px)`
        anchor.style.setProperty('--tail', `${Math.round(b.pos.x - ax)}px`)
        anchor.dataset.flip = b.pos.y - HEIGHT - 16 < 320 ? '' : 'no'
        // for bubbles pinned to the page edge rather than centred on him
        anchor.dataset.side = b.pos.x < vw / 2 ? 'left' : 'right'
        anchor.style.setProperty('--edge-left', `${Math.round(8 - ax)}px`)
        anchor.style.setProperty('--edge-right', `${Math.round(ax - vw + 8)}px`)
        anchor.style.setProperty('--gx-left', `${Math.round(b.pos.x - 8)}px`)
        anchor.style.setProperty('--gx-right', `${Math.round(vw - 8 - b.pos.x)}px`)
      }
    }

    // ---- debris -----------------------------------------------------------
    let anyDebris = false
    for (let i = 0; i < b.debris.length; i++) {
      const d = b.debris[i]
      const mesh = debrisRefs.current[i]
      if (!mesh) continue
      if (d.life <= 0) {
        mesh.visible = false
        continue
      }
      anyDebris = true
      d.vy += 900 * dt
      d.x += d.vx * dt
      d.y += d.vy * dt
      d.life -= dt
      mesh.visible = true
      mesh.position.set(d.x - b.pos.x, -(d.y - b.pos.y), 10)
      mesh.rotation.z += d.spin * dt
      mesh.scale.setScalar(Math.max(0.01, Math.min(1, d.life * 2)))
    }

    // ---- sleep when nothing moves ---------------------------------------------
    const settled =
      b.phase === 'sitting' &&
      b.speed < 0.5 &&
      Math.abs(p.sit - pt.sit) < 0.01 &&
      Math.abs(p.blink - pt.blink) < 0.01 &&
      Math.abs(p.glance - pt.glance) < 0.01 &&
      Math.abs(p.yawn - pt.yawn) < 0.01 &&
      Math.abs(p.fade - pt.fade) < 0.01 &&
      !anyDebris
    if (settled && b.awake) {
      b.awake = false
      setFrameloop('demand')
    }
  })

  return (
    <group ref={root}>
      <mesh ref={shadow} renderOrder={-1}>
        <planeGeometry args={[46, 18]} />
        <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} />
      </mesh>
      <group ref={figure}>
        <mesh ref={legL} material={stoneDark} position={[-8, 6, 0]}>
          <sphereGeometry args={[6.5, 18, 14]} />
        </mesh>
        <mesh ref={legR} material={stoneDark} position={[8, 6, 0]}>
          <sphereGeometry args={[6.5, 18, 14]} />
        </mesh>
        <mesh ref={body} geometry={bodyGeometry} material={stone} position={[0, 19, 0]} />
        <mesh ref={armL} material={stoneDark} position={[-19, 20, 0]}>
          <sphereGeometry args={[5.5, 16, 12]} />
        </mesh>
        <mesh ref={armR} material={stoneDark} position={[19, 20, 0]}>
          <sphereGeometry args={[5.5, 16, 12]} />
        </mesh>
        <group ref={head} position={[0, 44, 0]}>
          <mesh material={stone}>
            <sphereGeometry args={[17, 28, 22]} />
          </mesh>
          <mesh material={moss} position={[-5, 14, 4]}>
            <sphereGeometry args={[4.2, 12, 10]} />
          </mesh>
          <mesh material={moss} position={[3, 15.5, 1]}>
            <sphereGeometry args={[3.2, 12, 10]} />
          </mesh>
          <mesh material={moss} position={[8, 11, 6]}>
            <sphereGeometry args={[2.4, 10, 8]} />
          </mesh>
          <group ref={eyeL} position={[-7, 3, 14]}>
            <mesh material={eyeWhite}>
              <sphereGeometry args={[4.2, 16, 12]} />
            </mesh>
            <mesh ref={pupilL} material={ink} position={[0, 0, 3]}>
              <sphereGeometry args={[1.9, 12, 10]} />
            </mesh>
          </group>
          <group ref={eyeR} position={[7, 3, 14]}>
            <mesh material={eyeWhite}>
              <sphereGeometry args={[4.2, 16, 12]} />
            </mesh>
            <mesh ref={pupilR} material={ink} position={[0, 0, 3]}>
              <sphereGeometry args={[1.9, 12, 10]} />
            </mesh>
          </group>
          <mesh ref={mouth} material={ink} position={[0, -4.5, 16]} scale={[2.6, 0.7, 0.6]}>
            <sphereGeometry args={[1.4, 10, 8]} />
          </mesh>
        </group>
      </group>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            debrisRefs.current[i] = mesh
          }}
          material={debrisMaterial}
          visible={false}
        >
          <boxGeometry args={[5, 4, 4]} />
        </mesh>
      ))}
    </group>
  )
}

/** Clamp a rect to the viewport so flights never start off-screen. */
function visibleRect(rect: DOMRect): DOMRect {
  const left = Math.min(Math.max(rect.left, 0), window.innerWidth - rect.width)
  const top = Math.min(Math.max(rect.top, 0), window.innerHeight - rect.height)
  return new DOMRect(left, top, rect.width, rect.height)
}

const centerDelta = (from: DOMRect, to: DOMRect) => ({
  dx: to.left + to.width / 2 - (from.left + from.width / 2),
  dy: to.top + to.height / 2 - (from.top + from.height / 2),
})

/** Move the ghost so its inline box is `rect`, dropping any running animation. */
function anchorGhost(ghost: HTMLElement, rect: DOMRect) {
  for (const animation of ghost.getAnimations()) animation.cancel()
  Object.assign(ghost.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transform: '',
    opacity: '',
  })
}

/** Animate the ghost from its current box to `rect`, then re-anchor it there. */
async function carryGhost(ghost: HTMLElement, from: DOMRect, to: DOMRect, ms: number, rotate = 0, easing = 'cubic-bezier(0.2, 0.8, 0.2, 1)') {
  const { dx, dy } = centerDelta(from, to)
  const scale = to.width / from.width
  await ghost
    .animate(
      [
        { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(${rotate}deg)` },
      ],
      { duration: ms, easing, fill: 'forwards' },
    )
    .finished.catch(() => undefined)
  anchorGhost(ghost, to)
}

/**
 * Where he digs out. A mouse user's crossing point is ignored: he comes up
 * at the top-left of the white page, out of the way, and stays there until
 * he is asked to tag along.
 */
function startPoint(origin: { x: number; y: number }, mode: GolemMode) {
  if (mode !== 'pointer') return origin
  const ground = leftSide(measureGround())
  const spot = topGroundPoint(ground, 0) ?? nearestGroundPoint(ground, origin)
  return spot ? { x: spot.x, y: spot.y } : origin
}

export default function Golem({ handle, origin, mode, boundaryTop, restingSpot, onEmerged }: GolemProps) {
  const initialWait = mode === 'touch' ? true : readWait()
  const [start] = useState(() => startPoint(origin, mode))
  const brain = useRef<Brain>({
    phase: 'emerging',
    phaseStart: performance.now(),
    pos: { x: start.x, y: start.y },
    vel: { x: 0, y: 0 },
    target: { x: start.x, y: start.y },
    springK: WALK_K,
    maxSpeed: WALK_SPEED,
    pointer: mode === 'pointer' ? { x: origin.x, y: origin.y } : null,
    pointerMovedAt: performance.now(),
    retargetPointer: null,
    retargetRow: -1,
    nextRetargetCheck: 0,
    facing: 1,
    walkPhase: 0,
    speed: 0,
    pose: { ...restPose(), scale: 0 },
    poseTarget: restPose(),
    nextBlinkAt: performance.now() + 1800,
    nextGlanceAt: performance.now() + 5000,
    debris: (() => {
      const debris: Debris[] = Array.from({ length: 8 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, spin: 0 }))
      burstDebris(debris, start)
      return debris
    })(),
    chain: Promise.resolve(),
    awake: true,
    onEmerged: onEmerged ?? null,
    wait: initialWait,
    waitSpot: null,
    engaged: false,
    stroll: false,
    teleportTo: null,
    scrollY: window.scrollY,
    lastScrollChange: 0,
    lastFinish: null,
  })
  const wakeRef = useRef<() => void>(() => undefined)
  const hitRef = useRef<HTMLButtonElement | null>(null)
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const [waiting, setWaiting] = useState(initialWait)
  const [chatOpen, setChatOpen] = useState(false)
  const [saying, setSaying] = useState<string | null>(null)
  const sayTimer = useRef<number | null>(null)
  /** The row the pointer has settled on, while he is offering chips about it. */
  const [hoverSlug, setHoverSlug] = useState<string | null>(null)
  const hoverHide = useRef<number | null>(null)
  /** The chips are unfolded (pointer came to him while a row was lit). */
  const [offerOpen, setOfferOpen] = useState(false)
  const [question, setQuestion] = useState<{ id: number; text: string } | null>(null)

  // Keep the latest callback without restarting anything; the first time he
  // appears for a mouse user he also explains himself, once.
  useEffect(() => {
    if (brain.current.phase !== 'emerging') return
    brain.current.onEmerged = () => {
      onEmerged?.()
      if (mode === 'pointer' && !readHinted()) {
        writeHinted()
        window.setTimeout(() => sayRef.current(HINT, 6500), 1400)
      }
    }
  }, [onEmerged, mode])

  // Touch mode: start at the resting spot rather than a crossing point.
  useEffect(() => {
    if (mode !== 'touch') return
    const spot = restingSpot()
    const b = brain.current
    b.pos = { ...spot }
    b.target = { ...spot }
    b.waitSpot = { ...spot }
    for (const d of b.debris) {
      d.x += spot.x - origin.x
      d.y += spot.y - origin.y
    }
  }, [mode, origin.x, origin.y, restingSpot])

  // Follow the pointer (mouse / pen only); wake for scrolling too.
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (mode !== 'pointer' || event.pointerType === 'touch') return
      const b = brain.current
      b.pointer = { x: event.clientX, y: event.clientY }
      b.pointerMovedAt = performance.now()
      wakeRef.current()
    }
    const onScroll = () => wakeRef.current()
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [mode])

  const say = useCallback((text: string, ms = 2200) => {
    setSaying(text)
    if (sayTimer.current !== null) window.clearTimeout(sayTimer.current)
    sayTimer.current = window.setTimeout(() => setSaying(null), ms)
  }, [])
  const sayRef = useRef(say)
  sayRef.current = say
  useEffect(() => () => {
    if (sayTimer.current !== null) window.clearTimeout(sayTimer.current)
  }, [])

  const setWait = useCallback(
    (value: boolean, spot?: { x: number; y: number }) => {
      const b = brain.current
      b.wait = value
      if (value) {
        const found = spot ?? nearestGroundPoint(measureGround(), b.pos)
        b.waitSpot = found ? { x: found.x, y: found.y } : { ...b.pos }
      } else {
        b.waitSpot = null
        b.retargetPointer = null
        b.pointerMovedAt = performance.now()
      }
      if (mode === 'pointer') writeWait(value)
      setWaiting(value)
      wakeRef.current()
    },
    [mode],
  )

  const onHit = () => {
    if (chatOpen) {
      setChatOpen(false)
      return
    }
    if (mode === 'pointer' && !brain.current.wait) setWait(true)
    setSaying(null)
    setChatOpen(true)
  }

  const onFollow = useCallback(() => {
    setWait(false)
    setChatOpen(false)
    say('coming!')
  }, [setWait, say])

  const onWaitHere = useCallback(() => {
    setWait(true)
  }, [setWait])

  const closeChat = useCallback(() => setChatOpen(false), [])

  // Clicking bare floor is "sit there": he walks to the nearest ground by the
  // click and waits. Anything that is itself clickable, any text, the column,
  // the pile and his own bubble are not floor.
  useEffect(() => {
    if (mode !== 'pointer') return
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      const target = event.target as Element | null
      if (!target || !target.closest('#clubs')) return
      if (
        target.closest(
          '.golem-dom, .club-row, .club-filters, .club-preview, #shortlist-pile, .shortlist-stage, a, button, input, select, textarea, label, p, h1, h2, h3, li, [role="button"], [role="dialog"]',
        )
      )
        return
      const ground = measureGround()
      const p = { x: event.clientX, y: event.clientY }
      if (inNoGo(ground, p)) return
      const spot = nearestGroundPoint(ground, p)
      if (!spot || Math.hypot(spot.x - p.x, spot.y - p.y) > PARK_REACH) return
      setWait(true, spot)
      setChatOpen(false)
      say('ok, I’ll wait here', 1800)
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [mode, setWait, say])

  // The list says the pointer has settled on a row. He does not come over
  // and nothing pops up: a small dot lights on him to say he has something
  // about that club, and the chips open only when the pointer comes to him.
  useEffect(() => {
    if (mode !== 'pointer') return
    const onHover = (event: Event) => {
      const slug = (event as CustomEvent<{ slug: string | null }>).detail?.slug ?? null
      if (hoverHide.current !== null) window.clearTimeout(hoverHide.current)
      hoverHide.current = null
      if (slug) {
        setHoverSlug(slug)
        wakeRef.current()
      } else {
        hoverHide.current = window.setTimeout(() => {
          hoverHide.current = null
          if (anchorRef.current?.matches(':hover') || hitRef.current?.matches(':hover')) return
          setHoverSlug(null)
          setOfferOpen(false)
        }, 450)
      }
    }
    window.addEventListener(HOVER_EVENT, onHover)
    return () => {
      window.removeEventListener(HOVER_EVENT, onHover)
      if (hoverHide.current !== null) window.clearTimeout(hoverHide.current)
    }
  }, [mode])

  // Pointer on him (or on the chips): he is "engaged" — drawn at full
  // strength — and, if a row is lit, the chips unfold.
  const chatOpenRef = useRef(chatOpen)
  chatOpenRef.current = chatOpen
  const selfLeave = useRef<number | null>(null)
  const onSelfEnter = () => {
    if (selfLeave.current !== null) window.clearTimeout(selfLeave.current)
    selfLeave.current = null
    brain.current.engaged = true
    if (hoverSlug) setOfferOpen(true)
    wakeRef.current()
  }
  const onSelfLeave = () => {
    if (selfLeave.current !== null) window.clearTimeout(selfLeave.current)
    selfLeave.current = window.setTimeout(() => {
      selfLeave.current = null
      if (anchorRef.current?.matches(':hover') || hitRef.current?.matches(':hover')) return
      brain.current.engaged = chatOpenRef.current
      setOfferOpen(false)
      wakeRef.current()
    }, 300)
  }
  useEffect(() => () => {
    if (selfLeave.current !== null) window.clearTimeout(selfLeave.current)
  }, [])

  // An open bubble counts as engaged too.
  useEffect(() => {
    brain.current.engaged = chatOpen || !!(hitRef.current?.matches(':hover') || anchorRef.current?.matches(':hover'))
    wakeRef.current()
  }, [chatOpen])

  const dismissHover = useCallback(() => {
    setOfferOpen(false)
  }, [])

  const askFromHover = (text: string) => {
    setOfferOpen(false)
    setHoverSlug(null)
    setSaying(null)
    setQuestion({ id: performance.now(), text })
    setChatOpen(true)
  }

  const hoverClub = hoverSlug ? clubBySlug(hoverSlug) : null

  // His bubbles sit in the margin he is standing in when the margin is wide
  // enough; otherwise they are centred on him and may overlap the column
  // briefly.
  useEffect(() => {
    const anchor = anchorRef.current
    if (!anchor || (!hoverClub && !saying)) return
    const column = document.querySelector('.club-list__rows')?.getBoundingClientRect()
    const vw = window.innerWidth
    const margin = column ? (brain.current.pos.x < vw / 2 ? column.left : vw - column.right) : 0
    if (margin >= 170) {
      anchor.dataset.offer = 'side'
      anchor.style.setProperty('--offer-max', `${Math.min(300, Math.round(margin - 16))}px`)
    } else {
      anchor.dataset.offer = 'centre'
    }
  }, [hoverClub, offerOpen, saying])

  // Click outside the bubble closes it (the hit target handles its own click).
  useEffect(() => {
    if (!chatOpen) return
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (anchorRef.current?.contains(target) || hitRef.current?.contains(target)) return
      setChatOpen(false)
    }
    window.addEventListener('pointerdown', onDown, true)
    return () => window.removeEventListener('pointerdown', onDown, true)
  }, [chatOpen])

  // The scenes the page asks for.
  useEffect(() => {
    const b = brain.current

    const run = async (target: { x: number; y: number }, ms: number) => {
      b.target = { x: clamp(target.x, 24, window.innerWidth - 24), y: clamp(target.y, HEIGHT + 8, window.innerHeight - 8) }
      b.springK = RUN_K
      b.maxSpeed = RUN_SPEED
      const started = performance.now()
      while (performance.now() - started < ms) {
        if (Math.hypot(b.target.x - b.pos.x, b.target.y - b.pos.y) < 6) break
        await sleep(16)
      }
      // A starved frame loop (background tab, software GL) may not have got
      // it there in time: snap, so the rest of the scene stays coherent.
      if (Math.hypot(b.target.x - b.pos.x, b.target.y - b.pos.y) >= 6) {
        b.pos = { ...b.target }
        b.vel = { x: 0, y: 0 }
      }
    }

    const handRect = (w: number, h: number) =>
      new DOMRect(b.pos.x + b.facing * 28 - w / 2, b.pos.y - 30 - h / 2, w, h)
    const groundRect = (w: number, h: number, ahead = 24) => new DOMRect(b.pos.x + b.facing * ahead - w / 2, b.pos.y - h, w, h)
    const headRect = (w: number, h: number) => new DOMRect(b.pos.x - w / 2, b.pos.y - HEIGHT - h - 4, w, h)

    const throwFrom = async (ghost: HTMLElement, from: DOMRect, to: DOMRect) => {
      const w = from.width
      const h = from.height
      const overhead = headRect(w, h)
      b.poseTarget.lift = 1
      await carryGhost(ghost, from, overhead, 90)
      b.poseTarget.lean = -0.6
      await sleep(50)
      b.poseTarget.lift = 0
      b.poseTarget.lean = 1
      const flight = flyFlyer(ghost, overhead, to, { arc: 140, spin: 160, duration: 280 })
      await sleep(150)
      b.poseTarget.lean = -0.2
      await sleep(90)
      b.poseTarget.lean = 0
      await flight
    }

    const kickFrom = async (ghost: HTMLElement, from: DOMRect, to: DOMRect) => {
      const floor = groundRect(from.width, from.height)
      await carryGhost(ghost, from, floor, 80, 0, 'cubic-bezier(0.4, 0, 1, 1)')
      await kickAt(ghost, floor, to)
    }

    /** The poster is already on the ground in front of him: boot it. */
    const kickAt = async (ghost: HTMLElement, floor: DOMRect, to: DOMRect) => {
      b.poseTarget.kick = 1
      b.poseTarget.lean = -1
      await sleep(60)
      const flight = flyFlyer(ghost, floor, to, { arc: 120, spin: 220, duration: 280 })
      await sleep(130)
      b.poseTarget.kick = 0
      b.poseTarget.lean = 0.6
      await sleep(90)
      b.poseTarget.lean = 0
      await flight
    }

    const fumbleThenThrow = async (ghost: HTMLElement, from: DOMRect, to: DOMRect) => {
      const w = from.width
      const h = from.height
      const floor = groundRect(w, h, 34)
      const { dx, dy } = centerDelta(from, floor)
      // it slips, drops, bounces once
      const fall = ghost
        .animate(
          [
            { transform: 'translate(0, 0) rotate(0deg)', offset: 0 },
            { transform: `translate(${dx}px, ${dy}px) rotate(-18deg)`, offset: 0.55, easing: 'cubic-bezier(0.4, 0, 1, 1)' },
            { transform: `translate(${dx}px, ${dy - 12}px) rotate(-26deg)`, offset: 0.78, easing: 'cubic-bezier(0, 0, 0.6, 1)' },
            { transform: `translate(${dx}px, ${dy}px) rotate(-22deg)`, offset: 1 },
          ],
          { duration: 260, fill: 'forwards' },
        )
        .finished.catch(() => undefined)
      await sleep(120)
      // startled hop
      b.poseTarget.hop = 1
      b.poseTarget.blink = 1
      await sleep(110)
      b.poseTarget.hop = 0
      b.poseTarget.blink = 0
      await fall
      anchorGhost(ghost, floor)
      // bend down and pick it up
      b.poseTarget.sit = 0.7
      b.poseTarget.reach = 1
      b.poseTarget.lean = 0.5
      await sleep(160)
      const hand = handRect(w, h)
      await carryGhost(ghost, floor, hand, 120, 8)
      b.poseTarget.sit = 0
      b.poseTarget.reach = 0
      b.poseTarget.lean = 0
      await sleep(60)
      await throwFrom(ghost, hand, to)
    }

    const pickFinish = (): Finish => {
      const othersQueued = handle.current.pending > 1
      const allowFumble = !othersQueued && b.lastFinish !== 'fumble'
      const r = Math.random() * (allowFumble ? 100 : 85)
      return r < 45 ? 'kick' : r < 85 ? 'throw' : 'fumble'
    }

    const performer: GolemPerformer = {
      catchPoster(scene: GolemScene) {
        const job = async () => {
          wakeRef.current()
          const from = visibleRect(scene.from)
          const to = scene.to
          const grabSpot = { x: from.left - 26, y: from.bottom }
          const near = Math.hypot(grabSpot.x - b.pos.x, grabSpot.y - b.pos.y) <= NEAR_REACH
          if (!near || b.phase === 'vanishing' || b.phase === 'emerging') {
            // Not within reach (following or parked, either way): no performance.
            // The poster makes its own way to the pile and he just watches it go.
            const side = to.left + to.width / 2 >= b.pos.x ? 1 : -1
            const glance = side * 0.8
            b.poseTarget.glance = glance
            b.nextGlanceAt = performance.now() + 5000
            await flyPoster(from, to, scene.style, { arc: 90, spin: 40, duration: 420 })
            announcePileHit()
            window.setTimeout(() => {
              if (b.poseTarget.glance === glance) b.poseTarget.glance = 0
            }, 400)
            return
          }
          b.phase = 'busy'
          b.poseTarget.sit = 0
          // 1. step to the photo's lower edge, on the list side
          await run(grabSpot, 320)
          b.facing = 1
          // 2. reach for it — the photo itself, from exactly where it was
          const ghost = makeFlyer(from, scene.style)
          b.poseTarget.reach = 1
          b.poseTarget.lean = 0.5
          await sleep(110)
          // 3. it shrinks into the hands
          const handW = 36
          const handH = Math.max(20, Math.round((handW * from.height) / from.width))
          const hand = handRect(handW, handH)
          await carryGhost(ghost, from, hand, 150, 6)
          b.poseTarget.reach = 0
          b.poseTarget.lean = 0
          // 4. one of three finishes
          const finish = pickFinish()
          b.lastFinish = finish
          if (finish === 'kick') await kickFrom(ghost, hand, to)
          else if (finish === 'throw') await throwFrom(ghost, hand, to)
          else await fumbleThenThrow(ghost, hand, to)
          announcePileHit()
          b.phase = 'walking'
          b.springK = WALK_K
          b.maxSpeed = WALK_SPEED
          b.retargetPointer = null
          b.pointerMovedAt = performance.now()
        }
        const next = b.chain.then(job, job)
        b.chain = next.catch(() => undefined)
        return next
      },
      throwTools(ghost: HTMLElement, to: DOMRect) {
        const job = async () => {
          wakeRef.current()
          b.phase = 'busy'
          b.poseTarget.sit = 0
          const toCenterX = to.left + to.width / 2
          b.facing = toCenterX >= b.pos.x ? 1 : -1
          const hand = { x: b.pos.x + b.facing * 10, y: b.pos.y - HEIGHT + 4 }
          const dx = hand.x - toCenterX
          const dy = hand.y - (to.top + to.height / 2)
          const start = `translate(${dx}px, ${dy}px) scale(0.05) rotate(-10deg)`
          ghost.style.transform = start
          ghost.style.opacity = '0.4'
          b.poseTarget.lift = 1
          b.poseTarget.lean = -0.6
          await sleep(200)
          b.poseTarget.lift = 0
          b.poseTarget.lean = 1
          const flight = ghost
            .animate(
              [
                { transform: start, opacity: 0.4, offset: 0 },
                {
                  transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 110}px) scale(0.55) rotate(4deg)`,
                  opacity: 1,
                  offset: 0.5,
                },
                { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1, offset: 1 },
              ],
              { duration: 520, easing: 'cubic-bezier(0.3, 0, 0.55, 1)', fill: 'forwards' },
            )
            .finished.catch(() => undefined)
          await sleep(160)
          b.poseTarget.lean = -0.2
          await sleep(120)
          b.poseTarget.lean = 0
          await flight
          b.phase = 'walking'
          b.springK = WALK_K
          b.maxSpeed = WALK_SPEED
          b.pointerMovedAt = performance.now()
        }
        const next = b.chain.then(job, job)
        b.chain = next.catch(() => undefined)
        return next
      },
    }
    handle.current.performer = performer
    const where = () => ({ ...b.pos })
    handle.current.where = where
    return () => {
      if (handle.current.performer === performer) handle.current.performer = null
      if (handle.current.where === where) handle.current.where = null
    }
  }, [handle])

  return (
    <>
      <div className="golem-layer" aria-hidden="true" ref={layerRef}>
        <Canvas
          orthographic
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          frameloop="always"
          style={{ pointerEvents: 'none' }}
        >
          <PixelCamera />
          <Waker brain={brain} wakeRef={wakeRef} />
          <hemisphereLight args={['#ffffff', '#8c8a84', 1.1]} />
          <directionalLight position={[-220, 320, 460]} intensity={1.7} />
          <directionalLight position={[260, -80, 300]} intensity={0.35} color="#dfe8ff" />
          <StoneMan
            brain={brain}
            boundaryTop={boundaryTop}
            restingSpot={restingSpot}
            mode={mode}
            hitRef={hitRef}
            anchorRef={anchorRef}
            layerRef={layerRef}
          />
        </Canvas>
      </div>
      <div className="golem-dom">
        <button
          ref={hitRef}
          type="button"
          className="golem-hit"
          aria-label={chatOpen ? 'the golem — close its bubble' : 'the golem — click to talk to it'}
          aria-expanded={chatOpen}
          hidden
          onClick={onHit}
          onPointerEnter={onSelfEnter}
          onPointerLeave={onSelfLeave}
        />
        <div ref={anchorRef} className="golem-anchor" data-flip="no" onPointerEnter={onSelfEnter} onPointerLeave={onSelfLeave}>
          {hoverClub && !chatOpen && !offerOpen ? <span className="golem-dot" aria-hidden="true" /> : null}
          {saying && !chatOpen ? <div className="golem-say">{saying}</div> : null}
          {hoverClub && offerOpen && !chatOpen ? (
            <div className="golem-say golem-offer" onPointerLeave={dismissHover}>
              <span className="golem-offer__name">{hoverClub.name}?</span>
              <span className="golem-offer__chips">
                {hoverPrompts(hoverClub).map((prompt) => (
                  <button key={prompt.label} type="button" className="golem-chip" onClick={() => askFromHover(prompt.question)}>
                    {prompt.label}
                  </button>
                ))}
              </span>
            </div>
          ) : null}
          <GolemChat
            open={chatOpen}
            waiting={waiting}
            canFollow={mode === 'pointer'}
            onClose={closeChat}
            onFollow={onFollow}
            onWait={onWaitHere}
            initialQuestion={question}
          />
        </div>
      </div>
    </>
  )
}

/** Lets DOM-side events switch the canvas back to continuous rendering. */
function Waker({
  brain,
  wakeRef,
}: {
  brain: MutableRefObject<Brain>
  wakeRef: MutableRefObject<() => void>
}) {
  const setFrameloop = useThree((state) => state.setFrameloop)
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    wakeRef.current = () => {
      const b = brain.current
      if (!b.awake) {
        b.awake = true
        setFrameloop('always')
      }
      invalidate()
    }
    // Blinks and glances happen while asleep too: wake briefly for them.
    const timer = window.setInterval(() => {
      const b = brain.current
      const soon = performance.now() + 20
      if (soon >= b.nextBlinkAt || (b.phase === 'sitting' && soon >= b.nextGlanceAt)) wakeRef.current()
    }, 500)
    return () => {
      window.clearInterval(timer)
      wakeRef.current = () => undefined
    }
  }, [brain, wakeRef, setFrameloop, invalidate])
  return null
}
