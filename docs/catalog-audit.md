# Nhiệm vụ 5 — Rà soát tìm kiếm, lọc và sắp xếp sản phẩm

Ngày kiểm tra: 09/11/2026. Căn cứ: F01 trong `docs/REQUIREMENTS.md`.

## 1. Chức năng đã có

- `products.html`: ô tìm kiếm, 5 nhóm lọc (danh mục, khoảng giá, thương hiệu, màu sắc, nhu cầu), lựa chọn sắp xếp, số lượng kết quả, thông báo rỗng và hai nút xóa lọc.
- `js/catalog-utils.js`: tìm kiếm không phân biệt hoa/thường, hỗ trợ tiếng Việt không dấu; nhiều lựa chọn trong cùng nhóm kết hợp OR, giữa các nhóm kết hợp AND; sắp xếp giá tăng, giá giảm và tên A–Z.
- `js/products.js`: kết hợp tìm kiếm với bộ lọc và sắp xếp; đọc và cập nhật URL qua `q`, `category`, `brand`, `color`, `use`, `price`, `sort`. Nhiều giá trị trong một nhóm được phân cách bằng dấu phẩy. Cập nhật dùng `history.replaceState`.
- Không có kết quả: hiển thị thông báo, số lượng bằng 0, ẩn dòng kết thúc và cung cấp nút xóa tất cả bộ lọc.
- `css/product-pages.css`, `css/product-interactions.css`: có bố cục responsive; sản phẩm chuyển từ 4 cột trên desktop sang 2 cột trên tablet và 1 cột trên mobile.
- Dữ liệu hiện tại gồm 8 sản phẩm mẫu, 6 danh mục và 1 thương hiệu HyperWork trong `js/product-data.js`.

## 2. Các trường hợp đã chạy và kết quả

Chạy JavaScript thật của trang bằng Chrome headless, với một bản HTML kiểm tra tạm dùng cùng mã nguồn và CSS của dự án. Các thao tác được kích hoạt trên DOM thật. Bản kiểm tra không thay đổi mã nguồn ứng dụng.

| STT | Trường hợp | Kết quả thực tế |
| --- | --- | --- |
| 1 | Mở URL có `q=ban%20phim&category=keyboard&price=300to700&sort=price-desc` | Đạt: khôi phục từ khóa, danh mục, giá và sắp xếp; còn HyperOne Gen 2. |
| 2 | Xóa lọc sau khi mở URL trên | Đạt: trả lại 8 thẻ, xóa query, xóa từ khóa, sắp xếp mặc định. |
| 3 | Nhập `  BAN PHIM  ` | Đạt: còn HyperOne Gen 2; URL lưu từ khóa đã bỏ khoảng trắng hai đầu. |
| 4 | Chọn đồng thời danh mục `keyboard` và `mouse` | Đạt: hiển thị 2 sản phẩm, kết hợp OR trong nhóm. |
| 5 | Chọn `organize` + HyperWork + màu kem + nhu cầu sắp xếp + giá dưới 300.000 đồng | Đạt: chỉ còn Khay đi dây CM02, kết hợp AND giữa 5 nhóm. |
| 6 | Kiểm tra URL sau tổ hợp ở trường hợp 5 | Đạt: lưu đủ `category`, `brand`, `color`, `use`, `price` với giá trị đã chọn. |
| 7 | Thêm từ khóa `khay` và sắp xếp giá tăng vào tổ hợp ở trường hợp 5 | Đạt: vẫn chỉ còn CM02. |
| 8 | Chọn danh mục đèn và màu đen | Đạt: 0 thẻ, số đếm bằng 0, hiện thông báo rỗng, ẩn dòng kết thúc. |
| 9 | Nhấn nút xóa tất cả trong thông báo rỗng | Đạt: trả lại 8 thẻ và ẩn thông báo rỗng. |
| 10 | Sắp xếp giá tăng dần | Đạt: toàn bộ danh sách có giá không giảm. |
| 11 | Sắp xếp giá giảm dần | Đạt: toàn bộ danh sách có giá không tăng. |
| 12 | Sắp xếp tên A–Z | Đạt: thứ tự khớp phép so sánh tiếng Việt `localeCompare(..., 'vi')`. |
| 13 | Lọc một danh mục rồi xóa lọc | Đạt: giữ nguyên các DOM node của thẻ và nút thêm giỏ hàng. Chưa kiểm tra nghiệp vụ thêm giỏ trong lượt này. |
| 14 | Tìm chuỗi chứa thẻ script | Đạt: không có sản phẩm; chuỗi được hiển thị dưới dạng văn bản trong trạng thái tìm kiếm. |
| 15 | Chọn mức giá dưới 300.000 đồng | Đạt: chỉ có một radio khoảng giá được chọn. |

