/* Coming up (16 Oct 2026): anything that is only true for a while, from data/coming-up.json: events, notices,
   requests for help, and urgent messages. Each item shows from show_from until the day before hide_from (London).
   Current items appear in two places:
   - the homepage strip, at the foot of the prayer banner (.prayer-banner .container), one item at a time;
   - coming-up.html (#coming-up-root): the full post of each item that has one (text or a poster), at #<id>.
   Per item (all optional):
   - label: what the strip's tag says: "Coming up" (the default), "Notice", "Help needed" or "Important".
     While an Important item is current, the strip shows only Important items, first, in deep red.
   - line: the strip's short second line, word for word. Without it the strip says when in words relative to today
     ("This Sunday · 6–8pm", "On now", "Open until …") from starts / ends / time.
   - link: where tapping the strip goes. Absent: the item's full post. A URL ("tel:…", "contact.html", "https://…"):
     there, with link_label in place of "See details". null: nowhere (the line says it all).
   The homepage poster slot is separate: the weekly class posters, "Every week".
   Review aids: ?today=YYYY-MM-DD shows the site as on that date; ?all=1 treats every item as current;
   ?strip=gold|tag|green picks the strip's colouring (gold is the default); ?examples=notices|important shows the
   example notices in data/coming-up-examples.json (staging only). */
