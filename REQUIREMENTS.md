# Yêu cầu dự án Góc Desk

## 1. Mục tiêu dự án

Xây dựng website bán phụ kiện góc học tập và làm việc, kết nối việc tìm sản phẩm, thử bố trí trong không gian 3D và đặt hàng. Khách hàng mục tiêu là sinh viên và người mới đi làm sử dụng laptop, có không gian và ngân sách mua phụ kiện giới hạn.

Các mục tiêu kinh doanh và giá trị mang lại cho khách hàng:

- Hỗ trợ lựa chọn các phụ kiện đồng bộ về màu sắc, công năng, kích thước và phù hợp nhu cầu sử dụng.
- Giúp khách hình dung vị trí và mức độ chiếm chỗ khi đặt nhiều món trên cùng một bàn thông qua góc mẫu 3D.
- Cập nhật danh sách sản phẩm và tổng giá khi thêm, bỏ hoặc thay món để khách kiểm soát ngân sách.
- Hỗ trợ kiểm tra kết nối, hệ điều hành hoặc dải kích thước tương thích khi có dữ liệu; đánh dấu rõ trường hợp chưa xác minh.
- Cho phép lưu bộ setup và đưa các món đã chọn vào giỏ, giảm thao tác ghi nhớ và tìm lại từng sản phẩm.
- Tư vấn theo nhu cầu, ngân sách và phong cách bằng chatbot AI; gợi ý sản phẩm hoặc bộ setup từ danh mục cửa hàng, kèm giá, liên kết và lý do lựa chọn.
- Hỗ trợ tích điểm khi đơn hoàn tất, xem số dư và lịch sử điểm, đổi điểm giảm giá và hoàn điểm đã dùng khi đơn bị hủy theo quy tắc.
- Cung cấp chức năng quản trị sản phẩm, giá, tồn kho, đơn hàng, voucher và Dashboard phục vụ hoạt động cửa hàng.

Các khó khăn của khách hàng và mức độ khác biệt với website tương tự là giả định cần được kiểm chứng bằng khảo sát, không được xem là kết quả khảo sát đã hoàn tất.

## 2. Phạm vi

### 2.1. Trong phạm vi đề xuất

- Kinh doanh phụ kiện học tập, làm việc bằng laptop và đồ trang trí nhỏ trên bàn: chuột, bàn phím, giá đỡ laptop, đèn bàn và các vật dụng phù hợp.
- Danh mục khoảng 30–40 sản phẩm mẫu; chọn 8–10 sản phẩm có mô hình phù hợp cho công cụ bố trí 3D. Tường và sàn là bối cảnh mẫu.
- **F01–F03:** Danh mục, tìm kiếm, sắp xếp, bộ lọc; chi tiết sản phẩm; tài khoản, hồ sơ, địa chỉ, sản phẩm đã xem, lịch sử mua và yêu thích.
- **F04–F07:** Giỏ hàng, voucher, tích điểm, đặt hàng, phí vận chuyển theo bảng phí khu vực, thanh toán qua một cổng sandbox, email xác nhận và theo dõi đơn hàng. Điểm được cộng khi đơn hoàn tất; khách xem số dư và lịch sử điểm, đổi điểm giảm giá và được hoàn điểm đã dùng khi đơn bị hủy theo quy tắc.
- **F08–F09:** Quản trị dữ liệu cửa hàng, tài nguyên 3D và Dashboard cơ bản theo dữ liệu đơn hàng.
- **F10:** Một góc mẫu 3D; thêm, di chuyển, xoay, xóa và đổi góc nhìn; giới hạn vị trí trên mặt bàn và giữ kích thước theo dữ liệu sản phẩm.
- **F11:** Lưu và mở lại bố cục; cập nhật tổng giá; kiểm tra điều kiện tương thích có dữ liệu; mua từng món hoặc thêm các món đã chọn của bộ setup vào giỏ.
- **F12:** Chatbot AI tư vấn nhu cầu, ngân sách và phong cách; gợi ý sản phẩm hoặc bộ setup từ danh mục cửa hàng, kèm giá, liên kết và lý do lựa chọn.
- Giao diện desktop và mobile; kiểm tra đầu vào, phân quyền và xác minh giá, tồn kho, voucher, thanh toán ở máy chủ; kiểm thử luồng chính, dữ liệu biên và trường hợp lỗi.

