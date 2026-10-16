/* What We Offer (16 Oct 2026): marks the index entry for the item being read, with
   aria-current="location" on its link and .is-current on its group (styled in what-we-offer.css).
   The item being read is the one crossing a reading line about a third of the way down the screen;
   between cards (or over a group heading) the last marked item stays marked.
   On tablet and phone the index sits above the content; the marking is harmless there. */
(() => {
    'use strict';

    const index = document.querySelector('.offer-index');
    if (!index || !('IntersectionObserver' in window)) return;

    // Each index link points at an item (or its heading); watch the whole item card.
    const entries = [...index.querySelectorAll('ul a[href^="#"]')]
        .map(link => {
            const target = document.getElementById(link.getAttribute('href').slice(1));
            return target ? { link, item: target.closest('.offer') || target } : null;
        })
        .filter(Boolean);
    if (!entries.length) return;

    const groups = [...index.querySelectorAll('.offer-index-group')];
    const inBand = new Set();
    let current = null;

    // entry === null clears the marking (above the first item).
    function mark(entry) {
        if (entry === current) return;
        current = entry;
        entries.forEach(({ link }) => {
            if (entry && link === entry.link) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
        groups.forEach(group => group.classList.toggle('is-current', !!entry && group.contains(entry.link)));
    }

    // A one-per-cent band at 35% of the viewport height acts as the reading line.
    const observer = new IntersectionObserver(changes => {
        changes.forEach(change => (change.isIntersecting ? inBand.add(change.target) : inBand.delete(change.target)));
        const reading = entries.find(entry => inBand.has(entry.item));
        if (reading) mark(reading);
        else if (entries[0].item.getBoundingClientRect().top > window.innerHeight * 0.35) mark(null);
    }, { rootMargin: '-35% 0px -64% 0px' });

    entries.forEach(({ item }) => observer.observe(item));
})();
