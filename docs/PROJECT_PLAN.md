# Project Plan – Góc Desk

## 1. Mục tiêu dự án

Góc Desk là website thương mại điện tử bán phụ kiện góc học tập và làm việc. Website hỗ trợ khách hàng tìm kiếm sản phẩm, bố trí phụ kiện trong không gian góc phòng 3D, lưu và mua bộ setup, sử dụng chatbot AI để được tư vấn sản phẩm và tạo ảnh AI minh họa phong cách.

Phạm vi phiên bản đầu gồm các chức năng mua hàng, tài khoản, quản trị, Dashboard, thiết kế góc 3D, lưu và mua bộ setup, chatbot AI và tạo ảnh AI minh họa.

## 2. Thành viên và vai trò

Bảng 1. Phân công vai trò dự án

| **Vai trò**                                  | **Thành viên**        | **Trách nhiệm chính**                                                                                                           |
| -------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Trưởng nhóm / BA                             | Nguyễn Kiều Oanh      | Phân tích yêu cầu, xác định phạm vi, lập kế hoạch, phân công và theo dõi tiến độ, quản lý GitHub Issues và điều phối nhóm.      |
| UI/UX Designer                               | Hoàng Huyền Nhi       | Nghiên cứu đối thủ, xây dựng luồng người dùng, thiết kế Figma và chuẩn bị tài nguyên giao diện.                                 |
| Frontend – Giao diện mua hàng                | Sạch Thị Phương Trinh | Xây dựng trang chủ, danh mục, tìm kiếm, bộ lọc, sắp xếp, chi tiết sản phẩm và giao diện responsive.                             |
| Frontend – Tài khoản và trải nghiệm mua hàng | Nguyễn Hoàng Nhi      | Xây dựng giao diện tài khoản, yêu thích, giỏ hàng, voucher, đặt hàng, theo dõi đơn, phối hợp triển khai giao diện 3D và AI.     |
| Backend & Database – Dữ liệu và hệ thống     | Nguyễn Hoàng Hưng     | Thiết kế cơ sở dữ liệu và API cho tài khoản, phân quyền, sản phẩm, danh mục, thông số và dữ liệu thiết kế 3D.                   |
| Backend & Database – Nghiệp vụ TMĐT          | Nguyễn Huy Hoàng      | Xử lý nghiệp vụ giá, tồn kho, giỏ hàng, voucher, khuyến mãi, đơn hàng, vận chuyển, trạng thái thanh toán và dữ liệu Dashboard.  |
| Tích hợp chức năng & quản trị website        | Lê Bảo Ngọc           | Tích hợp Frontend–Backend, xây dựng giao diện quản trị và Dashboard, phối hợp tích hợp thanh toán sandbox, email và dịch vụ AI. |


## 3. Các giai đoạn triển khai

**Bảng 2. Các giai đoạn triển khai dự án**

| Giai đoạn | Thời gian | Nội dung chính | Kết quả cần đạt | Trạng thái |
|---|---|---|---|---|
| 1. Khảo sát và xác định yêu cầu | Tuần 1 | Khảo sát đối thủ, xác định phạm vi, chức năng và user flow. | Thống nhất yêu cầu và repository dự án. | Hoàn thành |
| 2. Thiết kế và xây dựng giao diện | Tuần 2 | Thiết kế UI/UX, xây dựng HTML, CSS và responsive. | Hoàn thiện giao diện website. | Hoàn thành |
| 3. Phát triển Frontend | Tuần 3 | Tích hợp JavaScript, dữ liệu sản phẩm, tìm kiếm, lọc, giỏ hàng, LocalStorage và tương tác 3D. | Hoàn thiện các chức năng phía giao diện với dữ liệu mẫu. | Hoàn thành |
| 4. Phát triển Backend và cơ sở dữ liệu | Tuần 4–5 | Xây dựng máy chủ, cơ sở dữ liệu, API và xử lý tài khoản, sản phẩm, đơn hàng. | Hoàn thiện Backend và các API nền tảng. | Dự kiến |
| 5. Tích hợp và hoàn thiện nghiệp vụ | Tuần 6 | Kết nối Frontend – Backend, hoàn thiện đăng nhập, đặt hàng, voucher, vận chuyển và quản trị. | Các nghiệp vụ chính hoạt động đồng bộ. | Dự kiến |
| 6. Tích hợp nâng cao và kiểm thử | Tuần 7 | Tích hợp AI, chatbot, thanh toán thử nghiệm; kiểm thử và sửa lỗi. | Hoàn thiện chức năng và xử lý lỗi quan trọng. | Dự kiến |
| 7. Triển khai và nghiệm thu | Tuần 8 | Triển khai demo, hoàn thiện tài liệu và chuẩn bị thuyết trình. | Website và tài liệu sẵn sàng nghiệm thu. | Dự kiến |

