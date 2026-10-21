# **Nhiệm vụ 4\. Prompt 2 – Phản biện yêu cầu dự án Góc Desk** 

- Công cụ sử dụng: Gemini  
- Mục tiêu: Sử dụng Gemini để phản biện kết quả phân tích yêu cầu do ChatGPT đề xuất, qua đó nhận diện những điểm còn thiếu, chưa rõ ràng, trùng lặp hoặc chưa phù hợp với mục tiêu và nguồn lực của dự án.  
- Đầu vào: Kết quả phân tích yêu cầu dự án Góc Desk từ ChatGPT, bao gồm mục tiêu, phạm vi, nhóm người dùng, danh sách chức năng, quy trình nghiệp vụ, yêu cầu phi chức năng, mức độ ưu tiên và các rủi ro dự kiến.  
- Yêu cầu đối với Gemini: Đánh giá tính đầy đủ và nhất quán của các yêu cầu; xem xét khả năng triển khai trong 6 tuần với nhóm 7 thành viên; xác định các vấn đề về quy trình mua hàng, dữ liệu, tồn kho, bảo mật, chi phí API và tính khả thi của công cụ 3D/AI. Với mỗi vấn đề, Gemini cần nêu nội dung phản biện, lý do, phương án điều chỉnh và mức độ ưu tiên.  
- Cách sử dụng kết quả: Nhóm đối chiếu ý kiến phản biện của Gemini với đề xuất ban đầu của ChatGPT, đánh giá tính phù hợp và quyết định những chức năng cần giữ lại, điều chỉnh, kiểm tra thêm hoặc chuyển sang giai đoạn sau. Kết quả phản biện không được áp dụng máy móc mà phải căn cứ vào yêu cầu môn học, nguồn lực và kế hoạch thực tế của nhóm.

## **1\. Mục tiêu phản biện**

Phần phản biện nhằm đánh giá kết quả phân tích yêu cầu dự án Góc Desk ở Nhiệm vụ 3, tập trung vào mức độ phù hợp với mục tiêu kinh doanh, tính đầy đủ, tính khả thi, rủi ro triển khai và khả năng kiểm thử.

Nội dung phản biện xem xét các chức năng F01–F12, quy trình mua hàng, công cụ thiết kế 3D, chatbot AI, tạo ảnh minh họa, dữ liệu, bảo mật và yêu cầu phi chức năng. Trên cơ sở đó, nhóm xác định những yêu cầu cần giữ lại, làm rõ, kiểm tra thêm hoặc đưa sang giai đoạn phát triển sau.

## **2\. Đánh giá và phản biện chi tiết theo 8 khía cạnh**

### **a. Mức độ giải quyết vấn đề kinh doanh và đáp ứng khách hàng mục tiêu**

Vấn đề 1.1: Chức năng bán hàng đơn thuần chưa đủ thể hiện điểm khác biệt của Góc Desk.

- Đề xuất ban đầu: Hoàn thiện các chức năng thương mại điện tử, sau đó triển khai thiết kế 3D và AI theo thứ tự ưu tiên.  
- Nội dung phản biện: Nếu website chỉ có danh mục, chi tiết sản phẩm và giỏ hàng, khách vẫn phải tự hình dung cách bố trí các phụ kiện và tự tính tổng ngân sách khi chọn nhiều món.  
- Lý do: Mục tiêu của Góc Desk không chỉ là bán sản phẩm mà còn hỗ trợ khách lựa chọn và phối hợp phụ kiện trong không gian làm việc.  
- Phương án điều chỉnh: Giữ công cụ thiết kế 3D với phạm vi giới hạn, cho phép khách chọn sản phẩm, xem danh sách và tổng giá của bộ setup, sau đó thêm các món đã chọn vào giỏ hàng.  
- Quyết định của nhóm: Giữ F10 và F11 trong phạm vi phiên bản đầu, đồng thời kiểm tra tính khả thi của công cụ 3D ngay từ giai đoạn đầu dự án.

### **b. Các yêu cầu trùng lặp, ít giá trị hoặc chưa rõ ràng**

Vấn đề 2.1: Chức năng quản lý hình ảnh có thể trùng lặp với trang chi tiết sản phẩm.

