import { artworkImages } from "./artwork-images.js";
import { initMotion } from './motion.js?v=5';
import './artwork-protection.js';

import { artworks } from "./artworks.js";


const imagePath = (work) => artworkImages[work.id];
const inquiryPath = (work) => `mailto:SaraConca@me.com?subject=${encodeURIComponent(`Artwork inquiry — ${work.title}`)}&body=${encodeURIComponent(`Hello Sara,\n\nI would like to ask about ${work.sold ? 'works related to ' : 'availability and pricing for '}${work.title} (${work.dimensions}).\n\nMy location:\n\n`)}`;
const grid = document.getElementById('artwork-grid');
const counter = document.getElementById('collection-count');
const dialog = document.getElementById('art-viewer');
const viewerImage = document.getElementById('viewer-image');
const filters = [...document.querySelectorAll('.filter')];
let filtered = artworks;
let viewerWorks = artworks;
let currentWork = 0;
let previousFocus = null;

function renderCollection() {
  const fragment = document.createDocumentFragment();
  filtered.forEach(work => {
    const card = document.createElement('article');
    card.className = 'artwork-card';
    card.dataset.work = work.id;
    const button = document.createElement('a');
    button.className = 'artwork-open';
    button.href = `artworks/${work.id}.html`;
    button.dataset.art = work.id;
    button.setAttribute('aria-label', `View ${work.title}`);
    const wall = document.createElement('span');
    wall.className = 'artwork-wall';
    const image = new Image();
    image.src = imagePath(work);
    image.alt = `${work.title} by Sara Conca — ${work.medium}`;
    image.loading = 'lazy';
    image.decoding = 'async';
    wall.append(image);
    const plus = document.createElement('span');
    plus.className = 'artwork-hover';
    plus.setAttribute('aria-hidden', 'true');
    plus.textContent = '+';
    wall.append(plus);
    button.append(wall);
    const caption = document.createElement('div');
    caption.className = 'artwork-caption';
    const title = document.createElement('h3');
    title.textContent = work.title;
    const dimensions = document.createElement('span');
    dimensions.textContent = work.dimensions;
    caption.append(title, dimensions);
    const subtitle = document.createElement('div');
    subtitle.className = 'artwork-subtitle';
    const medium = document.createElement('span');
    medium.textContent = work.category === 'canvas' ? 'Oil & gold on wood' : work.category === 'sculptural' ? 'Sculptural work' : 'Mixed media on acrylic';
    const status = document.createElement('span');
    status.textContent = work.sold ? 'Sold' : 'Availability on request';
    if (work.sold) status.className = 'sold';
    subtitle.append(medium, status);
    card.append(button, caption, subtitle);
    fragment.append(card);
  });
  grid.replaceChildren(fragment);
  counter.textContent = `${filtered.length} ${filtered.length === 1 ? 'work' : 'works'}`;
}