## 4. Danh sách công việc

**Bảng 3. Danh sách công việc và tiến độ thực hiện**

*Trạng thái: Chưa bắt đầu – Đang thực hiện – Cần xử lý – Hoàn thành.*

| Mã công việc | Công việc | Người phụ trách | Kết quả cần đạt | Thời hạn | Trạng thái |
|---|---|---|---|---|---|
| GD-01 | Khảo sát, xác định yêu cầu và phạm vi dự án | Toàn nhóm | Thống nhất yêu cầu và chức năng website | Tuần 1 | Hoàn thành |
| GD-02 | Thiết lập repository và tổ chức mã nguồn | Kiều Oanh | Repository GitHub và cấu trúc dự án | Tuần 1–2 | Hoàn thành |
| GD-03 | Xây dựng giao diện HTML, CSS và responsive | Toàn nhóm | Hoàn thiện các trang giao diện | Tuần 2 | Hoàn thành |
| GD-04 | Cải thiện trang chủ và hình ảnh sản phẩm | Hoàng Nhi | Trang chủ hoàn thiện, bố cục và hình ảnh đồng bộ | Tuần 3 | Hoàn thành |
| GD-05 | Chuẩn hóa dữ liệu và hiển thị sản phẩm động | Huyền Nhi | Dữ liệu sản phẩm dùng chung và hiển thị bằng JavaScript | Tuần 3 | Hoàn thành |
| GD-06 | Hoàn thiện tìm kiếm, lọc và sắp xếp | Phương Trinh | Các chức năng tìm kiếm và xử lý danh sách sản phẩm | Tuần 3 | Hoàn thành |
| GD-07 | Xây dựng giỏ hàng và LocalStorage | Hoàng Hưng | Thêm, xóa, thay đổi số lượng, tính tiền và lưu giỏ hàng | Tuần 3 | Hoàn thành |
| GD-08 | Cải thiện giao diện và tương tác thiết kế 3D | Huy Hoàng | Hoàn thiện giao diện và các thao tác thiết kế 3D | Tuần 3 | Hoàn thành |
| GD-09 | Kiểm thử và chỉnh sửa hệ thống | Bảo Ngọc | Kiểm tra chức năng, giao diện và ghi nhận lỗi | Tuần 3 | Hoàn thành |
| GD-10 | Quản lý mã nguồn và tổng hợp tài liệu | Kiều Oanh | Theo dõi GitHub, README và minh chứng dự án | Tuần 3 | Hoàn thành |
| GD-11 | Thiết kế cơ sở dữ liệu và xây dựng Backend nền tảng | Hoàng Hưng, Huy Hoàng | Cơ sở dữ liệu và máy chủ Backend | Tuần 4–5 | Chưa bắt đầu |
| GD-12 | Xây dựng API sản phẩm, tài khoản và đơn hàng | Hoàng Hưng, Huy Hoàng | API phục vụ các chức năng chính | Tuần 4–5 | Chưa bắt đầu |
| GD-13 | Tích hợp Frontend với Backend | Bảo Ngọc và nhóm phối hợp | Các giao diện kết nối với API | Tuần 6 | Chưa bắt đầu |
| GD-14 | Hoàn thiện nghiệp vụ mua hàng, voucher và vận chuyển | Nhóm phát triển | Các luồng nghiệp vụ TMĐT hoạt động | Tuần 6 | Chưa bắt đầu |
| GD-15 | Tích hợp chức năng nâng cao và kiểm thử tổng thể | Toàn nhóm | Các chức năng nâng cao được tích hợp và kiểm tra | Tuần 7 | Chưa bắt đầu |
| GD-16 | Triển khai demo và hoàn thiện báo cáo | Kiều Oanh và toàn nhóm | Website demo, README và báo cáo cuối kỳ | Tuần 8 | Chưa bắt đầu |

