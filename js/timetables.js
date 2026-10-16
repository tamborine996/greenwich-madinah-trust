/* Monthly prayer timetables (16 Oct 2026), from data/timetables.json.
   - The prayer banner's "Full Timetable" button opens this month's published timetable in the picture viewer
     (js/viewer.js), with "Download PDF" and, away from the Prayer Times page, "Prayer Times page". Without
     JavaScript, or if the timetable cannot be shown, the button still goes to prayer-times.html.
   - window.GMTTimetables.current() gives this month's entry to the printable timetable on prayer-times.html.
   This month = the entry for the current London month, or the latest earlier one until it is added. It always
   follows the real date: the Coming up review aid ?today= does not move it, as the prayer strip beside the button
   shows the real day's times. Test hook: window.GMT_TIMETABLE_TEST_DATE. */
(() => {
    'use strict';

    function thisMonth() {
        const date = window.GMT_TIMETABLE_TEST_DATE ? new Date(window.GMT_TIMETABLE_TEST_DATE) : new Date();
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit' })
            .formatToParts(date).map(part => [part.type, part.value]));
        return `${parts.year}-${parts.month}`;
    }

    let list = null;
    const months = () => (list = list || fetch('data/timetables.json', { cache: 'no-cache' })
        .then(response => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
        .then(data => (data.months || []).slice().sort((a, b) => b.month.localeCompare(a.month))));

    function current() {
        const now = thisMonth();
        return months().then(all => all.find(entry => entry.month <= now) || all[all.length - 1] || null);
    }

    const onPrayerPage = /(^|\/)prayer-times\.html$/.test(window.location.pathname);

    // "Full Timetable" in the prayer banner (it links to prayer-times.html).
    document.addEventListener('click', event => {
        const button = event.target.closest('.prayer-banner-actions a[href^="prayer-times.html"]');
        if (!button || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
        if (typeof window.GMTViewer !== 'object') return;
        event.preventDefault();
        current().then(entry => {
            if (!entry || !entry.image) throw new Error('no timetable image');
            const actions = [{ label: 'Download PDF', href: entry.pdf, primary: true, download: true }];
            if (!onPrayerPage) actions.push({ label: 'Prayer Times page', href: 'prayer-times.html' });
            return window.GMTViewer.open({
                src: entry.image,
                alt: entry.alt,
                kind: 'Prayer timetable',
                title: entry.title,
                lines: ['Begins and Jama’at times for every day of the month, as published by Ghousia Masjid.'],
                actions,
            });
        }).catch(() => {
            window.location.href = button.href;
        });
    });

    window.GMTTimetables = { current };
})();
