import React, { useEffect, useRef } from 'react'
import frameSrc from '../../assets/landing/ai-core-frame.webp'

/*
  Cinematic loop built on the reference frame (644 × 360). Everything below is in reference-frame
  pixels so overlays stay locked to the artwork while the camera dollies.

  - 0–5s dolly-in toward the core lens, 5–10s ease back to the exact opening frame.
  - Canvas FX run at 24fps; every motion is periodic over 10s so the loop is seamless.
  - Near "bokeh" particles zoom harder than the frame for parallax.
  The frame itself never moves structurally, so code panels and labels stay crisp and readable.
*/

const FW = 644
const FH = 360
const AR = FW / FH
const LOOP = 10
const FPS = 24
const DOLLY = 0.12
const NEAR_DOLLY = 0.2
const LENS: Pt = [273, 168]
const SPHERE = { x: 248, y: 165, r: 58 }
/** Keep the core and beams centred when the viewport crops the frame (narrow screens). */
const FOCUS = { x: 0.47, y: 0.47 }
const MAX_CANVAS_W = 2400
const STILL_T = 1.9

type Pt = [number, number]

const CYAN = '#8fe6ff'
const GOLD = '#ffc978'
const RED = '#ff6a6a'
const BLUE = '#7cc4ff'
const WHITE = '#ffffff'

const NODES = {
  payment: [450, 80] as Pt,
  userDb: [520, 82] as Pt,
  inventory: [545, 229] as Pt,
  docTop: [582, 93] as Pt,
  docMid: [588, 157] as Pt,
  docBottom: [588, 210] as Pt,
}

/** Junctions of the existing network, softly breathing between pulses. */
const JUNCTIONS: Pt[] = [
  [440, 109], [541, 121], [469, 148], [542, 152], [451, 183], [546, 183],
  [506, 202], [410, 203], [403, 120], [418, 173], [568, 93], [578, 157], [578, 208],
]

const BLUE_EDGES: [Pt, Pt][] = [
  [[403, 120], [440, 109]], [[440, 109], [450, 84]], [[440, 109], [469, 148]],
  [[469, 148], [542, 152]], [[542, 152], [578, 157]], [[469, 148], [541, 121]],
  [[541, 121], [568, 93]], [[418, 173], [451, 183]], [[410, 203], [451, 183]],
  [[451, 183], [506, 202]], [[506, 202], [546, 183]], [[546, 183], [578, 208]],
  [[546, 183], [578, 157]], [[506, 202], [545, 226]],
]

const RED_EDGES: [Pt, Pt][] = [
  [[520, 88], [541, 121]], [[541, 121], [578, 157]], [[520, 88], [497, 107]],
  [[497, 107], [480, 147]], [[480, 147], [457, 213]], [[457, 213], [445, 223]],
  [[445, 223], [525, 212]], [[525, 212], [578, 208]],
]

interface Pulse {
  start: number
  dur: number
  path: Pt[]
  color: string
  /** Index of the first segment drawn in red (the red dependency lines). */
  redFrom?: number
  target?: { at: Pt; color: string }
}

/** Sequential illumination: PAYMENT_GATEWAY → USER_DB → INVENTORY_API → DOCUMENTATION. */
const PULSES: Pulse[] = [
  { start: 0.2, dur: 1.5, color: GOLD, path: [LENS, [403, 120], [440, 109], [450, 86]], target: { at: NODES.payment, color: CYAN } },
  { start: 2.7, dur: 1.6, color: CYAN, path: [LENS, [418, 173], [480, 147], [497, 107], [520, 88]], redFrom: 2, target: { at: NODES.userDb, color: RED } },
  { start: 5.2, dur: 1.5, color: CYAN, path: [LENS, [410, 203], [506, 202], [545, 226]], target: { at: NODES.inventory, color: CYAN } },
  { start: 7.6, dur: 1.4, color: GOLD, path: [LENS, [451, 183], [546, 183], [578, 157], [588, 157]], target: { at: NODES.docMid, color: CYAN } },
  { start: 8.4, dur: 0.9, color: CYAN, path: [[546, 183], [578, 208], [588, 210]], target: { at: NODES.docBottom, color: CYAN } },
  { start: 8.5, dur: 1.0, color: CYAN, path: [[542, 152], [541, 121], [568, 93], [582, 93]], target: { at: NODES.docTop, color: CYAN } },
]

/* ---------- deterministic helpers ---------- */

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TAU = Math.PI * 2
const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const wrap = (x: number, m: number) => ((x % m) + m) % m

