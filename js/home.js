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
       3. KHÔNG GIAN LÀM VIỆC — CAROUSEL
    -------------------------------------------------------- */

    const initStudioCarousel = () => {
        const carousel = document.querySelector('[data-studio-carousel]');

        if (!carousel || carousel.dataset.studioInitialized) return;

        const viewport = carousel.querySelector('[data-studio-viewport]');
        const track = carousel.querySelector('[data-studio-track]');
        const originals = [...carousel.querySelectorAll('[data-studio-slide]')];
        const controls = carousel.querySelector('[data-studio-controls]');
        const previous = carousel.querySelector('[data-studio-prev]');
        const next = carousel.querySelector('[data-studio-next]');
        const toggle = carousel.querySelector('[data-studio-toggle]');
        const toggleLabel = carousel.querySelector('[data-studio-toggle-label]');
        const dots = [...carousel.querySelectorAll('[data-studio-dot]')];
        const title = carousel.querySelector('[data-studio-title]');
        const description = carousel.querySelector('[data-studio-description]');
        const current = carousel.querySelector('[data-studio-current]');
        const total = carousel.querySelector('[data-studio-total]');
        const progress = carousel.querySelector('[data-studio-progress]');
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

        if (!viewport || !track || !originals.length) return;

        carousel.dataset.studioInitialized = 'true';

        const holdDuration = 5000;
        const transitionDuration = 800;
        let slides = [];
        let physicalSlides = [];
        let activeDots = [];
        let activeIndex = 0;
        let physicalIndex = 0;
        let autoplayTimer = null;
        let transitionTimer = null;
        let resizeFrame = null;
        let ready = false;
        let loading = false;
        let animating = false;
        let inView = false;
        let hovered = false;
        let focused = carousel.contains(document.activeElement);
        let userPaused = false;
        let pageActive = true;
        let gesture = null;

        const updateToggle = () => {
            if (!toggle) return;

            toggle.disabled = motion.matches;
            toggle.setAttribute('aria-pressed', String(userPaused));
            const label = motion.matches
                ? 'Giảm chuyển động'
                : userPaused ? 'Tiếp tục' : 'Tạm dừng';

            if (toggleLabel) toggleLabel.textContent = label;
            toggle.setAttribute('aria-label', motion.matches
                ? 'Tự động chuyển ảnh đã tắt theo cài đặt giảm chuyển động'
                : `${label} tự động chuyển ảnh`);
        };

        const stopAutoplay = () => {
            window.clearTimeout(autoplayTimer);
            autoplayTimer = null;
            carousel.classList.remove('is-playing');
            if (progress) progress.setAttribute('aria-valuenow', '0');
        };

        const canPlay = () => ready && slides.length > 1 && inView &&
            pageActive && !document.hidden && !motion.matches && !hovered &&
            !focused && !gesture && !userPaused && !animating;

        const syncAutoplay = () => {
            updateToggle();

            if (!canPlay()) {
                stopAutoplay();
                return;
            }

            if (autoplayTimer !== null) return;

            carousel.style.setProperty('--studio-duration', `${holdDuration}ms`);
            // Restart the progress animation with the same clock as this timeout.
            carousel.classList.remove('is-playing');
            void carousel.offsetWidth;
            carousel.classList.add('is-playing');
            autoplayTimer = window.setTimeout(() => {
                autoplayTimer = null;
                carousel.classList.remove('is-playing');
                if (canPlay()) moveBy(1);
            }, holdDuration);
        };

        const renderState = () => {
            const slide = slides[activeIndex];

            physicalSlides.forEach((item, index) => {
                item.classList.toggle('is-active', index === physicalIndex);
            });
            slides.forEach((item, index) => {
                item.setAttribute('aria-hidden', String(index !== activeIndex));
            });
            activeDots.forEach((dot, index) => {
                dot.classList.toggle('is-active', index === activeIndex);
                dot.setAttribute('aria-pressed', String(index === activeIndex));
                if (index === activeIndex) dot.setAttribute('aria-current', 'true');
                else dot.removeAttribute('aria-current');
            });

            carousel.dataset.studioActive = String(activeIndex);
            if (title) title.textContent = slide.dataset.title || '';
            if (description) description.textContent = slide.dataset.description || '';
            if (current) current.textContent = String(activeIndex + 1).padStart(2, '0');
            if (total) total.textContent = String(slides.length).padStart(2, '0');
        };

        const positionTrack = instant => {
            const slide = physicalSlides[physicalIndex];
            if (!slide) return;

            track.style.transition = instant ? 'none' : '';
            const offset = slide.offsetLeft + slide.offsetWidth / 2 -
                viewport.clientWidth / 2;
            track.style.transform = `translate3d(${-offset}px, 0, 0)`;

            if (instant) {
                void track.offsetWidth;
                track.style.transition = '';
            }
        };

        const settleTransition = () => {
            if (!animating) return;

            window.clearTimeout(transitionTimer);
            transitionTimer = null;
            animating = false;
            track.classList.remove('is-animating');
            // All navigation starts from the middle group after an invisible reset.
            track.classList.add('is-resetting');
            physicalIndex = slides.length + activeIndex;
            renderState();
            positionTrack(true);
            void track.offsetWidth;
            track.classList.remove('is-resetting');
            syncAutoplay();
        };

        const moveBy = delta => {
            if (!ready || animating || slides.length < 2 || !delta) return;

            stopAutoplay();
            activeIndex = (activeIndex + delta + slides.length) % slides.length;
            physicalIndex += delta;
            animating = !motion.matches;
            track.classList.toggle('is-animating', animating);
            renderState();
            positionTrack(!animating);

            if (animating) {
                transitionTimer = window.setTimeout(settleTransition,
                    transitionDuration + 100);
            } else {
                physicalIndex = slides.length + activeIndex;
                renderState();
                positionTrack(true);
                syncAutoplay();
            }
        };

        const makeClone = slide => {
            const clone = slide.cloneNode(true);
            clone.dataset.studioClone = 'true';
            clone.setAttribute('aria-hidden', 'true');
            clone.setAttribute('inert', '');
            [clone, ...clone.querySelectorAll('[id]')].forEach(item => {
                item.removeAttribute('id');
            });
            clone.querySelectorAll('a, button, input, select, textarea, [tabindex]')
                .forEach(item => item.setAttribute('tabindex', '-1'));
            clone.querySelectorAll('img').forEach(img => {
                img.alt = '';
                img.loading = 'eager';
                img.draggable = false;
            });
            return clone;
        };

        const loadImage = slide => new Promise(resolve => {
            const img = slide.querySelector('img');
            if (!img) {
                resolve(false);
                return;
            }

            let settled = false;
            const finish = success => {
                if (settled) return;
                settled = true;
                window.clearTimeout(deadline);
                img.removeEventListener('load', loaded);
                img.removeEventListener('error', failed);
                resolve(success);
            };
            const failed = () => finish(false);
            const loaded = () => {
                if (!img.naturalWidth) {
                    finish(false);
                } else if (typeof img.decode === 'function') {
                    img.decode().then(() => finish(true), () => finish(img.naturalWidth > 0));
                } else {
                    finish(true);
                }
            };
            const deadline = window.setTimeout(() => finish(false), 10000);

            img.addEventListener('load', loaded);
            img.addEventListener('error', failed);
            img.draggable = false;
            img.loading = 'eager';
            if (img.complete) loaded();
        });

        const prepare = async () => {
            if (loading) return;
            loading = true;

            const results = await Promise.all(originals.map(loadImage));

            slides = originals.filter((slide, index) => {
                const dot = dots.find(item => Number(item.dataset.studioDot) === index);
                if (!results[index]) {
                    slide.remove();
                    if (dot) dot.hidden = true;
                    return false;
                }
                if (dot) activeDots.push(dot);
                return true;
            });

            if (!slides.length) {
                viewport.hidden = true;
                if (controls) controls.hidden = true;
                const fallback = carousel.querySelector('[data-studio-fallback]');
                if (fallback) fallback.hidden = false;
                if (title) title.textContent = 'Góc làm việc của riêng bạn';
                if (description) {
                    description.textContent = 'Bắt đầu bố trí và khám phá không gian phù hợp với bạn.';
                }
                if (current) current.textContent = '00';
                if (total) total.textContent = '00';
                carousel.classList.add('is-unavailable');
                return;
            }

            if (slides.length > 1) {
                const before = document.createDocumentFragment();
                const after = document.createDocumentFragment();
                slides.forEach(slide => {
                    before.append(makeClone(slide));
                    after.append(makeClone(slide));
                });
                track.prepend(before);
                track.append(after);
            }

            physicalSlides = [...track.querySelectorAll('[data-studio-slide]')];
            physicalIndex = slides.length > 1 ? slides.length : 0;
            ready = true;
            hovered = carousel.matches(':hover') && window.matchMedia('(hover: hover)').matches;
            focused = carousel.contains(document.activeElement);
            carousel.classList.add('is-enhanced');
            if (controls) controls.hidden = slides.length < 2;
            renderState();
            positionTrack(true);
            syncAutoplay();
        };

        previous?.addEventListener('click', () => moveBy(-1));
        next?.addEventListener('click', () => moveBy(1));
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const target = activeDots.indexOf(dot);
                if (target < 0) return;
                let delta = target - activeIndex;
                if (delta > slides.length / 2) delta -= slides.length;
                if (delta < -slides.length / 2) delta += slides.length;
                moveBy(delta);
            });
        });
        toggle?.addEventListener('click', () => {
            userPaused = !userPaused;
            syncAutoplay();
        });

        track.addEventListener('transitionend', event => {
            if (event.target === track && event.propertyName === 'transform') {
                settleTransition();
            }
        });
        carousel.addEventListener('pointerenter', event => {
            if (event.pointerType !== 'mouse') return;
            hovered = true;
            syncAutoplay();
        });
        carousel.addEventListener('pointerleave', event => {
            if (event.pointerType !== 'mouse') return;
            hovered = false;
            syncAutoplay();
        });
        carousel.addEventListener('focusin', () => {
            focused = true;
            syncAutoplay();
        });
        carousel.addEventListener('focusout', event => {
            focused = carousel.contains(event.relatedTarget);
            syncAutoplay();
        });

        viewport.addEventListener('pointerdown', event => {
            if (!ready || event.isPrimary === false || event.button > 0) return;
            gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
            syncAutoplay();
        }, { passive: true });
        const finishGesture = (event, cancelled = false) => {
            if (!gesture || gesture.id !== event.pointerId) return;
            const dx = event.clientX - gesture.x;
            const dy = event.clientY - gesture.y;
            gesture = null;
            if (!cancelled && Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
                moveBy(dx < 0 ? 1 : -1);
            }
            syncAutoplay();
        };
        window.addEventListener('pointerup', event => finishGesture(event), { passive: true });
        window.addEventListener('pointercancel', event => finishGesture(event, true), { passive: true });
        viewport.addEventListener('dragstart', event => event.preventDefault());

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) gesture = null;
            syncAutoplay();
        });
        const motionChanged = () => {
            if (motion.matches) settleTransition();
            syncAutoplay();
        };
        if (motion.addEventListener) motion.addEventListener('change', motionChanged);
        else motion.addListener(motionChanged);

        const scheduleReposition = () => {
            if (!pageActive) return;
            if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
            resizeFrame = window.requestAnimationFrame(() => {
                resizeFrame = null;
                if (!ready) return;
                settleTransition();
                positionTrack(true);
            });
        };
        window.addEventListener('resize', scheduleReposition, { passive: true });
        // Slide widths can settle after the window resize event at a breakpoint.
        const geometryObserver = 'ResizeObserver' in window
            ? new ResizeObserver(scheduleReposition)
            : null;
        const observeGeometry = () => {
            if (!geometryObserver) return;
            geometryObserver.observe(viewport);
            originals.forEach(slide => geometryObserver.observe(slide));
        };
        observeGeometry();
        window.addEventListener('pagehide', () => {
            pageActive = false;
            geometryObserver?.disconnect();
            gesture = null;
            stopAutoplay();
            settleTransition();
            if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
            resizeFrame = null;
        });
        window.addEventListener('pageshow', () => {
            pageActive = true;
            observeGeometry();
            hovered = carousel.matches(':hover') && window.matchMedia('(hover: hover)').matches;
            focused = carousel.contains(document.activeElement);
            positionTrack(true);
            syncAutoplay();
        });

        if ('IntersectionObserver' in window) {
            const nearObserver = new IntersectionObserver(entries => {
                if (!entries.some(entry => entry.isIntersecting)) return;
                nearObserver.disconnect();
                prepare();
            }, { rootMargin: '400px 0px' });
            const viewObserver = new IntersectionObserver(entries => {
                const entry = entries[entries.length - 1];
                inView = entry.isIntersecting && entry.intersectionRatio >= 0.2;
                syncAutoplay();
            }, { threshold: [0, 0.2] });
            nearObserver.observe(carousel);
            viewObserver.observe(viewport);
        } else {
            const checkVisibility = () => {
                const bounds = viewport.getBoundingClientRect();
                const height = Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, 0);
                inView = height > 0 && height >= bounds.height * 0.2;
                syncAutoplay();
            };
            window.addEventListener('scroll', checkVisibility, { passive: true });
            window.addEventListener('resize', checkVisibility, { passive: true });
            checkVisibility();
            prepare();
        }
    };


    /* --------------------------------------------------------
       4. KHỞI TẠO TRANG CHỦ
    -------------------------------------------------------- */

    const initHomepage = () => {
        if (!document.body.classList.contains('home-page')) {
            return;
        }

        // Banner nằm trong HTML nên khởi tạo ngay.
        initPromoCarousel();

        initStudioCarousel();

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
