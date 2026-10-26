# Góc Desk

**Đề tài:** Xây dựng website bán phụ kiện góc làm việc tích hợp thiết kế 3D và tạo ảnh minh họa.

## 1. Giới thiệu

Góc Desk kinh doanh phụ kiện phục vụ học tập, làm việc bằng laptop và đồ trang trí nhỏ đặt trên bàn. Các nhóm sản phẩm chủ yếu gồm vật dụng trang trí bàn làm việc và các sản phẩm công năng như chuột, bàn phím, giá đỡ laptop, đèn bàn. Góc tường và sàn trong công cụ 3D là bối cảnh mẫu để khách bố trí sản phẩm.

Website cho phép mua từng món hoặc mua những sản phẩm đã chọn trong một bộ setup. Trong phiên bản đầu, nhóm dự kiến xây dựng danh mục khoảng 30–40 sản phẩm, chọn 8–10 sản phẩm có mô hình 3D phù hợp để đưa vào công cụ bố trí. Công cụ thiết kế hỗ trợ khách hình dung cách sử dụng các sản phẩm trước khi quyết định mua; tạo ảnh AI minh họa là hướng phát triển sau.

### Vấn đề kinh doanh

Vấn đề trọng tâm là khách khó lựa chọn nhóm phụ kiện phù hợp nhu cầu, không gian và tổng ngân sách. Nhóm dự kiến kiểm chứng các khó khăn sau qua khảo sát khách hàng và phân tích website tương tự ở các nhiệm vụ tiếp theo:

- **Khó hình dung bố cục:** Ảnh từng sản phẩm chưa giúp khách hình dung rõ vị trí, màu sắc và mức độ chiếm chỗ khi đặt nhiều món trên cùng một bàn.
- **Khó kiểm soát tổng chi phí:** Khi chọn từng món riêng, khách phải tự cộng giá; việc thay một món có thể khiến tổng ngân sách thay đổi.
- **Khó đối chiếu thông tin phù hợp:** Khách phải kiểm tra kết nối, hệ điều hành hoặc dải kích thước hỗ trợ để biết phụ kiện có dùng được với thiết bị của mình hay không.
- **Mất thời gian chuyển giữa các bước:** Khách phải tìm sản phẩm, ghi lại lựa chọn, tự tưởng tượng cách bố trí rồi quay lại thêm từng món vào giỏ hàng.

### Cách website giải quyết vấn đề

Góc Desk kết nối quá trình tìm sản phẩm, bố trí không gian và đặt hàng trong một hành trình sử dụng. Khách có thể bắt đầu bằng cách xem danh mục, nhận gợi ý từ chatbot AI hoặc chọn một góc làm việc mẫu để tự sắp xếp.

1. **Tìm đúng nhóm sản phẩm:** Tìm kiếm và lọc theo loại sản phẩm, giá, thương hiệu, màu sắc và nhu cầu sử dụng; bổ sung bộ lọc kỹ thuật theo từng danh mục.
2. **Thử bố trí trong không gian 3D:** Thêm sản phẩm từ thư viện vào góc mẫu, di chuyển, xoay, xóa và đổi góc nhìn. Mô hình giữ kích thước theo dữ liệu; vị trí đặt được giới hạn trên mặt bàn.
3. **Kiểm soát lựa chọn và ngân sách:** Danh sách sản phẩm và tổng tiền cập nhật khi thêm hoặc bỏ món. Chỉ kiểm tra điều kiện tương thích có dữ liệu; thông tin thiếu được đánh dấu chưa xác minh.
4. **Chatbot AI gợi ý:** Tư vấn theo nhu cầu, ngân sách và phong cách; gợi ý sản phẩm hoặc bộ setup từ danh mục cửa hàng, kèm giá, liên kết và lý do lựa chọn.
5. **Lưu thiết kế và mua hàng:** Lưu bộ setup vào tài khoản hoặc thêm các món đã chọn vào giỏ. Kiểm tra lại giá và tồn kho trước khi xác nhận đơn hàng.

Ví dụ: Một sinh viên chọn chuột, bàn phím, giá đỡ và cây trang trí với ngân sách sản phẩm 1,5 triệu đồng. Sau khi bố trí trên góc mẫu, khách có thể thay một món, xem tổng giá mới và thêm bộ đã chọn vào giỏ. Khi chức năng tạo ảnh được triển khai ở giai đoạn sau, khách có thể tạo thêm ảnh theo phong cách tối giản để tham khảo. Voucher và phí giao hàng được hiển thị rõ ở bước thanh toán.

