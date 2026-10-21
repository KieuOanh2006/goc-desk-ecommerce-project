# NHIỆM VỤ 6 - XÁC ĐỊNH QUY TRÌNH NGHIỆP VỤ

## 1. Mục tiêu quy trình

Quy trình mô tả hành trình của khách hàng từ khi xác định nhu cầu bố trí góc học tập hoặc làm việc đến khi hoàn tất đơn tại Góc Desk. Quy trình hướng đến ba khó khăn chính: khó chọn phụ kiện đồng bộ, khó hình dung bố cục của nhiều món trên cùng một mặt bàn và khó kiểm soát tổng chi phí của cả bộ setup.

Phiên bản đầu kết hợp luồng mua hàng trực tuyến với chatbot AI gợi ý và công cụ bố trí 3D. Chatbot AI tiếp nhận nhu cầu, ngân sách và thiết bị đang dùng để gợi ý sản phẩm hoặc bộ setup từ danh mục thực tế. Công cụ 3D giúp khách điều chỉnh bố cục trong một góc bàn mẫu; không triển khai AR hoặc dựng lại căn phòng thật từ ảnh của khách.

## 2. Tác nhân tham gia

Khách chưa đăng nhập có thể xem, tìm kiếm và lọc sản phẩm; sử dụng chatbot AI; tạo bộ setup tạm thời; quản lý giỏ hàng và đặt hàng theo phương án mua không cần tài khoản. Khách hàng đã đăng nhập có thêm quyền quản lý hồ sơ, địa chỉ, danh sách yêu thích, lịch sử đơn, điểm tích lũy và lưu bộ setup để mở lại. Quản trị viên quản lý sản phẩm, danh mục, dữ liệu tương thích, mô hình 3D, voucher, điểm thưởng, tồn kho và trạng thái đơn hàng. Hệ thống thực hiện việc gợi ý, tính giá, kiểm tra dữ liệu, tạo đơn và gửi thông báo.

## 3. Quy trình chính

| Bước | Tác nhân | Hoạt động và xử lý nghiệp vụ | Kết quả |
|---|---|---|---|
| 1. Bắt đầu mua sắm | Khách hàng | Khách truy cập Góc Desk, tìm sản phẩm theo danh mục hoặc mở chatbot AI. Khi dùng chatbot, khách cung cấp tối thiểu nhu cầu, ngân sách và thiết bị đang dùng. | Xác định nhu cầu mua sắm. |
| 2. Chatbot AI gợi ý | Khách hàng, chatbot AI | Chatbot đối chiếu thông tin khách cung cấp với danh mục sản phẩm thực tế để đề xuất một hoặc nhiều phương án. Mỗi phương án có danh sách sản phẩm, giá từng món, tổng tiền dự kiến, lý do gợi ý, liên kết sản phẩm và điều kiện tương thích đã biết. Khách có thể chọn, thay món hoặc tự tìm kiếm. | Có phương án sản phẩm hoặc bộ setup để tham khảo. |
| 3. Xem và chọn sản phẩm | Khách hàng, hệ thống | Khách tìm kiếm và lọc theo loại, giá, thương hiệu, màu sắc và tiêu chí kỹ thuật phù hợp. Trang chi tiết hiển thị ảnh, giá, tồn kho, thông số, mô tả, đánh giá và sản phẩm liên quan. | Sản phẩm được thêm vào bộ setup hoặc giỏ hàng. |
| 4. Bố trí setup 3D | Khách hàng, hệ thống | Với sản phẩm có mô hình 3D, khách thêm, di chuyển, xoay, xóa vật thể và đổi góc nhìn trong góc bàn mẫu. Hệ thống cập nhật danh sách sản phẩm và tổng tiền dự kiến. Kích thước, giá, tồn kho và tương thích luôn lấy từ dữ liệu sản phẩm. | Có bố cục 3D và danh sách sản phẩm tương ứng. |
| 5. Lưu setup và thêm vào giỏ | Khách hàng, hệ thống | Khách đã đăng nhập có thể lưu setup để mở lại; khách chưa đăng nhập chỉ giữ setup trong phiên làm việc. Khi chọn mua, hệ thống chuyển từng món thành dòng hàng riêng và kiểm tra lại mã sản phẩm, giá, tồn kho và giới hạn mua hàng. | Giỏ hàng được cập nhật chính xác. |
| 6. Áp dụng voucher, điểm và xác nhận giao hàng | Khách hàng, hệ thống | Hệ thống kiểm tra điều kiện, thời hạn, lượt dùng và giá trị đơn tối thiểu của voucher. Khách đã đăng nhập đủ điều kiện có thể dùng điểm tích lũy theo quy tắc. Hệ thống tính phí giao hàng theo khu vực và hiển thị rõ tiền hàng, giảm giá voucher, giảm giá điểm, phí giao hàng và tổng tiền. | Thông tin thanh toán được xác nhận. |
| 7. Thanh toán và tạo đơn | Khách hàng, hệ thống | Khách chọn phương thức thanh toán thử nghiệm. Máy chủ kiểm tra lại giá, tồn kho, voucher, điểm đã dùng, địa chỉ và kết quả thanh toán trước khi tạo đơn. | Đơn được tạo với trạng thái **Chờ xác nhận**. |
| 8. Theo dõi đơn và tích điểm | Khách hàng, quản trị viên, hệ thống | Quản trị viên xử lý đơn theo các trạng thái đã quy định. Khách chỉ xem được đơn thuộc tài khoản của mình. Khi đơn **Hoàn thành**, hệ thống cộng điểm và ghi lịch sử điểm. Nếu đơn bị hủy sau khi dùng điểm, hệ thống hoàn điểm theo quy tắc. | Đơn hàng và điểm tích lũy được cập nhật nhất quán. |