- Đề xuất ban đầu: F02 hiển thị hình ảnh sản phẩm; các tài nguyên hình ảnh và mô hình 3D được quản lý trong F08.  
- Nội dung phản biện: Nếu xây dựng thêm một chức năng riêng chỉ để hiển thị ảnh thông thường, hệ thống có thể phát sinh phần việc trùng lặp.  
- Lý do: Hình ảnh dùng để xem sản phẩm và tài nguyên dùng trong công cụ thiết kế có mục đích khác nhau.  
- Phương án điều chỉnh: Giữ ảnh thông thường trong F02; F08 quản lý tài nguyên 3D cần thiết cho công cụ thiết kế. Chỉ bổ sung quy trình quản lý ảnh tách nền hoặc mô hình riêng khi có yêu cầu thực tế.  
- Quyết định của nhóm: Giữ cách phân chia chức năng hiện tại, không tạo thêm mã chức năng riêng cho thư viện ảnh thông thường.

Vấn đề 2.2: Chatbot AI và tạo ảnh minh họa dễ bị hiểu nhầm là cùng một chức năng.

- Đề xuất ban đầu: F12 tư vấn và gợi ý sản phẩm; tạo ảnh AI được triển khai theo giai đoạn riêng.  
- Nội dung phản biện: Chatbot cung cấp thông tin và gợi ý sản phẩm, trong khi dịch vụ tạo ảnh sinh ra hình ảnh tham khảo. Hai chức năng có đầu vào, đầu ra và điều kiện kỹ thuật khác nhau.  
- Phương án điều chỉnh: Tách rõ F12 là chatbot AI gợi ý sản phẩm; tạo ảnh minh họa là hạng mục tích hợp riêng sau khi công cụ 3D được kiểm tra.  
- Quyết định của nhóm: Giữ cách phân biệt này trong báo cáo và thiết kế hệ thống.

### **c. Tính khả thi về thời gian, năng lực kỹ thuật và ngân sách**

Vấn đề 3.1: Phạm vi công nghệ có thể vượt quá thời gian thực hiện 6 tuần.

- Đề xuất ban đầu: Triển khai 12 chức năng, bao gồm mua hàng, quản trị, 3D và chatbot AI.  
- Nội dung phản biện: Công cụ 3D cần mô hình sản phẩm, xử lý vị trí và góc nhìn; chatbot và tạo ảnh AI có thể phụ thuộc API, hạn mức và chất lượng dịch vụ. Nếu thực hiện đồng thời, nhóm có nguy cơ chậm hoàn thiện các chức năng mua hàng.  
- Lý do: Thời gian và năng lực kỹ thuật của nhóm là điều kiện giới hạn việc triển khai.  
- Phương án điều chỉnh: Chia thành các giai đoạn: hoàn thiện luồng mua hàng trước; triển khai 3D với một không gian mẫu và 8–10 mô hình; tiếp tục chatbot và tạo ảnh theo kết quả kiểm thử.  
- Quyết định của nhóm: Giữ phạm vi mục tiêu nhưng triển khai theo thứ tự ưu tiên. Nhóm phải thử nghiệm kỹ thuật sớm và chuẩn bị phương án dự phòng nếu một chức năng không khả thi.

### **d. Các chức năng cơ bản và quy trình nghiệp vụ còn thiếu**

Vấn đề 4.1: Quy trình thiết kế cần kết nối trực tiếp với giỏ hàng.

- Đề xuất ban đầu: F10 cho phép bố trí sản phẩm; F11 cho phép lưu và mua bộ setup.  
- Nội dung phản biện: Nếu khách phải quay lại danh mục và tìm lại từng sản phẩm đã chọn, quá trình mua hàng sẽ bị gián đoạn.  
- Lý do: Giá trị của bộ setup nằm ở khả năng chuyển bố cục thành danh sách sản phẩm có thể mua.  
- Phương án điều chỉnh: F11 cần hiển thị danh sách sản phẩm, số lượng, giá từng món và tổng giá; khách có thể bỏ chọn sản phẩm trước khi thêm vào giỏ. Hệ thống phải kiểm tra lại giá và tồn kho tại thời điểm thêm giỏ hoặc đặt hàng.  
- Quyết định của nhóm: Giữ F11 và yêu cầu kết nối với dữ liệu sản phẩm thực tế.

Vấn đề 4.2: Quy tắc xử lý đơn hàng, tồn kho và điểm thưởng cần cụ thể hơn.

