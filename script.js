const content = window.PORTFOLIO_CONTENT;

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function installImageFallback(image, container, label) {
  const fallback = makeElement('span', 'image-fallback', label || 'Image unavailable');
  container.append(fallback);
  image.addEventListener('error', () => container.classList.add('is-missing'), { once: true });
}

function renderProfileLink(element, item, dataName) {
  if (!element || !item) return;
  const replacement = makeElement(item.url ? 'a' : 'span', item.url ? 'ink-link' : 'disabled-link', item.label);
  replacement.setAttribute(`data-${dataName}`, '');
  if (item.url) {
    replacement.href = item.url;
    if (/^https?:/.test(item.url)) { replacement.target = '_blank'; replacement.rel = 'noreferrer'; }
  } else {
    replacement.setAttribute('aria-disabled', 'true');
  }
  element.replaceWith(replacement);
}

function renderIdentity() {
  const name = content?.profile?.name;
  if (!name) return;
  document.querySelectorAll('[data-identity]').forEach((element) => { element.textContent = name; });
  document.querySelectorAll('[data-identity-home]').forEach((element) => { element.setAttribute('aria-label', `${name} home`); });
  const description = document.querySelector('[data-profile-description]');
  if (description) description.content = document.body.dataset.page === 'home'
    ? `${name}'s personal portfolio — a quiet collection of notes, photographs, and milestones.`
    : `A story from ${name}'s personal achievement archive.`;
  document.title = document.body.dataset.page === 'home' ? `${name} — Personal Archive` : `Achievement — ${name}`;
}

function renderProfile() {
  if (!content?.profile) return;
  const profile = content.profile;
  document.querySelector('[data-kicker]').textContent = profile.kicker;
  document.querySelector('[data-role]').textContent = profile.role;
  document.querySelector('[data-bio]').textContent = profile.bio;
  document.querySelector('[data-note]').textContent = profile.note;
  renderProfileLink(document.querySelector('[data-github]'), profile.github, 'github');
  renderProfileLink(document.querySelector('[data-linkedin]'), profile.linkedin, 'linkedin');
  renderProfileLink(document.querySelector('[data-cv]'), profile.cv, 'cv');
}

function renderGallery() {
  if (!content?.gallery) return;
  document.querySelector('[data-gallery-intro]').textContent = content.gallery.intro;
  const gallery = document.querySelector('[data-gallery]');
  gallery.replaceChildren();
  const items = Array.isArray(content.gallery.items) ? content.gallery.items : [];
  if (!items.length) {
    gallery.append(makeElement('p', 'collection-empty', 'Photographs will be added here when they are ready to share.'));
    return;
  }
  items.forEach((item) => {
    const figure = makeElement('figure', 'photo');
    const image = new Image();
    image.src = item.image;
    image.alt = item.alt;
    image.loading = 'lazy';
    figure.append(image);
    installImageFallback(image, figure, `${item.title} — image unavailable`);
    if (item.placeholder) figure.append(makeElement('span', 'placeholder-badge', 'Placeholder'));
    const caption = makeElement('figcaption');
    caption.append(makeElement('strong', '', item.title), makeElement('span', '', item.caption));
    figure.append(caption);
    gallery.append(figure);
  });
}

function makeAchievementCard(item, clone = false) {
  const card = makeElement('a', 'achievement-card');
  card.href = `achievement.html?id=${encodeURIComponent(item.id)}`;
  const meta = makeElement('p', 'card-meta');
  meta.append(makeElement('span', '', `${item.category} · ${item.year}`));
  if (item.placeholder) meta.append(makeElement('span', 'sample-label', 'Demo'));
  card.append(meta, makeElement('h3', '', item.title), makeElement('p', '', item.summary));
  if (clone) { card.setAttribute('aria-hidden', 'true'); card.tabIndex = -1; }
  return card;
}

