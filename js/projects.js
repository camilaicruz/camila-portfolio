/* Technical Projects page.
   projects/projects.txt lists project folders (one per line, in display order).
   Each folder has an info.txt — format documented in CLAUDE.md and at the top of each info.txt. */

// A line like "October 13: Made this CAD" (or "Oct 13, 2026: ...") starts a new update.
const UPDATE_HEADER = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(st|nd|rd|th)?(,?\s+\d{4})?\s*:/i;
const MEDIA_LINE = /^(photo|video)\s*:\s*(.+)$/i;

function parseProject(text) {
  const p = { meta: {}, summary: [], media: [], updates: [], writeup: [] };
  let section = null, update = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('#')) continue;

    const sec = line.match(/^\[(\w+)\]$/);
    if (sec) { section = sec[1].toLowerCase(); update = null; continue; }

    if (!section) { // header: key: value
      const m = line.match(/^([\w-]+)\s*:\s*(.*)$/);
      if (m) p.meta[m[1].toLowerCase()] = m[2];
      continue;
    }

    const media = line.match(MEDIA_LINE);
    if (section === 'updates') {
      if (UPDATE_HEADER.test(line)) {
        const i = line.indexOf(':');
        update = { date: line.slice(0, i).trim(), title: line.slice(i + 1).trim(), lines: [], media: [] };
        p.updates.push(update);
      } else if (update) {
        if (media) update.media.push({ type: media[1].toLowerCase(), ...splitCaption(media[2]) });
        else update.lines.push(line);
      }
    } else if (media) {
      p.media.push({ type: media[1].toLowerCase(), ...splitCaption(media[2]) });
    } else if (section === 'summary' || section === 'writeup') {
      p[section].push(line);
    }
  }
  return p;
}

// Lines → paragraphs (blank lines separate paragraphs).
function paragraphs(lines) {
  return lines.join('\n').split(/\n\s*\n/).map(s => s.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean)
    .map(s => `<p>${esc(s)}</p>`).join('');
}

function mediaHTML(items, folder, compact = false) {
  if (!items.length) return '';
  const url = src => /^https?:\/\//.test(src) ? src : folder + src;
  return `<div class="media-grid${compact ? ' compact' : ''}">${items.map(m => {
    const cap = m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : '';
    if (m.type === 'video') {
      return `<figure class="media"><video controls playsinline preload="metadata" data-fallback="${esc(m.caption || 'Video coming soon')}"><source src="${esc(url(m.src))}#t=0.1" type="video/mp4"></video>${cap}</figure>`;
    }
    return `<figure class="media"><button class="zoom" type="button" aria-label="Enlarge ${esc(m.caption || 'photo')}"><img src="${esc(url(m.src))}" alt="${esc(m.caption)}" loading="lazy" data-fallback="${esc(m.caption || 'Photo coming soon')}"></button>${cap}</figure>`;
  }).join('')}</div>`;
}

function renderProject(id, p) {
  const folder = `projects/${id}/`;
  const m = p.meta;
  const finished = /^(finished|done|complete)/i.test(m.status || '');
  const tags = (m.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const meta = [m.dates, m.role, m.team].filter(Boolean);

  let body;
  if (finished) {
    body = `<div class="prose">${paragraphs(p.writeup.length ? p.writeup : p.summary)}</div>${mediaHTML(p.media, folder)}`;
  } else {
    const updates = [...p.updates].reverse(); // file is written oldest → newest; show newest first
    body = `
      <div class="prose">${paragraphs(p.summary)}</div>
      ${mediaHTML(p.media, folder)}
      ${updates.length ? `
        <h3 style="margin-top:36px">Progress log</h3>
        <ol class="timeline">${updates.map(u => `
          <li class="update reveal-on-scroll">
            <time>${esc(u.date)}</time>
            <h3>${esc(u.title)}</h3>
            ${paragraphs(u.lines)}
            ${mediaHTML(u.media, folder, true)}
          </li>`).join('')}
        </ol>` : ''}`;
  }

  return `
    <article class="project glass reveal-on-scroll" id="${esc(id)}">
      <div class="project-head">
        <div>
          <h2>${esc(m.title || id)}</h2>
          ${m.tagline ? `<p class="tagline">${esc(m.tagline)}</p>` : ''}
        </div>
        <span class="chip status ${finished ? 'orange' : 'green'}"><span class="dot"></span>${finished ? 'Finished' : 'In progress'}</span>
      </div>
      <div class="project-meta">
        ${meta.map(x => `<span class="chip">${esc(x)}</span>`).join('')}
        ${tags.map(t => `<span class="chip green">${esc(t)}</span>`).join('')}
      </div>
      ${/^https?:\/\//.test(m.repo || '') ? `<p><a class="btn repo" href="${esc(m.repo)}" target="_blank" rel="noopener">${icon('github')}View code on GitHub</a></p>` : ''}
      ${body}
    </article>`;
}

function wireLightbox(root) {
  root.querySelectorAll('.media-grid').forEach(grid => {
    const buttons = [...grid.querySelectorAll('button.zoom')];
    buttons.forEach((b, i) => b.addEventListener('click', () => {
      const live = buttons.filter(x => x.isConnected); // skip any that became placeholders
      lightbox.open(live.map(x => ({ src: x.querySelector('img').src, caption: x.querySelector('img').alt })), live.indexOf(b));
    }));
  });
}

(async () => {
  const out = document.getElementById('projects');
  let ids;
  try {
    ids = (await loadText('projects/projects.txt')).split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#'));
  } catch (err) { return loadError(out, 'projects/projects.txt', err); }

  const results = await Promise.all(ids.map(id =>
    loadText(`projects/${id}/info.txt`).then(t => ({ id, p: parseProject(t) }), err => ({ id, err }))));

  out.innerHTML = results.map(r => r.err
    ? `<div class="project"><div class="notice">Couldn't load <code>projects/${esc(r.id)}/info.txt</code>.</div></div>`
    : renderProject(r.id, r.p)).join('');
  document.getElementById('jump').innerHTML = results.filter(r => !r.err)
    .map(r => `<a class="btn" href="#${esc(r.id)}">${esc(r.p.meta.title || r.id)}</a>`).join('');

  mediaFallback(out);
  wireLightbox(out);
  revealOnScroll(out);
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
})();
