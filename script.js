const content = window.PORTFOLIO_CONTENT || {};

const makeElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

document.querySelectorAll('[data-year]').forEach((node) => { node.textContent = new Date().getFullYear(); });

function imageWithFallback(item, container, className = '') {
  const image = new Image();
  image.className = className;
  image.src = item.image;
  image.alt = item.alt || item.imageAlt || '';
  const fallback = makeElement('span', 'image-fallback', `${item.title || 'Image'} — image unavailable`);
  container.append(image, fallback);
  image.addEventListener('error', () => container.classList.add('is-missing'), { once: true });
}

function renderLink(current, data, key) {
  if (!current || !data) return;
  const active = Boolean(data.url);
  const replacement = makeElement(active ? 'a' : 'span', `ink-link${active ? '' : ' is-disabled'}`, data.label);
  replacement.dataset[key] = '';
  if (active) {
    replacement.href = data.url;
    if (/^https?:/i.test(data.url)) { replacement.target = '_blank'; replacement.rel = 'noreferrer'; }
  } else {
    replacement.setAttribute('aria-disabled', 'true');
  }
  current.replaceWith(replacement);
}

function renderIdentity() {
  const name = content.profile?.name || 'AnNT';
  const posterHeader = document.querySelector('.poster-header');
  if (posterHeader) {
    posterHeader.classList.toggle('identity-compact', name.length > 10);
    posterHeader.classList.toggle('identity-long', name.length > 22);
  }
  document.querySelectorAll('[data-identity], [data-name]').forEach((node) => { node.textContent = name; });
  document.querySelectorAll('[data-identity-home]').forEach((node) => { node.setAttribute('aria-label', `${name} home`); });
  const description = document.querySelector('[data-profile-description]');
  if (description) description.content = document.body.dataset.page === 'home'
    ? `${name}'s personal portfolio — photographs, notes, and milestones.`
    : `A story from ${name}'s personal achievement archive.`;
  if (document.body.dataset.page === 'home') document.title = `${name} — Personal Archive`;
  if (document.body.dataset.page === 'archive') document.title = `Achievement archive — ${name}`;
  if (document.body.dataset.page === 'achievement') document.title = `Achievement — ${name}`;
}

function renderProfile() {
  const profile = content.profile || {};
  ['kicker', 'role', 'bio', 'note'].forEach((key) => {
    const node = document.querySelector(`[data-${key}]`);
    if (node && Object.prototype.hasOwnProperty.call(profile, key)) node.textContent = profile[key] ?? '';
  });
  renderLink(document.querySelector('[data-github]'), profile.github, 'github');
  renderLink(document.querySelector('[data-linkedin]'), profile.linkedin, 'linkedin');
  renderLink(document.querySelector('[data-cv]'), profile.cv, 'cv');
}

function renderGallery() {
  const gallery = document.querySelector('[data-gallery]');
  if (!gallery) return;
  const intro = document.querySelector('[data-gallery-intro]');
  if (intro && Object.prototype.hasOwnProperty.call(content.gallery || {}, 'intro')) intro.textContent = content.gallery.intro ?? '';
  const items = Array.isArray(content.gallery?.items) ? content.gallery.items : [];
  if (!items.length) {
    gallery.replaceChildren(makeElement('p', 'collection-empty', 'Photographs will be added here when they are ready to share.'));
    return;
  }
  gallery.replaceChildren(...items.map((item, index) => {
    const figure = makeElement('figure', `photo photo-${index + 1}${item.placeholder ? ' placeholder-photo' : ''}`);
    imageWithFallback(item, figure);
    const caption = document.createElement('figcaption');
    caption.append(makeElement('strong', '', item.title), makeElement('span', '', item.caption));
    figure.append(caption);
    return figure;
  }));
}

function sortedAchievements() {
  const items = Array.isArray(content.achievements) ? content.achievements : [];
  return [...items].sort((a, b) => String(b.date || b.year || '').localeCompare(String(a.date || a.year || '')));
}