Đây là phạm vi dự kiến theo bản cập nhật Nhiệm vụ 1, gồm 12 chức năng F01–F12. Mức độ ưu tiên, tiêu chí nghiệm thu và giới hạn triển khai được nêu chi tiết tại mục 4 và mục 6.

Thứ tự triển khai dự kiến: hoàn thiện luồng mua hàng, tiếp đến công cụ 3D và lưu thiết kế, sau đó tích hợp chatbot AI gợi ý. Khi dịch vụ AI lỗi, khách vẫn có thể tìm kiếm sản phẩm, chỉnh sửa bố cục và mua hàng. Bố cục và mã sản phẩm là dữ liệu gốc để tính tiền và đặt hàng.

### 2.2. Ngoài phạm vi phiên bản đầu theo bài nộp

- Tạo ảnh AI minh họa phong cách từ bố cục đã chọn.
- Tìm kiếm bằng ảnh và dựng phòng từ ảnh thật.
- AR và flash sale nâng cao.

Các chức năng này được cân nhắc cho giai đoạn sau theo thời gian, nguồn lực và kết quả kiểm thử. Nếu tích hợp tạo ảnh, hệ thống gửi ảnh chụp bố cục 3D, danh sách sản phẩm và phong cách lựa chọn đến dịch vụ AI; hiển thị trạng thái xử lý và cho phép thử lại khi có lỗi. Ảnh chỉ minh họa, có thể khác chi tiết hoặc vị trí so với thiết kế và không thay thế thông số kích thước hoặc căn cứ tính tiền.

**Điểm cần nhóm thống nhất:** Bản cập nhật Nhiệm vụ 1 xếp tạo ảnh AI minh họa vào giai đoạn sau, trong khi [PROJECT_PLAN.md](PROJECT_PLAN.md) vẫn đưa chức năng này vào phiên bản đầu. [Quy trình nghiệp vụ](docs/business-workflow.md) coi đây là hạng mục tích hợp bổ sung sau khi kiểm tra luồng mua hàng và 3D. Cần đồng bộ kế hoạch trước khi cam kết triển khai chức năng tạo ảnh.

## 3. Người dùng

| Vai trò | Nhiệm vụ chính | Quyền hạn và giới hạn |
| --- | --- | --- |
| Khách chưa đăng nhập | Tìm hiểu sản phẩm, thử bố trí góc làm việc và mua hàng. | Xem, tìm kiếm, lọc sản phẩm; quản lý giỏ hàng và bộ setup tạm thời; đặt hàng không cần tài khoản theo phương án đề xuất; tra cứu đơn bằng mã đơn và số điện thoại. Không được vào trang quản trị hoặc lưu thiết kế dài hạn vào tài khoản. |
| Khách hàng đã đăng nhập | Mua hàng, quản lý thông tin cá nhân và lưu bộ setup. | Có các quyền mua sắm của khách chưa đăng nhập; quản lý hồ sơ, địa chỉ, yêu thích, sản phẩm đã xem; xem lịch sử mua hàng; lưu và mở lại thiết kế của mình; yêu cầu tạo ảnh AI trong hạn mức nếu chức năng được triển khai. |
| Quản trị viên | Quản lý dữ liệu và hoạt động của cửa hàng. | Quản lý sản phẩm, danh mục, giá, tồn kho, người dùng, voucher, khuyến mãi, đơn hàng và tài nguyên thiết kế; xem Dashboard. Các thao tác phải được kiểm tra quyền ở máy chủ; không được xem mật khẩu gốc của khách hàng. |

Tất cả quyền riêng tư và quyền quản trị phải được kiểm tra ở máy chủ. Khách hàng chỉ thao tác dữ liệu của mình và không tự thay đổi giá, tồn kho, quyền tài khoản hoặc trạng thái thanh toán. Chưa tách thêm nhân viên kho hay nhân viên chăm sóc khách hàng trong phiên bản đầu.

## 4. Yêu cầu chức năng

Mỗi mục bên dưới có mã, tên, mô tả, người sử dụng, ưu tiên và tiêu chí nghiệm thu. Phiên bản đầu bao gồm 12 chức năng mua sắm, quản trị, thiết kế góc 3D và chatbot AI gợi ý.

### F01 Danh mục và tìm kiếm

