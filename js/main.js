/* Shared code for every page: window chrome, footer, transitions,
   text-file parsing, lightbox and scroll reveals. */

const CONTACT = {
  email: 'camilaicruz08@gmail.com',
  phone: '787-438-5330',
  github: 'github.com/camilaicruz',
  linkedin: 'linkedin.com/in/camila-cruz-730a8838b',
  linktree: 'linktr.ee/camilaicruz08',
};

const PAGES = [
  { id: 'about', href: 'about.html', title: 'About Me' },
  { id: 'projects', href: 'projects.html', title: 'Technical Projects' },
  { id: 'design', href: 'design.html', title: 'Design Work' },
  { id: 'contact', href: 'contact.html', title: 'Contact' },
];

const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- tiny inline icon set (stroke icons, 24x24) ---------- */
const ICONS = {
  mail: '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',
  phone: '<path d="M6.6 3.5 9 3l1.6 4-2 1.3a11 11 0 0 0 7 7l1.3-2 4 1.6-.4 2.5a2 2 0 0 1-2 1.6A16 16 0 0 1 5 5.5a2 2 0 0 1 1.6-2Z"/>',
  github: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
  linkedin: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 10.5V16M8 7.5v.01M11.5 16v-5.5M11.5 13c0-1.7 1-2.6 2.3-2.6s2.2.9 2.2 2.6v3"/>',
  linktree: '<path d="M12 21v-8M12 13 6 7M12 13l6-6M12 9V3M7 12H3.5M20.5 12H17"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.3-1-1.6-1-2.6 0-.9.7-1.5 1.7-1.5H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  arrow: '<path d="M7 17 17 7M9 7h8v8"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 18 5-5 4 4 3-3 4 4"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
  pin: '<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11Z"/><circle cx="12" cy="10" r="2"/>',
  cap: '<path d="m2 9 10-5 10 5-10 5Z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>',
  bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6Z"/>',
  award: '<circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7"/>',
  code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4"/>',
  cube: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
};
function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}
// Fill any <span data-icon="name"></span> placeholders in static HTML.
function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- window chrome for inner pages ---------- */
function buildWindowBar() {
  const win = document.querySelector('.window');
  if (!win) return;
  const current = document.body.dataset.page;
  const page = PAGES.find(p => p.id === current);
  const bar = document.createElement('header');
  bar.className = 'window-bar';
  bar.innerHTML = `
    <div class="lights">
      <a class="light close" href="index.html" aria-label="Close window and return to desktop">${icon('close')}</a>
      <span class="light min" aria-hidden="true"></span>
      <span class="light max" aria-hidden="true"></span>
    </div>
    <span class="window-title">${esc(page ? page.title : '')}</span>
    <nav class="tabs" aria-label="Pages">
      ${PAGES.map(p => `<a href="${p.href}"${p.id === current ? ' aria-current="page"' : ''}>${p.title}</a>`).join('')}
    </nav>`;
  win.prepend(bar);
  const tabs = bar.querySelector('.tabs'), active = tabs.querySelector('[aria-current]');
  if (active) tabs.scrollLeft = active.offsetLeft - (tabs.clientWidth - active.offsetWidth) / 2; // phones: keep current tab visible

  // Close button: shrink the window, then go back to the desktop.
  bar.querySelector('.close').addEventListener('click', e => {
    if (REDUCED_MOTION) return;
    e.preventDefault();
    win.classList.add('closing');
    setTimeout(() => { location.href = 'index.html'; }, 340);
  });
  bar.querySelectorAll('.tabs a').forEach(a => a.addEventListener('click', () => {
    try { sessionStorage.setItem('nav', 'tab'); } catch {}
  }));
}

// Pick the entrance animation: full "window open", unless we arrived from a tab
// or from a desktop icon (whose launch animation already "opened" the window).
function entrance() {
  let nav = null;
  try { nav = sessionStorage.getItem('nav'); sessionStorage.removeItem('nav'); } catch {}
  document.body.classList.add(nav === 'tab' ? 'enter-tab' : 'enter-open');
}

/* ---------- footer on every page ---------- */
function buildFooter() {
  const f = document.createElement('footer');
  f.className = 'site-footer glass';
  f.innerHTML = `
    <span>© ${new Date().getFullYear()} Camila I. Cruz</span>
    <ul>
      <li><a href="mailto:${CONTACT.email}">${icon('mail')}${CONTACT.email}</a></li>
      <li><a href="tel:+1${CONTACT.phone.replace(/\D/g, '')}">${icon('phone')}${CONTACT.phone}</a></li>
      <li><a href="https://${CONTACT.github}" target="_blank" rel="noopener">${icon('github')}GitHub</a></li>
      <li><a href="https://${CONTACT.linkedin}" target="_blank" rel="noopener">${icon('linkedin')}LinkedIn</a></li>
      <li><a href="https://${CONTACT.linktree}" target="_blank" rel="noopener">${icon('linktree')}Linktree</a></li>
    </ul>`;
  document.body.append(f);
}

