const normalize = (value) => value.toLocaleLowerCase('vi').normalize('NFD')
  .replace(/\p{Diacritic}/gu, '').replaceAll('đ', 'd').trim()

const catalogParams = new URLSearchParams(location.search)
for (const key of [...catalogParams.keys()]) if (key !== 'q' && key !== 'group') catalogParams.delete(key)
for (const link of document.querySelectorAll('[data-plugin-return]')) link.search = catalogParams

for (const filter of document.querySelectorAll('[data-filter]')) {
  const controls = filter.querySelector('.filter-controls')
  const query = filter.querySelector('[data-query]')
  const group = filter.querySelector('[data-group]')
  const items = [...filter.querySelectorAll('[data-item]')]
  const count = filter.querySelector('[data-count]')
  const empty = filter.querySelector('[data-empty]')
  const links = filter.querySelectorAll('[data-item] h3 a')

  const update = () => {
    const words = normalize(query.value).split(/\s+/).filter(Boolean)
    let visible = 0
    for (const item of items) {
      const label = normalize(item.textContent)
      item.hidden = Boolean(group?.value && item.dataset.groupValue !== group.value) ||
        !words.every((word) => label.includes(word))
      visible += Number(!item.hidden)
    }
    count.textContent = visible + ' kết quả'
    empty.hidden = visible > 0
    const params = new URLSearchParams()
    if (query.value) params.set('q', query.value)
    if (group?.value) params.set('group', group.value)
    if (filter.dataset.filter === 'plugins') for (const link of links) link.search = params
  }
  const restore = () => {
    const params = new URLSearchParams(history.state?.filter || location.search)
    query.value = params.get('q') || ''
    if (group) group.value = params.get('group') || ''
    update()
  }
  const save = () => {
    update()
    const url = new URL(location.href)
    for (const [key, value] of [['q', query.value], ['group', group?.value]]) {
      if (value) url.searchParams.set(key, value)
      else url.searchParams.delete(key)
    }
    try {
      history.replaceState(null, '', url)
    } catch {
      history.replaceState({ filter: url.search }, '')
    }
  }
  query.addEventListener('input', save)
  group?.addEventListener('change', save)
  for (const button of filter.querySelectorAll('[data-clear]')) {
    button.addEventListener('click', () => {
      query.value = ''
      if (group) group.value = ''
      save()
      query.focus()
    })
  }
  window.addEventListener('popstate', restore)
  restore()
  controls.hidden = false
}

for (const menu of document.querySelectorAll('.mobile-nav, .desktop-nav .product')) {
  menu.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !menu.open) return
    menu.open = false
    menu.querySelector('summary').focus()
  })
}

if (matchMedia('(max-width: 820px)').matches) {
  for (const toc of document.querySelectorAll('.toc')) toc.open = false
}

function createNeuralBackdrop(reduce) {
  const canvas = document.querySelector('.neural-motion')
  const ctx = canvas?.getContext('2d')
  if (!ctx) return () => {}
  const layer = canvas.parentElement
  const color = getComputedStyle(layer).getPropertyValue('--accent-cool').trim()
  const dots = Array.from({ length: 48 }, (_, i) => ({
    x: (i * 71 % 101) / 101,
    y: ((i * 41 + i * i) % 103) / 103,
    vx: Math.sin(i * 2.4) * .009,
    vy: Math.cos(i * 2.4) * .013,
  }))
  let width, height

  function draw(delta) {
    ctx.clearRect(0, 0, width, height)
    const range = Math.min(170, Math.max(104, width * .128))
    const positions = dots.slice(0, width < 600 ? 26 : dots.length).map(dot => {
      dot.x = (dot.x + dot.vx * delta + 1) % 1
      dot.y = (dot.y + dot.vy * delta + 1) % 1
      return [dot.x * width, dot.y * height]
    })
    for (let i = 0; i < positions.length; i++) {
      const [x, y] = positions[i]
      for (let j = i + 1; j < positions.length; j++) {
        const [bx, by] = positions[j]
        const distance = Math.hypot(x - bx, y - by)
        if (distance >= range) continue
        ctx.globalAlpha = (1 - distance / range) * .58
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(bx, by)
        ctx.stroke()
      }
      ctx.globalAlpha = i % 6 ? .44 : .8
      ctx.fillRect(x - 1, y - 1, 2, 2)
    }
  }

  function resize() {
    width = layer.clientWidth
    height = layer.clientHeight
    canvas.width = width
    canvas.height = height
    ctx.fillStyle = ctx.strokeStyle = color
    draw(0)
  }

  window.addEventListener('resize', resize)
  resize()
  const sync = () => layer.classList.toggle('is-moving', !reduce.matches)
  reduce.addEventListener('change', sync)
  sync()
  return draw
}
