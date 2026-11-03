# Danh mục sản phẩm và gallery màu

Cập nhật mới nhất về bảo hành, banner sản phẩm, tích điểm và tin tức: xem [PAGE_REDESIGN.md](PAGE_REDESIGN.md). Nội dung bên dưới ghi lại các lượt chỉnh sửa trước; phần hero bảo hành/tích điểm/tin tức đã được thay thế theo yêu cầu mới.

Dùng Live Server của VS Code để mở website: các trang cần cùng địa chỉ website để chia sẻ giỏ hàng. Có thể mở file trực tiếp để xem giao diện, nhưng trình duyệt có thể tách localStorage theo từng file. Nếu trang đang mở, nhấn Ctrl + Shift + R để tải lại JavaScript và CSS.

## Thay đổi

- Trang chủ và trang sản phẩm dùng chung tám sản phẩm trong `js/product-data.js`: tên, giá tham khảo, danh mục, thông số, ảnh và màu. Mọi thẻ sản phẩm dẫn đến đúng ID trong trang chi tiết.
- Bộ lọc hoạt động theo danh mục, giá, thương hiệu, màu và nhu cầu; có tìm kiếm tiếng Việt không dấu, sắp xếp giá/tên, số kết quả, trạng thái trống và xóa lọc. Các lựa chọn được giữ trong URL khi trình duyệt cho phép.
- Mỗi sản phẩm có hai màu. Bấm thumbnail hoặc nút màu đổi ảnh chính, tên màu, thông số màu và đường dẫn 3D. URL có thể giữ màu đang chọn.
- Phần giới thiệu dài được thay bằng thông số, hướng dẫn sử dụng/tương thích, bảo hành và phản hồi. Các mục thông tin cuộn đến đúng phần mà không làm mất ID sản phẩm trong URL.
- Phản hồi do người xem nhập được lưu trong localStorage riêng cho từng sản phẩm. Chưa có máy chủ chia sẻ hay xác minh đánh giá. Nếu trình duyệt chặn lưu trữ, phản hồi vẫn hiển thị trong phiên và báo rõ giới hạn.
- Nút thử 3D dẫn sang trang thiết kế hiện có, mang theo mã sản phẩm và màu; trang 3D hiển thị thẻ sản phẩm và liên kết quay lại. Khung 3D hiện tại vẫn là mô phỏng CSS, chưa có mô hình 3D riêng cho tám sản phẩm.

## Ảnh màu bổ sung

Tạo bằng công cụ **image_gen tích hợp**, dựa trên ảnh sản phẩm gốc, giữ hình dáng và chi tiết, đổi riêng phối màu. Các ảnh này là phối màu minh họa thiết kế, không được trình bày như màu bán đã xác nhận của hãng. Giá tham khảo áp dụng cho phiên bản gốc.

Ảnh nằm tại `images/product-pages/variants/`:

- `hyperone-gen-2-cream.png`
- `silentium-gen-2-cream.png`
- `nova-dl02-sage.png`
- `lh01-oak.png`
- `corepad-sage.png`
- `ds02-oak.png`
- `hs01-oak.png`
- `cm02-cream.png`

Prompt đầy đủ và đường dẫn từng đầu ra: `images/product-pages/variants/prompts.json`. Bảng ánh xạ màu/ảnh: `images/product-pages/variants/manifest.json`.

## Thêm vào giỏ hàng

- Nút thêm trên cả tám sản phẩm ghi nhận màu đang xem và số lượng, hiện thông báo tại chỗ, không chuyển trang.
- Cùng sản phẩm và màu cộng dồn số lượng; màu khác được giữ thành dòng riêng. Số lượng nguyên từ 1–99 cho mỗi dòng.
- Giỏ dùng localStorage với khóa `goc-desk:cart:v1`. Chỉ lưu mã sản phẩm, mã màu và số lượng; tên, ảnh và giá tham khảo luôn lấy từ danh mục chung.
- Biểu tượng giỏ trên cả tám trang hiển thị tổng số món đã lưu. Trang giỏ hiển thị đúng các món đó, hỗ trợ đổi số lượng/xóa và cập nhật tổng tiền. Không còn hai món mẫu tự điền.
- Nếu lưu trữ bị chặn hoặc đầy, thông báo lỗi thay vì báo đã thêm. Việc thêm giỏ chưa tạo đơn hàng; chức năng đặt hàng và voucher vẫn chưa mở.

## Kiểm tra

Với Node.js, chạy từ thư mục dự án:

```powershell
node -e "import('./tests/catalog.test.mjs').then(m => m.run()).then(console.log)"
node -e "import('./tests/cart.test.mjs').then(m => m.run()).then(console.log)"
```

Đã chạy đạt 16 kiểm thử bằng Node: kết hợp bộ lọc, biên khoảng giá, tìm không dấu, sắp xếp, liên kết, ảnh tồn tại, 16 lựa chọn màu, giữ ID sản phẩm và xử lý phản hồi. Các handler trang chi tiết được chạy với bộ mô phỏng DOM; đây không phải kiểm thử trình duyệt.

Đã chạy thêm 15 kiểm thử giỏ hàng: cộng dồn/tách màu, giữ dữ liệu qua phiên trang mới, sửa/xóa/tính tiền, đầu vào sai, lỗi lưu trữ, thêm tại chỗ không chuyển URL, cập nhật badge và hiển thị trang giỏ. Tổng cộng 31 kiểm thử tự động đạt; vẫn chưa kiểm tra trực quan trong trình duyệt.

Đã kiểm tra cấu trúc HTML, ID, 397 liên kết/tệp nội bộ của bốn trang và định dạng Git. Chưa kiểm tra trực quan: công cụ trình duyệt không có kết nối và cửa sổ Chrome đang thu nhỏ.

