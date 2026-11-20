// A casual saving deterrent, not DRM. Browser-delivered images can still be copied.
const mediaSelector = '#works img, #art-viewer img, .work-image img, #journey img, .closing-art img, .installation-band img, .artist-portrait img';
document.addEventListener('dragstart', event => {
  if (event.target.matches?.(mediaSelector)) event.preventDefault();
});
let noticeTimer;
document.addEventListener('contextmenu', event => {
  if (!event.target.matches?.(mediaSelector)) return;
  event.preventDefault();
  let notice = document.getElementById('media-rights-note');
  if (!notice) {
    notice = document.createElement('div');
    notice.id = 'media-rights-note';
    notice.className = 'media-rights-note';
    notice.setAttribute('role','status');
    document.body.append(notice);
  }
  notice.textContent = 'Sara Conca artwork · Reproduction by permission';
  notice.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { notice.hidden = true; }, 3000);
});