(() => {
    'use strict';

    const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

    function londonToday() {
        const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
        const v = Object.fromEntries(parts.map(p => [p.type, p.value]));
        return `${v.year}-${v.month}-${v.day}`;
    }

    const params = new URLSearchParams(window.location.search);
    const requested = params.get('today');
    const today = /^\d{4}-\d{2}-\d{2}$/.test(requested || '') ? requested : londonToday();
    const exampleSet = ['notices', 'important'].includes(params.get('examples')) ? params.get('examples') : '';
    const isCurrent = item => params.get('all') === '1' || ((!item.show_from || today >= item.show_from) && (!item.hide_from || today < item.hide_from));
    // Review links keep their review settings when they go to coming-up.html.
    const keepReview = url => {
        const kept = ['today', 'all', 'examples'].filter(key => params.has(key)).map(key => `${key}=${encodeURIComponent(params.get(key))}`).join('&');
        return kept ? url.replace(/(#|$)/, `?${kept}$1`) : url;
    };
    const postUrl = item => keepReview(`coming-up.html#${encodeURIComponent(item.id)}`);
    const hasPost = item => Boolean((item.text && item.text.length) || (item.poster && item.poster.url));

    // The strip's colouring: gold (a solid gold band along the foot of the prayer banner), tag (a solid gold
    // "Coming up" label on the green) or green (gold lettering on the green). Important items are always deep red.
    const TONES = ['gold', 'tag', 'green'];
    const stripTone = TONES.includes(params.get('strip')) ? params.get('strip') : 'gold';
    const labelOf = item => item.label || 'Coming up';
    const isImportant = item => labelOf(item) === 'Important';

    // ---------- When, in words ----------
    const DAY_MS = 86400000;
    const utc = iso => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
    const daysFromToday = iso => Math.round((utc(iso) - utc(today)) / DAY_MS);
    const format = options => iso => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...options }).format(utc(iso));
    const weekday = format({ weekday: 'long' });
    const longDay = format({ weekday: 'long', day: 'numeric', month: 'long' }); // Sunday 11 October
    const capitalise = text => text.charAt(0).toUpperCase() + text.slice(1);

    // "today", "tomorrow", "this Sunday" within the coming week, otherwise "Sunday 11 October".
    function dayInWords(iso) {
        const days = daysFromToday(iso);
        if (days === 0) return 'today';
        if (days === 1) return 'tomorrow';
        if (days > 1 && days < 7) return `this ${weekday(iso)}`;
        return longDay(iso);
    }

    // The strip's short line: the item's own line if it has one; otherwise from its dates. One day: starts. A run
    // of days: starts and ends. A deadline (questionnaire, appeal): ends only. Anything else uses the full when.
    function whenInWords(item) {
        if (item.line) return item.line;
        const time = item.time ? ` · ${item.time}` : '';
        if (item.starts && !item.ends) return capitalise(dayInWords(item.starts)) + time;
        if (item.starts && today < item.starts) return `Starts ${dayInWords(item.starts)}${time}`;
        if (item.starts) return `On now${time}`;
        if (item.ends) return daysFromToday(item.ends) < 7 ? `Closes ${dayInWords(item.ends)}` : `Open until ${longDay(item.ends)}`;
        return item.when || '';
    }

    // Where tapping the strip goes, and what the laptop strip calls it.
    function linkOf(item) {
        if (item.link === null) return null;
        if (typeof item.link === 'string' && item.link) return { href: item.link, label: item.link_label || 'See details', external: /^https?:/.test(item.link) };
        return hasPost(item) ? { href: postUrl(item), label: 'See details', external: false } : null;
    }

    // ---------- Homepage strip ----------
    // Several items fade from one to the next every ROTATE_MS; the strip keeps the height of its longest item (and
    // its tag the width of its longest label) so the page never jumps. Rotation stops while the pointer or keyboard
    // is on the strip, can be paused, and never starts for visitors who ask for less motion.
    const ROTATE_MS = 6000;
    const PAUSE_ICON = '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
    const PLAY_ICON = '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
    const CHEVRON = '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
    const ALERT_ICON = '<svg class="cu-label-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 7v6.2"/><circle cx="12" cy="16.6" r="0.6" fill="currentColor"/></svg>';

    function renderStrip(current) {
        // The Coming up page lists the posts themselves, so the strip would only repeat them there.
        if (document.getElementById('coming-up-root')) return;
        const container = document.querySelector('.prayer-banner .container');
        // While anything Important is current, the strip shows only that.
        const important = current.filter(isImportant);
        const items = important.length ? important : current;
        if (!container || !items.length) return;
        const many = items.length > 1;
        const tone = important.length ? 'important' : stripTone;
        const slides = items.map((item, i) => {
            const link = linkOf(item);
            const when = whenInWords(item);
            const label = many ? ` aria-label="${escape(`${i + 1} of ${items.length}. ${labelOf(item)}: ${item.title}${when ? `, ${when}` : ''}.${link ? ` ${link.label}.` : ''}`)}"` : '';
            // An item that goes somewhere shows a small button ("See details ›") at the end of its second line.
            // The default reads "See details" on laptops and "Details" on phones, where width is short.
            const words = link && link.label === 'See details' ? '<span class="cu-more-long">See details</span><span class="cu-more-short">Details</span>' : escape(link ? link.label : '');
            const more = link ? `<span class="cu-more">${words}${CHEVRON}</span>` : '';
            const body = `
                        <span class="visually-hidden">${escape(labelOf(item))}: </span><span class="cu-title">${escape(item.title)}</span>
                        ${when || more ? `<span class="cu-when">${when ? `<span class="cu-when-text">${escape(when)}</span>` : ''}${more}</span>` : ''}`;
            const active = i === 0 ? ' is-active' : '';
            return link
                ? `
                    <a class="cu-item${active}" href="${escape(link.href)}"${link.external ? ' target="_blank" rel="noopener"' : ''} data-id="${escape(item.id)}"${label}>${body}
                    </a>`
                : `
                    <div class="cu-item${active}" data-id="${escape(item.id)}"${many ? ' role="group"' : ''}${label}>${body}
                    </div>`;
        }).join('');
        const tags = items.map((item, i) => `<span class="cu-label${i === 0 ? ' is-active' : ''}">${isImportant(item) ? ALERT_ICON : ''}${escape(labelOf(item))}</span>`).join('');
        const controls = many ? `
                <div class="cu-controls">
                    <span class="cu-dots">${items.map((item, i) => `<button type="button" class="cu-dot" data-index="${i}" aria-label="Show ${escape(item.title)}" aria-pressed="${i === 0}"></button>`).join('')}</span>
                    <button type="button" class="cu-pause" aria-label="Pause">${PAUSE_ICON}</button>
                </div>` : '';
        container.insertAdjacentHTML('beforeend', `
            <section class="prayer-coming-up strip-${tone}${many ? ' is-rotating' : ''}" aria-label="${important.length ? 'Important' : 'Coming up and notices'}"${many ? ' aria-roledescription="carousel"' : ''}>
                <span class="cu-eyebrow" aria-hidden="true">${tags}</span>
                <div class="cu-stack" aria-live="${many ? 'off' : 'polite'}">${slides}
                </div>${controls}
            </section>`);
        const strip = container.lastElementChild;
        // A full-width band (gold, or red for Important) meets the hero, so the prayer banner drops its bottom padding.
        container.closest('.prayer-banner').classList.toggle('has-gold-strip', tone === 'gold' || tone === 'important');
        // On a slow connection the list can arrive after the page has appeared: the strip then slides open rather
        // than jumping in. Arriving in time (the usual case), it is simply there.
        const painted = performance.getEntriesByType('paint').some(entry => entry.name === 'first-contentful-paint');
        if (painted && typeof strip.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const end = getComputedStyle(strip);
            const to = { height: `${strip.offsetHeight}px`, marginTop: end.marginTop, paddingTop: end.paddingTop, paddingBottom: end.paddingBottom, opacity: 1 };
            strip.style.overflow = 'hidden';
            strip.animate([{ height: '0px', marginTop: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0 }, to], { duration: 320, easing: 'ease-out' })
                .finished.then(() => strip.style.removeProperty('overflow'), () => strip.style.removeProperty('overflow'));
        }
        // The hero sizes itself to the first screen; let it re-measure now the strip is in place.
        window.dispatchEvent(new Event('resize'));

        if (!many) return;

        const slidesEls = [...strip.querySelectorAll('.cu-item')];
        const labels = [...strip.querySelectorAll('.cu-label')];
        const dots = [...strip.querySelectorAll('.cu-dot')];
        const pause = strip.querySelector('.cu-pause');
        const stack = strip.querySelector('.cu-stack');
        let index = 0;
        let timer = 0;
        let holding = false; // pointer or keyboard focus is on the strip
        let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const show = next => {
            index = (next + slidesEls.length) % slidesEls.length;
            slidesEls.forEach((el, i) => el.classList.toggle('is-active', i === index));
            labels.forEach((el, i) => el.classList.toggle('is-active', i === index));
            dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === index)));
        };
        const stop = () => { window.clearInterval(timer); timer = 0; };
        const run = () => { stop(); if (!paused && !holding && !document.hidden) timer = window.setInterval(() => show(index + 1), ROTATE_MS); };
        const setPaused = value => {
            paused = value;
            pause.innerHTML = value ? PLAY_ICON : PAUSE_ICON;
            pause.setAttribute('aria-label', value ? 'Play' : 'Pause');
            stack.setAttribute('aria-live', value ? 'polite' : 'off');
            run();
        };
        dots.forEach(dot => dot.addEventListener('click', () => { show(Number(dot.dataset.index)); run(); }));
        pause.addEventListener('click', () => setPaused(!paused));
        strip.addEventListener('mouseenter', () => { holding = true; stop(); });
        strip.addEventListener('mouseleave', () => { holding = strip.contains(document.activeElement); run(); });
        strip.addEventListener('focusin', () => { holding = true; stop(); });
        strip.addEventListener('focusout', event => { if (!strip.contains(event.relatedTarget)) { holding = false; run(); } });
        document.addEventListener('visibilitychange', run);
        setPaused(paused);
    }

    // ---------- coming-up.html ----------
    function renderPage(current) {
        const root = document.getElementById('coming-up-root');
        if (!root) return;
        // "Back to home" keeps a review link's settings, so the homepage shows the same day.
        document.querySelectorAll('.page-back-link').forEach(link => { link.href = keepReview('index.html'); });
        const items = current.filter(hasPost);
        if (!items.length) {
            root.innerHTML = `
                <div class="coming-up-empty">
                    <h2>Nothing coming up just now</h2>
                    <p>Our classes and gatherings continue every week.</p>
                    <a class="btn btn-outline" href="what-we-offer.html">Everything we offer</a>
                </div>`;
            return;
        }
        root.innerHTML = items.map(item => `
            <article class="coming-up-post" id="${escape(item.id)}" tabindex="-1" aria-labelledby="${escape(item.id)}-title">
                ${item.poster && item.poster.url ? `<a class="coming-up-poster" href="${escape(item.poster.url)}" target="_blank" rel="noopener">
                    <img src="${escape(item.poster.url)}" alt="${escape(item.poster.alt)}">
                </a>` : ''}
                <div class="coming-up-body">
                    <p class="coming-up-kind">${escape(item.kind || labelOf(item))}</p>
                    <h2 id="${escape(item.id)}-title">${escape(item.title)}</h2>
                    ${item.when ? `<p class="coming-up-when">${escape(item.when)}</p>` : ''}
                    ${item.place ? `<p class="coming-up-place">${escape(item.place)}</p>` : ''}
                    ${(item.text || []).map(p => `<p>${escape(p)}</p>`).join('')}
                    ${(item.details || []).length ? `<dl class="coming-up-details">${item.details.map(d => `<div><dt>${escape(d.label)}</dt><dd>${escape(d.value)}</dd></div>`).join('')}</dl>` : ''}
                    ${item.button ? `<a class="btn btn-primary" href="${escape(item.button.url)}"${/^https?:/.test(item.button.url) ? ' target="_blank" rel="noopener"' : ''}>${escape(item.button.label)}</a>` : ''}
                </div>
            </article>`).join('');
        // Land on the item named in the address (#id), below the fixed header, once the posters above it have
        // loaded (they change the page height); at most 1.5s.
        const target = window.location.hash && document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
        if (!target) return;
        const posters = [...root.querySelectorAll('.coming-up-poster img')].map(img => (img.complete ? null : new Promise(r => { img.onload = img.onerror = r; })));
        Promise.race([Promise.all(posters), new Promise(r => setTimeout(r, 1500))]).then(() => {
            target.scrollIntoView({ block: 'start' });
            target.focus({ preventScroll: true });
        });
    }

    // ---------- The list ----------
    const getJson = url => fetch(url, { cache: 'no-store' }).then(response => (response.ok ? response.json() : null)).catch(() => null);
    // The homepage asks for the list in its <head> (window.comingUpRequest); other pages ask here.
    const request = window.comingUpRequest || getJson('data/coming-up.json');
    let items;
    if (exampleSet) {
        // Review only: the example set's notices, plus any real items it names, all treated as current.
        items = Promise.all([request, getJson('data/coming-up-examples.json')]).then(([data, examples]) => {
            const set = (examples && examples.sets && examples.sets[exampleSet]) || { real: [], items: [] };
            const real = ((data && data.items) || []).filter(item => (set.real || []).includes(item.id));
            return [...real, ...(set.items || [])];
        });
    } else {
        items = request.then(data => ((data && data.items) || []).filter(isCurrent));
    }
    items
        .catch(() => [])
        .then(list => {
            // Important first, otherwise in the file's order.
            const ordered = [...list.filter(isImportant), ...list.filter(item => !isImportant(item))];
            renderStrip(ordered);
            renderPage(ordered);
        });
})();