Kiểm tra tay đề xuất:

1. Từ trang chủ, mở từng món và xác nhận tên/ảnh/giá; mở sáu ô danh mục để kiểm tra lọc sẵn.
2. Tìm `ban phim`, kết hợp danh mục/màu/giá, thử trường hợp không có kết quả và xóa lọc.
3. Đổi hai màu của từng món bằng thumbnail và nút màu; mở lại URL màu, thử nút 3D và quay lại.
4. Chuyển giữa thông số/thông tin/đánh giá mà vẫn giữ đúng sản phẩm; gửi phản hồi, tải lại và kiểm tra phản hồi không xuất hiện ở món khác.
5. Kiểm tra các trang ở độ rộng điện thoại và máy tính.
6. Chọn màu và số lượng, thêm hai lần mà không rời trang, mở giỏ kiểm tra cộng dồn; thử màu khác, sửa số lượng, xóa và tải lại. Dùng các trang trong cùng Live Server.

## File cập nhật trong lượt này

- HTML: `index.html`, `products.html`, `product-detail.html`, `setup-3d.html`.
- CSS: `css/home.css`, `css/product-interactions.css`, `css/setup-selection.css`.
- JavaScript: `js/product-data.js`, `js/catalog-utils.js`, `js/products.js`, `js/home-products.js`, `js/product-detail.js`, `js/setup-selection.js`.
- Tài nguyên ảnh và metadata: `images/product-pages/variants/`.
- Kiểm thử: `tests/catalog.test.mjs`.

File bổ sung/cập nhật cho giỏ: `js/cart-store.js`, `js/cart-badge.js`, `js/cart.js`, `js/product-detail.js`, `cart.html`, `product-detail.html`, `css/cart.css`, `css/site-shell.css`, `css/product-interactions.css`, `tests/cart.test.mjs`. Cả tám trang HTML nạp bộ lưu giỏ và badge dùng chung; bốn trang chưa nạp danh mục trước đó được bổ sung script dữ liệu.

## Nền menu và lối dẫn sang Studio

Màu nâu `#5b4432` được giữ làm nền dự phòng của header. Theo cập nhật mới, menu các trang con phủ lên ảnh riêng của từng trang, với gradient tối, chữ và biểu tượng trắng giống trang chủ. Menu và ảnh hero trang chủ được giữ nguyên. Logo và các nội dung/chức năng đã làm được giữ nguyên.

Khối xanh cuối trang sản phẩm được thay bằng banner trải nghiệm 3D giống trang chủ: cùng ảnh `setup-3d-hero-background.png`, tiêu đề, mô tả, kiểu nút và liên kết `setup-3d.html`. Hai trang dùng chung `css/studio-banner.css`, gồm bố cục điện thoại và chế độ giảm chuyển động. Đây là cập nhật nhận diện và lối dẫn theo sơ đồ người dùng gửi, không triển khai thêm các chức năng tài khoản hoặc thanh toán trong sơ đồ.

File cập nhật: `index.html`, `products.html`, `css/site-shell.css`, `css/home.css`, `css/product-pages.css`; thêm `css/studio-banner.css`. Đã kiểm tra nạp CSS, ảnh/đích liên kết, cấu trúc ngoặc CSS và độ tương phản chữ menu. Chưa kiểm tra trực quan vì công cụ không xác minh được URL Chrome. Mở trang sản phẩm bằng Live Server, tải lại bằng Ctrl + Shift + R và bấm “Khám phá Góc Desk Studio” để kiểm tra lối sang 3D.

## Header phủ ảnh cho các trang con

Người dùng đã xác nhận “một nửa” là **chiều cao**. Khung ảnh vẫn rộng toàn trang. `css/page-hero.css` dùng chiều cao tối thiểu bằng nửa khung trang chủ: desktop `max(340px, 46svh)`, tablet `max(450px, 47svh)`, điện thoại `max(470px, 47svh)`. Khung có thể cao thêm khi cần chứa đầy đủ menu, tiêu đề và nút trên màn hình hẹp, tránh chồng chữ.

Menu được đặt tuyệt đối lên ảnh từ đỉnh trang; nội dung giới thiệu cũ được đưa vào hero chung. Ảnh và nội dung đầu trang của bảy trang:

| Trang | Ảnh |
| --- | --- |
| Sản phẩm | `images/product-pages/banner.png` |
| Chi tiết sản phẩm | `images/news-keyboard-choice-v2.jpg` |
| Tích điểm | `images/hero-laptop-neutral.jpg` |
| Bảo hành | `images/news-cable-reset-v2.jpg`, kết hợp hình khiên có sẵn |
| Tin tức | `images/news-hero-background.png` |
| Thiết kế 3D | `images/setup-3d-hero-background.png` |
| Giỏ hàng | `images/hero-desk-fullscreen.png` |

Không chỉnh `index.html` hay CSS trang chủ trong cập nhật này; CSS mới chỉ áp dụng cho body có `has-photo-header`. Các chức năng tìm kiếm, lọc, chọn màu, thêm/sửa/xóa giỏ và liên kết tiếp tục dùng mã hiện có. Đã kiểm tra cấu trúc bảy trang, ID, ảnh, fragment liên kết và chạy lại đạt 31 kiểm thử chức năng; chưa kiểm tra trực quan trong trình duyệt.

File cập nhật: `products.html`, `product-detail.html`, `points.html`, `warranty.html`, `news.html`, `setup-3d.html`, `cart.html`, tài liệu này; thêm `css/page-hero.css`. Xem bằng Live Server và Ctrl + Shift + R. Kiểm tra menu trên ảnh, khoảng cách từ menu đến tiêu đề, độ cao trên máy tính/điện thoại và các nút trong hero.