- Đề xuất ban đầu: F04 xử lý voucher và tích điểm; F05 xử lý đặt hàng và vận chuyển; F06 xử lý thanh toán sandbox; F07 theo dõi đơn hàng.  
- Nội dung phản biện: Nếu không thống nhất điều kiện cộng điểm, hoàn điểm, cập nhật tồn kho và chuyển trạng thái đơn, dữ liệu có thể sai lệch khi đơn thất bại hoặc bị hủy.  
- Lý do: Đây là các quy tắc nghiệp vụ ảnh hưởng trực tiếp đến tính chính xác của đơn hàng.  
- Phương án điều chỉnh: Xác định điều kiện sử dụng voucher, thời điểm cộng điểm, cách hoàn điểm, quy tắc cập nhật tồn kho và những trạng thái đơn được phép chuyển đổi. Thanh toán chỉ được xác nhận khi kết quả sandbox đã được kiểm tra.  
- Quyết định của nhóm: Giữ F04–F07 và bổ sung các quy tắc trên vào thiết kế dữ liệu, quy trình nghiệp vụ và kịch bản kiểm thử.

### **e. Rủi ro về dữ liệu, bảo mật, quyền riêng tư, API và chi phí**

Vấn đề 5.1: Chưa thể mặc định dịch vụ AI luôn hoạt động ổn định.

* Đề xuất ban đầu: F12 sử dụng AI để tư vấn và gợi ý sản phẩm; tạo ảnh minh họa dự kiến tích hợp ở giai đoạn sau.  
* Nội dung phản biện: Dịch vụ bên ngoài có thể gặp lỗi, giới hạn số lượt gọi hoặc phát sinh chi phí. Nếu phụ thuộc hoàn toàn vào dịch vụ AI, trải nghiệm website có thể bị gián đoạn.  
* Phương án điều chỉnh: Kiểm tra hạn mức và chi phí trước khi tích hợp; bảo vệ khóa API ở phía máy chủ; giới hạn sử dụng nếu dịch vụ hỗ trợ; chuẩn bị thông báo lỗi và phương án dự phòng.  
* Quyết định của nhóm: Chỉ tích hợp dịch vụ thật khi đã kiểm tra điều kiện kỹ thuật. Website vẫn phải cho phép khách tiếp tục mua hàng khi AI không phản hồi.

Vấn đề 5.2: Ảnh AI có thể không phản ánh chính xác sản phẩm thực tế.

- Đề xuất ban đầu: Tạo ảnh tham khảo từ bố cục 3D, danh sách sản phẩm và phong cách khách chọn.  
- Nội dung phản biện: Ảnh tạo sinh có thể thay đổi màu sắc, hình dáng hoặc vị trí của sản phẩm, gây hiểu nhầm nếu được trình bày như ảnh hàng hóa thật.  
- Phương án điều chỉnh: Gắn nhãn ảnh ý tưởng minh họa do AI tạo; sử dụng dữ liệu sản phẩm thực tế để tính giá, tồn kho và tạo đơn; không lấy hình ảnh AI làm căn cứ xác định sản phẩm khách mua.  
- Quyết định của nhóm: Giữ nguyên nguyên tắc phân biệt ảnh sản phẩm thật với ảnh AI trong giao diện và quy trình nghiệp vụ.

### **f. Mức độ rõ ràng để lập trình và kiểm thử**

Vấn đề 6.1: Các tiêu chí tìm kiếm và lọc cần gắn với dữ liệu thực tế.

- Đề xuất ban đầu: F01 hỗ trợ tìm kiếm, sắp xếp và tối thiểu năm tiêu chí lọc phù hợp.  
- Nội dung phản biện: Nếu chưa xác định thuộc tính của từng danh mục, nhóm khó thiết kế dữ liệu và xây dựng kịch bản kiểm thử chính xác.  
- Phương án điều chỉnh: Xác định các thuộc tính như danh mục, khoảng giá, màu sắc, thương hiệu, phong cách hoặc chuẩn kết nối khi phù hợp. Khi khách chọn nhiều bộ lọc, kết quả phải đáp ứng đồng thời các điều kiện.  
- Quyết định của nhóm: Giữ F01 và chốt bộ thuộc tính lọc dựa trên dữ liệu 30–40 sản phẩm được chuẩn bị.

Vấn đề 6.2: Điều kiện nghiệm thu của các chức năng chưa được mô tả đầy đủ.

