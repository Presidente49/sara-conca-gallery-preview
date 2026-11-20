/**
 * One scroll-position timeline for the continuous gallery opening.
 * Progress follows the sticky stage's actual height on every screen. No
 * animation loop runs while idle, and the artwork itself is never distorted.
 */
export function initMotion() {
  const journey = document.getElementById('journey');
  const stage = document.getElementById('dream-stage');
  const openingImage = document.getElementById('gallery-opening');
  const softening = document.getElementById('hero-softening');
  const detailLayer = document.getElementById('detail-layer');
  const openingCopy = document.querySelector('.opening-copy');
  const detailCopy = document.querySelector('.detail-copy');
  if (!journey || !stage || !openingImage || !detailLayer || !openingCopy || !detailCopy) {
    return () => {};
  }

  stage.dataset.motionEngine = 'scroll';

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const interval = (progress, start, end) => clamp((progress - start) / (end - start));
  const initialBounds = stage.getBoundingClientRect();
  let isVisible = initialBounds.bottom > 0 && initialBounds.top < innerHeight;
  let frameId = 0;
  let destroyed = false;

  const motionEnabled = () =>
    !destroyed && !reducedMotion.matches &&
    document.documentElement.dataset.motion !== 'off';

  function clearStyles() {
    openingImage.style.removeProperty('transform');
    softening?.style.removeProperty('transform');
    detailLayer.style.removeProperty('opacity');
    openingCopy.style.removeProperty('opacity');
    detailCopy.style.removeProperty('opacity');
    stage.style.removeProperty('--gallery-progress');
  }

  function cancelUpdate() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function update() {
    frameId = 0;
    if (!motionEnabled()) { clearStyles(); return; }
    if (document.hidden || !isVisible) return;

    const bounds = journey.getBoundingClientRect();
    if (matchMedia('(max-width:900px)').matches) {
      const drift = clamp(-bounds.top / Math.max(1, bounds.height));
      openingImage.style.transform = `scale(${(1 + drift * 0.025).toFixed(4)})`;
      if (softening) softening.style.transform = openingImage.style.transform;
      detailLayer.style.opacity = '0';
      openingCopy.style.opacity = '1';
      detailCopy.style.opacity = '0';
      stage.style.setProperty('--gallery-progress', '0');
      return;
    }
    const progress = clamp(-bounds.top / Math.max(1, bounds.height - stage.getBoundingClientRect().height));
    stage.style.setProperty('--gallery-progress', progress.toFixed(4));
    openingImage.style.transform = `scale(${(1 + progress * 0.08).toFixed(4)}) translate3d(${(-progress * 1.2).toFixed(3)}%, ${(-progress * 0.6).toFixed(3)}%, 0)`;
    if (softening) softening.style.transform = openingImage.style.transform;
    detailLayer.style.opacity = interval(progress, 0.3, 0.75).toFixed(4);
    openingCopy.style.opacity = (1 - interval(progress, 0.2, 0.45)).toFixed(4);
    detailCopy.style.opacity = interval(progress, 0.55, 0.8).toFixed(4);
  }

  function requestUpdate() {
    if (!motionEnabled()) {
      cancelUpdate();
      clearStyles();
      return;
    }
    if (document.hidden || !isVisible || frameId) return;
    frameId = requestAnimationFrame(update);
  }

  function syncState() {
    if (document.hidden || !isVisible) cancelUpdate();
    requestUpdate();
  }

  const visibilityObserver = new IntersectionObserver((entries) => {
    isVisible = entries[0].isIntersecting;
    syncState();
  }, { threshold: 0 });
  visibilityObserver.observe(stage);

  const preferenceObserver = new MutationObserver(syncState);
  preferenceObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-motion'],
  });

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  window.addEventListener('motionchange', syncState);
  document.addEventListener('motionchange', syncState);
  document.addEventListener('visibilitychange', syncState);
  reducedMotion.addEventListener('change', syncState);
  requestUpdate();

  return function cleanupMotion() {
    destroyed = true;
    cancelUpdate();
    visibilityObserver.disconnect();
    preferenceObserver.disconnect();
    window.removeEventListener('scroll', requestUpdate);
    window.removeEventListener('resize', requestUpdate);
    window.removeEventListener('motionchange', syncState);
    document.removeEventListener('motionchange', syncState);
    document.removeEventListener('visibilitychange', syncState);
    reducedMotion.removeEventListener('change', syncState);
    clearStyles();
    delete stage.dataset.motionEngine;
  };
}
