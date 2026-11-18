// VirChue Bio team page: on wide screens the five team cards sit in one row and long bios are
// shortened to eight lines with a "Read more" button. Without this script every bio is shown in full.
(() => {
  'use strict';
  const grid = document.querySelector('.team-grid');
  if (!grid) return;
  const wide = window.matchMedia('(min-width: 1240px)');
  const ZH = /^zh/i.test(document.documentElement.lang);
  const T = ZH ? { more: '展开全文', less: '收起', moreAbout: '展开全文：', lessAbout: '收起：' } : { more: 'Read more', less: 'Show less', moreAbout: 'Read more about ', lessAbout: 'Show less about ' };
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
    btn.textContent = T.more;
    btn.setAttribute('aria-label', T.moreAbout + name);
    btn.addEventListener('click', () => {
      const open = card.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? T.less : T.more;
      btn.setAttribute('aria-label', (open ? T.lessAbout : T.moreAbout) + name);
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
      if (b) { b.setAttribute('aria-expanded', 'false'); b.textContent = T.more; }
    });
    measure();
  };
  if (wide.addEventListener) wide.addEventListener('change', onChange); else wide.addListener(onChange);
})();
