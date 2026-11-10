# Refactor nút thêm giỏ hàng

Phạm vi: nút **Thêm vào giỏ hàng** trên Trang chủ và Sản phẩm. Giữ nguyên CSS,
bố cục, bộ lọc, tìm kiếm, trang chi tiết và trang giỏ hàng.

## Phân chia trách nhiệm

- `js/product-data.js`: catalog mẫu hiện có, gồm mã, tên, giá và các màu sản phẩm.
- `js/cart-store.js`: kiểm tra sản phẩm/màu/số lượng, lưu `localStorage`, cộng dồn
  sản phẩm cùng màu, tính tổng và thông báo cho các subscriber. API giữ nguyên.
- `js/cart-buttons.js`: tạo nút, xử lý click và phản hồi thành công/lỗi dùng chung.
  Gọi trực tiếp `GocDeskCart.add(product.id, color.id, 1)`.
- `js/home-products.js`, `js/products.js`: gọi `GocDeskCartButtons.mount(grid)` sau
  khi có các thẻ sản phẩm. Mount nhiều lần không đăng ký trùng listener. Các thẻ
  được lọc/sắp xếp vẫn dùng listener trên grid.
- `js/cart-badge.js`: tiếp tục nhận thông báo từ store; không phát thêm các sự kiện
  giả định như `cart:updated`.

HTML chỉ cần `<span data-cart-product="ma-san-pham"></span>` ở vị trí nút.
Module thay vị trí này bằng nút và vùng báo lỗi. Tên, màu và giá không sao chép vào
HTML. Quick add lấy màu đầu tiên trong catalog, mỗi lần thêm một sản phẩm, giữ quy
tắc hiện có. Chọn màu khác/số lượng khác vẫn thực hiện ở trang chi tiết.

`js/home-cart-buttons.js` và đoạn xử lý inline trong `products.html` đã được bỏ.
Không còn dò tên store/hàm, suy đoán chữ ký hàm hoặc theo dõi toàn bộ DOM bằng
MutationObserver. Lỗi lưu không báo thành công; lỗi vượt giới hạn giữ thông báo
cụ thể của store. Timer được thay thế khi bấm lại và reset cả thẻ đang bị lọc ẩn.

Các file thay đổi:

- Tạo: `js/cart-buttons.js`, `tests/cart-buttons.test.mjs`, `docs/CART_REFACTOR.md`.
- Sửa: `index.html`, `products.html`, `css/home.css`, `css/product-pages.css`,
  `js/catalog-utils.js`, `js/home-products.js`, `js/products.js`,
  `tests/cart.test.mjs`, `tests/catalog.test.mjs`.
- Xóa: `js/home-cart-buttons.js`.

## Chạy và kiểm thử

Yêu cầu Node.js để chạy test và Python để phục vụ website tĩnh:

```sh
node --test tests/cart-buttons.test.mjs
node --input-type=module -e "console.log(await (await import('./tests/cart.test.mjs')).run())"
python -m http.server 8000
```

Mở `http://localhost:8000/index.html` hoặc `http://localhost:8000/products.html`.

Kết quả kiểm thử tại lần refactor:

- 9 test mới về quick add: dữ liệu catalog, cộng dồn giữa hai grid, mount, dữ liệu
  DOM cũ, nút disabled, lỗi storage, giới hạn số lượng, timer và sản phẩm mới.
- 15 kiểm tra giỏ hàng hiện có: storage, giá, màu, số lượng, tổng tiền, badge,
  trang chi tiết và xóa giỏ. Mock DOM được bổ sung `addEventListener`, `readyState`
  và `.detail-price` cho phù hợp mã đang có; không đổi các assertion nghiệp vụ.
- Chrome: thêm lặp, badge, tìm kiếm/lọc/sắp xếp, trạng thái không có kết quả,
  reload, đồng bộ hai tab, lỗi storage và thử lại, giới hạn 99, sửa/xóa giỏ,
  bàn phím Enter/Space ở viewport 390px. Không ghi nhận lỗi JavaScript trên trang.

## Giới hạn và lỗi có sẵn

Repo vẫn dùng catalog mẫu và lưu giỏ ở trình duyệt, chưa có API/backend để xác
minh giá hoặc tồn kho. Refactor này không thay đổi nguồn dữ liệu của dự án.

Trước khi sửa, `tests/catalog.test.mjs` thất bại vì so sánh nguyên chuỗi HTML của
category tile với HTML đã định dạng; `tests/warranty-lookup.test.mjs` thất bại do
thiếu ID mong đợi. Các lỗi đó vẫn còn và nằm ngoài phạm vi. Mock của test render
Trang chủ được cập nhật để khai báo dependency `GocDeskCartButtons` mới.

Audit UI toàn repo cũng còn các lỗi có sẵn ngoài phạm vi như native select chưa
có ownership contract, nút không có handler và quy tắc form/scrollbar. Không thay
đổi các phần đó trong refactor giỏ hàng này.
