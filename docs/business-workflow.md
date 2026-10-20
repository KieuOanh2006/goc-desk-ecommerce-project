
# NHIỆM VỤ 6 - XÁC ĐỊNH QUY TRÌNH NGHIỆP VỤ

## 1. Bảng quy trình nghiệp vụ chính

| Bước | Tên quy trình | Tác nhân | Mô tả xử lý nghiệp vụ | Kết quả |
|---|---|---|---|---|
| 1 | Bắt đầu mua sắm | Khách hàng | Truy cập website, tìm kiếm sản phẩm hoặc sử dụng chatbot AI. Nếu dùng chatbot, khách cung cấp nhu cầu, ngân sách và thiết bị đang sử dụng. | Xác định nhu cầu mua sắm |
| 2 | Gợi ý bộ setup | Khách hàng, Chatbot AI | Chatbot phân tích thông tin đầu vào, đề xuất bộ setup gồm sản phẩm, giá, tổng tiền, lý do gợi ý và thông tin tương thích đã biết. | Bộ setup được đề xuất |
| 3 | Xem và chọn sản phẩm | Khách hàng, Hệ thống | Khách tìm kiếm, lọc sản phẩm theo loại, giá, thương hiệu, màu sắc và thông số kỹ thuật. Xem chi tiết, giá, tồn kho và đánh giá sản phẩm. | Danh sách sản phẩm được lựa chọn |
| 4 | Bố trí setup 3D | Khách hàng, Hệ thống | Khách thêm, di chuyển, xoay hoặc xóa sản phẩm trên mặt bàn mẫu. Hệ thống cập nhật danh sách sản phẩm và tổng tiền. | Bố cục setup 3D hoàn chỉnh |
| 5 | Tạo ảnh và lưu setup | Khách hàng, Hệ thống AI | Khách có thể tạo ảnh AI minh họa phong cách. Khách đăng nhập được lưu setup; khách chưa đăng nhập chỉ lưu tạm trong phiên làm việc. | Setup được lưu hoặc giữ tạm |
| 6 | Thêm setup vào giỏ | Khách hàng, Hệ thống | Khách thêm toàn bộ hoặc một phần setup vào giỏ. Hệ thống kiểm tra giá hiện tại, tồn kho, số lượng và giới hạn mua. | Giỏ hàng được cập nhật |
| 7 | Áp dụng voucher và xác nhận giao hàng | Khách hàng, Hệ thống | Khách nhập voucher nếu có, cung cấp thông tin nhận hàng. Hệ thống kiểm tra điều kiện voucher, tính phí giao hàng và tổng tiền phải thanh toán. | Thông tin đơn hàng được xác nhận |
| 8 | Thanh toán và tạo đơn | Khách hàng, Hệ thống | Khách chọn phương thức thanh toán thử nghiệm. Hệ thống kiểm tra giá, tồn kho, voucher, địa chỉ và kết quả thanh toán trước khi tạo đơn. | Đơn hàng được tạo với trạng thái Chờ xác nhận |
| 9 | Xử lý đơn hàng | Quản trị viên, Hệ thống | Quản trị viên xác nhận, cập nhật trạng thái giao hàng, hoàn thành hoặc hủy đơn. Hệ thống lưu lịch sử thay đổi trạng thái. | Đơn hàng được xử lý và cập nhật trạng thái |
| 10 | Theo dõi đơn hàng | Khách hàng, Hệ thống | Khách đăng nhập xem lịch sử và trạng thái đơn thuộc tài khoản của mình. Hệ thống kiểm soát quyền truy cập dữ liệu đơn hàng. | Khách theo dõi được đơn hàng |

## 2. Bảng các trường hợp ngoại lệ

