// Visual-only port of MotionOrbitSphere and MotionPhotonLinks from Orbit.
// No Orbit runtime, microphone access, or service requests are involved.
const goldenRatio = (1 + Math.sqrt(5)) / 2
const unit = ([x, y, z]) => {
  const length = Math.hypot(x, y, z)
  return [x / length, y / length, z / length]
}
const vertices = [[-1,goldenRatio,0], [1,goldenRatio,0], [-1,-goldenRatio,0], [1,-goldenRatio,0],
  [0,-1,goldenRatio], [0,1,goldenRatio], [0,-1,-goldenRatio], [0,1,-goldenRatio],
  [goldenRatio,0,-1], [goldenRatio,0,1], [-goldenRatio,0,-1], [-goldenRatio,0,1]].map(unit)
const faces = [[0,11,5], [0,5,1], [0,1,7], [0,7,10], [0,10,11], [1,5,9], [5,11,4], [11,10,2], [10,7,6], [7,1,8],
  [3,9,4], [3,4,2], [3,2,6], [3,6,8], [3,8,9], [4,9,5], [2,4,11], [6,2,10], [8,6,7], [9,8,1]]
const edgeKey = (a, b) => a < b ? a + ':' + b : b + ':' + a
const midpoints = new Map()
const midpoint = (a, b) => {
  const key = edgeKey(a, b)
  if (!midpoints.has(key)) {
    midpoints.set(key, vertices.push(unit(vertices[a].map((value, index) => value + vertices[b][index]))) - 1)
  }
  return midpoints.get(key)
}
const edges = new Map()
for (const [a, b, c] of faces) {
  const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a)
  for (const [start, finish] of [[a,ab],[a,ca],[b,ab],[b,bc],[c,bc],[c,ca],[ab,bc],[bc,ca],[ca,ab]]) {
    edges.set(edgeKey(start, finish), [start, finish])
  }
}

