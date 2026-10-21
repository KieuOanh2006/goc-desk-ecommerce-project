# **Nhiệm vụ 3\. Prompt 1 – Phân tích yêu cầu dự án Góc Desk**

- Công cụ sử dụng: ChatGPT  
- Mục tiêu: Sử dụng ChatGPT để phân tích yêu cầu dự án website thương mại điện tử Góc Desk, xác định mục tiêu, phạm vi, nhóm người dùng, chức năng, quy trình nghiệp vụ, yêu cầu phi chức năng, mức độ ưu tiên và rủi ro triển khai.  
- Bối cảnh dự án: Góc Desk là website kinh doanh phụ kiện góc học tập và làm việc, hướng đến sinh viên và người mới đi làm. Điểm khác biệt dự kiến của dự án là kết hợp mua sắm trực tuyến với công cụ bố trí sản phẩm trong không gian 3D, lưu bộ setup và tạo ảnh minh họa bằng AI.  
- Yêu cầu đối với ChatGPT: Phân tích dự án theo các nội dung đã xác định, đề xuất danh sách chức năng có mã định danh, phân biệt chức năng cốt lõi và chức năng nâng cao, đồng thời đánh giá tính khả thi trong thời gian thực hiện 6 tuần với nhóm 7 thành viên. Những chức năng phụ thuộc vào API, mô hình 3D hoặc dịch vụ bên ngoài cần được đánh dấu để nhóm kiểm tra trước khi triển khai.  
- Kết quả sử dụng: Nội dung phân tích từ ChatGPT được dùng làm cơ sở ban đầu để nhóm xác định yêu cầu.

## **1\. Mục tiêu và phạm vi dự án**

### **a. Mục tiêu dự án**

# Góc Desk là dự án website thương mại điện tử kinh doanh phụ kiện góc học tập và làm việc, hướng đến sinh viên và người mới đi làm có nhu cầu sắp xếp không gian cá nhân với ngân sách hợp lý. Website không chỉ hỗ trợ tìm kiếm và mua sắm trực tuyến mà còn kết nối quá trình lựa chọn sản phẩm với công cụ bố trí góc làm việc 3D, lưu bộ setup và mua các sản phẩm đã chọn.

# Dự án hướng đến bốn mục tiêu chính:

- # Hỗ trợ mua sắm trực tuyến: Cho phép khách hàng tìm kiếm, xem thông tin, lựa chọn sản phẩm, quản lý giỏ hàng và đặt hàng.

- # Hỗ trợ lựa chọn sản phẩm: Cung cấp thông tin về giá bán, thông số, màu sắc và tình trạng tồn kho để khách hàng dễ so sánh.

- # Hỗ trợ hình dung không gian: Cho phép khách hàng thử bố trí các sản phẩm trong một góc làm việc mẫu, theo dõi tổng chi phí và lưu thiết kế.

- # Tăng tính trực quan: Định hướng tích hợp AI để tư vấn sản phẩm và tạo ảnh minh họa, giúp khách tham khảo phong cách bố trí trước khi mua.

# Với thời gian thực hiện 6 tuần và nhóm gồm 7 thành viên, dự án cần ưu tiên hoàn thiện các chức năng mua hàng và quản trị, sau đó triển khai công cụ 3D và các chức năng AI theo thứ tự ưu tiên.

### **b. Phạm vi dự án**

| Hạng mục | Phạm vi thực hiện |
| :---- | :---- |
| Sản phẩm kinh doanh | Chuột, bàn phím, giá đỡ laptop, đèn bàn và phụ kiện trang trí bàn làm việc. |
| Danh mục sản phẩm | Khoảng 30–40 sản phẩm trong phiên bản đầu. |
| Công cụ 3D | Một không gian mẫu và 8–10 sản phẩm có mô hình 3D phù hợp. |
| Khách hàng | Đăng ký, đăng nhập, quản lý tài khoản, tìm kiếm, mua hàng và theo dõi đơn. |
| Quản trị | Quản lý sản phẩm, danh mục, người dùng, đơn hàng, khuyến mãi và tài nguyên 3D. |
| Thanh toán và vận chuyển | Thanh toán qua một cổng thử nghiệm (sandbox), tính phí vận chuyển theo bảng phí khu vực. |
| AI | Chatbot tư vấn và gợi ý sản phẩm; tạo ảnh minh họa được triển khai theo thứ tự ưu tiên sau khi kiểm tra luồng mua hàng và 3D. |
| Ngoài phạm vi phiên bản đầu | Tạo ảnh phòng từ ảnh thật bằng AR và các chức năng nâng cao chưa đáp ứng điều kiện về thời gian hoặc nguồn lực. |