## 5. Rủi ro và phương án xử lý

**Bảng 4. Đánh giá rủi ro và phương án xử lý**

| Rủi ro | Ảnh hưởng | Phương án xử lý | Người theo dõi |
|---|---|---|---|
| Phạm vi chức năng lớn | Có thể chậm tiến độ | Ưu tiên chức năng cốt lõi và chia nhỏ công việc. | Kiều Oanh |
| Dữ liệu sản phẩm không thống nhất | Lỗi hiển thị và giỏ hàng | Sử dụng nguồn dữ liệu sản phẩm dùng chung. | Huyền Nhi |
| Xung đột mã nguồn | Khó tích hợp | Thống nhất quy trình GitHub, commit và branch. | Kiều Oanh |
| Frontend và Backend không tương thích | Chậm tích hợp | Thống nhất cấu trúc dữ liệu và API trước khi kết nối. | Hoàng Hưng, Huy Hoàng |
| Mô hình 3D hoạt động chưa ổn định | Ảnh hưởng trải nghiệm | Giới hạn số lượng mô hình và kiểm tra hiệu suất. | Huy Hoàng |
| Dịch vụ AI hoặc thanh toán gặp lỗi | Gián đoạn chức năng | Kiểm thử riêng và chuẩn bị phương án xử lý khi dịch vụ không khả dụng. | Bảo Ngọc |
| Giao diện lỗi trên thiết bị nhỏ | Trải nghiệm không tốt | Kiểm thử responsive và sửa lỗi theo từng kích thước. | Bảo Ngọc |

## 6. Kế hoạch triển khai Buổi 3 – JavaScript

### 6.1. Mục tiêu

Kế thừa giao diện HTML5 và CSS3 từ Buổi 1, Buổi 2 để tích hợp JavaScript, phát triển các chức năng tương tác cho website Góc Desk.

### 6.2. Phạm vi triển khai

- Chuẩn hóa dữ liệu và hiển thị sản phẩm động.
- Tìm kiếm, lọc và sắp xếp sản phẩm.
- Hiển thị chi tiết sản phẩm theo ID.
- Thêm, xóa, thay đổi số lượng và tính tổng tiền giỏ hàng.
- Lưu và khôi phục giỏ hàng bằng LocalStorage.
- Cải thiện giao diện và tương tác thiết kế 3D.
- Kiểm thử, sửa lỗi và tích hợp mã nguồn trên GitHub.

### 6.3. Quy trình thực hiện

Rà soát mã nguồn → Phân công nhiệm vụ → Phát triển JavaScript → Commit/Push → Tích hợp → Kiểm thử.

### 6.4. Tiêu chí hoàn thành

- Danh sách sản phẩm được hiển thị từ dữ liệu JavaScript.
- Tìm kiếm, lọc và sắp xếp hoạt động.
- Trang chi tiết hiển thị đúng sản phẩm được chọn.
- Giỏ hàng hỗ trợ thêm, xóa, thay đổi số lượng và tính tổng tiền.
- LocalStorage lưu và khôi phục dữ liệu.
- Website hoạt động phù hợp trên các kích thước màn hình.
- Mã nguồn và tài liệu được cập nhật trên GitHub.