function setupOrbit(figure) {
  const canvas = figure.querySelector('[data-orbit-canvas]')
  const center = figure.querySelector('[data-orbit-center]')
  const toggle = figure.querySelector('[data-orbit-toggle]')
  const nodes = [...figure.querySelectorAll('[data-orbit-node]')]
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const drawBackdrop = createNeuralBackdrop(motion)

  const style = getComputedStyle(figure)
  const accent = style.getPropertyValue('--accent').trim()
  const textColor = style.getPropertyValue('--text').trim()
  const circle = Math.PI * 2
  let geometry, frame = 0, lastRender = 0, elapsed = 0, visible = true, paused = false

  const dot = (x, y, radius, color, opacity) => {
    ctx.globalAlpha = opacity
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, circle)
    ctx.fill()
  }

  const render = () => {
    if (!geometry) return
    const { width, height, x, y, radius, connectors } = geometry
    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, width, height)
    const glow = ctx.createRadialGradient(x, y, radius * .08, x, y, radius * 1.48)
    glow.addColorStop(0, accent + '44')
    glow.addColorStop(.55, accent + '15')
    glow.addColorStop(1, accent + '00')
    ctx.fillStyle = glow
    ctx.fillRect(x - 1.5 * radius, y - 1.5 * radius, 3 * radius, 3 * radius)

    ctx.strokeStyle = accent
    ctx.lineWidth = .9
    for (const [index, [sx, sy, ex, ey]] of connectors.entries()) {
      const control = sx + (ex - sx) * .48
      ctx.globalAlpha = .46
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.bezierCurveTo(control, sy, control, ey, ex, ey)
      ctx.stroke()
      if (!motion.matches) {
        const t = ((elapsed + index * .48) % 3.8) / 3.8
        const s = 1 - t
        const sparkX = s ** 3 * sx + 3 * s * t * control + t ** 3 * ex
        const sparkY = (s ** 3 + 3 * s ** 2 * t) * sy + (3 * s * t ** 2 + t ** 3) * ey
        dot(sparkX, sparkY, 4, accent, .22)
        dot(sparkX, sparkY, 1.6, textColor, .9)
      }
    }

    const angle = .38 + elapsed * .27
    const cos = Math.cos(angle), sin = Math.sin(angle)
    const tiltCos = Math.cos(.3), tiltSin = Math.sin(.3)
    const projected = vertices.map(([vx, vy, vz]) => {
      const tx = vx * cos - vz * sin, tz = vx * sin + vz * cos
      const ty = vy * tiltCos - tz * tiltSin, depth = vy * tiltSin + tz * tiltCos
      const perspective = 3.2 / (3.2 - depth * .65)
      return [x + tx * radius * perspective, y + ty * radius * perspective, depth]
    })
    ctx.lineWidth = .85
    for (const [a, b] of edges.values()) {
      const [ax, ay, az] = projected[a], [bx, by, bz] = projected[b]
      ctx.globalAlpha = .15 + .29 * (1 + (az + bz) / 2)
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(bx, by)
      ctx.stroke()
    }
    for (const [px, py, depth] of projected) {
      dot(px, py, 1.05 + .52 * (depth + 1), textColor, .24 + .31 * (depth + 1))
    }
    for (const [index, tilt] of [-.72, .51, -.18].entries()) {
      const orbitRadius = radius * (1.27 + index * .13)
      const orbitHeight = radius * (.28 + index * .09)
      ctx.globalAlpha = .14
      ctx.beginPath()
      ctx.ellipse(x, y, orbitRadius, orbitHeight, tilt, 0, circle)
      ctx.stroke()
      const sweep = elapsed * (.63 + index * .12) + index * 2.1
      const dx = Math.cos(sweep) * orbitRadius, dy = Math.sin(sweep) * orbitHeight
      const cometX = x + dx * Math.cos(tilt) - dy * Math.sin(tilt)
      const cometY = y + dx * Math.sin(tilt) + dy * Math.cos(tilt)
      dot(cometX, cometY, 5, accent, .22)
      dot(cometX, cometY, 2, textColor, .93)
    }
    ctx.globalAlpha = 1
  }

  const fit = () => {
    const scene = canvas.getBoundingClientRect()
    const middle = center.getBoundingClientRect()
    if (!scene.width || !scene.height || !middle.width) return
    const ratio = Math.min(devicePixelRatio || 1, 2)
    canvas.width = Math.round(scene.width * ratio)
    canvas.height = Math.round(scene.height * ratio)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    const x = middle.left - scene.left + middle.width / 2
    const y = middle.top - scene.top + middle.height / 2
    const radius = Math.min(middle.width * .4, middle.height * .34, 112)
    const connectors = nodes.map((node) => {
      const rect = node.getBoundingClientRect()
      const left = rect.right < middle.right
      const sx = (left ? rect.right : rect.left) - scene.left
      const sy = rect.top - scene.top + rect.height / 2
      return [sx, sy, x + (left ? -1 : 1) * radius * .83, y + (sy < y ? -1 : 1) * radius * .24]
    })
    geometry = { width: scene.width, height: scene.height, x, y, radius, connectors }
    render()
    figure.classList.add('is-rendered')
  }

  const canAnimate = () => geometry && visible && !document.hidden && !paused && !motion.matches
  const animate = (time) => {
    frame = 0
    if (!canAnimate()) return
    if (!lastRender || time - lastRender >= 32) {
      const delta = lastRender ? Math.min(time - lastRender, 64) / 1000 : 0
      elapsed += delta
      lastRender = time
      render()
      drawBackdrop(delta)
    }
    frame = requestAnimationFrame(animate)
  }
  const sync = () => {
    toggle.hidden = motion.matches
    toggle.textContent = paused ? 'Phát chuyển động' : 'Tạm dừng chuyển động'
    if (!canAnimate() && frame) {
      cancelAnimationFrame(frame)
      frame = lastRender = 0
    }
    if (canAnimate() && !frame) frame = requestAnimationFrame(animate)
  }
  toggle.addEventListener('click', () => { paused = !paused; sync() })
  motion.addEventListener('change', () => { elapsed = 0; render(); sync() })
  document.addEventListener('visibilitychange', sync)
  if ('ResizeObserver' in window) new ResizeObserver(() => { fit(); sync() }).observe(center)
  else window.addEventListener('resize', () => { fit(); sync() })
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    sync()
  }).observe(figure)
  fit()
  sync()
}

for (const figure of document.querySelectorAll('[data-orbit-viz]')) setupOrbit(figure)
