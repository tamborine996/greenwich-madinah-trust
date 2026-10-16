/* (16 Oct 2026) sizes the square carousel in the two-column hero.
   Desktop only: poster side = smallest of the column width (less the arrow overhang),
   the space left in the first screen, and the 440px cap used by programme-carousel.js.
   If even FLOOR cannot fit, the page has to scroll anyway, so the poster keeps its full size.
   Review aids: ?order=carousel-first puts the carousel above the welcome on desktop;
   ?photo=<key> swaps the default photo (cleaned clear-day edit) for one of PHOTOS below. */
(() => {
    'use strict';

    const hero = document.querySelector('.hero-two-column');
    const frame = hero && hero.querySelector('.hero-carousel-frame');
    if (!hero || !frame) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('order') === 'carousel-first') hero.dataset.order = 'carousel-first';

    const PHOTOS = {
        // The original Facebook cover (pre-refurbishment frontage, white sky).
        'facebook-cover': {
            stem: 'images/hero/ghousia-masjid-exterior',
            widths: [800, 1280, 2048],
            alt: 'Ghousia Masjid on Camrose Street, with the Greenwich Madina Trust sign above the entrance',
        },
        'front-2024': {
            stem: 'images/hero/ghousia-masjid-front-2024-01',
            widths: [800, 1280, 1600],
            alt: 'Ghousia Masjid on Camrose Street: the Greenwich Madina Trust sign against a clear blue sky, with prayer rugs hung on the railings',
        },
        // AI-edited Facebook cover (Codex), real sign pasted in. Review only until the committee approves.
        'edit-a': {
            stem: 'images/hero/ghousia-masjid-edit-a',
            widths: [800, 1280, 1399],
            alt: 'Ghousia Masjid on Camrose Street on a clear day: the timber porch beneath the Greenwich Madina Trust sign',
        },
        'edit-b': {
            stem: 'images/hero/ghousia-masjid-edit-b',
            widths: [800, 1280, 1399],
            alt: 'Ghousia Masjid on Camrose Street at dusk: the timber porch beneath the Greenwich Madina Trust sign',
        },
        // Codex's careful sign composite (pixels only, verified unchanged outside the board).
        'edit-clear': {
            stem: 'images/hero/ghousia-masjid-clear',
            widths: [800, 1280, 1399],
            alt: 'Ghousia Masjid on Camrose Street on a clear day: the timber porch beneath the Greenwich Madina Trust sign',
        },
        'edit-clear-cleaned': {
            stem: 'images/hero/ghousia-masjid-clear-cleaned',
            widths: [800, 1280, 1399],
            alt: 'Ghousia Masjid on Camrose Street on a clear day: the timber porch beneath the Greenwich Madina Trust sign',
        },
    };
    const photo = PHOTOS[params.get('photo')];
    const image = hero.querySelector('.hero-photo img');
    if (photo && image) {
        hero.dataset.photo = params.get('photo');
        image.srcset = photo.widths.map(w => `${photo.stem}-${w}.webp ${w}w`).join(', ');
        image.src = `${photo.stem}-1280.webp`;
        image.alt = photo.alt;
    }

    const desktop = window.matchMedia('(min-width: 1024px)');
    const CAP = 440;
    const FLOOR = 320;
    const ARROW_OVERHANG = 22;
    let pending = 0;

    function size() {
        pending = 0;
        if (!desktop.matches) {
            hero.style.removeProperty('--hero-poster');
            return;
        }
        const column = frame.parentElement.clientWidth;
        const bottomPadding = parseFloat(getComputedStyle(hero).paddingBottom) || 0;
        // Page coordinates keep the size stable if the page loads part-scrolled.
        const top = frame.getBoundingClientRect().top + window.scrollY;
        const available = window.innerHeight - top - bottomPadding;
        const widest = Math.min(column - ARROW_OVERHANG, CAP);
        const side = Math.round(available >= FLOOR ? Math.min(widest, available) : widest);
        const value = `${side}px`;
        if (hero.style.getPropertyValue('--hero-poster') !== value) {
            hero.style.setProperty('--hero-poster', value);
        }
    }

    function schedule() {
        if (!pending) pending = requestAnimationFrame(size);
    }

    window.addEventListener('resize', schedule, { passive: true });
    desktop.addEventListener('change', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    if ('ResizeObserver' in window) {
        // Prayer times, the event bar and web fonts can all settle after first paint.
        const observer = new ResizeObserver(schedule);
        for (const selector of ['.header', '.prayer-banner', '#event-notification-bar', '.hero-two-column .hero-welcome']) {
            const element = document.querySelector(selector);
            if (element) observer.observe(element);
        }
    }

    // Size synchronously so Swiper measures the final frame when it initialises.
    size();
})();
