# **AGENTS.md — Project Instructions for AI**

## **1\. Project Context**

Đây là dự án website thương mại điện tử của sinh viên, có tên **Góc Desk**, chuyên kinh doanh phụ kiện học tập và làm việc. Website hỗ trợ khách hàng tìm kiếm sản phẩm, bố trí góc làm việc trong không gian 3D, lưu bộ setup và đặt hàng.

AI đóng vai trò hỗ trợ nhóm trong quá trình phân tích yêu cầu, phát triển giao diện, lập trình chức năng, kiểm thử và hoàn thiện tài liệu dự án.

## **2\. Scope and Requirements**

* Chỉ triển khai các chức năng đã được nhóm thống nhất trong REQUIREMENTS.md.  
* Đọc và đối chiếu yêu cầu liên quan trước khi thực hiện bất kỳ thay đổi nào.  
* Không tự ý bổ sung chức năng mới, thay đổi quy trình nghiệp vụ hoặc mở rộng phạm vi dự án.  
* Nếu phát hiện yêu cầu chưa rõ ràng, mâu thuẫn giữa các tài liệu hoặc chưa được nhóm thống nhất, phải báo cáo và chờ xác nhận.  
* Các chức năng F01–F12 được triển khai theo phạm vi và thứ tự ưu tiên đã thống nhất trong tài liệu yêu cầu.  
* Không tự ý đưa chức năng ngoài phạm vi phiên bản đầu vào triển khai nếu chưa được nhóm phê duyệt.

## **3\. Coding Principles**

* Viết mã nguồn rõ ràng, dễ đọc, dễ bảo trì và kiểm thử.  
* Tuân thủ công nghệ, cấu trúc thư mục, quy ước đặt tên và phong cách lập trình hiện có.  
* Không thay đổi kiến trúc lớn hoặc thay thế công nghệ khi chưa được nhóm đồng ý.  
* Không tự ý xóa, vô hiệu hóa hoặc làm hỏng chức năng đang hoạt động.  
* Ưu tiên các thay đổi nhỏ, có phạm vi rõ ràng và có thể kiểm tra độc lập.  
* Tái sử dụng mã nguồn hiện có khi phù hợp; hạn chế trùng lặp và tránh sửa những phần không liên quan.  
* Đảm bảo dữ liệu giữa giao diện, máy chủ và cơ sở dữ liệu nhất quán.  
* Không tự ý thay đổi cấu trúc cơ sở dữ liệu, API hoặc quy tắc nghiệp vụ nếu chưa đánh giá ảnh hưởng và được nhóm xác nhận.

## **4\. Workflow**

### **4.1. Before Making Changes**

Trước khi sửa mã nguồn, AI phải thực hiện các bước sau:

1. Đọc AGENTS.md, REQUIREMENTS.md và các tài liệu liên quan đến chức năng cần sửa.  
2. Kiểm tra cấu trúc thư mục, công nghệ sử dụng và mã nguồn hiện tại.  
3. Phân tích hiện trạng, xác định nguyên nhân vấn đề và các thành phần có thể bị ảnh hưởng.  
4. Đề xuất phương án xử lý, nêu rõ các file dự kiến thay đổi, phạm vi sửa đổi, rủi ro và cách kiểm thử.  
5. Chờ nhóm xác nhận trước khi tiến hành sửa mã nguồn.

### **4.2. After Making Changes**

Sau khi được nhóm xác nhận và hoàn tất thay đổi, AI phải:

1. Giải thích những thay đổi đã thực hiện và mục đích của từng thay đổi.  
2. Liệt kê các file đã tạo, sửa hoặc xóa.  
3. Hướng dẫn cách chạy ứng dụng và kiểm thử chức năng liên quan.  
4. Báo cáo kết quả kiểm thử thực tế; không khẳng định kiểm thử thành công nếu chưa chạy kiểm thử.  
5. Nêu rõ các giới hạn, lỗi chưa xử lý và vấn đề cần nhóm kiểm tra thêm.  
6. Thông báo nếu phát hiện thay đổi làm ảnh hưởng đến các chức năng khác hoặc không còn phù hợp với tài liệu yêu cầu.

## **5\. Security**

* Không đưa mật khẩu, API key, access token hoặc thông tin bí mật vào mã nguồn hay repository.  
* Sử dụng biến môi trường hoặc cơ chế cấu hình phù hợp để quản lý thông tin nhạy cảm.  
* Không tự ý vô hiệu hóa xác thực, phân quyền hoặc các cơ chế kiểm tra bảo mật.  
* Kiểm tra dữ liệu đầu vào ở cả giao diện và máy chủ khi phù hợp.  
* Đảm bảo các thao tác liên quan đến giá bán, tồn kho, voucher, đơn hàng và trạng thái thanh toán được xác minh ở máy chủ.  
* Kiểm tra quyền truy cập để khách hàng không thể xem hoặc chỉnh sửa dữ liệu của người khác.  
* Không sử dụng dữ liệu cá nhân thật khi chưa được phép.  
* Không ghi thông tin đăng nhập, token hoặc dữ liệu nhạy cảm vào log và báo cáo.  
* Không tự ý thay đổi cơ chế bảo mật chỉ để làm cho chức năng chạy được.

## **6\. Project-Specific Instructions**

* Ưu tiên hoàn thiện luồng mua hàng cốt lõi theo yêu cầu của dự án.  
* Triển khai công cụ thiết kế 3D và chức năng lưu bộ setup theo phạm vi đã thống nhất.  
* Tích hợp chatbot AI theo yêu cầu F12; khi dịch vụ AI gặp lỗi, các chức năng tìm kiếm sản phẩm, chỉnh sửa bố cục và mua hàng vẫn phải hoạt động.  
* Không sử dụng kết quả từ chatbot làm căn cứ duy nhất để xác định giá bán, tồn kho hoặc tính tiền đơn hàng.  
* Chỉ gợi ý sản phẩm từ danh mục cửa hàng theo yêu cầu dự án; thông tin sản phẩm phải có giá và liên kết phù hợp với dữ liệu hiện có.  
* Không tự ý triển khai chức năng tạo ảnh AI minh họa trong phiên bản đầu khi phạm vi này chưa được nhóm thống nhất giữa các tài liệu.  
* Ưu tiên sử dụng dữ liệu mẫu; không giả định dữ liệu chưa được xác minh là dữ liệu thực tế.  
* Nếu cần tích hợp dịch vụ bên ngoài, phải xem xét khả năng triển khai, hạn mức sử dụng, chi phí và phương án xử lý lỗi.

## **7\. Communication**

* Giao tiếp rõ ràng, ngắn gọn và ưu tiên tiếng Việt.  
* Nếu yêu cầu chưa rõ, hãy hỏi lại trước khi triển khai.  
* Nếu phát hiện mâu thuẫn giữa yêu cầu mới và tài liệu hiện có, hãy nêu rõ vấn đề và chờ nhóm quyết định.  
* Không tự suy đoán rằng nhóm đã phê duyệt một chức năng hoặc thay đổi.  
* Khi có nhiều phương án, hãy trình bày ưu điểm, hạn chế, rủi ro và mức độ phù hợp với thời gian thực hiện.  
* Phân biệt rõ nội dung đã triển khai, nội dung mới đề xuất và nội dung cần xác nhận.

## **8\. Final Principle**

**AI chỉ hỗ trợ phân tích, đề xuất, lập trình và kiểm thử trong phạm vi được giao. Nhóm dự án là bên quyết định yêu cầu, phê duyệt thay đổi và xác nhận kết quả cuối cùng.**

