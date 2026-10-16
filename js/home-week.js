/* Homepage "What we offer": renders the weekly schedule and services from
   data/weekly-schedule.json. Without the data the section keeps its link to What We Offer. */
(() => {
    'use strict';

    const root = document.getElementById('home-week-root');
    if (!root) return;

    const escape = text => String(text ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    function renderSession(session) {
        return `
            <li class="home-week-row">
                <a class="home-week-link" href="${escape(session.link)}">
                    <span class="home-week-day">${escape(session.day)}</span>
                    <span class="home-week-main">
                        <span class="home-week-title">${escape(session.title)}</span>
                        ${session.detail ? `<span class="home-week-detail">${escape(session.detail)}</span>` : ''}
                    </span>
                    <span class="home-week-when">
                        ${session.time ? `<span class="home-week-time">${escape(session.time)}</span>` : ''}
                        <span class="home-week-place">${escape(session.place)}</span>
                    </span>
                </a>
            </li>`;
    }

    function renderService(service) {
        return `
            <li class="home-service">
                <h4 class="home-service-title">${escape(service.title)}</h4>
                <p class="home-service-detail">${escape(service.detail)}</p>
                <a class="text-link" href="${escape(service.link)}">${escape(service.action)}</a>
            </li>`;
    }

    async function init() {
        try {
            const response = await fetch('data/weekly-schedule.json', { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const places = Object.entries(data.places || {})
                .map(([name, address]) => `<span class="home-week-place-item"><strong>${escape(name)}</strong> ${escape(address)}</span>`)
                .join('<span class="home-week-places-sep" aria-hidden="true">·</span>');

            root.innerHTML = `
                <div class="home-week-schedule">
                    <h3 class="visually-hidden">Every week</h3>
                    <ul class="home-week-list">${(data.sessions || []).map(renderSession).join('')}</ul>
                    ${places ? `<p class="home-week-places">${places}</p>` : ''}
                </div>
                <aside class="home-services" aria-labelledby="home-services-heading">
                    <h3 class="home-services-heading" id="home-services-heading">Services</h3>
                    <ul class="home-services-list">${(data.services || []).map(renderService).join('')}</ul>
                </aside>`;
        } catch (error) {
            root.innerHTML = '<p>Our classes and services are listed on <a href="what-we-offer.html">What We Offer</a>.</p>';
        }
    }

    init();
})();