filters.forEach(filter => filter.addEventListener('click', () => {
  const selected = filter.dataset.filter;
  filters.forEach(button => {
    const active = button === filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  filtered = artworks.filter(work => selected === 'all' || (selected === 'archive' ? work.sold : work.category === selected));
  renderCollection();
}));

function updateViewer() {
  document.getElementById('viewer-softening').setAttribute('hidden', '');
  dialog.dataset.softenRight = 'false';
  const work = viewerWorks[currentWork];
  viewerImage.src = imagePath(work);
  viewerImage.parentElement.style.setProperty('--art-backdrop', `url("${imagePath(work)}")`);
  viewerImage.alt = `${work.title} by Sara Conca — ${work.medium}`;
  document.getElementById('viewer-title').textContent = work.title;
  document.getElementById('viewer-medium').textContent = work.medium;
  document.getElementById('viewer-dimensions').textContent = work.dimensions;
  document.getElementById('viewer-status').textContent = work.sold ? 'Sold' : 'Inquire about availability';
  document.getElementById('viewer-number').textContent = `${String(currentWork + 1).padStart(2,'0')} / ${String(viewerWorks.length).padStart(2,'0')}`;
  const inquiry = document.getElementById('viewer-inquire');
  inquiry.href = inquiryPath(work);
  inquiry.firstChild.textContent = work.sold ? 'Inquire about related works ' : 'Inquire about this work ';
  const pageLink = document.getElementById('viewer-page');
  pageLink.href = `artworks/${work.id}.html`;
  pageLink.hidden = false;
  document.getElementById('viewer-previous').disabled = viewerWorks.length < 2;
  document.getElementById('viewer-next').disabled = viewerWorks.length < 2;
  document.getElementById('viewer-previous').hidden = false;
  document.getElementById('viewer-next').hidden = false;
}

function openWork(id, trigger, list = artworks) {
  viewerWorks = list;
  currentWork = viewerWorks.findIndex(work => work.id === id);
  if (currentWork < 0) return;
  previousFocus = trigger;
  dialog.dataset.kind = 'artwork';
  dialog.dataset.input = trigger.matches(':focus-visible') ? 'keyboard' : 'pointer';
  updateViewer();
  if (!dialog.open) dialog.showModal();
  document.documentElement.dataset.viewer = 'open';
  document.dispatchEvent(new CustomEvent('motionchange'));
  document.getElementById('viewer-close').focus({preventScroll:true});
}

function moveViewer(direction) {
  if (viewerWorks.length < 2) return;
  currentWork = (currentWork + direction + viewerWorks.length) % viewerWorks.length;
  updateViewer();
}
document.querySelectorAll('.artwork-trigger').forEach(trigger => trigger.addEventListener('click', () => openWork(trigger.dataset.art, trigger)));
grid.addEventListener('click', event => {
  const link = event.target.closest('a.artwork-open');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  openWork(link.dataset.art, link, filtered);
});
document.querySelectorAll('[data-photo]').forEach(trigger => trigger.addEventListener('click', () => {
  viewerWorks = [];
  previousFocus = trigger;
  dialog.dataset.kind = 'photo';
  dialog.dataset.input = trigger.matches(':focus-visible') ? 'keyboard' : 'pointer';
  const sourceImage = trigger.querySelector('img');
  const photoWidth = sourceImage?.naturalWidth || sourceImage?.width || 4;
  const photoHeight = sourceImage?.naturalHeight || sourceImage?.height || 3;
  viewerImage.parentElement.style.setProperty('--photo-ratio', `${photoWidth} / ${photoHeight}`);
  const softened = trigger.hasAttribute('data-soften-right');
  const softening = document.getElementById('viewer-softening');
  dialog.dataset.softenRight = String(softened);
  softening.toggleAttribute('hidden', !softened);
  if (softened) document.getElementById('viewer-softening-image').setAttribute('href', trigger.dataset.photo);
  viewerImage.src = trigger.dataset.photo;
  viewerImage.parentElement.style.setProperty('--art-backdrop', `url("${trigger.dataset.photo}")`);
  viewerImage.alt = trigger.dataset.photoTitle;
  document.getElementById('viewer-title').textContent = trigger.dataset.photoTitle;
  document.getElementById('viewer-number').textContent = '';
  document.getElementById('viewer-medium').textContent = 'Installation photograph';
  document.getElementById('viewer-dimensions').textContent = '';
  document.getElementById('viewer-status').textContent = '';
  document.getElementById('viewer-page').hidden = true;
  const inquiry = document.getElementById('viewer-inquire');
  inquiry.textContent = 'Inquire about a painting';
  inquiry.href = 'mailto:SaraConca@me.com?subject=Painting%20inquiry';
  document.getElementById('viewer-previous').hidden = true;
  document.getElementById('viewer-next').hidden = true;
  dialog.showModal();
  document.documentElement.dataset.viewer = 'open';
  document.dispatchEvent(new CustomEvent('motionchange'));
  document.getElementById('viewer-close').focus({preventScroll:true});
}));
document.getElementById('viewer-close').addEventListener('click', () => dialog.close());
document.getElementById('viewer-previous').addEventListener('click', () => moveViewer(-1));
document.getElementById('viewer-next').addEventListener('click', () => moveViewer(1));
dialog.addEventListener('keydown', event => {
  dialog.dataset.input = 'keyboard';
  if (event.key === 'ArrowRight') { event.preventDefault(); moveViewer(1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); moveViewer(-1); }
});
dialog.addEventListener('pointerdown', () => { dialog.dataset.input = 'pointer'; });
dialog.addEventListener('close', () => {
  delete document.documentElement.dataset.viewer;
  document.dispatchEvent(new CustomEvent('motionchange'));
  if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
});
if (!('closedBy' in HTMLDialogElement.prototype)) {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
}

const menuButton = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
function closeMenu(restoreFocus = false) {
  menuButton.setAttribute('aria-expanded','false');
  menuButton.setAttribute('aria-label','Open navigation');
  mobileMenu.hidden = true;
  document.body.style.overflow = '';
  document.querySelector('main').inert = false;
  document.querySelector('footer').inert = false;
  if (restoreFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  if (menuButton.getAttribute('aria-expanded') === 'true') { closeMenu(true); return; }
  mobileMenu.hidden = false;
  menuButton.setAttribute('aria-expanded','true');
  menuButton.setAttribute('aria-label','Close navigation');
  document.body.style.overflow = 'hidden';
  document.querySelector('main').inert = true;
  document.querySelector('footer').inert = true;
  mobileMenu.querySelector('a').focus();
});
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => {
  if (mobileMenu.hidden) return;
  if (event.key === 'Escape') { closeMenu(true); return; }
  if (event.key !== 'Tab') return;
  const focusable = [menuButton, ...mobileMenu.querySelectorAll('a')];
  const first = focusable[0], last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
matchMedia('(min-width:901px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const motionToggle = document.getElementById('motion-toggle');
const journey = document.getElementById('journey');
const stage = document.getElementById('dream-stage');
let motionOn = !reduced.matches;
function applyMotion({fromInteraction = false} = {}) {
  const oldBounds = journey.getBoundingClientRect();
  const wasInside = oldBounds.top < 0 && oldBounds.bottom > stage.getBoundingClientRect().height;
  motionOn = motionOn && !reduced.matches;
  document.documentElement.dataset.motion = motionOn ? 'on' : 'off';
  motionToggle.disabled = reduced.matches;
  motionToggle.setAttribute('aria-pressed', String(motionOn));
  motionToggle.setAttribute('aria-label', reduced.matches ? 'Motion reduced by system preference' : motionOn ? 'Turn motion off' : 'Enable motion');
  document.getElementById('motion-label').textContent = reduced.matches ? 'Reduced motion' : motionOn ? 'Motion on' : 'Motion off';
  if (!motionOn && wasInside && fromInteraction) window.scrollTo({top:journey.offsetTop,behavior:'instant'});
  document.dispatchEvent(new CustomEvent('motionchange'));
  syncHero();
}
motionToggle.addEventListener('click', () => { motionOn = !motionOn; applyMotion({fromInteraction:true}); });
reduced.addEventListener('change', event => { motionOn = !event.matches; applyMotion(); });
let heroFrame = 0;
function syncHero() {
  heroFrame = 0;
  const bounds = journey.getBoundingClientRect();
  const progress = motionOn && !reduced.matches ? Math.max(0,Math.min(1,-bounds.top / Math.max(1,bounds.height-stage.getBoundingClientRect().height))) : 0;
  const detailActive = !matchMedia('(max-width:900px)').matches && motionOn && !reduced.matches && progress > .525;
  stage.dataset.detailActive = String(detailActive);
  document.getElementById('opening-photo').inert = detailActive;
  document.querySelector('.opening-copy').inert = detailActive;
  document.querySelector('.opening-copy').setAttribute('aria-hidden', String(detailActive));
  document.getElementById('detail-layer').inert = !detailActive;
  document.getElementById('detail-layer').setAttribute('aria-hidden', String(!detailActive));
  document.querySelector('.detail-copy').inert = !detailActive;
  document.querySelector('.detail-copy').setAttribute('aria-hidden', String(!detailActive));
}
window.addEventListener('scroll', () => { if (!heroFrame) heroFrame = requestAnimationFrame(syncHero); }, {passive:true});
window.addEventListener('resize', syncHero, {passive:true});

const soundtrack = document.getElementById('gallery-audio');
const soundButton = document.getElementById('sound-toggle');
const soundLabel = document.getElementById('sound-label');
const audioStatus = document.getElementById('audio-status');
soundtrack.volume = .32;
function syncAudio() {
  const playing = !soundtrack.paused;
  soundButton.setAttribute('aria-pressed', String(playing));
  soundButton.setAttribute('aria-label', playing ? 'Pause gallery soundtrack' : 'Play gallery soundtrack');
  soundLabel.textContent = playing ? 'Sound on' : 'Sound off';
}
soundButton.addEventListener('click', async () => {
  if (!soundtrack.paused) { soundtrack.pause(); return; }
  audioStatus.textContent = '';
  try { await soundtrack.play(); syncAudio(); }
  catch {
    syncAudio();
    audioStatus.textContent = 'Sound could not start. Tap Sound off to try again.';
  }
});
soundtrack.addEventListener('play', syncAudio);
soundtrack.addEventListener('pause', syncAudio);
document.addEventListener('visibilitychange', () => { if (document.hidden && !soundtrack.paused) soundtrack.pause(); });

document.getElementById('year').textContent = new Date().getFullYear();
// The initial collection is real HTML; filtering progressively replaces it.
applyMotion();
initMotion();
