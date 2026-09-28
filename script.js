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
  document.querySelectorAll('[data-name]').forEach((element) => { element.textContent = name; });
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

function sortAchievements(achievements) {
  return [...achievements].sort((a, b) => {
    const yearA = a.year === 'Next' ? 9999 : parseInt(a.year) || 0;
    const yearB = b.year === 'Next' ? 9999 : parseInt(b.year) || 0;
    return yearB - yearA;
  });
}

function makeAchievementCard(item) {
  const card = makeElement('a', 'achievement-card');
  card.href = `achievement.html?id=${encodeURIComponent(item.id)}`;
  const meta = makeElement('p', 'card-meta');
  const catYear = makeElement('div', 'card-category-year');
  catYear.append(
    makeElement('span', 'card-category', item.category),
    makeElement('span', 'card-year', item.year)
  );
  meta.append(catYear);
  if (item.placeholder) meta.append(makeElement('span', 'sample-label', 'Demo'));
  card.append(meta, makeElement('h3', '', item.title), makeElement('p', '', item.summary));
  return card;
}

function setupAchievements() {
  const list = document.getElementById('achievements-list');
  const scrollContainer = document.getElementById('achievements-scroll');
  const viewAllBtn = document.getElementById('view-all-btn');
  if (!list || !scrollContainer || !viewAllBtn) return;

  const allItems = Array.isArray(content?.achievements) ? content.achievements : [];
  if (!allItems.length) {
    list.append(makeElement('li', 'collection-empty rail-empty', 'Achievement notes will appear here as the archive grows.'));
    viewAllBtn.style.display = 'none';
    return;
  }

  const sorted = sortAchievements(allItems);
  const top5 = sorted.slice(0, 5);
  const remaining = sorted.slice(5);
  let showingAll = false;

  function renderCards(items) {
    list.replaceChildren(...items.map(item => makeAchievementCard(item)));
  }

  function duplicateForLoop() {
    const cards = [...list.children];
    cards.forEach(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.tabIndex = -1;
      list.appendChild(clone);
    });
  }

  function initScroll() {
    if (showingAll) return;
    const cards = [...list.children];
    if (cards.length <= 1) return;
    const cardHeight = cards[0].offsetHeight + 16;
    const totalHeight = cardHeight * cards.length;
    scrollContainer.style.setProperty('--scroll-distance', `${totalHeight}px`);
    scrollContainer.classList.add('is-scrolling');
    duplicateForLoop();
  }

  function showAll() {
    showingAll = true;
    scrollContainer.classList.remove('is-scrolling');
    renderCards(sorted);
    viewAllBtn.setAttribute('aria-expanded', 'true');
    viewAllBtn.querySelector('span').textContent = 'Show less';
  }

  function showTop5() {
    showingAll = false;
    renderCards(top5);
    initScroll();
    viewAllBtn.setAttribute('aria-expanded', 'false');
    viewAllBtn.querySelector('span').textContent = 'View all';
  }

  viewAllBtn.addEventListener('click', () => {
    if (showingAll) showTop5();
    else showAll();
  });

  renderCards(top5);
  initScroll();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotion.addEventListener?.('change', () => {
    if (reducedMotion.matches) {
      scrollContainer.classList.remove('is-scrolling');
      scrollContainer.style.overflowY = 'auto';
    } else if (!showingAll) {
      scrollContainer.style.overflowY = 'hidden';
      initScroll();
    }
  });
}

function renderNotFound(container) {
  const block = makeElement('div', 'not-found');
  block.append(
    makeElement('p', 'eyebrow', 'Archive note'),
    makeElement('h1', '', 'That story is not here.'),
    makeElement('p', '', 'The achievement ID may be missing, outdated, or mistyped. The rest of the archive is still waiting for you.')
  );
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
  copy.append(
    makeElement('p', 'eyebrow', `${item.category} · ${item.year}${item.placeholder ? ' · demo content' : ''}`),
    makeElement('h1', '', item.title),
    makeElement('p', 'detail-summary', item.summary),
    makeElement('p', 'detail-story', item.story)
  );

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
  setupAchievements();
} else if (document.body.dataset.page === 'achievement') {
  renderAchievementDetail();
}