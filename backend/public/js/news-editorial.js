/* Bộ lọc chủ đề và liên kết đọc bài trong Góc Desk Journal. */
(() => {
  const main = document.querySelector('.journal-main');
  if (!main) return;
  const filters = [...main.querySelectorAll('input[name="news-filter"]')];
  const topics = [...main.querySelectorAll('.journal-topic')];
  const status = main.querySelector('#journal-filter-status');

  function filterArticles() {
    const selected = filters.find(input => input.checked);
    const topic = selected?.value || 'all';
    let count = 0;
    for (const group of topics) {
      group.hidden = topic !== 'all' && group.dataset.topic !== topic;
      if (!group.hidden) count += group.querySelectorAll('.journal-article').length;
    }
    const label = topic === 'all'
      ? 'Tất cả chủ đề'
      : selected.nextElementSibling.textContent.replace(/\s*\d+\s*$/, '').trim();
    if (status) status.textContent = `${count} bài viết · ${label}`;
  }

  function openArticle(hash, focus = false) {
    let id;
    try { id = decodeURIComponent(hash.replace(/^#/, '')); } catch { return; }
    const article = document.getElementById(id);
    if (!(article instanceof HTMLDetailsElement) || !main.contains(article)) return;
    const topic = article.closest('.journal-topic');
    const selected = filters.find(input => input.checked);
    if (topic && selected?.value !== 'all' && selected?.value !== topic.dataset.topic) {
      const all = filters.find(input => input.value === 'all');
      if (all) all.checked = true;
      filterArticles();
    }
    article.open = true;
    if (focus) article.querySelector('summary')?.focus({ preventScroll: true });
    requestAnimationFrame(() => article.scrollIntoView({ block: 'start' }));
  }

  for (const input of filters) input.addEventListener('change', filterArticles);
  main.addEventListener('click', event => {
    const link = event.target.closest('a[data-read-article]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const hash = link.getAttribute('href');
    if (!hash?.startsWith('#')) return;
    event.preventDefault();
    if (location.hash !== hash) {
      try { history.pushState(null, '', hash); } catch (_) { /* Vẫn mở bài khi file:// giới hạn lịch sử. */ }
    }
    openArticle(hash, true);
  });
  window.addEventListener('hashchange', () => openArticle(location.hash));
  window.addEventListener('popstate', () => openArticle(location.hash));
  filterArticles();
  if (location.hash) openArticle(location.hash);
})();
