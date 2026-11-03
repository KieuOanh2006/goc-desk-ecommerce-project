/* ==========================================================================
   GÓC DESK — HOMEPAGE INTERACTIONS
   1. Announcement ticker
   2. Promotional banner carousel
   ========================================================================== */

(() => {
    'use strict';

    const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    let announcementInitialized = false;
    let carouselInitialized = false;

    /* --------------------------------------------------------
       1. THANH SLOGAN / THÔNG BÁO
       Chờ header component tải xong mới khởi tạo.
    -------------------------------------------------------- */

    const initAnnouncement = () => {
        if (
            announcementInitialized ||
            !document.body.classList.contains('home-page')
        ) return;

        const announcement = document.querySelector(
            '[data-home-announcement]'
        );

        const messageElement = announcement?.querySelector(
            '[data-announcement-message]'
        );

        if (!announcement || !messageElement) return;

        announcementInitialized = true;

        const messages = [
            'Một góc nhỏ, nhiều niềm vui · Miễn phí vận chuyển từ 499.000đ',
            'Ưu đãi 10% cho đơn đầu tiên từ 500.000đ · Mã CHAMGOC10',
            'Sắp xếp góc học tập, làm việc theo cách của riêng bạn',
            'Trải nghiệm thiết kế góc 3D miễn phí cùng Góc Desk'
        ];

        let currentIndex = 0;
        let timer = null;

        const stop = () => {
            window.clearInterval(timer);
            timer = null;
        };

        const start = () => {
            if (reduceMotion || document.hidden || timer) return;

            timer = window.setInterval(() => {
                currentIndex = (currentIndex + 1) % messages.length;

                messageElement.classList.add('is-changing');

                window.setTimeout(() => {
                    messageElement.textContent = messages[currentIndex];
                    messageElement.classList.remove('is-changing');
                }, 180);

            }, 3000);
        };

        announcement.addEventListener('mouseenter', stop);
        announcement.addEventListener('mouseleave', start);
        announcement.addEventListener('focusin', stop);

        announcement.addEventListener('focusout', event => {
            if (!announcement.contains(event.relatedTarget)) {
                start();
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stop();
            } else {
                start();
            }
        });

        start();
    };


    /* --------------------------------------------------------
       2. BANNER PHỤ CAROUSEL
    -------------------------------------------------------- */

    const initPromoCarousel = () => {
        if (carouselInitialized) return;

        const carousel = document.querySelector(
            '[data-home-carousel]'
        );

        if (!carousel) return;

        const viewport = carousel.querySelector(
            '[data-carousel-viewport]'
        );

        const slides = [
            ...carousel.querySelectorAll('[data-carousel-slide]')
        ];

        const dots = [
            ...carousel.querySelectorAll('[data-carousel-dot]')
        ];

        const previousButton = carousel.querySelector(
            '[data-carousel-prev]'
        );

        const nextButton = carousel.querySelector(
            '[data-carousel-next]'
        );

        if (!viewport || !slides.length) return;

        carouselInitialized = true;

        if (slides.length <= 1) {
            carousel.querySelector('.home-promo-controls')
                ?.setAttribute('hidden', '');
            return;
        }

        let currentIndex = 0;
        let autoPlayTimer = null;
        let scrollFrame = null;

        const updateControls = () => {
            dots.forEach((dot, index) => {
                const active = index === currentIndex;

                dot.classList.toggle('is-active', active);
                dot.setAttribute('aria-pressed', String(active));
            });

            slides.forEach((slide, index) => {
                slide.classList.toggle(
                    'is-active',
                    index === currentIndex
                );
            });
        };

        const getSlidePosition = index => {
            const slide = slides[index];

            const slideRect = slide.getBoundingClientRect();
            const viewportRect = viewport.getBoundingClientRect();

            return (
                slideRect.left -
                viewportRect.left +
                viewport.scrollLeft -
                (viewport.clientWidth - slide.clientWidth) / 2
            );
        };

        const goToSlide = index => {
            currentIndex =
                (index + slides.length) % slides.length;

            viewport.scrollTo({
                left: getSlidePosition(currentIndex),
                behavior: reduceMotion ? 'auto' : 'smooth'
            });

            updateControls();
        };

        const syncActiveSlide = () => {
            const viewportRect = viewport.getBoundingClientRect();

            const viewportCenter =
                viewportRect.left + viewport.clientWidth / 2;

            let nearestIndex = 0;
            let shortestDistance = Infinity;

            slides.forEach((slide, index) => {
                const slideRect = slide.getBoundingClientRect();

                const slideCenter =
                    slideRect.left + slideRect.width / 2;

                const distance = Math.abs(
                    viewportCenter - slideCenter
                );

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestIndex = index;
                }
            });

            currentIndex = nearestIndex;
            updateControls();
        };

        /* Nút trái/phải */

        previousButton?.addEventListener('click', () => {
            goToSlide(currentIndex - 1);
        });

        nextButton?.addEventListener('click', () => {
            goToSlide(currentIndex + 1);
        });

        /* Chấm điều hướng */

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                goToSlide(index);
            });
        });

        /* Vuốt và cuộn ngang */

        viewport.addEventListener('scroll', () => {
            if (scrollFrame !== null) {
                window.cancelAnimationFrame(scrollFrame);
            }

            scrollFrame = window.requestAnimationFrame(() => {
                syncActiveSlide();
                scrollFrame = null;
            });
        }, { passive: true });

        /* Thay đổi kích thước màn hình */

        window.addEventListener('resize', () => {
            goToSlide(currentIndex);
        }, { passive: true });

        /* Tự động chuyển slide */

        const stopAutoPlay = () => {
            window.clearInterval(autoPlayTimer);
            autoPlayTimer = null;
        };

        const startAutoPlay = () => {
            if (reduceMotion || document.hidden || autoPlayTimer) {
                return;
            }

            autoPlayTimer = window.setInterval(() => {
                goToSlide(currentIndex + 1);
            }, 6000);
        };

        carousel.addEventListener('mouseenter', stopAutoPlay);
        carousel.addEventListener('mouseleave', startAutoPlay);
        carousel.addEventListener('focusin', stopAutoPlay);

        carousel.addEventListener('focusout', event => {
            if (!carousel.contains(event.relatedTarget)) {
                startAutoPlay();
            }
        });

        carousel.addEventListener('pointerdown', stopAutoPlay);

        window.addEventListener('pointerup', startAutoPlay, {
            passive: true
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAutoPlay();
            } else {
                startAutoPlay();
            }
        });

        updateControls();

        window.requestAnimationFrame(() => {
            goToSlide(0);
            startAutoPlay();
        });
    };


    /* --------------------------------------------------------
       3. KHỞI TẠO TRANG CHỦ
    -------------------------------------------------------- */

    const initHomepage = () => {
        if (!document.body.classList.contains('home-page')) {
            return;
        }

        // Banner nằm trong HTML nên khởi tạo ngay.
        initPromoCarousel();

        // Thử khởi tạo thông báo nếu header đã có.
        initAnnouncement();
    };

    // Header tải xong thì khởi tạo thanh thông báo.
    document.addEventListener('site-shell:loaded', initAnnouncement);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHomepage, {
            once: true
        });
    } else {
        initHomepage();
    }

})();