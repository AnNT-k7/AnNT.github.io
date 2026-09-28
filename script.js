const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobileBreakpoint = window.matchMedia('(max-width: 900px)');
let menuWasOpened = false;

document.querySelector('[data-year]').textContent = new Date().getFullYear();

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 24);
}, { passive: true });

function setMenu(open, restoreFocus = false) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
  navigation.classList.toggle('open', open);
  document.body.style.overflow = open && mobileBreakpoint.matches ? 'hidden' : '';
  if (open) {
    menuWasOpened = true;
    navigation.querySelector('a').focus();
  } else if (restoreFocus && menuWasOpened) {
    menuButton.focus();
  }
}

menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  setMenu(false);
}));

document.addEventListener('keydown', (event) => {
  if (menuButton.getAttribute('aria-expanded') !== 'true') return;
  if (event.key === 'Escape') {
    setMenu(false, true);
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...navigation.querySelectorAll('a')];
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

mobileBreakpoint.addEventListener('change', (event) => {
  if (!event.matches) setMenu(false);
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  revealObserver.observe(element);
});

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll('.main-nav a').forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-35% 0px -55%', threshold: 0 });

document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));

if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  const glow = document.querySelector('.cursor-glow');
  window.addEventListener('pointermove', (event) => {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  }, { passive: true });
}

const canvas = document.querySelector('#energy-field');
const context = canvas.getContext('2d');
let particles = [];
let animationFrame;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const bounds = canvas.getBoundingClientRect();
  canvas.width = bounds.width * ratio;
  canvas.height = bounds.height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  particles = Array.from({ length: Math.min(42, Math.floor(bounds.width / 24)) }, () => ({
    x: Math.random() * bounds.width,
    y: Math.random() * bounds.height,
    radius: Math.random() * 1.4 + 0.3,
    speed: Math.random() * 0.22 + 0.08,
    drift: Math.random() * 0.18 - 0.09,
    alpha: Math.random() * 0.45 + 0.08
  }));
}

function drawEnergy() {
  const bounds = canvas.getBoundingClientRect();
  context.clearRect(0, 0, bounds.width, bounds.height);
  particles.forEach((particle) => {
    particle.y -= particle.speed;
    particle.x += particle.drift;
    if (particle.y < -5) particle.y = bounds.height + 5;
    if (particle.x < -5) particle.x = bounds.width + 5;
    if (particle.x > bounds.width + 5) particle.x = -5;
    context.beginPath();
    context.fillStyle = `rgba(231, 50, 50, ${particle.alpha})`;
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fill();
  });
  animationFrame = requestAnimationFrame(drawEnergy);
}

resizeCanvas();
if (!reduceMotion) drawEnergy();
window.addEventListener('resize', resizeCanvas, { passive: true });
window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame));
