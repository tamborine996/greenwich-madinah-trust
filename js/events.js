/**
 * Event Manager for Greenwich Madina Trust
 * Reads from data/events.json and controls visibility of event sections
 */

(function() {
    'use strict';

    // Load events data and update the page
    async function loadEvents() {
        try {
            const response = await fetch('data/events.json?v=20260720-editorial-live');
            if (!response.ok) {
                throw new Error('Failed to load events data');
            }
            const data = await response.json();

            updateNotificationBar(data.notificationBar);
            updateSpotlight(data.spotlight);

        } catch (error) {
            console.error('Error loading events:', error);
            // Hide both sections if there's an error loading data
            hideNotificationBar();
            hideSpotlight();
        }
    }

    function getTodayIsoDateInLondon() {
        const formatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/London',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const parts = formatter.formatToParts(new Date()).reduce((dateParts, part) => {
            if (part.type !== 'literal') {
                dateParts[part.type] = part.value;
            }
            return dateParts;
        }, {});

        return parts.year + '-' + parts.month + '-' + parts.day;
    }

    function isEventConfigActive(config) {
        if (!config || !config.enabled) {
            return false;
        }

        if (config.hideFrom && getTodayIsoDateInLondon() >= config.hideFrom) {
            return false;
        }

        return true;
    }

    // Update the notification bar
    function updateNotificationBar(config) {
        const bar = document.getElementById('event-notification-bar');
        if (!bar) return;

        if (!isEventConfigActive(config)) {
            hideNotificationBar();
            return;
        }

        // Show the bar and update content
        bar.style.display = '';
        bar.href = config.linkUrl || '#event-spotlight';
        bar.setAttribute('aria-label', config.ariaLabel || config.linkText || 'View event details');

        if (config.openInNewTab) {
            bar.target = '_blank';
            bar.rel = 'noopener noreferrer';
        } else {
            bar.removeAttribute('target');
            bar.removeAttribute('rel');
        }

        // Update badge text
        const badgeEl = bar.querySelector('.event-notif-badge');
        if (badgeEl && config.badgeText) {
            badgeEl.textContent = config.badgeText;
        }

        const textEl = bar.querySelector('.event-notif-text');
        if (textEl && config.linkText) {
            // Parse the text to bold the event name (before the em dash)
            const parts = config.linkText.split('—');
            if (parts.length === 2) {
                textEl.innerHTML = '<strong>' + parts[0].trim() + '</strong> — ' + parts[1].trim();
            } else {
                textEl.innerHTML = '<strong>' + config.linkText + '</strong>';
            }
        }
    }

    function hideNotificationBar() {
        const bar = document.getElementById('event-notification-bar');
        if (bar) {
            bar.style.display = 'none';
        }
    }

    // Update the spotlight section
    function updateSpotlight(config) {
        const section = document.getElementById('event-spotlight');
        if (!section) return;

        if (!isEventConfigActive(config)) {
            hideSpotlight();
            return;
        }

        // Show the section
        section.style.display = '';

        // Update badge text
        const badgeEl = section.querySelector('.spotlight-badge');
        if (badgeEl && config.badgeText) {
            badgeEl.textContent = config.badgeText;
        }

        // Update one or more posters and their full-size links.
        // The single `poster` field remains supported for older event entries.
        const configuredPosters = Array.isArray(config.posters) && config.posters.length
            ? config.posters
            : (config.poster ? [{ src: config.poster }] : []);
        const posterLinks = Array.from(section.querySelectorAll('.spotlight-poster-link'));

        posterLinks.forEach((posterLink, index) => {
            const poster = configuredPosters[index];
            if (!poster) {
                posterLink.style.display = 'none';
                return;
            }

            const posterSrc = poster.src || poster.url || poster.poster;
            const posterImg = posterLink.querySelector('img');
            const posterLabel = posterLink.querySelector('.spotlight-poster-label');
            const posterName = poster.label || config.title || 'event';

            posterLink.style.display = '';
            posterLink.href = posterSrc;
            posterLink.setAttribute('aria-label', poster.ariaLabel || 'Open the full ' + posterName + ' poster');

            if (posterImg) {
                posterImg.src = posterSrc;
                posterImg.alt = poster.alt || posterName + ' poster';
            }
            if (posterLabel) {
                posterLabel.textContent = poster.label || '';
                posterLabel.style.display = poster.label ? '' : 'none';
            }
        });

        // Update title
        const titleEl = section.querySelector('.spotlight-title');
        if (titleEl && config.title) {
            titleEl.textContent = config.title;
        }

        // Update date
        const dateEl = section.querySelector('.spotlight-date');
        if (dateEl && config.date) {
            dateEl.textContent = config.date;
        }

        // Update description
        const descEl = section.querySelector('.spotlight-description');
        if (descEl && config.description) {
            descEl.textContent = config.description;
        }

        // Multi-gathering events need complete, self-contained detail cards instead of
        // shared time and location rows. Older single-event entries keep the legacy rows.
        const gatheringWrap = section.querySelector('.spotlight-gatherings');
        const gatheringCards = Array.from(section.querySelectorAll('[data-gathering-index]'));
        const gatherings = Array.isArray(config.gatherings)
            ? config.gatherings.filter(gathering => gathering && gathering.title)
            : [];
        const hasGatherings = gatherings.length > 0 && gatheringWrap;
        const legacyDate = section.querySelector('.spotlight-legacy-date');
        const legacyDetails = section.querySelector('.spotlight-legacy-details');

        if (hasGatherings) {
            gatheringWrap.hidden = false;
            if (legacyDate) legacyDate.style.display = 'none';
            if (legacyDetails) legacyDetails.style.display = 'none';

            gatheringCards.forEach((card, index) => {
                const gathering = gatherings[index];
                if (!gathering) {
                    card.style.display = 'none';
                    return;
                }

                card.style.display = '';
                const title = card.querySelector('.spotlight-gathering-title');
                const date = card.querySelector('.spotlight-gathering-date');
                const time = card.querySelector('.spotlight-gathering-time');
                const venue = card.querySelector('.spotlight-gathering-venue');
                const address = card.querySelector('.spotlight-gathering-address');

                if (title) title.textContent = gathering.title;
                if (date) date.textContent = gathering.date || '';
                if (time) time.textContent = gathering.time || '';
                if (venue) venue.textContent = gathering.venue || '';
                if (address) address.textContent = gathering.address || '';
            });
        } else {
            if (gatheringWrap) gatheringWrap.hidden = true;
            if (legacyDate) legacyDate.style.display = '';
            if (legacyDetails) legacyDetails.style.display = '';

            // Update time - hide if empty
            const timeDetail = section.querySelector('.spotlight-time')?.closest('.spotlight-detail');
            if (timeDetail) {
                if (config.time) {
                    timeDetail.style.display = '';
                    section.querySelector('.spotlight-time').textContent = config.time;
                } else {
                    timeDetail.style.display = 'none';
                }
            }

            // Update location - hide if empty
            const locationDetail = section.querySelector('.spotlight-location')?.closest('.spotlight-detail');
            if (locationDetail) {
                if (config.location) {
                    locationDetail.style.display = '';
                    section.querySelector('.spotlight-location').textContent = config.location;
                } else {
                    locationDetail.style.display = 'none';
                }
            }
        }

        // Update button - use custom URL/text or Facebook
        const btn = section.querySelector('.spotlight-fb-link');
        if (btn) {
            if (config.buttonUrl) {
                btn.href = config.buttonUrl;
                btn.removeAttribute('target');
                btn.textContent = config.buttonText || 'Learn More';
            } else if (config.facebookUrl) {
                btn.href = config.facebookUrl;
                btn.target = '_blank';
                btn.textContent = 'View on Facebook';
            } else {
                btn.style.display = 'none';
            }
        }
    }

    function hideSpotlight() {
        const section = document.getElementById('event-spotlight');
        if (section) {
            section.style.display = 'none';
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadEvents);
    } else {
        loadEvents();
    }
})();