/** Dolly amount 0 → 1 → 0 over the loop, eased at both ends so the loop point is invisible. */
function dollyAt(t: number) {
  const p = wrap(t, LOOP) / LOOP
  return p < 0.5 ? easeInOutSine(p / 0.5) : easeInOutSine((1 - p) / 0.5)
}

function pointOnPath(path: Pt[], f: number): Pt {
  const lens: number[] = []
  let total = 0
  for (let i = 0; i < path.length - 1; i++) {
    const d = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1])
    lens.push(d)
    total += d
  }
  let dist = Math.max(0, Math.min(1, f)) * total
  for (let i = 0; i < lens.length; i++) {
    if (dist <= lens[i] || i === lens.length - 1) {
      const k = lens[i] ? Math.min(1, dist / lens[i]) : 0
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k]
    }
    dist -= lens[i]
  }
  return path[path.length - 1]
}

function segmentIndexAt(path: Pt[], f: number) {
  let total = 0
  const lens = path.slice(0, -1).map((p, i) => {
    const d = Math.hypot(path[i + 1][0] - p[0], path[i + 1][1] - p[1])
    total += d
    return d
  })
  let dist = f * total
  for (let i = 0; i < lens.length; i++) {
    if (dist <= lens[i]) return i
    dist -= lens[i]
  }
  return lens.length - 1
}

/** Soft radial light sprite, drawn scaled with additive blending (far cheaper than shadowBlur). */
function glowSprite(color: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, color)
  grad.addColorStop(0.18, color)
  grad.addColorStop(0.45, `${color}55`)
  grad.addColorStop(1, `${color}00`)
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  return c
}

/* ---------- static scene data ---------- */

const R = rng(42)
const STREAKS = Array.from({ length: 30 }, (_, i) => {
  const k = i / 29
  return {
    end: [398 + R() * 46, 96 + k * 156 + (R() - 0.5) * 10] as Pt,
    // integer cycles per loop keeps the streak field perfectly periodic
    speed: (4 + Math.floor(R() * 5)) / LOOP,
    phase: R(),
    len: 0.12 + R() * 0.16,
    width: 0.7 + R() * 1.3,
    color: R() < 0.45 ? GOLD : R() < 0.85 ? CYAN : WHITE,
    alpha: 0.28 + R() * 0.32,
  }
})

const EDGE_DOTS = [
  ...BLUE_EDGES.map((e) => ({ edge: e, color: BLUE })),
  ...RED_EDGES.map((e) => ({ edge: e, color: RED })),
].map((d) => ({ ...d, cycles: 1 + Math.floor(R() * 3), phase: R() }))

const FAR_PARTICLES = Array.from({ length: 110 }, () => ({
  x: R() * FW,
  y: R() * FH,
  r: 0.25 + R() * 0.55,
  ax: 3 + R() * 9,
  ay: 2 + R() * 7,
  m: 1 + Math.floor(R() * 2),
  phase: R() * TAU,
  tw: 1 + Math.floor(R() * 4),
  color: R() < 0.7 ? WHITE : R() < 0.85 ? CYAN : GOLD,
}))

const NEAR_PARTICLES = Array.from({ length: 22 }, () => ({
  x: R() * FW,
  y: R() * FH,
  r: 2.2 + R() * 4.5,
  ax: 6 + R() * 14,
  ay: 4 + R() * 10,
  phase: R() * TAU,
  alpha: 0.05 + R() * 0.12,
  color: R() < 0.6 ? CYAN : GOLD,
}))

/* ---------- component ---------- */

interface CinematicHeroProps {
  videoSrc?: string
  className?: string
}