*   **Mô tả:** Trang chủ, nhóm sản phẩm, tìm kiếm, sắp xếp và tối thiểu năm tiêu chí lọc phù hợp với danh mục.
*   **Người sử dụng:** Mọi khách.
*   **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu:**
1. Tìm theo tên sản phẩm; kết hợp các bộ lọc theo danh mục, khoảng giá, thương hiệu, màu sắc và nhu cầu sử dụng trên dữ liệu mẫu đã chuẩn hóa.
2. Khi chọn nhiều bộ lọc, kết quả đáp ứng đồng thời các điều kiện; sắp xếp giá tăng hoặc giảm hoạt động đúng.
3. Không có kết quả thì hiển thị thông báo và cách xóa bộ lọc.

### F02 Chi tiết sản phẩm

*   **Mô tả:** Ảnh, mô tả, giá, giá khuyến mãi nếu có, tồn kho, thông số, đánh giá và sản phẩm liên quan.
*   **Người sử dụng:** Mọi khách.
*   **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu:**
1. Hiển thị đúng thông tin, giá bán và tình trạng tồn kho của sản phẩm đang chọn.
2. Sản phẩm hết hàng không thể được đặt mua; thông tin kỹ thuật chưa đủ phải ghi "chưa xác minh".

### F03 Tài khoản khách hàng

*   **Mô tả:** Đăng ký, đăng nhập, hồ sơ, địa chỉ, sản phẩm đã xem, đã mua và danh sách yêu thích.
*   **Người sử dụng:** Khách đăng ký, khách hàng đã đăng nhập.
*   **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu:**
1. Đăng ký/đăng nhập hợp lệ; email trùng hoặc sai mật khẩu phải báo lỗi.
2. Tài khoản A không đọc hoặc sửa được dữ liệu cá nhân của tài khoản B qua API hay đường dẫn.

### F04 Giỏ hàng, voucher và tích điểm

*   **Mô tả:** Thêm hoặc bỏ món, đổi số lượng, tính lại tiền; kiểm tra điều kiện, thời hạn và lượt sử dụng voucher. Cộng điểm khi đơn hoàn tất; xem số dư và lịch sử điểm; đổi điểm giảm giá theo quy tắc và hoàn điểm đã dùng khi đơn bị hủy.
*   **Người sử dụng:** Mọi khách; khách hàng đã đăng nhập sử dụng điểm.
*   **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu:**
1. Cập nhật đúng tổng tiền khi đổi số lượng; đối chiếu tồn kho khi đặt hàng.
2. Voucher phải hợp lệ (còn hạn, còn lượt) mới được áp dụng.
3. Điểm thưởng được cộng đúng khi đơn hoàn thành và hoàn trả chính xác nếu đơn bị hủy.

### F05 Đặt hàng và vận chuyển

*   **Mô tả:** Nhập thông tin nhận hàng, tính phí theo bảng phí khu vực, xác nhận và lưu chi tiết đơn cùng trạng thái giao hàng.
*   **Người sử dụng:** Người mua.
*   **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu:**
1. Trước khi xác nhận, hiển thị tiền hàng, giảm giá, phí giao hàng và tổng phải trả.
2. Lưu thành công mã đơn, thông tin người nhận, chi tiết sản phẩm và tổng tiền.

### F06 Thanh toán sandbox

*   **Mô tả:** Tích hợp một cổng thử nghiệm, xác thực kết quả, xử lý thành công, thất bại, hủy và thông báo lặp.
*   **Người sử dụng:** Người mua.
*   **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu:**
1. Giao dịch gắn đúng mã đơn và số tiền; xử lý đúng các trạng thái thành công/thất bại/hủy.
2. Thông báo lặp không tạo đơn mới hoặc cộng dồn tiền/tồn kho nhiều lần.

### F07 Theo dõi đơn hàng

*   **Mô tả:** Khách xem lịch sử và trạng thái đơn thuộc tài khoản của mình, có email xác nhận đơn.
*   **Người sử dụng:** Khách hàng đã đăng nhập.
*   **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu:**
1. Khách chỉ xem được đơn của mình; hệ thống chặn truy cập đơn chéo bằng mã.
2. Nếu có email hợp lệ, gửi thông báo tiếp nhận đơn chính xác.

### F08 Quản trị cửa hàng

*   **Mô tả:** Quản lý sản phẩm, danh mục, nhóm sản phẩm, người dùng, đơn hàng, khuyến mãi, voucher và tài nguyên 3D.
*   **Người sử dụng:** Quản trị viên.
*   **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu:**
1. Các thao tác thêm, sửa, xóa, ẩn dữ liệu được bảo vệ bằng quyền quản trị ở cả giao diện và API.
2. Thay đổi giá hiện tại không làm đổi giá trong đơn đã lưu.

