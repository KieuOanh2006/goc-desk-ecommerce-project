# Cập nhật bảo hành, sản phẩm, tích điểm và tin tức

Cập nhật ngày 02/11/2026 theo các mẫu người dùng gửi. Phần giao diện trang chủ được giữ nguyên trong lượt chỉnh sửa này. Logo, menu chung, danh mục sản phẩm và giỏ hàng tiếp tục dùng phần đã đồng bộ.

## Thay đổi và file liên quan

| Trang | Nội dung | File |
| --- | --- | --- |
| Bảo hành | Bỏ ảnh đầu trang, dùng ô nhập Serial/IMEI và ba bước hướng dẫn; giữ chính sách và mục yêu cầu hỗ trợ | `warranty.html`, `css/warranty-lookup.css`, `js/warranty-lookup.js` |
| Sản phẩm | Thay ảnh hero bằng đúng collage tham khảo, căn giữa tiêu đề; giữ bộ lọc, danh mục, giỏ và liên kết 3D | `products.html`, `css/products-banner.css` |
| Tích điểm | Hero nâu đậm `#3b291f`, thương hiệu Góc Desk; bốn thẻ Bronze/Silver/Gold/Titan không có huy hiệu; sáu lựa chọn quà và voucher; lọc và xem chi tiết phần thưởng | `points.html`, `css/rewards.css`, `js/rewards.js` |
| Tin tức | Bố cục biên tập nền kem, chữ lớn, ảnh và nội dung không có khung thẻ; giữ bài viết, bộ lọc chủ đề và liên kết tới từng bài | `news.html`, `css/news-editorial.css`, `js/news-editorial.js` |

Các yêu cầu mới thay thế hero ảnh cũ của trang bảo hành, tích điểm và tin tức. Trang sản phẩm vẫn dùng ảnh phủ toàn chiều ngang với khung hero trang con. Các trang chi tiết sản phẩm, giỏ và 3D tiếp tục dùng header ảnh đã làm trước đó.

## Nguồn tham khảo và tài nguyên

