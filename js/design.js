/* Design Work page: grid launches + campaign slider (from content/design.txt)
   and the yearbook flipbook (StPageFlip, js/vendor/page-flip.browser.js). */

const DESIGN_DIR = 'assets/design/';
const CAN_HOVER = matchMedia('(hover: hover)').matches;

/* ---------- grids & campaigns ---------- */
(async () => {
  const grids = document.getElementById('grids');
  const track = document.getElementById('campaigns');
  let items;
  try { items = parseBlocks(await loadText('content/design.txt')); }
  catch (err) { return loadError(grids, 'content/design.txt', err); }

  const pieces = items.filter(i => i.images?.length);
  const gridItems = pieces.filter(i => i.type === 'grid');
  const campaigns = pieces.filter(i => i.type !== 'grid');

  grids.innerHTML = gridItems.map(g => {
    const src = DESIGN_DIR + g.images[0];
    return `
      <article class="ig-grid glass reveal-on-scroll">
        <div class="ig-tiles" role="button" tabindex="0" aria-label="Enlarge ${esc(g.title)}">
          ${`<div class="ig-tile" style="background-image:url('${esc(src)}')"></div>`.repeat(3)}
        </div>
        <div class="ig-caption">
          <h3>${esc(g.title)} <span class="chip orange">${esc(g.when || '')}</span></h3>
          <p>${esc(g.description || '')}</p>
        </div>
      </article>`;
  }).join('');

  grids.querySelectorAll('.ig-grid').forEach((card, i) => {
    const g = gridItems[i];
    const open = () => lightbox.open([{ src: DESIGN_DIR + g.images[0], caption: g.title }]);
    const tiles = card.querySelector('.ig-tiles');
    tiles.addEventListener('click', open);
    tiles.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    if (CAN_HOVER) {
      card.addEventListener('mouseenter', () => card.classList.add('split'));
      card.addEventListener('mouseleave', () => card.classList.remove('split'));
      tiles.addEventListener('focus', () => card.classList.add('split'));
      tiles.addEventListener('blur', () => card.classList.remove('split'));
    }
  });
  // Touch screens: split each grid while it's in the middle of the screen.
  if (!CAN_HOVER && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('split', e.isIntersecting)),
      { rootMargin: '-30% 0px -30% 0px' });
    grids.querySelectorAll('.ig-grid').forEach(el => io.observe(el));
  }

  track.innerHTML = campaigns.map(c => `
    <button class="campaign" type="button" aria-label="${esc(c.title)} — open gallery">
      <img src="${esc(DESIGN_DIR + c.images[0])}" alt="" loading="lazy">
      ${c.images.length > 1 ? `<span class="chip count">${c.images.length} pieces</span>` : ''}
      <span class="reveal">
        <span class="when">${esc(c.when || '')}</span>
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.description || '')}</p>
      </span>
    </button>`).join('');
  track.querySelectorAll('.campaign').forEach((btn, i) => btn.addEventListener('click', () => {
    const c = campaigns[i];
    lightbox.open(c.images.map((img, n) => ({ src: DESIGN_DIR + img, caption: `${c.title} · ${n + 1}/${c.images.length}` })));
  }));

  const step = () => (track.querySelector('.campaign')?.offsetWidth || 300) + 18;
  document.getElementById('prev').onclick = () => track.scrollBy({ left: -step(), behavior: 'smooth' });
  document.getElementById('next').onclick = () => track.scrollBy({ left: step(), behavior: 'smooth' });

  revealOnScroll(grids);
})();

