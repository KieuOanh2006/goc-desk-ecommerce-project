
/* Home Add to Cart - Đồng bộ logic với products.html */
(function () {
  'use strict';

  const ICON = `
    <svg viewBox="0 0 24 24" width="18" height="18"
         fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true" focusable="false">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.7 13.3a2 2 0 0 0 2 1.7h9.7a2 2 0 0 0 2-1.6L23 6H6" />
      <path d="M16 8v5m-2.5-2.5h5" />
    </svg>
    <span>Thêm vào giỏ hàng</span>
  `;

  const METHOD_NAMES = [
    'add',
    'addItem',
    'addProduct',
    'addToCart',
    'addCartItem'
  ];

  const STORES = [
    'GocDeskCart',
    'CartStore',
    'cartStore'
  ];

  // 1. Lấy dữ liệu sản phẩm
  function findProduct(card) {
    const catalog = window.GocDeskCatalog;

    if (!catalog || !Array.isArray(catalog.products)) {
      return null;
    }

    const existingButton = card.querySelector(
      '[data-product-id]'
    );

    const detailLink = card.querySelector(
      'a[href*="product-detail.html#"]'
    );

    const productId =
      existingButton?.dataset.productId ||
      detailLink?.getAttribute('href')?.split('#')[1] ||
      card.dataset.productId ||
      card.id?.replace(/^card-/, '');

    return catalog.products.find(
      product => product.id === productId
    ) || null;
  }

  // 2. Tạo nút nếu card chưa có
  function addButtons() {
    const grid = document.getElementById('home-products');

    if (!grid) return;

    for (const card of grid.children) {
      if (card.querySelector('.card-add-to-cart')) {
        continue;
      }

      const product = findProduct(card);

      if (!product) continue;

      const color = product.colors?.[0];

      const button = document.createElement('button');

      button.type = 'button';
      button.className = 'card-add-to-cart';

      button.dataset.productId = product.id;
      button.dataset.productColor = color?.id || 'default';
      button.dataset.productName = product.name;
      button.dataset.productPrice = String(product.price);
      button.dataset.detailUrl =
        'product-detail.html#' + product.id;

      button.setAttribute(
        'aria-label',
        'Thêm ' + product.name + ' vào giỏ hàng'
      );

      button.innerHTML = ICON;

      card.appendChild(button);
    }
  }

  // 3. Tìm hàm thêm giỏ hàng giống products.html
  function resolveAddMethod() {
    for (const key of STORES) {
      const store = window[key];

      if (!store) continue;

      for (const name of METHOD_NAMES) {
        if (typeof store[name] === 'function') {
          return {
            store,
            fn: store[name],
            name,
            key
          };
        }
      }
    }

    return null;
  }

  // 4. Feedback đồng bộ với trang Products
  function feedback(button, message, success) {
    const label = button.querySelector('span');

    clearTimeout(button._feedbackTimer);

    if (success) {
      if (label) {
        label.textContent = 'Đã thêm vào giỏ hàng';
      }

      button.classList.add('is-added');
      button.dataset.state = 'success';
      button.setAttribute('aria-label', message);

      button._feedbackTimer = setTimeout(() => {
        if (!button.isConnected) return;

        button.classList.remove('is-added');
        delete button.dataset.state;

        if (label) {
          label.textContent = 'Thêm vào giỏ hàng';
        }

        button.setAttribute(
          'aria-label',
          'Thêm ' + button.dataset.productName +
          ' vào giỏ hàng'
        );
      }, 1800);
    } else {
      button.classList.remove('is-added');
      button.dataset.state = 'error';

      if (label) {
        label.textContent = 'Không thể thêm';
      }

      button._feedbackTimer = setTimeout(() => {
        if (!button.isConnected) return;

        delete button.dataset.state;

        if (label) {
          label.textContent = 'Thêm vào giỏ hàng';
        }
      }, 1800);
    }

    // Thông báo lỗi giống products.html
    let note = button.parentElement.querySelector(
      '.card-cart-feedback'
    );

    if (!note) {
      note = document.createElement('p');
      note.className = 'card-cart-feedback';
      note.setAttribute('role', 'status');
      note.setAttribute('aria-live', 'polite');

      button.insertAdjacentElement('afterend', note);
    }

    note.textContent = success ? '' : message;
  }

  // 5. Logic thêm vào giỏ hàng
  async function addToCart(button) {
    if (button.disabled) return;

    const resolved = resolveAddMethod();

    if (!resolved) {
      const error =
        'Chưa xác định được hàm thêm giỏ hàng từ js/cart-store.js.';

      console.error('[Home Cart]', error);

      feedback(button, error, false);
      return;
    }

    const id = button.dataset.productId;
    const color = button.dataset.productColor;

    const item = {
      id,
      productId: id,
      name: button.dataset.productName,
      price: Number(button.dataset.productPrice),
      color,
      quantity: 1
    };

    if (!id || !color) {
      feedback(
        button,
        'Thiếu thông tin sản phẩm hoặc màu sắc.',
        false
      );
      return;
    }

    try {
      button.disabled = true;

      // Giữ đúng cách gọi của trang products.html
      const result =
        resolved.fn.length >= 2
          ? await resolved.fn.call(
              resolved.store,
              id,
              color,
              1
            )
          : await resolved.fn.call(
              resolved.store,
              item
            );

      if (
        result === false ||
        result?.success === false
      ) {
        throw new Error(
          'Cart store từ chối thêm sản phẩm'
        );
      }

      // Thông báo cho các thành phần giỏ hàng
      [
        'cart:updated',
        'cart-updated',
        'gocdesk:cart-updated'
      ].forEach(name => {
        document.dispatchEvent(
          new CustomEvent(name, {
            detail: { productId: id }
          })
        );
      });

      feedback(
        button,
        'Đã thêm ' + item.name + ' vào giỏ hàng',
        true
      );

    } catch (error) {
      console.error(
        '[Home Cart] Thêm vào giỏ thất bại:',
        error
      );

      feedback(
        button,
        'Không thể thêm vào giỏ hàng. Kiểm tra js/cart-store.js.',
        false
      );

    } finally {
      button.disabled = false;
    }
  }

  // 6. Chỉ xử lý click trong #home-products
  document.addEventListener('click', function (event) {
    const button = event.target.closest(
      '#home-products .card-add-to-cart'
    );

    if (!button) return;

    event.preventDefault();
    event.stopPropagation();

    addToCart(button);
  });

  // 7. Hỗ trợ render lại danh sách sản phẩm
  let queued = false;

  function schedule() {
    if (queued) return;

    queued = true;

    requestAnimationFrame(() => {
      queued = false;
      addButtons();
    });
  }

  function start() {
    const grid = document.getElementById('home-products');

    if (!grid) return;

    addButtons();

    // Theo dõi khi các card bị render lại
    const observer = new MutationObserver(schedule);

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();