# Ảnh AI chỉ phục vụ minh họa phong cách, không thay thế hình ảnh sản phẩm thực tế hoặc dữ liệu dùng để tính giá và tạo đơn hàng. Góc tường và sàn trong công cụ 3D là bối cảnh mẫu để khách bố trí sản phẩm.

## **2\. Các nhóm người dùng và quyền hạn**

| Nhóm người dùng | Quyền hạn chính | Mức độ ưu tiên |
| :---- | :---- | :---- |
| Khách vãng lai | Xem danh mục, tìm kiếm, lọc và xem chi tiết sản phẩm. | Bắt buộc |
| Khách hàng | Đăng ký, đăng nhập, quản lý hồ sơ, địa chỉ, yêu thích, giỏ hàng, đặt hàng, lưu bộ setup và theo dõi đơn hàng. | Bắt buộc |
| Quản trị viên | Quản lý sản phẩm, danh mục, người dùng, đơn hàng, khuyến mãi, voucher, tài nguyên 3D và xem dashboard. | Bắt buộc |

# Hệ thống phải xác thực người dùng trước khi cho phép truy cập các chức năng yêu cầu đăng nhập. Quản trị viên chỉ được thực hiện các thao tác phù hợp với quyền hạn. Việc kiểm tra quyền, giá, tồn kho, voucher và kết quả thanh toán phải được xử lý ở phía máy chủ, không chỉ dựa vào giao diện người dùng.

## **3\. Danh sách chức năng của website**

### **a. Nhóm chức năng thương mại điện tử**

| Mã | Chức năng | Mô tả yêu cầu |
| :---- | :---- | :---- |
| F01 | Danh mục và tìm kiếm | Hiển thị trang chủ, danh mục sản phẩm, tìm kiếm, sắp xếp và tối thiểu năm tiêu chí lọc phù hợp với dữ liệu sản phẩm. |
| F02 | Chi tiết sản phẩm | Hiển thị hình ảnh, mô tả, giá bán, giá khuyến mãi nếu có, tồn kho, thông số, đánh giá và sản phẩm liên quan. |
| F03 | Tài khoản khách hàng | Hỗ trợ đăng ký, đăng nhập, quản lý hồ sơ, địa chỉ nhận hàng, sản phẩm đã xem, đã mua và danh sách yêu thích. |
| F04 | Giỏ hàng, voucher và tích điểm | Cho phép thêm hoặc bỏ sản phẩm, thay đổi số lượng, tính tổng tiền, kiểm tra điều kiện voucher, cộng điểm sau khi đơn hoàn tất và xử lý hoàn điểm theo quy tắc. |
| F05 | Đặt hàng và vận chuyển | Nhập thông tin nhận hàng, tính phí theo bảng phí khu vực, xác nhận và lưu thông tin đơn hàng cùng trạng thái giao hàng. |
| F06 | Thanh toán sandbox | Tích hợp một cổng thanh toán thử nghiệm, xử lý trạng thái thành công, thất bại, hủy và tránh ghi nhận lặp kết quả thanh toán. |
| F07 | Theo dõi đơn hàng | Cho phép khách xem lịch sử và trạng thái đơn thuộc tài khoản của mình; gửi email xác nhận đơn hàng. |
| F08 | Quản trị cửa hàng | Quản lý sản phẩm, danh mục, nhóm sản phẩm, người dùng, đơn hàng, khuyến mãi, voucher và tài nguyên 3D. |
| F09 | Dashboard cơ bản | Thống kê doanh thu từ đơn hoàn tất, số đơn, sản phẩm bán chạy, đơn chờ giao và số khách hàng. |

