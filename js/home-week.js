/* Homepage "What we offer": renders the weekly schedule and services from
   data/weekly-schedule.json. Without the data the section keeps its link to What We Offer.
   A session with a poster gets "See poster", which opens it in the picture viewer (js/viewer.js). */
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
                ${session.poster ? `<button type="button" class="home-week-poster" data-poster="${escape(session.id)}">${POSTER_ICON}See poster</button>` : ''}
            </li>`;
    }

    const POSTER_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 7h8M8 10.5h8M8 14h5"/></svg>';

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
            const sessions = data.sessions || [];
            root.addEventListener('click', event => {
                const button = event.target.closest('.home-week-poster');
                const session = button && sessions.find(item => item.id === button.dataset.poster);
                if (!session || !window.GMTViewer) return;
                window.GMTViewer.open({
                    src: session.poster.url,
                    alt: session.poster.alt,
                    kind: session.day,
                    title: session.title,
                    lines: [[session.time, session.place].filter(Boolean).join(' · ')],
                    actions: [{ label: 'Class details', href: session.link }],
                });
            });
        } catch (error) {
            root.innerHTML = '<p>Our classes and services are listed on <a href="what-we-offer.html">What We Offer</a>.</p>';
        }
    }

    init();
})();
