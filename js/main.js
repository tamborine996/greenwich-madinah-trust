/**
 * Main JavaScript for Greenwich Madina Trust Website
 */

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    initMobileMenu();

    // Note: Hero Carousel is now handled by Swiper.js (initialized in index.html)

    // FAQ Accordions
    initFaqAccordions();

    // Smooth scroll for anchor links
    initSmoothScroll();

    // Form validation
    initFormValidation();

    // Dynamic footer year
    initCurrentYear();

    // Rabi al-Awwal seasonal detailing (automatically expires after day 30)
    initRabiAlAwwalSeason();
});

/**
 * Hero Carousel
 */
function initHeroCarousel() {
    const track = document.getElementById('carousel-track');
    // Support both full-width and compact carousel slides
    let slides = document.querySelectorAll('.carousel-slide-compact');
    if (slides.length === 0) {
        slides = document.querySelectorAll('.carousel-slide');
    }
    const dots = document.querySelectorAll('.carousel-dot');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    if (!track || slides.length === 0) return;

    let currentSlide = 0;
    let autoPlayInterval;
    const autoPlayDelay = 10000; // 10 seconds between slides

    // Go to specific slide
    function goToSlide(index) {
        // Handle wrap-around
        if (index >= slides.length) index = 0;
        if (index < 0) index = slides.length - 1;

        currentSlide = index;
        // Fade transition handled by CSS - no transform needed

        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });

        // Update slides active state
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === currentSlide);
        });
    }

    // Next slide
    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    // Previous slide
    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    // Start auto-play
    function startAutoPlay() {
        stopAutoPlay();
        autoPlayInterval = setInterval(nextSlide, autoPlayDelay);
    }

    // Stop auto-play
    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
        }
    }

    // Event listeners
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            startAutoPlay(); // Reset timer on manual navigation
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            startAutoPlay(); // Reset timer on manual navigation
        });
    }

    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
            startAutoPlay(); // Reset timer on manual navigation
        });
    });

    // Pause on hover
    track.addEventListener('mouseenter', stopAutoPlay);
    track.addEventListener('mouseleave', startAutoPlay);

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoPlay();
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoPlay();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide(); // Swipe left = next
            } else {
                prevSlide(); // Swipe right = prev
            }
        }
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        const carousel = document.getElementById('hero-carousel');
        if (!carousel) return;

        // Only respond if carousel is in viewport
        const rect = carousel.getBoundingClientRect();
        const inViewport = rect.top < window.innerHeight && rect.bottom > 0;

        if (inViewport) {
            if (e.key === 'ArrowLeft') {
                prevSlide();
                startAutoPlay();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
                startAutoPlay();
            }
        }
    });

    // Start auto-play on load
    startAutoPlay();
}

/**
 * Mobile Menu
 */
function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const nav = document.getElementById('main-nav');

    if (toggle && nav) {
        toggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            toggle.setAttribute('aria-expanded', nav.classList.contains('active'));
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!nav.contains(e.target) && !toggle.contains(e.target)) {
                nav.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Close menu when clicking a link
        nav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                nav.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }
}

/**
 * FAQ Accordions
 */
function initFaqAccordions() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        if (question) {
            question.addEventListener('click', function() {
                // Close other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });

                // Toggle current item
                item.classList.toggle('active');
            });
        }
    });
}

/**
 * Dynamic Footer Year
 */
function initCurrentYear() {
    const currentYear = new Date().getFullYear();
    document.querySelectorAll('[data-current-year]').forEach(el => {
        el.textContent = currentYear;
    });
}

/**
 * Dress the site for Rabi al-Awwal while the official GMT Hijri calendar
 * reports days 1–30 of the month. The prayer banner remains untouched and the
 * seasonal treatment occupies the established strip immediately beneath it.
 */