### **b. Nhóm chức năng thiết kế trực quan và AI**

| Mã | Chức năng | Mô tả yêu cầu |
| :---- | :---- | :---- |
| F10 | Thiết kế góc 3D | Cung cấp một không gian mẫu và 8–10 mô hình sản phẩm; cho phép thêm, di chuyển, xoay, xóa vật thể, đổi góc nhìn và giới hạn vùng đặt. |
| F11 | Lưu và mua bộ setup | Cho phép lưu và mở lại bố cục, xem danh sách sản phẩm, tổng giá, kiểm tra điều kiện tương thích có dữ liệu và thêm các sản phẩm đã chọn vào giỏ hàng. |
| F12 | Chatbot AI gợi ý | Tư vấn theo nhu cầu, ngân sách và phong cách; gợi ý sản phẩm hoặc bộ setup từ danh mục thực tế, kèm giá, liên kết và lý do lựa chọn. |

# Chức năng tạo ảnh minh họa bằng AI là hạng mục tích hợp riêng, không đồng nhất với F12. Hệ thống dự kiến sử dụng ảnh chụp bố cục 3D, danh sách sản phẩm và phong cách khách chọn để tạo ảnh tham khảo. Việc tích hợp được thực hiện sau khi luồng mua hàng và công cụ 3D đã được kiểm tra. Khi dịch vụ AI gặp lỗi, khách vẫn có thể xem bố cục đã lưu và tiếp tục mua hàng.

## **4\. Các quy trình nghiệp vụ chính**

### **a. Quy trình tìm kiếm và mua sản phẩm**

1. # Khách truy cập website và chọn danh mục hoặc nhập từ khóa tìm kiếm.

2. # Hệ thống hiển thị danh sách sản phẩm phù hợp với điều kiện tìm kiếm và lọc.

3. # Khách xem chi tiết sản phẩm, giá bán, thông số và tồn kho.

4. # Khách thêm sản phẩm vào giỏ hàng, điều chỉnh số lượng và nhập voucher nếu có.

5. # Khách đăng nhập hoặc đăng ký tài khoản, chọn địa chỉ nhận hàng và kiểm tra phí vận chuyển.

6. # Hệ thống tính tổng tiền, kiểm tra tồn kho và điều kiện khuyến mãi.

7. # Khách xác nhận đơn và thực hiện thanh toán theo phương thức thử nghiệm được hỗ trợ.

8. # Hệ thống xác minh kết quả thanh toán, lưu đơn hàng và hiển thị thông báo kết quả.

9. # Khách theo dõi trạng thái đơn hàng trong tài khoản.

# Các quy tắc nghiệp vụ cần thực hiện:

- # Số lượng đặt hàng phải lớn hơn 0 và không vượt quá tồn kho khả dụng.

- # Giá bán, giảm giá, voucher, điểm thưởng và tổng tiền phải được tính theo dữ liệu và quy tắc do hệ thống kiểm soát.

- # Đơn hàng phải lưu mã đơn, sản phẩm, số lượng, giá tại thời điểm đặt, thông tin nhận hàng và trạng thái.

- # Không được ghi nhận đơn thanh toán thành công khi chưa xác minh được kết quả từ cổng sandbox.

- # Việc cộng hoặc hoàn điểm cần căn cứ vào trạng thái đơn và quy tắc tích điểm đã thống nhất.

- # Đơn hàng bị hủy phải được xử lý tồn kho và điểm thưởng theo quy định nghiệp vụ của hệ thống.

### **b. Quy trình quản trị cửa hàng**

1. # Quản trị viên đăng nhập khu vực quản trị.

2. # Chọn chức năng quản lý sản phẩm, danh mục, người dùng, đơn hàng, voucher hoặc tài nguyên 3D.

3. # Thực hiện thêm, sửa, ẩn hoặc cập nhật thông tin.

4. # Hệ thống kiểm tra quyền truy cập và dữ liệu đầu vào.

5. # Hệ thống lưu thay đổi và thông báo kết quả.

6. # Dashboard cập nhật số liệu dựa trên dữ liệu thực tế được lưu trong hệ thống.

