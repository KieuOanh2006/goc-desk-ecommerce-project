/* Giữ hash sản phẩm khi dùng liên kết bỏ qua nội dung hoặc về đầu trang. */
const detailMain = document.getElementById('main');

document.querySelectorAll('a[href="#main"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    detailMain.focus({ preventScroll: true });
    detailMain.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  });
});