Bố cục 3D và mã sản phẩm được lưu là dữ liệu gốc để tính tiền và đặt hàng. Nếu được tích hợp, chức năng tạo ảnh gửi ảnh chụp bố cục 3D, danh sách sản phẩm và phong cách lựa chọn đến dịch vụ AI; giao diện hiển thị trạng thái xử lý và cho phép thử lại khi có lỗi. Ảnh AI chỉ minh họa phong cách, có thể khác chi tiết hoặc vị trí so với thiết kế. Việc kiểm tra kích thước dựa trên thông số sản phẩm và số đo người dùng cung cấp; hình ảnh minh họa không thay thế các dữ liệu này.

### Điểm khác biệt dự kiến

Điểm khác biệt nhóm hướng tới là hỗ trợ khách thử bố trí sản phẩm trước khi mua và chuyển bộ thiết kế thành giỏ hàng.

- Mỗi vật thể trong thư viện bán hàng gắn với mã sản phẩm, biến thể và giá tương ứng.
- Khách quyết định bố cục trong khung 3D; ở giai đoạn phát triển sau, ảnh minh họa theo một trong ba phong cách giới hạn giúp tham khảo phương án trang trí.
- Tổng giá thay đổi theo thiết kế; nhiều món có thể được đưa vào giỏ từ cùng một bộ đã lưu.
- Các góc mẫu dự kiến gắn với nơi ở của sinh viên và người đi làm, như học tập tại phòng trọ, làm đồ án và bắt đầu kỳ thực tập; nội dung được điều chỉnh theo khảo sát sinh viên UEH.

Đây là hướng khác biệt dự kiến. Mức độ khác biệt so với từng website cần được đối chiếu bằng khảo sát thực tế.

## 2. Khách hàng mục tiêu

Khách hàng chính là sinh viên và người mới đi làm có nhu cầu sắp xếp góc học tập hoặc làm việc cá nhân, sử dụng laptop và có ngân sách mua phụ kiện giới hạn. Nhóm chú trọng người muốn chọn nhiều món đồng bộ về màu sắc, công năng và kích thước nhưng chưa quen đọc thông số kỹ thuật.

Trong giai đoạn khảo sát, nhóm có thể tiếp cận sinh viên UEH để tìm hiểu nhu cầu bố trí bàn tại phòng trọ, học nhóm trực tuyến và chuẩn bị kỳ thực tập. Những tình huống này là cơ sở dự kiến để xây dựng bộ setup mẫu; mức độ phổ biến và tiêu chí lựa chọn cần được kiểm chứng qua khảo sát.

## 3. Chức năng chính

Phiên bản đầu dự kiến hoàn thiện chức năng mua hàng và quản trị, đồng thời triển khai công cụ 3D cùng chatbot AI gợi ý. Thanh toán, vận chuyển, voucher, tích điểm và Dashboard được đưa vào kế hoạch để phù hợp yêu cầu đồ án toàn học phần.

