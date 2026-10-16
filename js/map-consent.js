/* Maps on request (16 Oct 2026). Google Maps sets cookies as soon as it loads, so each map starts as a
   placeholder (.map-consent, with data-map-src, data-map-title and data-map-height) and loads only when the
   visitor presses its "Show map" button. The placeholder also links to Google Maps in a new tab. */
(() => {
    'use strict';

    document.querySelectorAll('.map-consent[data-map-src]').forEach(box => {
        const button = box.querySelector('[data-map-show]');
        if (!button) return;
        button.addEventListener('click', () => {
            const frame = document.createElement('iframe');
            frame.src = box.dataset.mapSrc;
            frame.title = box.dataset.mapTitle || 'Map';
            frame.width = '100%';
            frame.height = box.dataset.mapHeight || '300';
            frame.style.border = '0';
            frame.allowFullscreen = true;
            frame.referrerPolicy = 'no-referrer-when-downgrade';
            box.replaceChildren(frame);
            box.classList.add('is-loaded');
            frame.focus();
        });
    });
})();