### F09 Dashboard cơ bản

*   **Mô tả:** Thống kê doanh thu đơn hoàn tất, loại trừ đơn hủy, số đơn, sản phẩm bán chạy, đơn chờ giao và số khách hàng.
*   **Người sử dụng:** Quản trị viên.
*   **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu:**
1. Cung cấp số liệu chính xác theo khoảng thời gian được chọn; đối chiếu khớp với dữ liệu thực tế.

### F10 Thiết kế góc 3D

*   **Mô tả:** Một góc mẫu và 8-10 sản phẩm có mô hình, thêm, di chuyển, xoay, xóa, đổi góc nhìn và giới hạn vùng đặt.
*   **Người sử dụng:** Mọi khách.
*   **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu:**
1. Thêm, di chuyển, xoay, xóa và đổi góc nhìn hoạt động mượt mà; vật thể không đặt ngoài vùng mặt bàn.

### F11 Lưu và mua bộ setup

*   **Mô tả:** Lưu và mở lại bố cục, xem tổng giá, kiểm tra điều kiện tương thích có dữ liệu và thêm các món đã chọn vào giỏ.
*   **Người sử dụng:** Khách hàng đã đăng nhập lưu; mọi khách chọn mua.
*   **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu:**
1. Chuyển các món trong không gian thành dòng hàng hợp lệ trong giỏ.
2. Khách chưa đăng nhập giữ bộ setup tạm thời; muốn lưu dài hạn phải đăng nhập.

### F12 Chatbot AI gợi ý

*   **Mô tả:** Tư vấn nhu cầu, ngân sách và phong cách; gợi ý sản phẩm hoặc bộ setup từ danh mục cửa hàng, kèm giá, liên kết và lý do lựa chọn.
*   **Người sử dụng:** Mọi khách.
*   **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu:**
1. Gợi ý chính xác danh sách sản phẩm dựa trên ngân sách và nhu cầu khách hàng đưa ra.
2. Đưa ra được lý do lựa chọn hợp lý và dẫn link trực tiếp đến sản phẩm hoặc thêm vào giỏ.

## 5. Yêu cầu phi chức năng

| Mã | Yêu cầu | Cách kiểm tra dự kiến |
| --- | --- | --- |
| NFR01 | Giao diện và khả năng sử dụng | Giao diện đáp ứng nhiều kích thước màn hình (360, 768, 1366 px). Chữ, nút không bị che hoặc tràn ngang. Có trạng thái trống, đang tải và lỗi. |
| NFR02 | Kiểm tra đầu vào | Dữ liệu đầu vào được kiểm tra ở cả giao diện và máy chủ. Thông báo đủ để người dùng sửa lỗi. |
| NFR03 | Phân quyền và bảo vệ tài khoản | Các chức năng quản trị được phân quyền chặn API trái phép. Mật khẩu được băm an toàn; bí mật hệ thống chỉ đặt ở máy chủ. Không công khai thông tin bí mật. |
| NFR04 | Tính nhất quán dữ liệu | Tính tiền ở máy chủ; đơn lưu giá tại lúc mua; thao tác lặp không tạo đơn hoặc thanh toán lặp. |
| NFR05 | Hiệu năng | Đo bằng Lighthouse trang chủ, danh mục, chi tiết trong cùng điều kiện. Đo riêng thời gian tải 3D và phản hồi AI. |
| NFR06 | Mã nguồn và khôi phục | Mã nguồn được tổ chức rõ ràng. Có hướng dẫn chạy, bản sao lưu hoặc script tạo dữ liệu mẫu. |
| NFR07 | Dịch vụ bên ngoài | Có hạn mức API và xử lý lỗi; AI sập không làm mất đơn hàng. |

## 6. Giới hạn và giả định

*   **Thời gian và nguồn lực:** Lịch dự kiến kéo dài 8 tuần theo Project Plan với 7 thành viên. Các ưu tiên cốt lõi phải được hoàn thành trong các tuần đầu tiên.
*   **Công nghệ:** Backend, CSDL, thư viện 3D, và API AI sẽ sử dụng các công nghệ được nhóm thống nhất; tích hợp API AI yêu cầu kiểm soát chi phí và hạn mức chặt chẽ.
*   **Phạm vi 3D:** Giới hạn cung cấp 8-10 sản phẩm có mô hình 3D mẫu trong một góc phòng định sẵn. Không hỗ trợ AR hay quét căn phòng thực tế trong phiên bản MVP này.