### **c. Quy trình thiết kế và mua bộ setup**

1. # Khách mở khu vực thiết kế 3D.

2. # Khách chọn không gian mẫu và thêm các sản phẩm có mô hình 3D.

3. # Khách di chuyển, xoay, xóa sản phẩm hoặc thay đổi góc nhìn.

4. # Hệ thống hiển thị danh sách sản phẩm đã chọn và tổng giá tương ứng.

5. # Khách lưu bộ setup để mở lại khi cần.

6. # Khách có thể bỏ chọn những sản phẩm không muốn mua.

7. # Khi khách thêm bộ setup vào giỏ hàng, hệ thống kiểm tra lại mã sản phẩm, giá bán và tồn kho.

8. # Khách tiếp tục quy trình đặt hàng thông thường.

# Bố cục 3D và mã sản phẩm là dữ liệu gốc để liên kết với hàng hóa. Hình ảnh minh họa do AI tạo ra không được sử dụng để xác định giá hoặc thay thế danh sách sản phẩm thực tế.

### **d. Quy trình chatbot AI và tạo ảnh minh họa**

# Chatbot AI gợi ý:

1. # Khách cung cấp nhu cầu, ngân sách hoặc phong cách mong muốn.

2. # Hệ thống tiếp nhận thông tin và đối chiếu với danh mục sản phẩm.

3. # Chatbot đề xuất sản phẩm hoặc bộ setup, kèm giá, liên kết và lý do lựa chọn.

4. # Khách xem sản phẩm và quyết định thêm vào giỏ hàng.

# Tạo ảnh minh họa bằng AI:

1. # Khách chọn phong cách hoặc tông màu mong muốn.

2. # Hệ thống chuẩn bị ảnh chụp bố cục 3D và danh sách sản phẩm.

3. # Nếu dịch vụ đã được tích hợp, máy chủ gửi yêu cầu đến API AI.

4. # Hệ thống nhận và hiển thị ảnh, hoặc thông báo lỗi khi dịch vụ không phản hồi.

5. # Ảnh được gắn nhãn minh họa vì có thể khác hình dáng, màu sắc, chi tiết hoặc vị trí của sản phẩm thực tế.

# Nếu chưa tích hợp được API hoạt động, nhóm phải ghi rõ đây là bản mẫu hoặc phương án dự kiến, không mô tả như chức năng đã vận hành.

# **5\. Các yêu cầu phi chức năng**

| Mã | Yêu cầu | Tiêu chí đề xuất |
| :---- | :---- | :---- |
| NFR01 | Hiệu năng | Đo thời gian tải các trang chính bằng công cụ kiểm thử phù hợp; ghi nhận kết quả thực tế. Có thể sử dụng LCP không quá 2,5 giây ở phân vị 75 làm mục tiêu tham khảo khi điều kiện đo phù hợp. |
| NFR02 | Khả năng sử dụng | Giao diện rõ ràng, dễ tìm chức năng, thao tác mua hàng và đặt hàng thuận tiện. |
| NFR03 | Tương thích | Hiển thị và sử dụng được trên desktop và mobile; kiểm thử trên trình duyệt phổ biến. |
| NFR04 | Bảo mật | Kiểm soát quyền truy cập, bảo vệ thông tin đăng nhập và không để lộ khóa API ở frontend. |
| NFR05 | Toàn vẹn dữ liệu | Đơn hàng, chi tiết đơn, giá tại thời điểm mua, voucher và điểm thưởng được lưu nhất quán. |
| NFR06 | Khả năng bảo trì | Mã nguồn có cấu trúc, quy ước đặt tên và hướng dẫn cài đặt rõ ràng để 7 thành viên phối hợp. |
| NFR07 | Khả năng khôi phục | Có dữ liệu mẫu, tệp sao lưu hoặc hướng dẫn khôi phục phù hợp với kiến trúc hệ thống. |
| NFR08 | Khả năng mở rộng | Có thể bổ sung sản phẩm, danh mục và chức năng mới mà không phải xây dựng lại toàn bộ hệ thống. |
| NFR09 | Chi phí vận hành | Theo dõi hạn mức và chi phí dịch vụ bên ngoài, đặc biệt là API AI; có phương án dự phòng khi dịch vụ lỗi. |