**Kết quả: 15/15 trường hợp tương tác đạt.** Không phát hiện lỗi cần sửa trong các trường hợp đã chạy.

## 3. Kiểm tra responsive thực tế

Đo trang ở desktop và tải trang gốc trong iframe cùng trình duyệt cho các kích thước nhỏ. So sánh chiều rộng nội dung với vùng hiển thị; đọc số cột bằng computed style. Đây là kiểm tra bố cục bằng trình duyệt, chưa phải đánh giá trực quan trên thiết bị thật.

| Chiều rộng viewport | Cột sản phẩm | Chiều rộng nội dung / vùng hiển thị | Kết quả |
| --- | --- | --- | --- |
| Desktop 1422px | 4 | 1407 / 1407px | Không tràn ngang. |
| Tablet 768px | 2 | 753 / 753px | Không tràn ngang. |
| Mobile 375px | 1 | 360 / 360px | Không tràn ngang. |
| Mobile 320px | 1 | 305 / 305px | Không tràn ngang. |

Chiều rộng vùng hiển thị nhỏ hơn viewport do thanh cuộn dọc. Ở tablet, form bộ lọc cũng được đo và có 2 cột.

## 4. Nội dung bổ sung và phạm vi thay đổi

- Bổ sung tài liệu này để ghi lại chức năng đã có, các trường hợp kiểm tra và kết quả thực tế. Bộ test `tests/catalog.test.mjs` có sẵn các kiểm tra logic danh mục nhưng chưa chạy tương tác trang danh sách sản phẩm; lượt rà soát này bổ sung bằng chứng chạy trên DOM thật.
- Không sửa HTML, JavaScript hoặc CSS vì chưa xác nhận được lỗi trong phạm vi đã kiểm tra.
- Không thay đổi API, dữ liệu sản phẩm hoặc quy tắc nghiệp vụ.

## 5. Cách kiểm tra lại và giới hạn

Mở thư mục dự án bằng VS Code, dùng Live Server để phục vụ `products.html`, sau đó thực hiện lần lượt các trường hợp ở mục 2. Dùng Chrome DevTools để kiểm tra các chiều rộng 320px, 375px, 768px và desktop; quan sát số cột, khả năng thao tác bộ lọc và thanh cuộn ngang.

- Lượt kiểm tra tự động này chạy qua `file://` với quyền đọc tài nguyên cục bộ; chưa chạy lại qua HTTP/Live Server hoặc môi trường triển khai.
- Chưa chạy bộ `.mjs` có sẵn vì môi trường không nhận lệnh `node`; không coi bộ test đó là đã đạt.
- Chưa kiểm tra Safari/Firefox, thiết bị cảm ứng thật, điều hướng Back/Forward, URL có giá trị sai hoặc tham số lặp.
- Chưa kiểm tra phản hồi giao diện với từ khóa rất dài hay số lượng sản phẩm lớn. Kết quả hiện tại chỉ áp dụng cho 8 sản phẩm mẫu.
- Nếu kiểm tra bổ sung phát hiện lỗi, cần nêu cách tái hiện, file dự kiến sửa, ảnh hưởng và cách kiểm thử, rồi chờ xác nhận trước khi sửa mã theo mục 4.1 của `AGENTS.md`.