- Đề xuất ban đầu: Các chức năng được mô tả theo nhóm nghiệp vụ.  
- Nội dung phản biện: Chỉ mô tả chức năng là chưa đủ để xác định chức năng đã hoạt động đúng hay chưa.  
- Phương án điều chỉnh: Xây dựng kịch bản kiểm thử cho các trường hợp như nhập sai dữ liệu, tồn kho không đủ, voucher hết hạn, thanh toán thất bại, đơn bị hủy, lưu thiết kế lỗi và API AI không phản hồi.  
- Quyết định của nhóm: Bổ sung điều kiện nghiệm thu và kết quả kiểm thử cho các luồng quan trọng trước khi hoàn thiện báo cáo.

### **g. Phân biệt thiết kế trực quan với tạo ảnh AI**

Vấn đề 7.1: Công cụ 3D và ảnh AI cần được xác định đúng vai trò.

- Đề xuất ban đầu: F10 bố trí sản phẩm trong không gian; F11 lưu và mua bộ setup; tạo ảnh AI cung cấp hình ảnh tham khảo.  
- Nội dung phản biện: Nếu không phân biệt rõ, khách có thể cho rằng ảnh AI thể hiện chính xác kích thước và vị trí của sản phẩm trong bố cục.  
- Phương án điều chỉnh: Dùng F10 để thể hiện vị trí và bố cục trong phạm vi mô hình đã xây dựng; dùng F11 để lưu dữ liệu và kết nối sản phẩm với giỏ hàng; dùng ảnh AI làm tham khảo về phong cách.  
- Quyết định của nhóm: Giữ ba vai trò riêng biệt, đồng thời ghi rõ giới hạn của ảnh AI.

### **h. Yêu cầu phi chức năng và tiêu chí kiểm thử**

Vấn đề 8.1: Các yêu cầu về hiệu năng, bảo mật và khôi phục cần có bằng chứng nghiệm thu.

- Đề xuất ban đầu: Xác định các yêu cầu về hiệu năng, khả năng sử dụng, tương thích, bảo mật, toàn vẹn dữ liệu và khả năng khôi phục.  
- Nội dung phản biện: Một số yêu cầu mới dừng ở mức định hướng, chưa xác định cách đo lường hoặc bằng chứng kiểm thử.  
- Phương án điều chỉnh:  
  * Hiệu năng: Sử dụng Google Lighthouse để đo các trang chính trong điều kiện thống nhất và ghi nhận kết quả.  
  * Bảo mật: Kiểm tra quyền quản trị, dữ liệu đầu vào và cách bảo vệ khóa API.  
  * Toàn vẹn dữ liệu: Kiểm thử giá, tồn kho, đơn hàng, voucher và điểm thưởng qua các trường hợp thành công, thất bại và hủy.  
  * Khả năng khôi phục: Chuẩn bị dữ liệu mẫu, tệp sao lưu hoặc hướng dẫn khôi phục.  
  * 3D/AI: Kiểm tra thời gian tải, thời gian phản hồi và phương án dự phòng.  
- Quyết định của nhóm: Giữ các yêu cầu phi chức năng và bổ sung tiêu chí kiểm thử thực tế. Các kết quả chưa đo không được ghi là đã đạt.

## **3\. Bảng tổng hợp kết quả phản biện**

