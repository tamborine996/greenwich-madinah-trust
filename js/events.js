/**
 * Event Manager for Greenwich Madina Trust
 * Reads from data/events.json and controls visibility of event sections
 */

(function() {
    'use strict';

    // Load events data and update the page
    async function loadEvents() {
        try {
            const response = await fetch('data/events.json');
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

    // Update the notification bar
    function updateNotificationBar(config) {
        const bar = document.getElementById('event-notification-bar');
        if (!bar) return;

        if (!config || !config.enabled) {
            hideNotificationBar();
            return;
        }

        // Show the bar and update content
        bar.style.display = '';
        bar.href = config.linkUrl || '#event-spotlight';

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

        if (!config || !config.enabled) {
            hideSpotlight();
            return;
        }

        // Show the section
        section.style.display = '';

        // Update poster
        const posterImg = section.querySelector('.spotlight-poster img');
        if (posterImg && config.poster) {
            posterImg.src = config.poster;
            posterImg.alt = config.title + ' Event Poster';
        }

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

        // Update time
        const timeEl = section.querySelector('.spotlight-time');
        if (timeEl && config.time) {
            timeEl.textContent = config.time;
        }

        // Update location
        const locationEl = section.querySelector('.spotlight-location');
        if (locationEl && config.location) {
            locationEl.textContent = config.location;
        }

        // Update Facebook link
        const fbLink = section.querySelector('.spotlight-fb-link');
        if (fbLink && config.facebookUrl) {
            fbLink.href = config.facebookUrl;
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