| STT | Trường hợp ngoại lệ | Cách xử lý của hệ thống | Kết quả mong muốn |
|---|---|---|---|
| 1 | Chatbot thiếu dữ liệu | Yêu cầu khách bổ sung thông tin hoặc chuyển sang tìm kiếm thủ công. | Khách tiếp tục mua sắm |
| 2 | Sản phẩm hết hàng | Thông báo sản phẩm hết hàng và đề xuất khách điều chỉnh lựa chọn. | Không thêm sản phẩm không đủ tồn kho |
| 3 | Giá sản phẩm thay đổi | Cập nhật giá hiện tại và yêu cầu khách xác nhận lại. | Giá trị giỏ hàng chính xác |
| 4 | Voucher không hợp lệ | Thông báo lý do không áp dụng voucher. | Không giảm giá sai điều kiện |
| 5 | Thanh toán thất bại hoặc bị hủy | Không xác nhận thanh toán thành công; giữ giỏ hàng và setup để khách thử lại. | Khách có thể thanh toán lại |
| 6 | Dịch vụ tạo ảnh AI lỗi | Thông báo lỗi nhưng vẫn cho phép lưu bố cục 3D, thêm giỏ và đặt hàng. | Không làm gián đoạn luồng mua hàng |
| 7 | Khách xem đơn hàng không thuộc tài khoản | Từ chối truy cập trái phép. | Bảo vệ dữ liệu khách hàng |

## 3. Bảng trạng thái nghiệp vụ

| Đối tượng | Trạng thái | Ý nghĩa |
|---|---|---|
| Bộ setup | Đang thiết kế | Khách đang bố trí và điều chỉnh sản phẩm |
| Bộ setup | Đã lưu | Bộ setup được lưu để mở lại và chỉnh sửa |
| Bộ setup | Đã thêm vào giỏ | Sản phẩm trong setup đã được đưa vào giỏ hàng |
| Đơn hàng | Chờ xác nhận | Đơn đã được tạo và chờ quản trị viên xử lý |
| Đơn hàng | Đã xác nhận | Đơn đã được quản trị viên xác nhận |
| Đơn hàng | Đang giao | Đơn đang được vận chuyển |
| Đơn hàng | Hoàn thành | Đơn hàng đã hoàn tất |
| Đơn hàng | Đã hủy | Đơn hàng đã bị hủy |

## 4. Bảng liên kết với yêu cầu chức năng

| Mã chức năng | Nhóm chức năng | Vai trò trong quy trình |
|---|---|---|
| F01 | Tìm kiếm sản phẩm | Hỗ trợ khách tìm sản phẩm |
| F02 | Lọc và xem sản phẩm | Hiển thị thông tin chi tiết và hỗ trợ lựa chọn |
| F03 | Quản lý tài khoản | Đăng nhập, quản lý thông tin và lưu setup |
| F04 | Quản lý giỏ hàng | Thêm, sửa số lượng và xóa sản phẩm |
| F05 | Quản lý voucher | Kiểm tra và áp dụng mã giảm giá |
| F06 | Thanh toán | Xử lý thanh toán thử nghiệm |
| F07 | Quản lý đơn hàng | Theo dõi và cập nhật trạng thái đơn |
| F08 | Quản trị hệ thống | Quản lý sản phẩm, dữ liệu tương thích, mô hình 3D, voucher và tồn kho |
| F09 | Thống kê và báo cáo | Hỗ trợ quản trị theo dõi hoạt động kinh doanh |
| F10 | Bố trí không gian 3D | Cho phép khách bố trí sản phẩm trên mặt bàn mẫu |
| F11 | Lưu bộ setup | Lưu và mở lại bộ setup đã thiết kế |
| F12 | Tạo ảnh AI minh họa | Tạo ảnh tham khảo phong cách setup |

## 5. Quy tắc nghiệp vụ quan trọng

| Mã | Quy tắc nghiệp vụ |
|---|---|
| BR01 | Giá sản phẩm, tồn kho, voucher và kết quả thanh toán phải được kiểm tra ở phía máy chủ trước khi tạo đơn. |
| BR02 | Khách chưa đăng nhập chỉ được giữ bộ setup tạm thời trong phiên làm việc. |
| BR03 | Khách đã đăng nhập chỉ được xem đơn hàng thuộc tài khoản của mình. |
| BR04 | Dữ liệu tương thích chưa được xác minh phải được thông báo rõ cho khách. |
| BR05 | Ảnh AI chỉ mang tính minh họa phong cách, không thay thế dữ liệu kích thước, giá hoặc thông tin tương thích. |
| BR06 | Thanh toán thất bại hoặc bị hủy không được xem là thanh toán thành công. |
| BR07 | Mọi thay đổi trạng thái đơn hàng phải được lưu lại để phục vụ kiểm tra. |
| BR08 | Flash sale nâng cao, AR và dựng phòng từ ảnh thật không thuộc phạm vi phiên bản đầu. |
