// VirChue Bio team page: on wide screens the five team cards sit in one row and long bios are
// shortened to eight lines with a "Read more" button. Without this script every bio is shown in full.
(() => {
  'use strict';
  const grid = document.querySelector('.team-grid');
  if (!grid) return;
  const wide = window.matchMedia('(min-width: 1240px)');
  const cards = [...grid.querySelectorAll('.person')];
  cards.forEach((card, i) => {
    const bio = card.querySelector('.bio');
    if (!bio) return;
    bio.id = bio.id || 'team-bio-' + (i + 1);
    const name = card.querySelector('h2') ? card.querySelector('h2').textContent : 'this person';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bio-more';
    btn.setAttribute('aria-controls', bio.id);
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Read more';
    btn.setAttribute('aria-label', 'Read more about ' + name);
    btn.addEventListener('click', () => {
      const open = card.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Show less' : 'Read more';
      btn.setAttribute('aria-label', (open ? 'Show less about ' : 'Read more about ') + name);
    });
    bio.after(btn);
  });
  grid.classList.add('can-clamp');
  const measure = () => {
    cards.forEach(card => {
      const bio = card.querySelector('.bio');
      if (!bio || card.classList.contains('open')) return;
      card.classList.toggle('has-more', wide.matches && bio.scrollHeight > bio.clientHeight + 2);
    });
  };
  measure();
  window.addEventListener('resize', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  const onChange = () => {
    if (!wide.matches) cards.forEach(card => {
      card.classList.remove('open');
      const b = card.querySelector('.bio-more');
      if (b) { b.setAttribute('aria-expanded', 'false'); b.textContent = 'Read more'; }
    });
    measure();
  };
  if (wide.addEventListener) wide.addEventListener('change', onChange); else wide.addListener(onChange);
})();