/* ---------- text-file loading & parsing ---------- */
async function loadText(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.text();
}

// Shown when a content file can't be fetched (usually: opened via file://).
function loadError(el, file, err) {
  console.error(err);
  const local = location.protocol === 'file:';
  el.innerHTML = `<div class="notice">Couldn't load <code>${esc(file)}</code>.
    ${local ? 'Browsers block reading files when a page is opened directly from disk — preview the site with a local server instead (see CLAUDE.md).' : 'Check that the file exists and the name is spelled correctly.'}</div>`;
}

/* "Blocks" format, used by licenses.txt and design.txt:
     key: value lines, blocks separated by a line of ---,
     lines starting with # are comments. Repeated keys (like image:) become arrays. */
function parseBlocks(text) {
  return text.split(/^\s*---\s*$/m).map(chunk => {
    const block = {};
    for (const raw of chunk.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const m = line.match(/^([\w-]+)\s*:\s*(.*)$/);
      if (!m) continue;
      const key = m[1].toLowerCase();
      if (key === 'image') (block.images ??= []).push(m[2]);
      else block[key] = m[2];
    }
    return block;
  }).filter(b => Object.keys(b).length);
}

// "file.jpg | caption" → { src, caption }
function splitCaption(value) {
  const [src, ...rest] = value.split('|');
  return { src: src.trim(), caption: rest.join('|').trim() };
}

/* ---------- media rendering with friendly placeholders ---------- */
function placeholderHTML(caption, kind = 'image') {
  return `<div class="placeholder">${icon(kind)}<span>${esc(caption || 'Coming soon')}</span></div>`;
}
// If an image/video file doesn't exist yet, swap in a placeholder tile.
function mediaFallback(root) {
  root.querySelectorAll('img[data-fallback], video[data-fallback]').forEach(el => {
    const swap = () => {
      const target = el.closest('button.zoom') || el;
      target.outerHTML = placeholderHTML(el.dataset.fallback, el.tagName === 'VIDEO' ? 'video' : 'image');
    };
    if (el.tagName === 'IMG') { if (el.complete && !el.naturalWidth && el.src) swap(); else el.addEventListener('error', swap, { once: true }); }
    else el.querySelector('source')?.addEventListener('error', swap, { once: true });
  });
}

/* ---------- lightbox (native <dialog>) ---------- */
const lightbox = (() => {
  let dlg, items = [], index = 0;
  function ensure() {
    if (dlg) return;
    dlg = document.createElement('dialog');
    dlg.className = 'lightbox';
    dlg.innerHTML = `
      <figure><img alt=""><figcaption class="glass"></figcaption></figure>
      <button class="btn icon lb-close" aria-label="Close">${icon('close')}</button>
      <button class="btn icon lb-prev" aria-label="Previous image">${icon('left')}</button>
      <button class="btn icon lb-next" aria-label="Next image">${icon('right')}</button>`;
    document.body.append(dlg);
    dlg.querySelector('.lb-close').onclick = () => dlg.close();
    dlg.querySelector('.lb-prev').onclick = () => show(index - 1);
    dlg.querySelector('.lb-next').onclick = () => show(index + 1);
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  }
  function show(i) {
    index = (i + items.length) % items.length;
    const { src, caption } = items[index];
    const img = dlg.querySelector('img');
    img.src = src; img.alt = caption || '';
    const cap = dlg.querySelector('figcaption');
    cap.textContent = caption || '';
    cap.hidden = !caption;
    const many = items.length > 1;
    dlg.querySelector('.lb-prev').hidden = !many;
    dlg.querySelector('.lb-next').hidden = !many;
  }
  return {
    open(list, start = 0) {
      ensure(); items = list; show(start);
      if (!dlg.open) dlg.showModal();
    },
  };
})();

/* ---------- scroll reveal ---------- */
function revealOnScroll(root = document) {
  const els = root.querySelectorAll('.reveal-on-scroll:not(.in)');
  if (REDUCED_MOTION || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

/* ---------- boot ---------- */
entrance();
buildWindowBar();
buildFooter();
hydrateIcons();
revealOnScroll();
