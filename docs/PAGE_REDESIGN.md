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
