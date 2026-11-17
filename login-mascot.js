(() => {
  const login = document.getElementById('login');
  const mascot = login?.querySelector('.login-mascot');
  const gaze = mascot?.querySelector('.mascot-gaze');
  const face = mascot?.querySelector('.mascot-face');
  const password = document.getElementById('password');
  const toggle = document.getElementById('show-password');
  if (!gaze || !password) return;

  const motion = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  let frame = 0;
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    gaze.style.transform = 'translate(0px, 0px)';
  };
  const syncPrivacy = () => {
    const active = document.activeElement;
    const closed = password.type === 'password' && (active === password || active === toggle);
    mascot.classList.toggle('is-private', closed);
    if (closed) reset();
  };
  document.addEventListener('pointermove', event => {
    if (!motion.matches || login.hidden || event.pointerType === 'touch' || mascot.classList.contains('is-private')) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      const rect = face.getBoundingClientRect();
      const x = rect.left + rect.width * 496 / 1024;
      const y = rect.top + rect.height * 682 / 1536;
      const dx = Math.tanh((event.clientX - x) / 250) * 15;
      const dy = Math.tanh((event.clientY - y) / 200) * 11;
      gaze.style.transform = `translate(${dx}px, ${dy}px)`;
    });
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', reset);
  window.addEventListener('blur', reset);
  document.addEventListener('focusin', syncPrivacy);
  document.addEventListener('focusout', () => queueMicrotask(syncPrivacy));
  new MutationObserver(syncPrivacy).observe(password, { attributes: true, attributeFilter: ['type'] });
  new MutationObserver(() => { reset(); syncPrivacy(); }).observe(login, { attributes: true, attributeFilter: ['hidden'] });
  motion.addEventListener('change', reset);
  syncPrivacy();
})();