/* ---------- yearbook flipbook ---------- */
(() => {
  const book = document.getElementById('book');
  const label = document.getElementById('yb-label');
  const loading = document.getElementById('flip-loading');
  if (!window.St?.PageFlip) { loading.textContent = 'The yearbook viewer failed to load.'; return; }

  // assets/yearbook: cover-front.jpg, page-002.jpg … page-137.jpg, cover-back.jpg
  // (PDF page 1 was the wraparound cover, split into front/back.)
  // Like the printed book, the inside of the front cover is blank, so spreads are
  // [blank | 1], [2 | 3], [4 | 5]… — num = the number printed on each page (PDF page − 1).
  const LAST_PDF_PAGE = 137;
  const pages = [{ file: 'cover-front.jpg' }, { blank: true }];
  for (let p = 2; p <= LAST_PDF_PAGE; p++) pages.push({ file: `page-${String(p).padStart(3, '0')}.jpg`, num: p - 1 });
  if (pages.length % 2 === 0) pages.push({ blank: true }); // so the back cover ends up alone (total must be even)
  pages.push({ file: 'cover-back.jpg' });

  book.innerHTML = pages.map((pg, i) => {
    if (pg.blank) return '<div class="page blank"></div>';
    const hard = i === 0 || i === pages.length - 1 ? ' data-density="hard"' : '';
    const alt = pg.num ? `Yearbook page ${pg.num}` : i === 0 ? 'Yearbook front cover' : 'Yearbook back cover';
    return `<div class="page"${hard}><img data-src="assets/yearbook/${pg.file}" alt="${alt}" draggable="false"></div>`;
  }).join('');
  const imgs = [...book.querySelectorAll('.page')].map(el => el.querySelector('img'));

  // Only load pages near the one being viewed (the full book is ~22 MB).
  function loadNear(i) {
    for (let j = Math.max(0, i - 2); j <= Math.min(imgs.length - 1, i + 5); j++) {
      if (imgs[j] && !imgs[j].src) imgs[j].src = imgs[j].dataset.src;
    }
  }

  const pageFlip = new St.PageFlip(book, {
    width: 450, height: 579,          // one page, matches the yearbook's 630×810 pt proportions
    size: 'stretch',
    minWidth: 220, maxWidth: 520,
    minHeight: 283, maxHeight: 669,
    showCover: true,
    maxShadowOpacity: 0.35,
    mobileScrollSupport: true,
    flippingTime: 800,
  });
  loadNear(0);
  pageFlip.loadFromHTML(book.querySelectorAll('.page'));
  loading.remove();

  // Label = the printed page numbers in view; blank pages are skipped.
  function pageLabel(i) {
    const n = pageFlip.getPageCount();
    if (i <= 0) return 'Cover';
    if (i >= n - 1) return 'Back cover';
    const left = i % 2 ? i : i - 1;  // spreads after the cover are (1,2), (3,4)…
    const nums = (pageFlip.getOrientation() === 'portrait' ? [pages[i]] : [pages[left], pages[left + 1]])
      .map(pg => pg.num).filter(Boolean);
    return nums.length === 2 ? `Pages ${nums[0]}–${nums[1]}` : nums.length ? `Page ${nums[0]}` : '';
  }
  const update = i => { label.textContent = pageLabel(i); loadNear(i); };
  pageFlip.on('flip', e => update(e.data));
  pageFlip.on('changeOrientation', () => update(pageFlip.getCurrentPageIndex()));
  update(0);

  document.getElementById('yb-prev').onclick = () => pageFlip.flipPrev();
  document.getElementById('yb-next').onclick = () => pageFlip.flipNext();
  document.addEventListener('keydown', e => {
    if (document.querySelector('dialog[open]') || e.target.closest('input, textarea')) return;
    const r = book.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return; // only when the book is on screen
    if (e.key === 'ArrowRight') pageFlip.flipNext();
    if (e.key === 'ArrowLeft') pageFlip.flipPrev();
  });

  // Self-check of the pairing rule (logs only on failure).
  console.assert(pages[1].blank && pages[2].num === 1 && pages[3].num === 2 && pages[4].num === 3 && pages.length % 2 === 0,
    'yearbook: expected [blank | 1], [2 | 3]… and an even page count');
})();