function achievementCard(item, index) {
  const card = makeElement('a', `achievement-card${item.placeholder ? ' placeholder-card' : ''}`);
  card.href = `achievement.html?id=${encodeURIComponent(item.id)}`;
  card.dataset.achievementId = item.id;
  card.setAttribute('aria-label', `${item.title}, ${item.category}, ${item.year}${item.placeholder ? ', demo content' : ''}`);
  card.tabIndex = -1;
  const visual = makeElement('span', 'frame-image');
  imageWithFallback(item, visual);
  const meta = makeElement('span', 'frame-meta');
  meta.append(
    makeElement('strong', '', item.category),
    makeElement('em', '', item.title),
    makeElement('span', '', item.year)
  );
  card.append(visual, meta);
  return card;
}

function renderArchive() {
  const grid = document.querySelector('[data-archive-grid]');
  if (!grid) return;
  const items = sortedAchievements();
  if (!items.length) {
    grid.replaceChildren(makeElement('p', 'collection-empty', 'Achievement notes will appear here as the archive grows.'));
    return;
  }
  grid.replaceChildren(...items.map((item, index) => achievementCard(item, index)));
  grid.querySelectorAll('.achievement-card').forEach((card) => { card.tabIndex = 0; });
}

function setupAchievements() {
  const track = document.querySelector('[data-achievement-track]');
  const viewport = document.querySelector('[data-achievement-viewport]');
  const controls = document.querySelector('[data-carousel-controls]');
  const previous = document.querySelector('[data-previous]');
  const next = document.querySelector('[data-next]');
  const pause = document.querySelector('[data-pause]');
  const status = document.querySelector('[data-carousel-status]');
  if (!track || !viewport || !controls || !previous || !next || !pause || !status) return;
  const interactionRegion = viewport.closest('.filmstrip-layout') || viewport;

  const allItems = sortedAchievements();
  const items = allItems.slice(0, 5);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let explicitlyPaused = false;
  let hoverPaused = false;
  let focusPaused = false;
  let timer;
  let touchX = null;
  let lastWheelAt = -Infinity;

  if (!items.length) {
    track.replaceChildren(makeElement('p', 'collection-empty', 'Achievement notes will appear here as the archive grows.'));
    viewport.removeAttribute('tabindex');
    controls.hidden = true;
    controls.querySelectorAll('button').forEach((button) => { button.disabled = true; });
    return;
  }

  track.replaceChildren(...items.map((item, i) => achievementCard(item, i)));
  controls.hidden = reduced.matches || items.length < 2;

  const stopTimer = () => { window.clearInterval(timer); timer = undefined; };

  function update(options = {}) {
    index = ((index % items.length) + items.length) % items.length;
    const cards = [...track.querySelectorAll('.achievement-card')];
    const offset = cards[index] ? cards[index].offsetTop - cards[0].offsetTop : 0;
    track.style.transform = reduced.matches ? 'none' : `translateY(-${offset}px)`;
    cards.forEach((card, cardIndex) => {
      card.tabIndex = reduced.matches || cardIndex === index ? 0 : -1;
      card.setAttribute('aria-current', !reduced.matches && cardIndex === index ? 'true' : 'false');
    });
    status.setAttribute('aria-live', options.announce ? 'polite' : 'off');
    status.textContent = `${index + 1} of ${items.length}`;
    if (options.announce) requestAnimationFrame(() => status.setAttribute('aria-live', 'off'));
    if (options.focus) cards[index]?.focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 760px)').matches && options.reveal) {
      cards[index]?.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function restartTimer() {
    stopTimer();
    if (reduced.matches || explicitlyPaused || hoverPaused || focusPaused || document.hidden || items.length < 2) return;
    timer = window.setInterval(() => { index += 1; update(); }, 4500);
  }

  function move(delta, focus = false, reveal = false) {
    index += delta;
    update({ announce: true, focus, reveal });
    restartTimer();
  }

  previous.addEventListener('click', () => move(-1, true));
  next.addEventListener('click', () => move(1, true));
  pause.addEventListener('click', () => {
    explicitlyPaused = !explicitlyPaused;
    pause.setAttribute('aria-pressed', String(explicitlyPaused));
    pause.textContent = explicitlyPaused ? 'Play' : 'Pause';
    restartTimer();
  });
  interactionRegion.addEventListener('mouseenter', () => { hoverPaused = true; restartTimer(); });
  interactionRegion.addEventListener('mouseleave', () => { hoverPaused = false; restartTimer(); });
  interactionRegion.addEventListener('focusin', () => { focusPaused = true; restartTimer(); });
  interactionRegion.addEventListener('focusout', (event) => {
    if (!interactionRegion.contains(event.relatedTarget)) { focusPaused = false; restartTimer(); }
  });
  viewport.addEventListener('wheel', (event) => {
    if (reduced.matches) return;
    if (Math.abs(event.deltaY) < 12 || performance.now() - lastWheelAt < 500) return;
    lastWheelAt = performance.now();
    move(event.deltaY > 0 ? 1 : -1);
  }, { passive: true });
  viewport.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowDown' ? 1 : -1, true);
  });
  let touchId = null;
  viewport.addEventListener('touchstart', (event) => {
    if (reduced.matches || !event.changedTouches.length) return;
    touchId = event.changedTouches[0].identifier;
    touchX = event.changedTouches[0].clientX;
  }, { passive: true });
  viewport.addEventListener('touchend', (event) => {
    if (reduced.matches || touchX === null) return;
    const touch = [...event.changedTouches].find((entry) => entry.identifier === touchId);
    if (!touch) return;
    const distance = touchX - touch.clientX;
    if (Math.abs(distance) > 44) move(distance > 0 ? 1 : -1, false, true);
    touchX = null;
    touchId = null;
  }, { passive: true });
  reduced.addEventListener?.('change', () => { controls.hidden = reduced.matches || items.length < 2; update(); restartTimer(); });
  document.addEventListener('visibilitychange', restartTimer);
  window.addEventListener('resize', update);

  requestAnimationFrame(update);
  restartTimer();
}