| Mã | Chức năng | Nội dung phiên bản đầu dự kiến |
| --- | --- | --- |
| F01 | Danh mục và tìm kiếm | Trang chủ, nhóm sản phẩm, tìm kiếm, sắp xếp và tối thiểu năm tiêu chí lọc phù hợp với danh mục. |
| F02 | Chi tiết sản phẩm | Ảnh, mô tả, giá, giá khuyến mãi nếu có, tồn kho, thông số, đánh giá và sản phẩm liên quan. |
| F03 | Tài khoản khách hàng | Đăng ký, đăng nhập, hồ sơ, địa chỉ, sản phẩm đã xem, đã mua và danh sách yêu thích. |
| F04 | Giỏ hàng, voucher và tích điểm | Thêm hoặc bỏ món, đổi số lượng, tính lại tiền; kiểm tra điều kiện, thời hạn và lượt sử dụng voucher. Cộng điểm khi đơn hoàn tất; xem số dư và lịch sử điểm; đổi điểm giảm giá theo quy tắc và hoàn điểm đã dùng khi đơn bị hủy. |
| F05 | Đặt hàng và vận chuyển | Nhập thông tin nhận hàng, tính phí theo bảng phí khu vực, xác nhận và lưu chi tiết đơn cùng trạng thái giao hàng. |
| F06 | Thanh toán sandbox | Tích hợp một cổng thử nghiệm; xác thực kết quả; xử lý thành công, thất bại, hủy và thông báo lặp. |
| F07 | Theo dõi đơn hàng | Khách xem lịch sử và trạng thái đơn thuộc tài khoản của mình; có email xác nhận đơn. |
| F08 | Quản trị cửa hàng | Quản lý sản phẩm, danh mục, nhóm sản phẩm, người dùng, đơn hàng, khuyến mãi, voucher và tài nguyên 3D. |
| F09 | Dashboard cơ bản | Thống kê doanh thu đơn hoàn tất, loại trừ đơn hủy; số đơn, sản phẩm bán chạy, đơn chờ giao và số khách hàng. |
| F10 | Thiết kế góc 3D | Một góc mẫu và 8–10 sản phẩm có mô hình; thêm, di chuyển, xoay, xóa, đổi góc nhìn và giới hạn vùng đặt. |
| F11 | Lưu và mua bộ setup | Lưu và mở lại bố cục, xem tổng giá, kiểm tra điều kiện tương thích có dữ liệu và thêm các món đã chọn vào giỏ. |

Chi tiết yêu cầu, mức độ ưu tiên, các điều kiện chờ nhóm chốt và tiêu chí nghiệm thu nằm trong [REQUIREMENTS.md](REQUIREMENTS.md). Các nội dung trên mô tả chức năng dự kiến, chưa phải xác nhận đã triển khai.

Giao diện phải sử dụng được trên desktop và mobile. Dữ liệu đầu vào cần được kiểm tra; khách hàng và quản trị viên được phân quyền; giá, tồn kho, voucher và thanh toán được xác minh phía máy chủ. Nhóm kiểm thử các luồng chính, dữ liệu biên và trường hợp lỗi trước khi triển khai.

Thứ tự triển khai dự kiến: luồng mua hàng → công cụ 3D và lưu thiết kế → chatbot AI gợi ý. Tài nguyên 3D và quyền truy cập API cần được chuẩn bị trước khi tích hợp. Khi dịch vụ AI lỗi, khách vẫn có thể tìm kiếm sản phẩm, chỉnh sửa bố cục và mua hàng bằng dữ liệu đã lưu.

### Hướng phát triển sau

