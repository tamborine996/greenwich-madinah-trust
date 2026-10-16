/* What We Offer (16 Oct 2026): fills class times marked data-session="<id>" from
   data/weekly-schedule.json, the file the homepage schedule also reads, so the two cannot drift.
   Format: "Thursdays, 7:45pm". The text already in the page stays if the data cannot load. */
(() => {
    'use strict';

    const targets = document.querySelectorAll('[data-session]');
    if (!targets.length) return;

    const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const plural = day => (WEEKDAYS.includes(day) ? `${day}s` : day);
    const lowerFirst = text => text.charAt(0).toLowerCase() + text.slice(1);

    function describe(session) {
        if (!session.time) return plural(session.day);
        // Keep clock times as written ("7:45pm"); lower-case words such as "After Isha".
        const time = /^\d/.test(session.time) ? session.time : lowerFirst(session.time);
        return `${plural(session.day)}, ${time}`;
    }

    fetch('data/weekly-schedule.json', { cache: 'no-store' })
        .then(response => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
        .then(data => {
            const byId = new Map((data.sessions || []).map(session => [session.id, session]));
            targets.forEach(element => {
                const session = byId.get(element.dataset.session);
                if (session) element.textContent = describe(session);
            });
        })
        .catch(() => { /* keep the printed fallback text */ });
})();