function renderNotFound(container) {
  const block = makeElement('div', 'not-found');
  block.append(
    makeElement('p', 'eyebrow', 'Archive note'),
    makeElement('h1', '', 'That story is not here.'),
    makeElement('p', '', 'The achievement ID may be missing, outdated, or mistyped. The rest of the archive is still waiting for you.')
  );
  const home = makeElement('a', 'detail-link', 'Return to achievements');
  home.href = 'index.html#achievements';
  block.append(home);
  container.replaceChildren(block);
  document.title = `Achievement not found — ${content.profile?.name || 'AnNT'}`;
}

function renderDetail() {
  const container = document.querySelector('[data-achievement-detail]');
  if (!container) return;
  const id = new URLSearchParams(window.location.search).get('id');
  const item = sortedAchievements().find((entry) => entry.id === id);
  if (!item) { renderNotFound(container); return; }
  const visual = makeElement('figure', 'detail-visual');
  imageWithFallback(item, visual);
  const copy = makeElement('div', 'detail-copy');
  copy.append(
    makeElement('p', 'eyebrow', `${item.category} · ${item.year}${item.placeholder ? ' · demo content' : ''}`),
    makeElement('h1', '', item.title),
    makeElement('p', 'detail-summary', item.summary),
    makeElement('p', 'detail-story', item.story)
  );
  const facts = makeElement('ul', 'facts');
  (Array.isArray(item.facts) ? item.facts : []).forEach((fact) => facts.append(makeElement('li', '', fact)));
  if (facts.children.length) copy.append(facts);
  const links = makeElement('div', 'detail-links');
  (Array.isArray(item.links) ? item.links : []).filter((link) => link.url).forEach((itemLink) => {
    const link = makeElement('a', 'detail-link', itemLink.label);
    link.href = itemLink.url;
    if (/^https?:/i.test(itemLink.url)) { link.target = '_blank'; link.rel = 'noreferrer'; }
    links.append(link);
  });
  const back = makeElement('a', 'detail-link', '← Back to archive');
  back.href = 'index.html#achievements';
  links.append(back);
  copy.append(links);
  container.replaceChildren(visual, copy);
  document.title = `${item.title} — ${content.profile?.name || 'AnNT'}`;
}

renderIdentity();
if (document.body.dataset.page === 'home') {
  renderProfile();
  renderGallery();
  setupAchievements();
} else if (document.body.dataset.page === 'archive') {
  renderArchive();
} else {
  renderDetail();
}
