/* Keep native Swiper, video lifecycle and existing campaigns intact. */
(() => {
    'use strict';
    function initialiseProgrammeSlides() {
        const root = document.getElementById('hero-carousel');
        const swiper = root && root.swiper;
        if (!swiper || !root.querySelector('.slide-programme')) return;
        let pending = 0;
        function sync() {
            pending = 0;
            const active = swiper.slides[swiper.activeIndex];
            const programmeActive = Boolean(active && active.classList.contains('slide-programme'));
            root.classList.toggle('has-programme-slide', programmeActive);
            const rect = root.getBoundingClientRect();
            // Page coordinates keep the height stable when the user scrolls.
            const available = window.innerHeight - (rect.top + window.scrollY) - 16;
            const limit = window.innerWidth >= 1024 ? 440 : 480;
            const height = Math.max(160, Math.floor(Math.min(rect.width, available, limit)));
            const value = `${height}px`;
            if (root.style.getPropertyValue('--programme-height') !== value) {
                root.style.setProperty('--programme-height', value);
            }
            // Do not reset transition duration here: cancelling Swiper's fade
            // prevents its transition-end cleanup and can lock navigation.
            if (programmeActive) swiper.updateAutoHeight();
        }
        function schedule() {
            if (!pending) pending = requestAnimationFrame(sync);
        }
        swiper.on('slideChange', schedule);
        swiper.on('slideChangeTransitionEnd', schedule);
        swiper.on('resize', schedule);
        window.addEventListener('resize', schedule, { passive: true });
        // The prayer banner and date-driven ribbon can settle after DOM ready.
        for (const image of root.querySelectorAll('.programme-artwork')) {
            image.addEventListener('load', schedule, { once: true });
        }
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
        if ('ResizeObserver' in window) {
            const observer = new ResizeObserver(schedule);
            for (const selector of ['.header', '.prayer-banner', '#event-notification-bar']) {
                const element = document.querySelector(selector);
                if (element) observer.observe(element);
            }
        }
        sync();
        window.setTimeout(schedule, 1000);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialiseProgrammeSlides);
    } else {
        initialiseProgrammeSlides();
    }
})();