Theo bản cập nhật Nhiệm vụ 1, tạo ảnh AI minh họa, dựng phòng từ ảnh thật và AR được cân nhắc cho giai đoạn sau theo thời gian, nguồn lực và kết quả kiểm thử. Nếu tích hợp tạo ảnh, hệ thống sử dụng ảnh chụp bố cục 3D, danh sách sản phẩm và phong cách lựa chọn để tạo ảnh tham khảo. Tìm kiếm bằng ảnh và flash sale nâng cao vẫn nằm ngoài phạm vi phiên bản đầu theo [quy trình nghiệp vụ](docs/business-workflow.md#6-phạm-vi-phiên-bản-đầu-và-giới-hạn).

**Điểm cần nhóm thống nhất:** Bản cập nhật Nhiệm vụ 1 xếp tạo ảnh AI minh họa vào giai đoạn sau, trong khi [PROJECT_PLAN.md](PROJECT_PLAN.md) vẫn đưa chức năng này vào phiên bản đầu. [Quy trình nghiệp vụ](docs/business-workflow.md) coi đây là hạng mục tích hợp bổ sung sau khi kiểm tra luồng mua hàng và 3D. Cần đồng bộ kế hoạch trước khi cam kết triển khai chức năng tạo ảnh.

## 4. Công nghệ dự kiến

| STT | Hạng mục | Công nghệ | Vai trò và chức năng trong Góc Desk |
|:---:|---|---|---|
| 1 | Frontend – Cấu trúc website | HTML5 | Xây dựng cấu trúc các trang như Trang chủ, Danh sách sản phẩm, Chi tiết sản phẩm, Tích điểm, Bảo hành, Tin tức và Thiết kế góc làm việc. Hiển thị văn bản, hình ảnh, giá sản phẩm, menu và các thành phần giao diện. |
| 2 | Frontend – Thiết kế giao diện | CSS3 | Thiết kế màu sắc thương hiệu, font chữ, kích thước, khoảng cách, bố cục, thẻ sản phẩm và hiệu ứng hover. Hỗ trợ giao diện responsive trên máy tính, máy tính bảng và điện thoại. |
| 3 | Frontend – Xử lý tương tác | JavaScript thuần | Xử lý sự kiện người dùng, thao tác với sản phẩm, thay đổi số lượng, cập nhật giỏ hàng và tính tổng tiền ở phía trình duyệt. |
| 4 | Công cụ phát triển frontend | Vite | Khởi chạy máy chủ phát triển cục bộ, hỗ trợ cập nhật trang khi mã nguồn thay đổi và đóng gói frontend khi triển khai. |
| 5 | Backend – Xử lý nghiệp vụ | Node.js + Express.js | Xây dựng máy chủ và API để tiếp nhận yêu cầu từ frontend, xử lý đăng nhập, truy xuất sản phẩm, tạo đơn hàng và lưu cấu hình thiết kế góc làm việc. |
| 6 | Hệ quản trị cơ sở dữ liệu | MySQL | Lưu trữ dữ liệu có cấu trúc, bao gồm tài khoản, danh mục, sản phẩm, giá bán, giỏ hàng, đơn hàng, chi tiết đơn hàng và thông tin thiết kế. |
| 7 | Thư viện kết nối cơ sở dữ liệu | mysql2 | Kết nối backend Node.js với MySQL, hỗ trợ thực hiện các truy vấn đọc, thêm, sửa và xóa dữ liệu. |
| 8 | Dịch vụ triển khai cơ sở dữ liệu | Railway – MySQL | Dự kiến sử dụng để triển khai cơ sở dữ liệu trực tuyến, cho phép backend truy cập dữ liệu khi website hoạt động trên môi trường mạng. Railway là dịch vụ triển khai, không phải hệ quản trị cơ sở dữ liệu riêng. |
| 9 | Công nghệ không gian 3D | Three.js | Xây dựng không gian làm việc 3D, hiển thị bàn và phụ kiện, hỗ trợ xoay góc nhìn, lựa chọn vật dụng và thay đổi cách bố trí trong không gian. |
| 10 | Quản lý mã nguồn và cộng tác | GitHub | Lưu trữ mã nguồn, quản lý lịch sử commit, theo dõi lỗi và công việc thông qua Issues, đồng thời hỗ trợ các thành viên phối hợp phát triển dự án. |
| 11 | Môi trường viết mã | Visual Studio Code | Soạn thảo HTML, CSS, JavaScript và mã backend; quản lý tệp dự án, sử dụng terminal và kiểm tra lỗi trong quá trình phát triển. |
| 12 | Kiểm thử giao diện | Google Chrome | Kiểm tra giao diện website, khả năng responsive, liên kết và các chức năng tương tác; sử dụng Developer Tools để hỗ trợ phát hiện lỗi. |

## 5. Thành viên và vai trò

| Thành viên | Vai trò |
| --- | --- |
| Nguyễn Kiều Oanh | Trưởng nhóm / BA |
| Nguyễn Hoàng Nhi | Frontend – Tài khoản và trải nghiệm mua hàng |
| Lê Bảo Ngọc | Tích hợp chức năng và quản trị website |
| Hoàng Huyền Nhi | UI/UX Designer |
| Nguyễn Huy Hoàng | Backend & Database – Nghiệp vụ TMĐT |
| Nguyễn Hoàng Hưng | Backend & Database – Dữ liệu và hệ thống |
| Sạch Thị Phương Trinh | Frontend – Giao diện mua hàng |

Trách nhiệm và kế hoạch công việc chi tiết nằm trong [PROJECT_PLAN.md](PROJECT_PLAN.md).

## 6. Liên kết

- [Bảng yêu cầu](REQUIREMENTS.md)
- [Kế hoạch dự án](PROJECT_PLAN.md)
- [Phân tích website tham khảo](docs/competitor-analysis.md)
- [Quy trình nghiệp vụ](docs/business-workflow.md)
- [Vai trò người dùng](docs/user-roles.md)
- [Nhật ký sử dụng AI](AI_USAGE_LOG.md)
- [Danh sách công việc trên GitHub](https://github.com/KieuOanh2006/goc-desk-ecommerce-project/issues)