## 4. Các trường hợp ngoại lệ

| Trường hợp | Cách xử lý của hệ thống | Kết quả mong muốn |
|---|---|---|
| Chatbot thiếu dữ liệu | Yêu cầu khách bổ sung nhu cầu hoặc ngân sách, đồng thời cho phép chuyển sang tự tìm kiếm. | Khách tiếp tục mua sắm. |
| Sản phẩm hết hàng hoặc giá thay đổi | Thông báo rõ sản phẩm bị ảnh hưởng và yêu cầu khách xác nhận lại trước khi thanh toán. | Không phát sinh đơn với dữ liệu không chính xác. |
| Voucher hoặc điểm không hợp lệ | Không áp dụng ưu đãi và nêu rõ lý do. | Không giảm giá sai điều kiện. |
| Thanh toán thất bại hoặc bị hủy | Đơn không được xác nhận; giỏ hàng và bộ setup vẫn được giữ để khách thử lại. | Không ghi nhận sai kết quả thanh toán. |
| Đơn bị hủy | Cập nhật tồn kho và hoàn điểm đã dùng theo quy tắc. Điểm của đơn hủy không được cộng. | Dữ liệu tồn kho và điểm thưởng nhất quán. |
| Chatbot AI không phản hồi | Hiển thị thông báo lỗi; khách vẫn có thể tìm kiếm, bố trí 3D và mua hàng. | AI không làm gián đoạn luồng mua hàng. |

## 5. Dữ liệu và trạng thái chính

| Đối tượng | Trạng thái | Ý nghĩa |
|---|---|---|
| Bộ setup | Đang thiết kế | Khách đang thêm và điều chỉnh sản phẩm trong không gian 3D. |
| Bộ setup | Đã lưu | Bộ setup của khách đã đăng nhập được lưu để mở lại. |
| Bộ setup | Đã thêm vào giỏ | Sản phẩm trong bộ setup đã được chuyển thành các dòng hàng trong giỏ. |
| Đơn hàng | Chờ xác nhận | Đơn đã được tạo hợp lệ và chờ quản trị viên xử lý. |
| Đơn hàng | Đã xác nhận | Quản trị viên đã tiếp nhận và xác nhận đơn. |
| Đơn hàng | Đang giao | Đơn đang trong quá trình vận chuyển. |
| Đơn hàng | Hoàn thành | Đơn đã hoàn tất; hệ thống cộng điểm cho khách theo quy tắc. |
| Đơn hàng | Đã hủy | Đơn không tiếp tục thực hiện; điểm đã dùng được hoàn theo quy tắc. |

## 6. Phạm vi phiên bản đầu và giới hạn

