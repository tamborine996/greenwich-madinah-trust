/**
 * Main JavaScript for Greenwich Madinah Trust Website
 */

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    initMobileMenu();

    // Hero Carousel
    initHeroCarousel();

    // FAQ Accordions
    initFaqAccordions();

    // Smooth scroll for anchor links
    initSmoothScroll();

    // Form validation
    initFormValidation();
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
 * Smooth Scroll
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            if (href !== '#') {
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
