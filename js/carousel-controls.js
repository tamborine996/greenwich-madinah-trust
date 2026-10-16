/* Homepage carousel reading controls (16 Oct 2026), following the W3C carousel guidance:
   a pause / play button beside the slide dots, and rotation stops while keyboard focus is inside
   the carousel. Reduced-motion visitors start paused (the existing script already stops autoplay). */
(() => {
    'use strict';

    function init() {
        const frame = document.querySelector('.hero-carousel-frame');
        const swiper = window.heroSwiper;
        if (!frame || !swiper || !swiper.autoplay) return;

        const PAUSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>';
        const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'carousel-toggle';
        frame.appendChild(button);

        let pausedByVisitor = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function render() {
            const running = swiper.autoplay.running && !swiper.autoplay.paused;
            button.innerHTML = running ? PAUSE_ICON : PLAY_ICON;
            button.setAttribute('aria-label', running ? 'Pause the slideshow' : 'Play the slideshow');
        }

        button.addEventListener('click', () => {
            if (swiper.autoplay.running && !swiper.autoplay.paused) {
                swiper.autoplay.stop();
                pausedByVisitor = true;
            } else {
                swiper.autoplay.start();
                pausedByVisitor = false;
            }
            render();
        });

        // Keyboard focus on the slides or arrows holds them still; leaving resumes unless the visitor paused.
        frame.addEventListener('focusin', event => {
            if (event.target !== button) {
                swiper.autoplay.stop();
                render();
            }
        });
        frame.addEventListener('focusout', event => {
            if (!frame.contains(event.relatedTarget) && !pausedByVisitor) {
                swiper.autoplay.start();
                render();
            }
        });

        swiper.on('autoplayStart', render);
        swiper.on('autoplayStop', render);
        render();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