Phiên bản đầu bao gồm danh mục và tìm kiếm sản phẩm, tài khoản khách hàng, giỏ hàng, voucher cơ bản, tích điểm, đặt hàng, thanh toán thử nghiệm, theo dõi đơn, quản trị cơ bản, công cụ bố trí 3D với một góc bàn mẫu và 8-10 mô hình sản phẩm, lưu và mua bộ setup, cùng chatbot AI gợi ý sản phẩm hoặc bộ setup.

Tạo ảnh minh họa bằng AI là hạng mục tích hợp bổ sung, chỉ thực hiện sau khi luồng mua hàng và công cụ 3D đã được kiểm tra về kỹ thuật. Nếu được triển khai, ảnh chỉ phục vụ tham khảo phong cách, phải gắn nhãn minh họa và không được dùng để xác định giá, tồn kho hay sản phẩm trong đơn. Dựng phòng từ ảnh thật, AR, tìm kiếm bằng ảnh và flash sale nâng cao được phát triển sau.

## 7. Liên kết với yêu cầu chức năng

| Mã | Chức năng | Vai trò trong quy trình |
|---|---|---|
| F01 | Danh mục và tìm kiếm | Hỗ trợ khách tìm và lọc sản phẩm. |
| F02 | Chi tiết sản phẩm | Cung cấp thông tin để khách đánh giá và lựa chọn sản phẩm. |
| F03 | Tài khoản khách hàng | Quản lý hồ sơ, địa chỉ, lịch sử đơn và lưu setup. |
| F04 | Giỏ hàng, voucher và tích điểm | Quản lý giỏ hàng, voucher, điểm tích lũy, sử dụng và hoàn điểm. |
| F05 | Đặt hàng và vận chuyển | Thu thập thông tin nhận hàng, tính phí và tạo đơn. |
| F06 | Thanh toán sandbox | Xác thực kết quả thanh toán thử nghiệm. |
| F07 | Theo dõi đơn hàng | Hiển thị lịch sử và trạng thái đơn thuộc tài khoản khách. |
| F08 | Quản trị cửa hàng | Quản lý sản phẩm, tồn kho, voucher, đơn hàng và tài nguyên 3D. |
| F09 | Dashboard cơ bản | Thống kê dữ liệu kinh doanh phục vụ quản trị. |
| F10 | Thiết kế góc 3D | Bố trí sản phẩm trong góc bàn mẫu. |
| F11 | Lưu và mua bộ setup | Lưu bố cục, tính tổng giá và chuyển sản phẩm vào giỏ. |
| F12 | Chatbot AI gợi ý | Gợi ý sản phẩm hoặc bộ setup theo nhu cầu, ngân sách và phong cách. |

## 8. Quy tắc nghiệp vụ quan trọng

| Mã | Quy tắc nghiệp vụ |
|---|---|
| BR01 | Giá, tồn kho, voucher, điểm và kết quả thanh toán phải được kiểm tra ở phía máy chủ trước khi tạo đơn. |
| BR02 | Khách chưa đăng nhập chỉ được giữ bộ setup tạm thời; khách đã đăng nhập mới lưu setup vào tài khoản. |
| BR03 | Khách chỉ được xem đơn hàng, điểm tích lũy và bộ setup thuộc tài khoản của mình. |
| BR04 | Dữ liệu tương thích chưa được xác minh phải được thông báo rõ cho khách. |
| BR05 | Điểm chỉ được cộng khi đơn hoàn thành; điểm đã sử dụng được hoàn khi đơn bị hủy theo quy tắc. |
| BR06 | Thanh toán thất bại hoặc bị hủy không được xem là thanh toán thành công. |
| BR07 | Mọi thay đổi trạng thái đơn hàng phải được lưu lại để phục vụ kiểm tra. |
| BR08 | Chatbot AI chỉ gợi ý từ danh mục thực tế, không tự thay đổi giá, tồn kho hoặc tạo đơn. |
| BR09 | Ảnh AI, nếu được tích hợp, chỉ mang tính minh họa; không thay thế dữ liệu sản phẩm thực tế. |
| BR10 | Flash sale nâng cao, AR, dựng phòng từ ảnh thật và tìm kiếm bằng ảnh không thuộc phạm vi phiên bản đầu. |
