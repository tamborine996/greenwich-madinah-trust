/* Prayer Times page (16 Oct 2026): today and tomorrow cards, and the current month as
   an HTML table in the printed timetable's layout. Reads data/prayer-times-2026.json through the
   PrayerTimes module (js/prayer-times.js), the same source as the prayer strip.
   Fajr is shown as "Start / Sehri End" with the sehri_end value, exactly as on the printed timetable. */
(() => {
    'use strict';

    if (typeof PrayerTimes === 'undefined') return;

    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const DAY_NAMES = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

    const escape = text => String(text ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    // London's civil date and clock time. Honours the prayer strip's test hook so both move together.
    function londonNow() {
        const source = window.GMT_PRAYER_TIMES_TEST_DATE ? new Date(window.GMT_PRAYER_TIMES_TEST_DATE) : new Date();
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
        }).formatToParts(source).map(part => [part.type, part.value]));
        return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), time: `${parts.hour}:${parts.minute}` };
    }

    function nextDate({ year, month, day }) {
        const date = new Date(Date.UTC(year, month - 1, day + 1));
        return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
    }

    function rowsFor(day) {
        const friday = day.day === 'Fri';
        return [
            { name: 'Fajr', begins: day.sehri_end, beginsNote: 'Start / Sehri End', jamaat: day.fajr_jamaat },
            { name: 'Sunrise', begins: day.sunrise, jamaat: '' },
            { name: friday ? 'Dhuhr / Jum’a' : 'Dhuhr', begins: day.dhuhr_begins, jamaat: day.dhuhr_jamaat },
            { name: 'Asr', begins: day.asr_begins, jamaat: day.asr_jamaat },
            { name: 'Maghrib', begins: day.maghrib, jamaat: day.maghrib },
            { name: 'Isha', begins: day.isha_begins, jamaat: day.isha_jamaat }
        ];
    }

    function renderDayCard(label, date, day, nowTime) {
        if (!day) {
            return `
                <article class="prayer-day prayer-day--missing">
                    <h3 class="prayer-day-title">${escape(label)}</h3>
                    <p>These times will appear when the ${escape(MONTH_NAMES[date.month - 1])} timetable is published.</p>
                </article>`;
        }
        const rows = rowsFor(day);
        // The next congregation still to come today (Sunrise has no jama'at).
        const next = nowTime ? rows.find(row => row.jamaat && row.jamaat > nowTime) : null;
        return `
            <article class="prayer-day${nowTime ? ' prayer-day--today' : ''}">
                <h3 class="prayer-day-title">${escape(label)} <span>${escape(DAY_NAMES[day.day] || day.day)} ${date.day} ${escape(MONTH_NAMES[date.month - 1])}</span></h3>
                <table class="prayer-day-table">
                    <thead><tr><th scope="col">Prayer</th><th scope="col">Begins</th><th scope="col">Jama’at</th></tr></thead>
                    <tbody>
                        ${rows.map(row => `
                        <tr${row === next ? ' class="is-next"' : ''}>
                            <th scope="row">${escape(row.name)}${row === next ? ' <span class="prayer-next">Next</span>' : ''}</th>
                            <td>${escape(row.begins)}</td>
                            <td class="prayer-jamaat">${escape(row.jamaat || '—')}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </article>`;
    }

    function renderMonth(days, year, month, today, notes) {
        const isCurrent = today.year === year && today.month === month;
        const body = days.map(day => {
            const isToday = isCurrent && day.date === today.day;
            const classes = [day.day === 'Fri' ? 'is-friday' : '', isToday ? 'is-today' : ''].filter(Boolean).join(' ');
            const noteRow = day.note ? `<tr class="prayer-month-note"><td colspan="13">${escape(day.note)}</td></tr>` : '';
            return `${noteRow}
                <tr${classes ? ` class="${classes}"` : ''}${isToday ? ' aria-current="date"' : ''}>
                    <th scope="row" class="col-date">${day.date}</th>
                    <td class="col-day">${escape(day.day)}</td>
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

        return `
            ${notes.length ? `<p class="prayer-month-guidance">${notes.map(escape).join(' · ')}</p>` : ''}
            <div class="prayer-month-scroll" tabindex="0" role="region" aria-labelledby="prayer-month-caption">
                <table class="prayer-month-table">
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
            <p class="prayer-month-key"><span class="key-friday"></span> Friday <span class="key-today"></span> Today · Maghrib Jama’at is at sunset.</p>`;
    }

    async function init() {
        const daysRoot = document.getElementById('prayer-days');
        const monthRoot = document.getElementById('prayer-month-root');
        if (!daysRoot || !monthRoot) return;

        const now = londonNow();
        const tomorrow = nextDate(now);
        const [thisMonth, nextMonthDays, metadata] = await Promise.all([
            PrayerTimes.getMonthlyCalendar(now.year, now.month),
            tomorrow.month !== now.month ? PrayerTimes.getMonthlyCalendar(tomorrow.year, tomorrow.month) : Promise.resolve(null),
            PrayerTimes.getMetadata()
        ]);
        const tomorrowMonth = tomorrow.month === now.month ? thisMonth : nextMonthDays;
        const todayRow = thisMonth && thisMonth.find(d => d.date === now.day);
        const tomorrowRow = tomorrowMonth && tomorrowMonth.find(d => d.date === tomorrow.day);

        daysRoot.innerHTML = renderDayCard('Today', now, todayRow, now.time) + renderDayCard('Tomorrow', tomorrow, tomorrowRow, null);

        if (!thisMonth || !thisMonth.length) {
            monthRoot.innerHTML = `<p>The ${escape(MONTH_NAMES[now.month - 1])} timetable will appear here when it is published. The printable timetable is below.</p>`;
            return;
        }
        const notes = metadata && Array.isArray(metadata.notes) ? metadata.notes.slice(0, 1) : [];
        document.getElementById('prayer-month-title').textContent = `${MONTH_NAMES[now.month - 1]} ${now.year}`;
        monthRoot.innerHTML = renderMonth(thisMonth, now.year, now.month, now, notes);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