function setupCarousel() {
  const root = document.querySelector('[data-carousel]');
  if (!root) return;
  const items = Array.isArray(content?.achievements) ? content.achievements : [];
  const track = root.querySelector('[data-achievement-track]');
  const controls = root.querySelector('[data-carousel-controls]');
  if (!items.length) {
    root.classList.add('is-empty');
    track.replaceChildren(makeElement('p', 'collection-empty rail-empty', 'Achievement notes will appear here as the archive grows.'));
    controls.hidden = true;
    controls.querySelectorAll('button').forEach((button) => { button.disabled = true; });
    return;
  }
  root.classList.remove('is-empty');
  controls.hidden = false;
  controls.querySelectorAll('button').forEach((button) => { button.disabled = false; });
  const status = root.querySelector('[data-carousel-status]');
  const pauseButton = root.querySelector('[data-pause]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 1;
  let timer;
  let userPaused = false;
  let interactionPaused = false;
  let moving = false;
  const step = 222;

  track.replaceChildren(makeAchievementCard(items.at(-1), true), ...items.map((item) => makeAchievementCard(item)), makeAchievementCard(items[0], true));
  const realCards = [...track.querySelectorAll('.achievement-card:not([aria-hidden="true"])')];

  function syncCardTabStops() {
    const safeIndex = (index - 1 + items.length) % items.length;
    realCards.forEach((card, cardIndex) => { card.tabIndex = reducedMotion.matches || cardIndex === safeIndex ? 0 : -1; });
  }

  function update(animated = true, announce = true) {
    syncCardTabStops();
    if (reducedMotion.matches) {
      track.style.transform = '';
      const safeIndex = (index - 1 + items.length) % items.length;
      track.children[safeIndex + 1]?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    } else {
      track.classList.toggle('no-transition', !animated);
      track.style.transform = `translateY(${-index * step}px)`;
    }
    if (announce) {
      const safeIndex = (index - 1 + items.length) % items.length;
      status.textContent = `${items[safeIndex].title}, ${safeIndex + 1} of ${items.length}`;
    }
  }

  function restartTimer() {
    window.clearInterval(timer);
    if (!userPaused && !interactionPaused && !reducedMotion.matches) timer = window.setInterval(() => move(1, false), 4500);
  }
  function move(direction, announce = true) {
    if (moving && !reducedMotion.matches) return;
    moving = !reducedMotion.matches;
    index += direction;
    update(true, announce);
    restartTimer();
  }

  track.addEventListener('transitionend', () => {
    moving = false;
    if (index === items.length + 1) index = 1;
    else if (index === 0) index = items.length;
    else return;
    update(false, false);
    window.requestAnimationFrame(() => track.classList.remove('no-transition'));
  });
  root.querySelector('[data-previous]').addEventListener('click', () => move(-1));
  root.querySelector('[data-next]').addEventListener('click', () => move(1));
  pauseButton.addEventListener('click', () => {
    userPaused = !userPaused;
    pauseButton.setAttribute('aria-pressed', String(userPaused));
    pauseButton.textContent = userPaused ? 'Play' : 'Pause';
    status.textContent = userPaused ? 'Automatic movement paused' : 'Automatic movement resumed';
    restartTimer();
  });
  root.addEventListener('pointerenter', () => { interactionPaused = true; restartTimer(); });
  root.addEventListener('pointerleave', () => { interactionPaused = false; restartTimer(); });
  root.addEventListener('focusin', () => { interactionPaused = true; restartTimer(); });
  root.addEventListener('focusout', (event) => {
    if (!root.contains(event.relatedTarget)) { interactionPaused = false; restartTimer(); }
  });
  reducedMotion.addEventListener?.('change', () => { moving = false; update(false, false); restartTimer(); });
  update(false, false);
  restartTimer();
}

function renderNotFound(container) {
  const block = makeElement('div', 'not-found');
  block.append(makeElement('p', 'eyebrow', 'Archive note'), makeElement('h1', '', 'That story is not here.'), makeElement('p', '', 'The achievement ID may be missing, outdated, or mistyped. The rest of the archive is still waiting for you.'));
  const home = makeElement('a', 'ink-link', 'Return to achievements');
  home.href = 'index.html#achievements';
  block.append(home);
  container.replaceChildren(block);
  document.title = `Achievement not found — ${content?.profile?.name || 'AnNT'}`;
}

function renderAchievementDetail() {
  const container = document.querySelector('[data-achievement-detail]');
  if (!container || !content?.achievements) return;
  const id = new URLSearchParams(window.location.search).get('id');
  const item = content.achievements.find((entry) => entry.id === id);
  if (!item) { renderNotFound(container); return; }
  const visual = makeElement('figure', 'detail-visual');
  const image = new Image();
  image.src = item.image;
  image.alt = item.imageAlt;
  visual.append(image);
  installImageFallback(image, visual, `${item.title} — image unavailable`);
  const copy = makeElement('div', 'detail-copy');
  copy.append(makeElement('p', 'eyebrow', `${item.category} · ${item.year}${item.placeholder ? ' · demo content' : ''}`), makeElement('h1', '', item.title), makeElement('p', 'detail-summary', item.summary), makeElement('p', 'detail-story', item.story));
  const facts = makeElement('ul', 'facts');
  (Array.isArray(item.facts) ? item.facts : []).forEach((fact) => facts.append(makeElement('li', '', fact)));
  copy.append(facts);
  const links = makeElement('div', 'detail-links');
  (Array.isArray(item.links) ? item.links : []).forEach((itemLink) => {
    const link = makeElement('a', 'ink-link', itemLink.label);
    link.href = itemLink.url;
    if (/^https?:/.test(itemLink.url)) { link.target = '_blank'; link.rel = 'noreferrer'; }
    links.append(link);
  });
  const back = makeElement('a', 'ink-link', '← Back to archive');
  back.href = 'index.html#achievements';
  links.append(back);
  copy.append(links);
  container.replaceChildren(visual, copy);
  document.title = `${item.title} — ${content?.profile?.name || 'AnNT'}`;
}

renderIdentity();
if (document.body.dataset.page === 'home') {
  renderProfile();
  renderGallery();
  setupCarousel();
} else if (document.body.dataset.page === 'achievement') {
  renderAchievementDetail();
}
