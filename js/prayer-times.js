/**
 * Prayer Times Module
 * Uses official Greenwich Madina Trust prayer times from local JSON
 * Data extracted from mosque's official 2025 timetable PDF
 */

const PrayerTimes = (function() {
    // Month names for JSON lookup
    const MONTHS = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
    ];

    // Cache for loaded data
    let prayerTimesData = null;
    let hijriCalendarData = null;

    /**
     * Load prayer times JSON data
     */
    async function loadPrayerTimesData() {
        if (prayerTimesData) {
            return prayerTimesData;
        }

        try {
            const response = await fetch('data/prayer-times-2025.json');
            if (!response.ok) {
                throw new Error('Failed to load prayer times data');
            }
            prayerTimesData = await response.json();
            return prayerTimesData;
        } catch (error) {
            console.error('Error loading prayer times:', error);
            return null;
        }
    }

    /**
     * Load Hijri calendar data (mosque's official moon sighting dates)
     */
    async function loadHijriCalendarData() {
        if (hijriCalendarData) {
            return hijriCalendarData;
        }

        try {
            const response = await fetch('data/hijri-calendar.json');
            if (!response.ok) {
                throw new Error('Failed to load Hijri calendar data');
            }
            hijriCalendarData = await response.json();
            return hijriCalendarData;
        } catch (error) {
            console.error('Error loading Hijri calendar:', error);
            return null;
        }
    }

    /**
     * Get prayer times for a specific date
     */
    async function getTimesForDate(date) {
        const data = await loadPrayerTimesData();
        if (!data) return null;

        const month = MONTHS[date.getMonth()];
        const day = date.getDate();

        const monthData = data[month];
        if (!monthData) return null;

        // Find the day's data
        const dayData = monthData.find(d => d.date === day);
        return dayData || null;
    }

    /**
     * Get today's prayer times
     */
    async function getTodaysTimes() {
        const today = new Date();
        return await getTimesForDate(today);
    }

    /**
     * Get monthly calendar data
     */
    async function getMonthlyCalendar(year, month) {
        // Currently only have 2025 data
        if (year !== 2025) {
            console.warn('Prayer times only available for 2025');
            return null;
        }

        const data = await loadPrayerTimesData();
        if (!data) return null;

        const monthName = MONTHS[month - 1]; // month is 1-indexed
        return data[monthName] || null;
    }

    /**
     * Calculate Hijri date based on mosque's official calendar
     * Uses data/hijri-calendar.json which is updated when new month is announced
     */
    async function getHijriDate() {
        const calendar = await loadHijriCalendarData();
        if (!calendar) {
            return { day: '?', month: '?', year: '?' };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Parse the next month start date
        const nextMonthStart = new Date(calendar.nextMonth.gregorianStartDate);
        nextMonthStart.setHours(0, 0, 0, 0);

        // Parse the current month start date
        const currentMonthStart = new Date(calendar.currentMonth.gregorianStartDate);
        currentMonthStart.setHours(0, 0, 0, 0);

        let hijriMonth, hijriYear, hijriDay;

        if (today >= nextMonthStart) {
            // We're in the next month
            hijriMonth = calendar.nextMonth.hijriMonth;
            hijriYear = calendar.nextMonth.hijriYear;
            // Calculate day of month (1-indexed)
            const diffTime = today - nextMonthStart;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            hijriDay = diffDays + 1;
        } else {
            // We're in the current month
            hijriMonth = calendar.currentMonth.hijriMonth;
            hijriYear = calendar.currentMonth.hijriYear;
            // Calculate day of month (1-indexed)
            const diffTime = today - currentMonthStart;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            hijriDay = diffDays + 1;
        }

        return {
            day: hijriDay,
            month: hijriMonth,
            year: hijriYear
        };
    }

    /**
     * Format Gregorian date
     */
    function formatGregorianDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    /**
     * Update DOM elements with prayer times
     */
    async function updateDisplay() {
        const dayData = await getTodaysTimes();

        if (!dayData) {
            console.error('Could not load prayer times for today');
            return;
        }

        const today = new Date();

        // Update Begins times (when prayer time starts)
        const beginsElements = {
            'fajr-time': dayData.sehri_end, // Fajr begins ~3 min after sehri end
            'sunrise-time': dayData.sunrise,
            'dhuhr-time': dayData.dhuhr_begins,
            'asr-time': dayData.asr_begins,
            'maghrib-time': dayData.maghrib,
            'isha-time': dayData.isha_begins
        };

        for (const [id, time] of Object.entries(beginsElements)) {
            const element = document.getElementById(id);
            if (element && time) {
                element.textContent = time;
            }
        }

        // Update Jama'at times (congregation times set by mosque)
        const jamaatElements = {
            'fajr-jamaat': dayData.fajr_jamaat,
            'dhuhr-jamaat': dayData.dhuhr_jamaat,
            'asr-jamaat': dayData.asr_jamaat,
            'maghrib-jamaat': dayData.maghrib, // Maghrib jamaat is same as begins
            'isha-jamaat': dayData.isha_jamaat
        };

        for (const [id, time] of Object.entries(jamaatElements)) {
            const element = document.getElementById(id);
            if (element && time) {
                element.textContent = time;
            }
        }

        // Update Hijri date from mosque's official calendar
        const hijriElement = document.getElementById('hijri-date');
        if (hijriElement) {
            const hijri = await getHijriDate();
            hijriElement.textContent = `${hijri.day} ${hijri.month} ${hijri.year} AH`;
        }

        // Update Gregorian date
        const gregorianElement = document.getElementById('gregorian-date');
        if (gregorianElement) {
            gregorianElement.textContent = formatGregorianDate(today);
        }
    }

    /**
     * SVG icons for prayer times table headers
     */
    const PRAYER_ICONS = {
        fajr: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M24 16c0-4.4-3.6-8-8-8-.8 0-1.6.1-2.3.3C15.2 5.5 18.1 4 21.3 4 27.2 4 32 8.8 32 14.7s-4.8 10.7-10.7 10.7c-3.2 0-6.1-1.4-8.1-3.7"/><circle cx="13" cy="19" r="2.5" fill="currentColor" opacity="0.3"/></svg>`,
        sunrise: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 25v4M7 25h18"/><circle cx="16" cy="16" r="6"/><path d="M16 6v2M24 8l-2 2M26 16h-2M8 8l2 2M6 16h2"/></svg>`,
        dhuhr: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="16" cy="16" r="5"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M7 25l3-3M22 10l3-3"/></svg>`,
        asr: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="16" cy="16" r="5"/><path d="M16 7v3M16 22v3M7 16h3M22 16h3"/><path d="M10 10l2 2M20 20l2 2M10 22l2-2M20 12l2-2"/></svg>`,
        maghrib: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 24h26"/><path d="M16 24V18"/><circle cx="16" cy="12" r="5"/><path d="M16 3v4M9 12H6M26 12h-3"/></svg>`,
        isha: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M25 16c0-5-4-9-9-9-.9 0-1.8.1-2.6.4C15 4.3 19 2 23.5 2 29.3 2 34 6.7 34 12.5S29.3 23 23.5 23c-4 0-7.5-2-9.5-5.1"/><circle cx="9" cy="23" r="1.3" fill="currentColor"/><circle cx="15" cy="27" r="1" fill="currentColor"/><circle cx="5" cy="19" r="1" fill="currentColor"/></svg>`
    };

    /**
     * Render monthly timetable with separate Begins/Jama'at columns
     */
    async function renderMonthlyTable(containerId, year, month) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<p class="text-center">Loading prayer times...</p>';

        const calendar = await getMonthlyCalendar(year, month);

        if (!calendar || calendar.length === 0) {
            container.innerHTML = '<p class="text-center">Could not load prayer times. Please try again later.</p>';
            return;
        }

        const today = new Date().getDate();
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        let html = `
            <div class="timetable-wrapper">
            <table class="prayer-times-table">
                <thead>
                    <tr class="header-main">
                        <th class="col-date sticky-col" rowspan="2">Date</th>
                        <th class="col-day sticky-col-2" rowspan="2">Day</th>
                        <th class="col-prayer-group" colspan="2">
                            <span class="prayer-header">
                                <span class="prayer-icon">${PRAYER_ICONS.fajr}</span>
                                <span class="prayer-name">Fajr</span>
                            </span>
                        </th>
                        <th class="col-prayer-single" rowspan="2">
                            <span class="prayer-header">
                                <span class="prayer-icon">${PRAYER_ICONS.sunrise}</span>
                                <span class="prayer-name">Sunrise</span>
                            </span>
                        </th>
                        <th class="col-prayer-group" colspan="2">
                            <span class="prayer-header">
                                <span class="prayer-icon">${PRAYER_ICONS.dhuhr}</span>
                                <span class="prayer-name">Dhuhr</span>
                            </span>
                        </th>
                        <th class="col-prayer-group" colspan="2">
                            <span class="prayer-header">
                                <span class="prayer-icon">${PRAYER_ICONS.asr}</span>
                                <span class="prayer-name">Asr</span>
                            </span>
                        </th>
                        <th class="col-prayer-single" rowspan="2">
                            <span class="prayer-header">
                                <span class="prayer-icon">${PRAYER_ICONS.maghrib}</span>
                                <span class="prayer-name">Maghrib</span>
                            </span>
                        </th>
                        <th class="col-prayer-group" colspan="2">
                            <span class="prayer-header">
                                <span class="prayer-icon">${PRAYER_ICONS.isha}</span>
                                <span class="prayer-name">Isha</span>
                            </span>
                        </th>
                    </tr>
                    <tr class="header-sub">
                        <th class="col-begins">Begins</th>
                        <th class="col-jamaat">Jama'at</th>
                        <th class="col-begins">Begins</th>
                        <th class="col-jamaat">Jama'at</th>
                        <th class="col-begins">Begins</th>
                        <th class="col-jamaat">Jama'at</th>
                        <th class="col-begins">Begins</th>
                        <th class="col-jamaat">Jama'at</th>
                    </tr>
                </thead>
                <tbody>
        `;

        calendar.forEach(day => {
            const isToday = day.date === today && month === currentMonth && year === currentYear;
            const rowClass = isToday ? 'today-row' : '';
            const todayLabel = isToday ? '<span class="today-label">Today</span>' : '';

            html += `
                <tr class="${rowClass}">
                    <td class="col-date sticky-col">${day.date}${todayLabel}</td>
                    <td class="col-day sticky-col-2">${day.day}</td>
                    <td class="col-begins">${day.sehri_end}</td>
                    <td class="col-jamaat">${day.fajr_jamaat}</td>
                    <td class="col-sunrise">${day.sunrise}</td>
                    <td class="col-begins">${day.dhuhr_begins}</td>
                    <td class="col-jamaat">${day.dhuhr_jamaat}</td>
                    <td class="col-begins">${day.asr_begins}</td>
                    <td class="col-jamaat">${day.asr_jamaat}</td>
                    <td class="col-maghrib">${day.maghrib}</td>
                    <td class="col-begins">${day.isha_begins}</td>
                    <td class="col-jamaat">${day.isha_jamaat}</td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';

        // Add note about official times
        html += `
            <div class="timetable-footer">
                <p>Official prayer times from Greenwich Madina Trust's 2025 timetable.</p>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Get metadata from the prayer times file
     */
    async function getMetadata() {
        const data = await loadPrayerTimesData();
        return data ? data.metadata : null;
    }

    // Public API
    return {
        getTodaysTimes,
        getTimesForDate,
        getMonthlyCalendar,
        updateDisplay,
        renderMonthlyTable,
        getMetadata
    };
})();

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Update prayer banner on all pages
    PrayerTimes.updateDisplay();
});