export function CinematicHero({ videoSrc, className = '' }: CinematicHeroProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const imageStageRef = useRef<HTMLDivElement>(null)
  const nearStageRef = useRef<HTMLDivElement>(null)
  const fxRef = useRef<HTMLCanvasElement>(null)
  const nearRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!videoSrc) return
    const v = videoRef.current
    if (v) {
      v.defaultMuted = true
      v.muted = true
      v.play().catch(() => {
        const unlock = () => {
          if (videoRef.current) {
            videoRef.current.muted = true
            videoRef.current.play().catch(() => {})
          }
          window.removeEventListener('click', unlock)
          window.removeEventListener('keydown', unlock)
        }
        window.addEventListener('click', unlock)
        window.addEventListener('keydown', unlock)
      })
    }
  }, [videoSrc])

  useEffect(() => {
    if (videoSrc) return
    const root = rootRef.current
    const imageStage = imageStageRef.current
    const nearStage = nearStageRef.current
    const fx = fxRef.current
    const near = nearRef.current
    if (!root || !imageStage || !nearStage || !fx || !near) return
    const fxCtx = fx.getContext('2d')
    const nearCtx = near.getContext('2d')
    if (!fxCtx || !nearCtx) return

    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    const sprites = {
      [CYAN]: glowSprite(CYAN),
      [GOLD]: glowSprite(GOLD),
      [RED]: glowSprite(RED),
      [BLUE]: glowSprite(BLUE),
      [WHITE]: glowSprite(WHITE),
    } as Record<string, HTMLCanvasElement>

    let scale = 1 // canvas px per frame px

    /* Cover-fit the frame, biased toward the focus point, never revealing an edge. */
    const layout = () => {
      const cw = root.clientWidth
      const ch = root.clientHeight
      if (!cw || !ch) return
      const sw = Math.max(cw, ch * AR)
      const sh = sw / AR
      const sx = Math.min(0, Math.max(cw - sw, cw / 2 - FOCUS.x * sw))
      const sy = Math.min(0, Math.max(ch - sh, ch / 2 - FOCUS.y * sh))
      root.style.setProperty('--stage-w', `${sw}px`)
      root.style.setProperty('--stage-h', `${sh}px`)
      root.style.setProperty('--stage-x', `${sx}px`)
      root.style.setProperty('--stage-y', `${sy}px`)
      const dpr = Math.min(1.5, window.devicePixelRatio || 1)
      const pw = Math.min(MAX_CANVAS_W, Math.round(sw * dpr))
      const ph = Math.round(pw / AR)
      for (const c of [fx, near]) {
        c.width = pw
        c.height = ph
      }
      scale = pw / FW
      render(lastT)
    }

    const sprite = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, radius: number, alpha: number) => {
      if (alpha <= 0.002 || radius <= 0) return
      ctx.globalAlpha = Math.min(1, alpha)
      ctx.drawImage(sprites[color] ?? sprites[WHITE], x - radius, y - radius, radius * 2, radius * 2)
    }

    const drawFx = (t: number) => {
      const ctx = fxCtx
      const tl = wrap(t, LOOP)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, fx.width, fx.height)
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      ctx.globalCompositeOperation = 'lighter'

      const breath = 0.5 + 0.5 * Math.sin((TAU * tl * 4) / LOOP)
      // launch flash at the lens each time a pulse leaves the core
      let flash = 0
      for (const p of PULSES) {
        if (p.path[0] !== LENS) continue
        const since = wrap(tl - p.start, LOOP)
        if (since < 0.6) flash = Math.max(flash, 1 - since / 0.6)
      }

      // ceiling + window reflections of the core light
      sprite(ctx, CYAN, LENS[0] + 20, 10, 150, 0.035 + 0.03 * breath + 0.04 * flash)
      sprite(ctx, GOLD, LENS[0] - 30, 6, 110, 0.025 + 0.02 * breath)
      const sweepX = -160 + (tl / LOOP) * (FW + 320)
      const sweep = ctx.createLinearGradient(sweepX - 70, 0, sweepX + 70, 0)
      sweep.addColorStop(0, 'rgba(180,220,255,0)')
      sweep.addColorStop(0.5, 'rgba(180,220,255,0.05)')
      sweep.addColorStop(1, 'rgba(180,220,255,0)')
      ctx.globalAlpha = 1
      ctx.save()
      ctx.transform(1, 0, -0.35, 1, 0, 0)
      ctx.fillStyle = sweep
      ctx.fillRect(sweepX - 70, 0, 140, FH * 0.72)
      ctx.restore()

      // volumetric bloom around the core
      sprite(ctx, CYAN, SPHERE.x, SPHERE.y, 120, 0.08 + 0.05 * breath + 0.06 * flash)
      sprite(ctx, GOLD, LENS[0] + 6, LENS[1], 70, 0.06 + 0.05 * breath)

      // light streaks flowing out along the existing beams
      ctx.lineCap = 'round'
      for (const s of STREAKS) {
        const head = wrap(tl * s.speed + s.phase, 1)
        const tail = Math.max(0, head - s.len)
        const hx = LENS[0] + (s.end[0] - LENS[0]) * head
        const hy = LENS[1] + (s.end[1] - LENS[1]) * head
        const tx = LENS[0] + (s.end[0] - LENS[0]) * tail
        const ty = LENS[1] + (s.end[1] - LENS[1]) * tail
        const fade = Math.sin(Math.PI * head) // dim at the core and at the far end
        const grad = ctx.createLinearGradient(tx, ty, hx, hy)
        grad.addColorStop(0, `${s.color}00`)
        grad.addColorStop(1, s.color)
        ctx.globalAlpha = s.alpha * fade
        ctx.strokeStyle = grad
        ctx.lineWidth = s.width
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(hx, hy)
        ctx.stroke()
      }

      // soft pulses along the blue and red connection lines
      for (const d of EDGE_DOTS) {
        const f = wrap((tl * d.cycles) / LOOP + d.phase, 1)
        const [a, b] = d.edge
        const x = a[0] + (b[0] - a[0]) * f
        const y = a[1] + (b[1] - a[1]) * f
        const env = Math.sin(Math.PI * f)
        sprite(ctx, d.color, x, y, 5, 0.32 * env)
      }

      // junctions breathe gently
      JUNCTIONS.forEach(([x, y], i) => {
        const b = 0.5 + 0.5 * Math.sin((TAU * tl * 2) / LOOP + i * 1.7)
        sprite(ctx, BLUE, x, y, 7, 0.08 + 0.1 * b)
      })

      // sequential pulses and node illumination
      for (const p of PULSES) {
        const local = wrap(tl - p.start, LOOP)
        if (local <= p.dur) {
          const f = easeInOutCubic(local / p.dur)
          const seg = segmentIndexAt(p.path, f)
          const color = p.redFrom !== undefined && seg >= p.redFrom ? RED : p.color
          for (let k = 14; k >= 0; k--) {
            const ff = f - k * 0.012
            if (ff < 0) continue
            const [x, y] = pointOnPath(p.path, ff)
            const a = (1 - k / 15) * 0.55
            sprite(ctx, color, x, y, 3 + (1 - k / 15) * 5, a)
          }
          const [hx, hy] = pointOnPath(p.path, f)
          sprite(ctx, WHITE, hx, hy, 4, 0.9)
          sprite(ctx, color, hx, hy, 14, 0.45)
        }
        if (p.target) {
          const since = local - p.dur
          if (since >= 0 && since < 2.2) {
            const k = since / 2.2
            const intensity = Math.exp(-3 * k) * (since < 0.12 ? since / 0.12 : 1)
            const [x, y] = p.target.at
            sprite(ctx, p.target.color, x, y, 26, 0.7 * intensity)
            sprite(ctx, WHITE, x, y, 7, 0.55 * intensity)
            ctx.globalAlpha = 0.5 * (1 - k) * (1 - k)
            ctx.strokeStyle = p.target.color
            ctx.lineWidth = 0.9
            ctx.beginPath()
            ctx.arc(x, y, 8 + 22 * easeInOutSine(Math.min(1, k * 1.4)), 0, TAU)
            ctx.stroke()
          }
        }
      }

      // inner mechanical rings: dash patterns flow around fixed ellipses, so the rings turn in
      // place without changing shape or position (dash period divides the loop → seamless)
      const rings = [
        { rx: 0.9, ry: 0.36, rot: -0.38, dash: [7, 5], cycles: 2, color: CYAN, alpha: 0.38, w: 0.9 },
        { rx: 0.72, ry: 0.72, rot: 0, dash: [2.2, 5.4], cycles: -1, color: GOLD, alpha: 0.32, w: 1 },
        { rx: 0.5, ry: 0.84, rot: 0.55, dash: [10, 7], cycles: 1, color: CYAN, alpha: 0.22, w: 0.7 },
      ]
      for (const ring of rings) {
        const period = ring.dash[0] + ring.dash[1]
        ctx.save()
        ctx.globalAlpha = ring.alpha * (0.8 + 0.2 * breath)
        ctx.strokeStyle = ring.color
        ctx.lineWidth = ring.w
        ctx.setLineDash(ring.dash)
        ctx.lineDashOffset = -((tl / LOOP) * ring.cycles * period * 6)
        ctx.beginPath()
        ctx.ellipse(SPHERE.x, SPHERE.y, SPHERE.r * ring.rx, SPHERE.r * ring.ry, ring.rot, 0, TAU)
        ctx.stroke()
        ctx.restore()
      }
      ctx.setLineDash([])

      // the lens itself
      sprite(ctx, WHITE, LENS[0], LENS[1], 16, 0.35 + 0.25 * breath + 0.35 * flash)
      sprite(ctx, CYAN, LENS[0], LENS[1], 34, 0.18 + 0.12 * breath + 0.2 * flash)

      // fine airborne particles (periodic drift, gentle twinkle)
      for (const p of FAR_PARTICLES) {
        const x = p.x + p.ax * Math.sin((TAU * tl * p.m) / LOOP + p.phase)
        const y = p.y + p.ay * Math.cos((TAU * tl * p.m) / LOOP + p.phase * 1.3)
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((TAU * tl * p.tw) / LOOP + p.phase))
        sprite(ctx, p.color, x, y, p.r * 3.2, 0.5 * tw)
      }
      ctx.globalAlpha = 1
    }

    const drawNear = (t: number) => {
      const ctx = nearCtx
      const tl = wrap(t, LOOP)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, near.width, near.height)
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      ctx.globalCompositeOperation = 'lighter'
      // out-of-focus foreground motes: the depth-of-field cue in front of the panels
      for (const p of NEAR_PARTICLES) {
        const x = p.x + p.ax * Math.sin((TAU * tl) / LOOP + p.phase)
        const y = p.y + p.ay * Math.cos((TAU * tl) / LOOP + p.phase * 0.7)
        ctx.globalAlpha = p.alpha
        ctx.drawImage(sprites[p.color], x - p.r * 3, y - p.r * 3, p.r * 6, p.r * 6)
      }
      ctx.globalAlpha = 1
    }

    const applyCamera = (t: number) => {
      const e = reduce ? 0 : dollyAt(t)
      imageStage.style.transform = `scale(${(1 + DOLLY * e).toFixed(5)})`
      nearStage.style.transform = `scale(${(1 + NEAR_DOLLY * e).toFixed(5)})`
    }

    const render = (t: number) => {
      drawFx(t)
      drawNear(t)
    }

    let raf = 0
    let visible = true
    let start = performance.now()
    // Reduced motion shows one still (PAYMENT_GATEWAY lit); resizes re-render that same moment.
    let lastT = reduce ? STILL_T : 0
    let lastFxFrame = -1

    const tick = (now: number) => {
      raf = 0
      const t = (now - start) / 1000
      lastT = t
      applyCamera(t) // camera at display rate for a smooth dolly
      const frame = Math.floor(t * FPS)
      if (frame !== lastFxFrame) {
        lastFxFrame = frame
        render(frame / FPS) // effects at a cinematic 24fps
      }
      if (visible && !document.hidden) raf = requestAnimationFrame(tick)
    }
    const play = () => {
      if (reduce || raf || !visible || document.hidden) return
      start = performance.now() - lastT * 1000
      raf = requestAnimationFrame(tick)
    }

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(layout) : null
    ro?.observe(root)
    layout()
    applyCamera(0)
    render(lastT)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) play()
      else if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    })
    io.observe(root)
    const onVisibility = () => {
      if (!document.hidden) play()
    }
    document.addEventListener('visibilitychange', onVisibility)
    play()

    return () => {
      ro?.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [videoSrc])

  const stageStyle: React.CSSProperties = {
    position: 'absolute',
    left: 'var(--stage-x, 0px)',
    top: 'var(--stage-y, 0px)',
    width: 'var(--stage-w, 100%)',
    height: 'var(--stage-h, 100%)',
    transformOrigin: `${(LENS[0] / FW) * 100}% ${(LENS[1] / FH) * 100}%`,
    willChange: 'transform',
  }

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label="An AI core in a dark glass office at night streams cyan and gold light into a dependency graph of payment, database, inventory and documentation services, beside holographic Python code diffs."
      className={`absolute inset-0 overflow-hidden bg-[#05080d] ${className}`}
    >
      {videoSrc ? (
        <video
          ref={(node) => {
            videoRef.current = node
            if (node) {
              node.defaultMuted = true
              node.muted = true
            }
          }}
          src={videoSrc}
          poster={frameSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={(e) => {
            e.currentTarget.muted = true
            e.currentTarget.play().catch(() => {})
          }}
          onLoadedData={(e) => {
            e.currentTarget.muted = true
            e.currentTarget.play().catch(() => {})
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div ref={imageStageRef} style={stageStyle}>
            <img
              src={frameSrc}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full select-none"
              decoding="async"
            />
            <canvas
              ref={fxRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full"
              style={{ mixBlendMode: 'screen' }}
            />
          </div>
          <div ref={nearStageRef} style={stageStyle} aria-hidden>
            <canvas
              ref={nearRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
              style={{ mixBlendMode: 'screen' }}
            />
          </div>
        </>
      )}
      {/* cinematic finish: vignette and film grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 52% 48%, rgba(0,0,0,0) 45%, rgba(2,5,9,0.42) 82%, rgba(2,5,9,0.7) 100%)',
        }}
      />
      <div aria-hidden className="s7-grain pointer-events-none absolute -inset-[20%] opacity-[0.07]" />
    </div>
  )
}
