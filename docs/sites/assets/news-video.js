// Only load a YouTube player after an explicit click; switching stops the previous video.
for (const card of document.querySelectorAll('[data-video-card]')) {
  const stage = card.querySelector('.video-stage');
  const poster = card.querySelector('[data-video-play]');
  const formats = [...card.querySelectorAll('.video-format')];
  const links = [...card.querySelectorAll('.video-source')];
  function play() {
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${poster.dataset.id}?autoplay=1`;
    frame.title = poster.getAttribute('aria-label');
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    stage.replaceChildren(frame);
    frame.focus();
  }
  poster.addEventListener('click', play);
  for (const button of formats) button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') return;
    formats.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    links.forEach(link => { link.hidden = !link.href.includes(`v=${button.dataset.id}`); });
    poster.dataset.id = button.dataset.id;
    stage.classList.toggle('is-short', button.dataset.kind === 'Short');
    poster.querySelector('img').src = `https://i.ytimg.com/vi/${button.dataset.id}/hqdefault.jpg`;
    stage.replaceChildren(poster);
  });
}
