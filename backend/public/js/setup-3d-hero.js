(function () {
  'use strict';
  const hero = document.querySelector('.studio-design-hero');
  if (!hero) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let visible = true;
  let frame = 0;
  function resetPosition() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    hero.style.removeProperty('--hero-x');
    hero.style.removeProperty('--hero-y');
  }
  function updateMotion() {
    hero.dataset.paused = String(reducedMotion.matches || document.hidden || !visible);
    if (hero.dataset.paused === 'true' || !finePointer.matches) resetPosition();
  }
  hero.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || hero.dataset.paused === 'true') return;
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const bounds = hero.getBoundingClientRect();
      hero.style.setProperty('--hero-x', ((event.clientX - bounds.left) / bounds.width - .5) * 36 + 'px');
      hero.style.setProperty('--hero-y', ((event.clientY - bounds.top) / bounds.height - .5) * 20 + 'px');
      frame = 0;
    });
  });
  hero.addEventListener('pointerleave', resetPosition);
  reducedMotion.addEventListener('change', updateMotion);
  finePointer.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  if (window.IntersectionObserver) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateMotion();
    }).observe(hero);
  }
  updateMotion();
})();