- Bố cục tin tức tham khảo [Cocoon – Bài viết](https://cocoonvietnam.com/bai-viet). Nội dung và ảnh bài viết Góc Desk hiện có được giữ lại.
- Collage sản phẩm lấy từ [HyperWork – Tất cả sản phẩm](https://hyperwork.vn/collections/all), lưu tại `images/references/products-collage.svg`.
- Nét vẽ phần thưởng lấy từ [HyperWork Rewards](https://hyperwork.vn/pages/rewards), lưu bản gốc tại `images/references/rewards-line-art.svg`. Bản `rewards-line-art-brown.svg` đổi nền sang nâu đậm và màu nhấn sang nâu vàng; tên Góc Desk và tiêu đề được viết bằng HTML.
- URL tài nguyên gốc và các biến đổi nằm trong `images/references/sources.json`. Các SVG tải về đã được kiểm tra không chứa script, trình xử lý sự kiện hay liên kết tài nguyên ngoài.
- Thẻ thành viên, biểu tượng quà và voucher được dựng bằng CSS/SVG trong trang, không dùng ảnh huy hiệu.
- Mức điểm và quyền lợi dùng để minh họa theo mẫu, lưu trong `images/references/rewards-demo-policy.json`; chưa phải chính sách thương mại được xác nhận.

## Hành vi và giới hạn

- Tra cứu bảo hành kiểm tra định dạng đầu vào và hiển thị rõ việc chưa kết nối dữ liệu bảo hành. Không tự tạo trạng thái hay ngày hết hạn cho Serial/IMEI bất kỳ. Mã nhập không được lưu.
- Phần thưởng có bộ lọc Quà tặng/Voucher, hộp thoại chi tiết và nút lưu lựa chọn. Chỉ mã phần thưởng được lưu ở trình duyệt bằng khóa `goc-desk:reward-wishlist:v1`; không trừ điểm, phát hành mã voucher hay giả lập số dư tài khoản. Trường hợp không lưu được sẽ báo lỗi.
- Đăng nhập/đăng ký hiển thị thông tin về chức năng tài khoản chưa kết nối. Trang không yêu cầu nhập dữ liệu cá nhân.
- Tin tức hỗ trợ mở từng bài theo liên kết, đổi chủ đề, quay lại/tiến tới bằng trình duyệt và chủ đề Thiết kế 3D được giữ đúng tên.

## Cách xem và kiểm tra

Mở thư mục dự án bằng VS Code và chạy Live Server để các trang cùng địa chỉ website, rồi nhấn **Ctrl + Shift + R**. Xem lần lượt `warranty.html`, `products.html`, `points.html`, `news.html` ở chiều rộng máy tính và điện thoại.

Kiểm tra ô Serial/IMEI trống/sai/hợp lệ; lọc quà/voucher, mở chi tiết và lưu một lựa chọn rồi tải lại; đổi chủ đề và mở từng bài tin tức. Mở lại sản phẩm để kiểm tra bộ lọc, liên kết chi tiết và thêm giỏ vẫn hoạt động.

Với Node.js, chạy các bộ kiểm tra từ thư mục dự án:

```powershell
node -e "Promise.all(['catalog','cart','warranty-lookup','rewards','news-editorial'].map(async n => ({name:n,...await (await import('./tests/'+n+'.test.mjs')).run()}))).then(console.log)"
```

Đã chạy đạt **46 kiểm tra**: danh mục 16, giỏ hàng 15, bảo hành 7, phần thưởng 6, tin tức 2. Kiểm tra cấu trúc tám trang, ID trùng, đích fragment, 623 liên kết/tài nguyên nội bộ và ngoặc CSS không phát hiện lỗi. `git diff --check` đạt.

Các kiểm tra tương tác JavaScript chạy với bộ mô phỏng DOM, không thay thế kiểm tra giao diện thật. Chưa kiểm tra trực quan trong trình duyệt vì công cụ không kết nối được trình duyệt hiện có.


## Chỉnh trang chủ và video tin tức (09/11/2026)

Theo yêu cầu mới, thu chiều rộng nội dung trang chủ, danh mục và chi tiết sản phẩm xuống tối đa 1280px, giữ lề linh hoạt trên điện thoại. Ảnh sản phẩm dùng thêm khoảng đệm và nền xám đồng màu; chế độ hòa trộn darken nối nền ảnh vào khung để vật thể nhỏ hơn, không bị cắt. Ảnh danh mục dùng khung 4:3 để giảm chiều cao.

Khối “Mỗi góc bàn là một câu chuyện” ở trang chủ phát `images/Tik tok goc desk.mp4` và liên kết tới `news.html#news-desk-story`. Video và câu chuyện xuất hiện đầu trang tin tức; bài nổi bật cũ “Đẹp trên ảnh, đã hợp với bạn?” chuyển vào nhóm Cảm hứng setup, giữ nguyên nội dung và ID liên kết. Video giữ tỷ lệ gốc 5:4, có điều khiển phát trên trang tin tức. Dãy ba bài “Góc cảm hứng” ở trang chủ đã được bỏ.

File sửa: `index.html`, `news.html`, `css/home.css`, `css/product-interactions.css`, `css/news-editorial.css`, `tests/news-editorial.test.mjs` và tài liệu này. Video có sẵn trong thư mục images được tham chiếu trực tiếp, không tạo bản sao.

Kiểm tra thực tế: 27 kiểm tra đạt (danh mục 19, phần thưởng 6, tin tức 2); 126 liên kết/tài nguyên nội bộ ở trang chủ và tin tức tồn tại, không trùng ID, CSS cân bằng ngoặc, `git diff --check` đạt. Video có track hình 720×576, H.264 và âm thanh AAC. Hai bộ kiểm tra cũ giỏ hàng/bảo hành vẫn lỗi: DOM giả của giỏ thiếu `document.addEventListener`; kiểm tra bảo hành tìm ID không còn trong HTML. Các file đầu vào của hai bộ này không thay đổi so với HEAD trong lượt sửa này.

Chưa kiểm tra trực quan hoặc phát video trong trình duyệt vì Browser access host và native pipe không kết nối được. Để xem: mở thư mục dự án bằng VS Code Live Server, mở `index.html`, nhấn Ctrl+Shift+R; kiểm tra ảnh sản phẩm ở máy tính/điện thoại, nhấn khối video để sang đầu tin tức và thử các nút phát/âm thanh trên video.


## Nâng video lên 1080p (09/11/2026)

Tạo `images/goc-desk-1080p.mp4` từ video gốc `images/Tik tok goc desk.mp4`, giữ nguyên file gốc. Độ phân giải nâng từ 720×576 lên 1350×1080 theo tỷ lệ 5:4; giảm nhiễu nhẹ, nội suy Lanczos và làm nét nhẹ. Đây là upscale bằng bộ lọc, không phải phục hồi chi tiết bằng AI. Mã hóa H.264 CRF 17, 60 fps, yuv420p, MP4 faststart để tải trên website; âm thanh AAC được sao chép nguyên vẹn.

Cập nhật nguồn và kích thước video trong `index.html`, `news.html`. Bản 1080p khoảng 1,2 MB, giữ đủ 529 khung hình; checksum SHA-256 của track âm thanh trùng bản gốc. Đã giải mã kiểm tra toàn bộ video không báo lỗi và kiểm tra khung hình ở giây thứ 3 trước/sau. Nội suy giúp trình bày mượt hơn nhưng không tái tạo chi tiết đã mất trong nguồn nén thấp.

Thêm `height: auto` cho video trang chủ trong `css/home.css` để kích thước khai báo 1350×1080 vẫn co đúng tỷ lệ trên điện thoại. Đã xác nhận máy chủ xem trước trả HTTP 200 cho hai trang và file MP4 mới.


## Thu nhỏ thẻ danh mục trang chủ (09/11/2026)

Sửa `css/home.css`: chuyển sáu danh mục sang một hàng trên màn hình lớn (trước đây ba cột/hai hàng), giảm khoảng đệm và chiều cao vùng tên. Tablet tối đa 1100px dùng ba cột; điện thoại tối đa 640px dùng hai cột với đệm và chiều cao tên nhỏ hơn. Không đổi nội dung và liên kết danh mục.

Đã kiểm tra CSS cân bằng ngoặc, `git diff --check` đạt, máy chủ xem trước trả HTTP 200 với quy tắc sáu cột mới. Chưa kiểm tra trực quan trong trình duyệt. Xem tại `http://127.0.0.1:3000/goc-desk-ecommerce-project/index.html#shop-categories`, nhấn Ctrl+Shift+R. File sửa: `css/home.css`, tài liệu này.


## Thay video theo file mới (09/11/2026)

Theo yêu cầu, đổi nguồn video ở `index.html` và `news.html` sang đúng `images/TIKTOK gocdesk tintuc.mp4` (2700×2160, tỷ lệ 5:4, khoảng 68 MB). Cập nhật kích thước khai báo và liên kết mở video dự phòng. Tham chiếu trực tiếp file người dùng cung cấp, không nén hoặc chỉnh sửa file video. Các nút liên kết sang câu chuyện tin tức giữ nguyên.

Kiểm tra: máy chủ xem trước trả HTTP 200 cho cả hai trang với nguồn mới, không còn nguồn `goc-desk-1080p.mp4`; yêu cầu HEAD tới video mới trả HTTP 200. `git diff --check` đạt. Đã đọc được metadata H.264/AAC, chưa kiểm tra phát trực tiếp trong trình duyệt. File sửa: `index.html`, `news.html`, tài liệu này.


## Khớp khung với video mới (09/11/2026)

Sửa `css/home.css` và `css/news-editorial.css`: đặt tỷ lệ 5:4 trên khung chứa để khớp video 2700×2160. Video chiếm toàn bộ chiều rộng và chiều cao khung; bỏ giới hạn chiều cao 460px/560px vốn làm video bị chèn khoảng nền dư khi cột rộng. Tỷ lệ khung được giữ khi màn hình thay đổi, không cắt hình; giữ video, âm thanh và điều khiển hiện có.

Đã kiểm tra CSS cân bằng ngoặc; chưa kiểm tra trực quan trong trình duyệt. File sửa: hai CSS trên và tài liệu này. Xem trang chủ `index.html#community` hoặc `news.html#news-desk-story`, nhấn Ctrl+Shift+R.
