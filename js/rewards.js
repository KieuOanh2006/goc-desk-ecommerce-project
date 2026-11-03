/* Quà tham khảo cho khách chưa kết nối tài khoản; chỉ lưu lựa chọn trên máy. */
(() => {
  const cards = [...document.querySelectorAll('[data-reward-id]')];
  const dialog = document.getElementById('reward-dialog');
  if (!cards.length || !dialog) return;

  const storageKey = 'goc-desk:reward-wishlist:v1';
  const filterButtons = [...document.querySelectorAll('#reward-filters [data-reward-filter]')];
  const openButtons = [...document.querySelectorAll('[data-open-reward]')];
  const resultsStatus = document.getElementById('reward-results-status');
  const dialogTitle = document.getElementById('reward-dialog-title');
  const dialogCost = document.getElementById('reward-dialog-cost');
  const dialogNote = document.getElementById('reward-dialog-note');
  const dialogStatus = document.getElementById('reward-dialog-status');
  const saveButton = document.getElementById('reward-save');
  const rewards = new Map();
  let savedIds = new Set();
  let selectedRewardId = null;
  let opener = null;

  for (const card of cards) {
    const id = card.dataset.rewardId;
    if (!id || rewards.has(id)) continue;
    const pointsText = card.dataset.rewardPoints;
    const points = typeof pointsText === 'string' && pointsText.trim() ? Number(pointsText) : NaN;
    rewards.set(id, {
      title: card.dataset.rewardTitle || 'Quà tham khảo',
      type: card.dataset.rewardType === 'voucher' ? 'voucher' : 'gift',
      points: Number.isSafeInteger(points) && points >= 0 ? points : null,
    });
  }

  function readWishlist() {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === null) return { ids: new Set(), error: false };
      const stored = JSON.parse(raw);
      if (!Array.isArray(stored)) throw new Error('Invalid wishlist');
      return {
        ids: new Set(stored.filter(id => typeof id === 'string' && rewards.has(id))),
        error: false,
      };
    } catch (_) {
      return { ids: new Set(), error: true };
    }
  }

  function setStatus(message, isError = false) {
    if (!dialogStatus) return;
    dialogStatus.textContent = message;
    dialogStatus.dataset.state = isError ? 'error' : 'success';
  }

  function refreshSavedButtons() {
    for (const button of openButtons) {
      const saved = savedIds.has(button.dataset.openReward);
      button.textContent = saved ? 'Đã lưu · Xem lại' : rewards.get(button.dataset.openReward)?.type === 'voucher' ? 'Đổi voucher' : 'Đổi quà';
      button.dataset.rewardSaved = String(saved);
    }
    if (!saveButton) return;
    const saved = savedIds.has(selectedRewardId);
    saveButton.disabled = saved || !rewards.has(selectedRewardId);
    saveButton.textContent = saved ? 'Đã lưu vào yêu thích' : 'Lưu vào yêu thích';
  }

  function applyFilter(value = 'all') {
    const filter = ['all', 'gift', 'voucher'].includes(value) ? value : 'all';
    for (const button of filterButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.rewardFilter === filter));
    }
    let visibleCount = 0;
    for (const card of cards) {
      const visible = filter === 'all' || card.dataset.rewardType === filter;
      card.hidden = !visible;
      card.setAttribute('aria-hidden', String(!visible));
      if (visible) visibleCount += 1;
    }
    const label = filter === 'gift' ? 'Quà tặng' : filter === 'voucher' ? 'Voucher' : 'Tất cả quà';
    if (resultsStatus) resultsStatus.textContent = `${visibleCount} lựa chọn · ${label}`;
  }

  function openReward(id, button) {
    const reward = rewards.get(id);
    if (!reward) return;
    selectedRewardId = id;
    opener = button;
    const wishlist = readWishlist();
    savedIds = wishlist.ids;
    if (dialogTitle) dialogTitle.textContent = reward.title;
    if (dialogCost) dialogCost.textContent = reward.points === null
      ? 'Mức điểm sẽ được cập nhật'
      : `${reward.points.toLocaleString('vi-VN')} điểm`;
    if (dialogNote) dialogNote.textContent = 'Tài khoản và số điểm của bạn chưa được kết nối tại đây. Bạn có thể lưu quà vào danh sách yêu thích trên trình duyệt này để xem lại; thao tác này chưa phải yêu cầu đổi quà.';
    setStatus(wishlist.error
      ? 'Không đọc được danh sách yêu thích. Hãy cho phép bộ nhớ trình duyệt hoặc thử lại; quà chưa được xác nhận là đã lưu.'
      : savedIds.has(id) ? 'Quà này đã có trong danh sách yêu thích trên trình duyệt này.' : '', wishlist.error);
    refreshSavedButtons();
    if (!dialog.open) {
      try {
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
      } catch (_) {
        dialog.setAttribute('open', '');
      }
    }
  }

  function returnFocus() {
    selectedRewardId = null;
    opener?.focus?.();
    opener = null;
  }

  function closeDialog() {
    try {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    } catch (_) {
      dialog.removeAttribute('open');
    }
    returnFocus();
  }

  function saveReward() {
    const id = selectedRewardId;
    if (!rewards.has(id)) return;
    const wishlist = readWishlist();
    if (wishlist.error) {
      setStatus('Không lưu được lựa chọn vì không đọc được bộ nhớ trình duyệt. Hãy cho phép lưu trữ hoặc thử lại.', true);
      return;
    }
    if (wishlist.ids.has(id)) {
      savedIds = wishlist.ids;
      refreshSavedButtons();
      setStatus('Quà này đã có trong danh sách yêu thích trên trình duyệt này.');
      return;
    }
    const nextIds = new Set(wishlist.ids);
    nextIds.add(id);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...nextIds]));
      const confirmed = readWishlist();
      if (confirmed.error || !confirmed.ids.has(id)) throw new Error('Wishlist not saved');
      savedIds = confirmed.ids;
      refreshSavedButtons();
      setStatus('Đã lưu vào danh sách yêu thích trên trình duyệt này. Bạn chưa đổi quà hoặc sử dụng điểm.');
    } catch (_) {
      setStatus('Không lưu được lựa chọn. Bộ nhớ trình duyệt có thể đang bị chặn hoặc đã đầy; vui lòng thử lại.', true);
    }
  }

  for (const button of filterButtons) {
    button.addEventListener('click', () => applyFilter(button.dataset.rewardFilter));
  }
  for (const button of openButtons) {
    button.addEventListener('click', () => openReward(button.dataset.openReward, button));
  }
  for (const button of dialog.querySelectorAll('[data-close-reward]')) {
    button.addEventListener('click', closeDialog);
  }
  saveButton?.addEventListener('click', saveReward);
  dialog.addEventListener('close', returnFocus);
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
    }
  });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    const wishlist = readWishlist();
    if (wishlist.error) {
      if (dialog.open) setStatus('Không đọc được danh sách yêu thích sau khi bộ nhớ thay đổi. Hãy thử lại.', true);
      return;
    }
    savedIds = wishlist.ids;
    refreshSavedButtons();
    if (dialog.open) setStatus(savedIds.has(selectedRewardId)
      ? 'Quà này đã có trong danh sách yêu thích trên trình duyệt này.' : '');
  });

  savedIds = readWishlist().ids;
  refreshSavedButtons();
  applyFilter(filterButtons.find(button => button.getAttribute('aria-pressed') === 'true')?.dataset.rewardFilter || 'all');
})();
