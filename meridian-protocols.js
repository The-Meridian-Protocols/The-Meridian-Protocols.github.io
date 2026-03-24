// ── Protocol reveal ──
function toggleProtocol(id) {
  const card = document.getElementById(id);
  const body = document.getElementById(id + '-body');
  const isOpen = card.classList.contains('open');

  document.querySelectorAll('.protocol-preview').forEach(c => {
    c.classList.remove('open');
    const b = document.getElementById(c.id + '-body');
    if (b) b.style.maxHeight = '0';
    const pid = c.id + '-audio';
    if (players[pid] && players[pid].playing) {
      players[pid].audio.pause();
      setPlayState(pid, false);
    }
  });

  if (!isOpen) {
    card.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 'px';
    setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }
}

// ── Audio player ──
const players = {};

function initPlayer(id, src) {
  if (players[id]) return;
  const audio = new Audio(src);
  audio.preload = 'none';
  players[id] = { audio, playing: false };
  audio.addEventListener('timeupdate', () => {
    const fill = document.getElementById(id + '-fill');
    const time = document.getElementById(id + '-time');
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (fill) fill.style.width = pct + '%';
    if (time) time.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
  });
  audio.addEventListener('ended', () => {
    setPlayState(id, false);
    const fill = document.getElementById(id + '-fill');
    if (fill) fill.style.width = '0%';
  });
}

function togglePlay(id, src) {
  initPlayer(id, src);
  const p = players[id];
  if (p.playing) {
    p.audio.pause();
    setPlayState(id, false);
  } else {
    Object.entries(players).forEach(([pid, pp]) => {
      if (pid !== id && pp.playing) { pp.audio.pause(); setPlayState(pid, false); }
    });
    p.audio.play();
    setPlayState(id, true);
  }
}

function setPlayState(id, playing) {
  if (players[id]) players[id].playing = playing;
  const btn = document.getElementById(id + '-btn');
  if (btn) btn.innerHTML = playing
    ? '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="4" height="12" rx="1" fill="currentColor"/><rect x="8" y="1" width="4" height="12" rx="1" fill="currentColor"/></svg>'
    : '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 1.5L12 7L3 12.5V1.5Z" fill="currentColor"/></svg>';
}

function seekAudio(e, id) {
  const p = players[id];
  if (!p || !p.audio.duration) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  p.audio.currentTime = pct * p.audio.duration;
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + String(sec).padStart(2, '0');
}
