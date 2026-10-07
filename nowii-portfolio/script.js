const intro = document.getElementById('intro');
const progressBar = document.getElementById('introProgress');
const progressText = document.getElementById('introPercent');
const toast = document.getElementById('toast');
const roleText = document.getElementById('roleText');
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
const availabilityButton = document.getElementById('availabilityButton');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Premium opening sequence — short, intentional and skippable by reduced-motion preference.
let progress = 0;
const introTimer = setInterval(() => {
  progress += Math.ceil((100 - progress) / 10);
  progress = Math.min(progress, 100);
  progressBar.style.width = `${progress}%`;
  progressText.textContent = `${progress}%`;

  if (progress >= 100) {
    clearInterval(introTimer);
    setTimeout(() => intro.classList.add('is-done'), reducedMotion ? 0 : 360);
  }
}, reducedMotion ? 1 : 28);

// Scroll reveal.
const revealItems = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12 });
revealItems.forEach((item) => revealObserver.observe(item));

// Active navigation.
const navLinks = [...document.querySelectorAll('.nav-link')];
const sections = [...document.querySelectorAll('main section[id]')];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-38% 0px -52% 0px', threshold: 0 });
sections.forEach((section) => sectionObserver.observe(section));

// Typewriter / rotating role line beneath the hero title.
const roles = [
  'React interfaces',
  'interactive websites',
  'Python automation',
  'AI-assisted tools',
  'security experiments',
  'products with personality'
];
let roleIndex = 0;
let roleTimer;
let typingTimer;

function typeRole(text, onDone) {
  let index = 0;
  roleText.textContent = '';
  clearInterval(typingTimer);
  typingTimer = setInterval(() => {
    roleText.textContent = text.slice(0, index + 1);
    index += 1;
    if (index >= text.length) {
      clearInterval(typingTimer);
      setTimeout(onDone, reducedMotion ? 500 : 1800);
    }
  }, reducedMotion ? 0 : 48);
}

function startRoles() {
  if (!roleText) return;
  const next = () => {
    roleIndex = (roleIndex + 1) % roles.length;
    typeRole(roles[roleIndex], next);
  };
  typeRole(roles[roleIndex], next);
}
setTimeout(startRoles, reducedMotion ? 0 : 700);

// Pointer glow / subtle 3D interaction.
if (window.matchMedia('(pointer:fine)').matches) {
  window.addEventListener('pointermove', (event) => {
    cursorDot.style.left = `${event.clientX}px`;
    cursorDot.style.top = `${event.clientY}px`;
    cursorRing.style.left = `${event.clientX}px`;
    cursorRing.style.top = `${event.clientY}px`;
  });

  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * 4.5;
      const rotateY = (x - 0.5) * 6;
      card.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

// Animated stat, with a sane fallback when the GitHub API is unavailable.
const countElements = document.querySelectorAll('[data-count]');
const countObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    const target = Number(element.dataset.count || 0);
    const start = performance.now();
    const duration = reducedMotion ? 1 : 950;
    const animate = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      element.textContent = String(Math.round(target * eased)).padStart(2, '0');
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    observer.unobserve(element);
  });
}, { threshold: 0.8 });
countElements.forEach((el) => countObserver.observe(el));

// Toast / copy Discord handle.
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1700);
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
  showToast(`${value} copied — Discord`);
}

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', () => copyText(button.dataset.copy));
});

availabilityButton?.addEventListener('click', () => {
  document.getElementById('contact')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  showToast('Scroll down — let’s build something great.');
});

// GitHub profile data. The page still works perfectly when the API is blocked/offline.
fetch('https://api.github.com/users/nowii-core', { headers: { Accept: 'application/vnd.github+json' } })
  .then((response) => response.ok ? response.json() : Promise.reject(new Error('GitHub API unavailable')))
  .then((data) => {
    if (Number.isFinite(data.public_repos)) {
      const repo = document.getElementById('repoCount');
      if (repo) {
        repo.dataset.count = String(data.public_repos);
        repo.textContent = String(data.public_repos).padStart(2, '0');
      }
    }
  })
  .catch(() => {});