| Nội dung đề xuất ban đầu | Nội dung phản biện | Quyết định của nhóm | Lý do |
| :---- | :---- | :---- | :---- |
| 1\. Ưu tiên chức năng thương mại điện tử, triển khai 3D và AI theo giai đoạn. | Nếu chỉ có chức năng bán hàng, website chưa thể hiện rõ giá trị trực quan. | Giữ và điều chỉnh phạm vi triển khai | Giữ công cụ 3D và lưu bộ setup nhưng triển khai theo thứ tự ưu tiên. |
| 2\. Có ba nhóm người dùng: khách vãng lai, khách hàng và quản trị viên. | Cần bảo đảm quyền truy cập và bảo vệ thông tin tài khoản. | Giữ lại | Ba nhóm phù hợp với quy mô dự án; cần xác thực và phân quyền rõ ràng. |
| 3\. F01–F09 phục vụ mua hàng và quản trị. | Cần cụ thể hóa bộ lọc, voucher, điểm thưởng, thanh toán và quy tắc đơn hàng. | Giữ và bổ sung quy tắc nghiệp vụ | Các chức năng này là nền tảng để hệ thống vận hành nhất quán. |
| 4\. F10 là thiết kế góc 3D. | 3D có thể gây chậm tiến độ nếu chưa thử nghiệm kỹ thuật. | Giữ, kiểm tra sớm | Giới hạn một không gian mẫu và 8–10 mô hình, chuẩn bị phương án dự phòng. |
| 5\. F11 là lưu và mua bộ setup. | Cần kết nối trực tiếp với dữ liệu sản phẩm và giỏ hàng. | Giữ và làm rõ yêu cầu | Tránh khách phải chọn lại từng sản phẩm sau khi thiết kế. |
| 6\. F12 là chatbot AI gợi ý sản phẩm. | Chatbot AI khác với dịch vụ tạo ảnh minh họa. | Giữ và phân biệt rõ | Hai chức năng có mục đích, đầu vào và đầu ra khác nhau. |
| 7\. Tạo ảnh minh họa bằng AI sau khi kiểm tra luồng mua hàng và 3D. | Ảnh AI có thể sai khác sản phẩm và dịch vụ có thể phát sinh chi phí. | Giữ theo điều kiện triển khai | Cần xác minh API, bảo vệ khóa truy cập và gắn nhãn ảnh minh họa. |
| 8\. Các yêu cầu phi chức năng được xác định ở mức tổng quát. | Chưa đủ tiêu chí nghiệm thu nếu không có cách đo hoặc kịch bản kiểm thử. | Điều chỉnh | Bổ sung bằng chứng đo hiệu năng, kiểm tra bảo mật và kiểm thử dữ liệu. |
| 9\. AR tạo ảnh phòng từ ảnh thật. | Chức năng này làm tăng phạm vi và yêu cầu kỹ thuật. | Phát triển sau | Không đưa vào phiên bản đầu để bảo đảm tiến độ. |

## **4\. Kết luận sau phản biện**

### **a. Những nội dung nên giữ lại**

Nhóm giữ định hướng xây dựng website thương mại điện tử có công cụ thiết kế góc làm việc. Các chức năng F01–F09 tạo nền tảng cho mua hàng và quản trị; F10 và F11 kết nối việc bố trí sản phẩm với giỏ hàng; F12 hỗ trợ tư vấn và gợi ý sản phẩm theo nhu cầu.

Các yêu cầu về bảo mật, toàn vẹn dữ liệu, phân quyền và kiểm thử phải được duy trì xuyên suốt quá trình phát triển.

### **b. Những nội dung cần điều chỉnh**

Nhóm cần xác định rõ thuộc tính tìm kiếm và lọc, điều kiện áp dụng voucher, cách cộng và hoàn điểm, quy tắc xử lý tồn kho, trạng thái đơn hàng và kết quả thanh toán sandbox.

Đối với thiết kế 3D, cần giới hạn số lượng mô hình và kiểm tra kỹ thuật sớm. Đối với AI, cần phân biệt chatbot gợi ý sản phẩm với chức năng tạo ảnh minh họa, đồng thời bảo đảm ảnh AI không thay thế dữ liệu sản phẩm thật.

Các yêu cầu phi chức năng cần được chuyển thành tiêu chí kiểm thử có thể ghi nhận kết quả.

### **c. Những vấn đề cần xác minh trước khi triển khai**

1. Khả năng thực tế của nhóm trong việc phát triển 3D và tích hợp các dịch vụ AI.  
2. Nguồn mô hình 3D, ảnh sản phẩm và quyền sử dụng tài nguyên.  
3. Khả năng tích hợp cổng thanh toán sandbox và cách xác minh kết quả thanh toán.  
4. Cấu trúc dữ liệu phục vụ voucher, tích điểm, tồn kho, dashboard và bộ setup.  
5. Chi phí, hạn mức và điều kiện sử dụng API AI.  
6. Các tiêu chí nghiệm thu và yêu cầu bắt buộc của giảng viên.

### **d. Thống nhất phạm vi sau phản biện**

Sau khi đối chiếu phân tích ban đầu và kết quả phản biện, nhóm thống nhất giữ danh sách 12 chức năng F01–F12 trong phạm vi dự án. Tuy nhiên, việc triển khai được chia theo giai đoạn nhằm giảm rủi ro trong thời gian 6 tuần.