# Các mục tiêu phi chức năng là tiêu chí đề xuất cần được kiểm tra. Nhóm không được ghi một hệ thống đã đạt tiêu chí nếu chưa đo hoặc chưa có bằng chứng kiểm thử.

## **6\. Thứ tự ưu tiên triển khai**

| Giai đoạn | Phạm vi ưu tiên | Kết quả mong đợi |
| :---- | :---- | :---- |
| Giai đoạn 1 | F01–F09: mua hàng, tài khoản, thanh toán thử nghiệm và quản trị | Hoàn thiện luồng thương mại điện tử cơ bản. |
| Giai đoạn 2 | F10–F11: thiết kế 3D, lưu và mua bộ setup | Kết nối bố cục trực quan với sản phẩm và giỏ hàng. |
| Giai đoạn 3 | F12: chatbot AI gợi ý | Tư vấn dựa trên nhu cầu, ngân sách và danh mục thực tế. |
| Giai đoạn tích hợp bổ sung | Tạo ảnh minh họa bằng AI | Triển khai khi luồng mua hàng, 3D và điều kiện API đã được kiểm tra. |
| Phát triển sau | Tạo ảnh phòng từ ảnh thật bằng AR | Chưa thuộc phạm vi phiên bản đầu. |

## **7\. Rủi ro và phương án giảm thiểu**

| Rủi ro | Mức độ ảnh hưởng | Phương án giảm thiểu |
| :---- | :---- | :---- |
| Không hoàn thành đúng hạn 6 tuần | Cao | Chốt phạm vi, chia đầu việc và kiểm tra tiến độ hằng tuần. |
| Thiếu kinh nghiệm lập trình 3D | Cao nếu chưa thử nghiệm | Thử nghiệm sớm với một không gian và vài mô hình đại diện. |
| Thiếu mô hình 3D sản phẩm | Cao đối với F10 | Giới hạn 8–10 mô hình, kiểm tra nguồn tài nguyên và quyền sử dụng. |
| Sai lệch giá hoặc tồn kho | Cao | Kiểm tra dữ liệu phía máy chủ trước khi xác nhận đơn. |
| Lỗi thanh toán sandbox | Trung bình đến cao | Kiểm thử các trường hợp thành công, thất bại, hủy và phản hồi lặp. |
| API AI phát sinh chi phí hoặc không phản hồi | Trung bình đến cao | Kiểm tra hạn mức, giới hạn sử dụng nếu hỗ trợ và chuẩn bị phương án dự phòng. |
| 3D tải chậm trên điện thoại | Trung bình đến cao | Tối ưu mô hình, giới hạn vật thể và kiểm thử trên thiết bị phù hợp. |
| Dữ liệu không thống nhất giữa các thành viên | Trung bình | Thống nhất cấu trúc dữ liệu, mã sản phẩm và quy tắc quản lý mã nguồn. |
| Truy cập trái phép vào khu vực quản trị | Cao | Kiểm soát quyền ở phía máy chủ và bảo vệ thông tin đăng nhập. |

## **8\. Kết luận phân tích yêu cầu**

# Qua phân tích, Góc Desk cần được xây dựng như một website thương mại điện tử kết hợp công cụ bố trí góc làm việc trực quan. Các chức năng mua hàng, tài khoản, quản trị, thanh toán sandbox và vận chuyển tạo nền tảng cho hoạt động kinh doanh; công cụ 3D và chức năng lưu bộ setup giúp kết nối trải nghiệm thiết kế với việc lựa chọn sản phẩm thực tế.

# Trong thời gian 6 tuần, nhóm cần ưu tiên hoàn thiện luồng mua hàng trước, sau đó kiểm thử công cụ 3D với phạm vi giới hạn và tích hợp các chức năng AI theo điều kiện kỹ thuật. Việc phân biệt dữ liệu sản phẩm thật với ảnh AI, kiểm soát giá và tồn kho, bảo vệ thông tin người dùng và kiểm thử các tình huống lỗi là những yêu cầu quan trọng để bảo đảm tính khả thi của dự án.

# 