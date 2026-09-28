document.documentElement.classList.add('js');

const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
const motionButton = document.querySelector('[data-motion]');
const progress = document.querySelector('[data-progress]');
const pointerOrb = document.querySelector('.pointer-orb');
const mobileViewport = window.matchMedia('(max-width: 900px)');
const systemReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(pointer: fine)');
let userMotionChoice = null;
let menuWasOpened = false;
let pointerTracking = false;

try {
  const storedMotionChoice = localStorage.getItem('annt-motion');
  if (storedMotionChoice === 'full' || storedMotionChoice === 'reduced') {
    userMotionChoice = storedMotionChoice;
  } else if (storedMotionChoice !== null) {
    localStorage.removeItem('annt-motion');
  }
} catch (error) {
  userMotionChoice = null;
}

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

function motionIsReduced() {
  return userMotionChoice === 'reduced' || (userMotionChoice === null && systemReducedMotion.matches);
}

function trackPointer(event) {
  pointerOrb.style.left = `${event.clientX}px`;
  pointerOrb.style.top = `${event.clientY}px`;
}

function syncPointerTracking() {
  const shouldTrack = finePointer.matches && !motionIsReduced();
  if (shouldTrack === pointerTracking) return;

  pointerTracking = shouldTrack;
  if (shouldTrack) {
    window.addEventListener('pointermove', trackPointer, { passive: true });
  } else {
    window.removeEventListener('pointermove', trackPointer);
    pointerOrb.style.removeProperty('left');
    pointerOrb.style.removeProperty('top');
  }
}

function updateMotionControl() {
  const reduced = motionIsReduced();
  document.documentElement.classList.toggle('reduce-motion', reduced);
  motionButton.setAttribute('aria-pressed', String(reduced));
  syncPointerTracking();
}

motionButton.addEventListener('click', () => {
  userMotionChoice = motionIsReduced() ? 'full' : 'reduced';
  try {
    localStorage.setItem('annt-motion', userMotionChoice);
  } catch (error) {
    // The preference still applies for this visit when storage is unavailable.
  }
  updateMotionControl();
});

function handleSystemMotionChange() {
  if (userMotionChoice === null) updateMotionControl();
}

if (typeof systemReducedMotion.addEventListener === 'function') {
  systemReducedMotion.addEventListener('change', handleSystemMotionChange);
} else {
  systemReducedMotion.addListener(handleSystemMotionChange);
}

updateMotionControl();

if (typeof finePointer.addEventListener === 'function') {
  finePointer.addEventListener('change', syncPointerTracking);
} else {
  finePointer.addListener(syncPointerTracking);
}

function updateScrollDetails() {
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  const amount = distance > 0 ? Math.min(Math.max(window.scrollY / distance, 0), 1) : 0;
  header.classList.toggle('scrolled', window.scrollY > 24);
  progress.style.transform = `scaleX(${amount})`;
}

window.addEventListener('scroll', updateScrollDetails, { passive: true });
window.addEventListener('resize', updateScrollDetails, { passive: true });
updateScrollDetails();

function setMenu(open, restoreFocus = false) {
  const isOpen = open && mobileViewport.matches;
  const isHidden = mobileViewport.matches && !isOpen;
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Đóng menu' : 'Mở menu');
  navigation.classList.toggle('open', isOpen);
  navigation.toggleAttribute('inert', isHidden);
  if (isHidden) navigation.setAttribute('aria-hidden', 'true');
  else navigation.removeAttribute('aria-hidden');
  document.body.style.overflow = isOpen ? 'hidden' : '';

  if (isOpen) {
    menuWasOpened = true;
    navigation.querySelector('a')?.focus();
  } else if (restoreFocus && menuWasOpened) {
    menuButton.focus();
  }
}

menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    const destination = document.querySelector(link.getAttribute('href'));
    setMenu(false);
    if (!destination) return;

    window.requestAnimationFrame(() => {
      const focusTarget = destination.querySelector('h1, h2') || destination;
      focusTarget.setAttribute('tabindex', '-1');
      focusTarget.focus({ preventScroll: true });
      focusTarget.addEventListener('blur', () => focusTarget.removeAttribute('tabindex'), { once: true });
    });
  });
});

document.addEventListener('keydown', (event) => {
  if (menuButton.getAttribute('aria-expanded') !== 'true') return;

  if (event.key === 'Escape') {
    setMenu(false, true);
    return;
  }

  if (event.key !== 'Tab') return;
  const focusable = [menuButton, ...navigation.querySelectorAll('a')];
  const first = focusable[0];
  const last = focusable.at(-1);

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

function handleViewportChange(event) {
  setMenu(false);
}

setMenu(false);

if (typeof mobileViewport.addEventListener === 'function') {
  mobileViewport.addEventListener('change', handleViewportChange);
} else {
  mobileViewport.addListener(handleViewportChange);
}

const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && !motionIsReduced()) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -5%' });

  revealItems.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 4, 3) * 65}ms`;
    revealObserver.observe(element);
  });
} else {
  revealItems.forEach((element) => element.classList.add('visible'));
}

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navigation.querySelectorAll('a').forEach((link) => {
        const isCurrent = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', isCurrent);
        if (isCurrent) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-35% 0px -55%', threshold: 0 });

  document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));
}