Trước tiên, nhóm hoàn thiện luồng mua hàng, tài khoản, quản trị, thanh toán thử nghiệm và vận chuyển. Tiếp theo, nhóm triển khai công cụ 3D giới hạn ở một không gian mẫu và 8–10 mô hình, kết hợp chức năng lưu và mua bộ setup. Chatbot AI được triển khai dựa trên danh mục sản phẩm thực tế. Chức năng tạo ảnh minh họa được tích hợp sau khi các thành phần nền tảng đã được kiểm tra.

Tạo ảnh phòng từ ảnh thật bằng AR được xác định là định hướng phát triển sau, không thuộc phạm vi phiên bản đầu. Trong mọi trường hợp, giá bán, tồn kho, mã sản phẩm và dữ liệu đơn hàng phải được lấy từ hệ thống; ảnh AI chỉ mang tính minh họa.

## **5\. Bảng chức năng cuối cùng sau phân tích và phản biện**

Bảng dưới đây là danh sách chức năng thống nhất dùng cho các phần tiếp theo của báo cáo.

| Mã | Chức năng | Nội dung phiên bản đầu | Quyết định sau phản biện |
| :---- | :---- | :---- | :---- |
| F01 | Danh mục và tìm kiếm | Trang chủ, nhóm sản phẩm, tìm kiếm, sắp xếp và tối thiểu năm tiêu chí lọc phù hợp với danh mục. | Giữ lại; xác định rõ thuộc tính và dữ liệu dùng để lọc. |
| F02 | Chi tiết sản phẩm | Ảnh, mô tả, giá, giá khuyến mãi nếu có, tồn kho, thông số, đánh giá và sản phẩm liên quan. | Giữ lại; dữ liệu giá và tồn kho phải nhất quán. |
| F03 | Tài khoản khách hàng | Đăng ký, đăng nhập, hồ sơ, địa chỉ, sản phẩm đã xem, đã mua và danh sách yêu thích. | Giữ lại; kiểm soát quyền truy cập và bảo vệ tài khoản. |
| F04 | Giỏ hàng, voucher và tích điểm | Thêm hoặc bỏ món, đổi số lượng, tính tiền, kiểm tra voucher, cộng điểm và hoàn điểm theo quy tắc. | Giữ lại; xác định rõ điều kiện voucher và điểm thưởng. |
| F05 | Đặt hàng và vận chuyển | Nhập thông tin nhận hàng, tính phí theo bảng phí khu vực, xác nhận và lưu trạng thái giao hàng. | Giữ lại; thống nhất quy tắc phí vận chuyển và trạng thái đơn. |
| F06 | Thanh toán sandbox | Tích hợp một cổng thử nghiệm, xử lý thành công, thất bại, hủy và thông báo lặp. | Giữ lại; xác minh kết quả thanh toán ở phía máy chủ. |
| F07 | Theo dõi đơn hàng | Khách xem lịch sử và trạng thái đơn của tài khoản; có email xác nhận đơn. | Giữ lại; kiểm soát quyền xem đơn hàng. |
| F08 | Quản trị cửa hàng | Quản lý sản phẩm, danh mục, nhóm sản phẩm, người dùng, đơn hàng, khuyến mãi, voucher và tài nguyên 3D. | Giữ lại; kiểm tra quyền quản trị và dữ liệu cập nhật. |
| F09 | Dashboard cơ bản | Thống kê doanh thu đơn hoàn tất, số đơn, sản phẩm bán chạy, đơn chờ giao và số khách hàng. | Giữ lại; thống nhất công thức thống kê và loại trừ đơn hủy khỏi doanh thu. |
| F10 | Thiết kế góc 3D | Một góc mẫu và 8–10 mô hình; thêm, di chuyển, xoay, xóa, đổi góc nhìn và giới hạn vùng đặt. | Giữ lại trong phạm vi giới hạn; thử nghiệm sớm và có phương án dự phòng. |
| F11 | Lưu và mua bộ setup | Lưu, mở lại bố cục, xem tổng giá, kiểm tra tương thích khi có dữ liệu và thêm sản phẩm vào giỏ. | Giữ lại; kết nối mã sản phẩm thực tế với giá và giỏ hàng. |
| F12 | Chatbot AI gợi ý | Tư vấn nhu cầu, ngân sách và phong cách; gợi ý sản phẩm hoặc bộ setup kèm giá, liên kết và lý do. | Giữ lại; xác minh công nghệ, nguồn dữ liệu và phương án khi dịch vụ lỗi. |

