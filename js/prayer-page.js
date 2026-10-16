/* Prayer Times page (16 Oct 2026): the current month as an HTML table in the printed timetable's layout. Reads
   data/prayer-times-2026.json through the PrayerTimes module (js/prayer-times.js), the same source as the prayer
   strip, which already shows today's times at the top of every page.
   Fajr is shown as "Start / Sehri End" with the sehri_end value, exactly as on the printed timetable.
   Only today's row is highlighted, with "Today" in its day column. On phones (css/prayer-page.css) the rows before
   today are hidden until "Show 1–<yesterday> <month>" is pressed, so the table opens at today, with tomorrow below. */
(() => {
    'use strict';

    if (typeof PrayerTimes === 'undefined') return;

    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const DAY_NAMES = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

    const escape = text => String(text ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    // London's civil date. Honours the prayer strip's test hook so both move together.
    function londonToday() {
        const source = window.GMT_PRAYER_TIMES_TEST_DATE ? new Date(window.GMT_PRAYER_TIMES_TEST_DATE) : new Date();
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
        }).formatToParts(source).map(part => [part.type, part.value]));
        return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
    }

    function renderMonth(days, year, month, today, notes) {
        const isCurrent = today.year === year && today.month === month;
        const body = days.map(day => {
            const isToday = isCurrent && day.date === today.day;
            const isPast = isCurrent && day.date < today.day;
            const past = isPast ? ' class="is-past"' : '';
            const noteRow = day.note ? `<tr class="prayer-month-note${isPast ? ' is-past' : ''}"><td colspan="13">${escape(day.note)}</td></tr>` : '';
            const dayCell = isToday
                ? `<span class="prayer-today-label">Today</span><span class="visually-hidden">, ${escape(DAY_NAMES[day.day] || day.day)}</span>`
                : escape(day.day);
            return `${noteRow}
                <tr${isToday ? ' class="is-today" aria-current="date"' : past}>
                    <th scope="row" class="col-date">${day.date}</th>
                    <td class="col-day">${dayCell}</td>
                    <td>${escape(day.sehri_end)}</td>
                    <td class="prayer-jamaat">${escape(day.fajr_jamaat)}</td>
                    <td>${escape(day.sunrise)}</td>
                    <td>${escape(day.dhahwa_kubra)}</td>
                    <td>${escape(day.dhuhr_begins)}</td>
                    <td class="prayer-jamaat">${escape(day.dhuhr_jamaat)}</td>
                    <td>${escape(day.asr_begins)}</td>
                    <td class="prayer-jamaat">${escape(day.asr_jamaat)}</td>
                    <td class="prayer-jamaat">${escape(day.maghrib)}</td>
                    <td>${escape(day.isha_begins)}</td>
                    <td class="prayer-jamaat">${escape(day.isha_jamaat)}</td>
                </tr>`;
        }).join('');
        const earlier = isCurrent && today.day > 1
            ? `<button type="button" class="prayer-month-earlier" aria-controls="prayer-month-table">Show 1–${today.day - 1} ${escape(MONTH_NAMES[month - 1])}</button>`
            : '';

        return `
            ${notes.length ? `<p class="prayer-month-guidance">${notes.map(escape).join(' · ')}</p>` : ''}
            ${earlier}
            <div class="prayer-month-scroll" tabindex="0" role="region" aria-labelledby="prayer-month-caption">
                <table class="prayer-month-table" id="prayer-month-table">
                    <caption id="prayer-month-caption">${escape(MONTH_NAMES[month - 1])} ${year} · UK local time</caption>
                    <thead>
                        <tr>
                            <th scope="col" rowspan="2" class="col-date">Date</th>
                            <th scope="col" rowspan="2" class="col-day">Day</th>
                            <th scope="colgroup" colspan="2">Fajr</th>
                            <th scope="col" rowspan="2">Sunrise</th>
                            <th scope="col" rowspan="2">Dhahwa-<br>e-Kubra</th>
                            <th scope="colgroup" colspan="2">Dhuhr</th>
                            <th scope="colgroup" colspan="2">Asr</th>
                            <th scope="col" rowspan="2">Maghrib</th>
                            <th scope="colgroup" colspan="2">Isha</th>
                        </tr>
                        <tr class="prayer-month-sub">
                            <th scope="col">Start / Sehri End</th><th scope="col">Jama’at</th>
                            <th scope="col">Begins</th><th scope="col">Jama’at</th>
                            <th scope="col">Begins</th><th scope="col">Jama’at</th>
                            <th scope="col">Begins</th><th scope="col">Jama’at</th>
                        </tr>
                    </thead>
                    <tbody>${body}</tbody>
                </table>
            </div>
            <p class="prayer-month-key"><span class="key-today"></span> Today · Maghrib Jama’at is at sunset.</p>`;
    }

    async function init() {
        const monthRoot = document.getElementById('prayer-month-root');
        if (!monthRoot) return;

        const today = londonToday();
        const [thisMonth, metadata] = await Promise.all([
            PrayerTimes.getMonthlyCalendar(today.year, today.month),
            PrayerTimes.getMetadata()
        ]);
        if (!thisMonth || !thisMonth.length) {
            monthRoot.innerHTML = `<p>The ${escape(MONTH_NAMES[today.month - 1])} timetable will appear here when it is published. The printable timetable is below.</p>`;
            return;
        }
        const notes = metadata && Array.isArray(metadata.notes) ? metadata.notes.slice(0, 1) : [];
        document.getElementById('prayer-month-title').textContent = `${MONTH_NAMES[today.month - 1]} ${today.year}`;
        monthRoot.innerHTML = renderMonth(thisMonth, today.year, today.month, today, notes);

        // Phones: start at today; the button brings back the earlier days.
        const earlier = monthRoot.querySelector('.prayer-month-earlier');
        if (earlier) {
            monthRoot.classList.add('hide-past');
            earlier.addEventListener('click', () => {
                monthRoot.classList.remove('hide-past');
                monthRoot.querySelector('.prayer-month-scroll').focus();
            });
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