async function initRabiAlAwwalSeason() {
    if (!document.body.hasAttribute('data-seasonal-shell')) return;
    if (typeof PrayerTimes === 'undefined' || typeof PrayerTimes.getHijriDate !== 'function') return;

    try {
        const hijri = await PrayerTimes.getHijriDate();
        const month = String(hijri.month || '').toLowerCase().replace(/[^a-z]/g, '');
        const day = Number(hijri.day);
        const isRabiAlAwwal = month === 'rabialawwal' && day >= 1 && day <= 30;

        document.body.dataset.rabiSeason = isRabiAlAwwal ? 'active' : 'inactive';
        document.body.classList.toggle('season-rabi-al-awwal', isRabiAlAwwal);
        document.querySelectorAll('.rabi-season-banner, .rabi-nur-band, .rabi-nur-veil, .rabi-nur-garland')
            .forEach(element => element.remove());
        if (!isRabiAlAwwal) return;

        const prayerBanner = document.querySelector('.prayer-banner');
        if (!prayerBanner) return;

        const assets = 'images/rabi/';

        // The radiance band with the Na'layn Sharif crest in its apron of light
        const band = document.createElement('aside');
        band.className = 'rabi-nur-band';
        band.setAttribute('aria-labelledby', 'rabi-nur-title');
        band.innerHTML = `
            <div class="rabi-nur-rays-clip" aria-hidden="true">
                <img class="rabi-nur-rays" src="${assets}rays.svg" alt="">
                <img class="rabi-nur-rays-m" src="${assets}rays-m.svg" alt="">
            </div>
            <div class="rabi-nur-copy">
                <span class="rabi-nur-month"><i aria-hidden="true">✦</i> Rabiʿ al-Awwal <b class="rabi-nur-year"></b> <i aria-hidden="true">✦</i></span>
                <div class="rabi-nur-row">
                    <p class="rabi-nur-main" id="rabi-nur-title">Honouring the month in which the Prophet Muhammad&nbsp;ﷺ was born</p>
                    <a class="rabi-nur-link" href="news.html#post-1">Read about our Mawlid event <span class="rabi-nur-arrow" aria-hidden="true">→</span></a>
                </div>
            </div>
            <span class="rabi-nur-rule" aria-hidden="true"></span>
            <span class="rabi-nur-apron" aria-hidden="true"></span>
            <img class="rabi-nur-apron-rays" src="${assets}apron-rays.svg" alt="" aria-hidden="true">
            <span class="rabi-nur-crest-glow" aria-hidden="true"></span>
            <img class="rabi-nur-crest" src="${assets}nalayn.png" alt="" aria-hidden="true">`;
        band.querySelector('.rabi-nur-year').textContent = `${hijri.year || ''} AH`;
        prayerBanner.insertAdjacentElement('afterend', band);

        // Fore-edge veils (desktop widths only, via CSS)
        ['l', 'r'].forEach(side => {
            const veil = document.createElement('span');
            veil.className = `rabi-nur-veil rabi-nur-veil-${side}`;
            veil.setAttribute('aria-hidden', 'true');
            document.body.appendChild(veil);
        });

        // Garlands of light down both margins (phone drawings below 1300px)
        const garlands = ['l', 'r'].map(side => {
            const garland = document.createElement('div');
            garland.className = `rabi-nur-garland rabi-nur-garland-${side}`;
            garland.setAttribute('aria-hidden', 'true');
            garland.innerHTML = `
                <img class="rabi-nur-garland-spray-d" src="${assets}spray.svg" alt="">
                <img class="rabi-nur-garland-spray-m" src="${assets}spray-m.svg" alt="">
                <div class="rabi-nur-garland-line"></div>
                <img class="rabi-nur-garland-end-d" src="${assets}garland-end.svg" alt="">
                <img class="rabi-nur-garland-end-m" src="${assets}garland-end-m.svg" alt="">`;
            document.body.appendChild(garland);
            return garland;
        });

        // The garlands span from the band's corners to just above the footer
        const sizeGarlands = () => {
            const footer = document.querySelector('.footer') || document.querySelector('footer');
            const mobile = window.innerWidth < 1300;
            let on = !!footer && document.body.contains(band);
            if (on) {
                const top = band.getBoundingClientRect().bottom + window.scrollY - (mobile ? 10 : 18);
                const height = footer.getBoundingClientRect().top + window.scrollY - top - 44;
                on = height > 900;
                garlands.forEach(garland => {
                    garland.style.top = `${top}px`;
                    garland.style.height = `${height}px`;
                });
            }
            garlands.forEach(garland => garland.classList.toggle('rabi-nur-garland-on', on));
        };
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(sizeGarlands, 200);
        });
        if (document.readyState === 'complete') {
            sizeGarlands();
            setTimeout(sizeGarlands, 700);
        } else {
            window.addEventListener('load', () => {
                sizeGarlands();
                setTimeout(sizeGarlands, 700);
            });
        }
        setTimeout(sizeGarlands, 1600);
    } catch (error) {
        console.warn('Could not apply the Rabi al-Awwal seasonal theme:', error);
    }
}

/**
 * Smooth Scroll
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            if (href && href !== '#' && href.startsWith('#')) {
                e.preventDefault();

                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

/**
 * Form Validation
 */
function initFormValidation() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            let isValid = true;

            // Check required fields
            const requiredFields = form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                } else {
                    field.classList.remove('error');
                }
            });

            // Check email fields
            const emailFields = form.querySelectorAll('input[type="email"]');
            emailFields.forEach(field => {
                if (field.value && !isValidEmail(field.value)) {
                    isValid = false;
                    field.classList.add('error');
                }
            });

            if (!isValid) {
                e.preventDefault();
                alert('Please fill in all required fields correctly.');
            }
        });
    });
}

/**
 * Email validation helper
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Format date helper
 */
function formatDate(date) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return new Date(date).toLocaleDateString('en-GB', options);
}

/**
 * Debounce helper
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
