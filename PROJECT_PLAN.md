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

Bảng 2. Các giai đoạn triển khai

| **Giai đoạn**                                  | **Thời gian** | **Nội dung chính**                                                                                | **Kết quả cần đạt**                                                                |
| ---------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1. Khảo sát và xác định yêu cầu                | Tuần 1        | Khảo sát đối thủ, chốt phạm vi, user flow, repository và quy ước làm việc.                        | Yêu cầu và danh sách chức năng được thống nhất, repository và Issues đã thiết lập. |
| 2. Thiết kế giao diện và dữ liệu               | Tuần 2        | Thiết kế Figma, ERD, dữ liệu mẫu, hợp đồng API và kiến trúc 3D/AI.                                | Thiết kế giao diện, cơ sở dữ liệu và quy ước API được thống nhất.                  |
| 3. Phát triển Frontend và Backend nền tảng     | Tuần 3–4      | Phát triển giao diện mua hàng, tài khoản, API sản phẩm, tài khoản, giỏ hàng và thử nghiệm 3D sớm. | Các module nền tảng chạy với dữ liệu mẫu/API, có bản thử nghiệm 3D.                |
| 4. Hoàn thiện nghiệp vụ TMĐT và trải nghiệm 3D | Tuần 5        | Hoàn thiện đặt hàng, voucher, vận chuyển, lưu và mua bộ setup.                                    | Luồng mua hàng và luồng setup cơ bản hoạt động xuyên suốt.                         |
| 5. Tích hợp AI, quản trị và thanh toán         | Tuần 6        | Tích hợp chatbot, tạo ảnh AI, giao diện quản trị, Dashboard, thanh toán sandbox và email.         | Các chức năng chính được tích hợp, có kết quả kiểm thử ban đầu.                    |
| 6. Kiểm thử và hoàn thiện                      | Tuần 7        | Kiểm thử chức năng, phân quyền, dữ liệu, responsive và xử lý lỗi.                                 | Các lỗi quan trọng được sửa, có checklist kiểm thử cập nhật.                       |
| 7. Triển khai và nghiệm thu                    | Tuần 8        | Triển khai demo, hoàn thiện tài liệu, rà soát repository và chuẩn bị trình bày.                   | Bản demo, README, hướng dẫn chạy và báo cáo cuối.                                  |

## 4. Danh sách công việc

Bảng 3. Danh sách công việc theo tuần

*Trạng thái sử dụng: Chưa bắt đầu · Đang thực hiện · Cần xử lý · Hoàn thành.*

| **Mã công việc** | **Công việc**                                                     | **Người phụ trách**                                                            | **Kết quả cần đạt**                                                                   | **Thời hạn** | **Trạng thái** |
| ---------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------ | -------------- |
| GD-01            | Chốt yêu cầu, phạm vi, quy trình nghiệp vụ và tiêu chí nghiệm thu | Sạch Thị Phương Trinh, Nguyễn Hoàng Hưng, Nguyễn Huy Hoàng                     | Tài liệu yêu cầu và danh sách chức năng được nhóm thống nhất                          | Tuần 1       | Hoàn thành     |
| GD-02            | Khảo sát đối thủ và xây dựng user flow                            | Hoàng Huyền Nhi, Nguyễn Hoàng Nhi, Lê Bảo Ngọc                                 | Bảng phân tích đối thủ và luồng người dùng                                            | Tuần 1       | Hoàn thành     |
| GD-03            | Thiết lập repository, Issues và quy ước làm việc                  | Nguyễn Kiều Oanh                                                               | Repository có README, danh sách Issues và quy ước nhánh/commit                        | Tuần 1       | Hoàn thành     |
| GD-04            | Thiết kế giao diện và thống nhất hệ thống thiết kế                | Hoàng Huyền Nhi, Phương Trinh, Hoàng Nhi, Bảo Ngọc phối hợp                    | Figma các trang chính, màu sắc, kiểu chữ và thành phần giao diện                      | Tuần 2       | Chưa bắt đầu   |
| GD-05            | Thiết kế cơ sở dữ liệu và chuẩn bị dữ liệu mẫu                    | Nguyễn Hoàng Hưng, Nguyễn Huy Hoàng                                            | ERD, cấu trúc bảng và dữ liệu mẫu cho sản phẩm, tài khoản, đơn hàng, bộ setup         | Tuần 2       | Chưa bắt đầu   |
| GD-06            | Lập kế hoạch triển khai và thống nhất API                         | Nguyễn Kiều Oanh, Hùng, Hoàng và nhóm phối hợp                                 | Backlog công việc, GitHub Issues và quy ước trao đổi dữ liệu giữa Frontend và Backend | Tuần 2       | Chưa bắt đầu   |
| GD-07            | Xây dựng giao diện trang chủ, danh mục và tìm kiếm                | Sạch Thị Phương Trinh, Hoàng Nhi, Huyền Nhi phối hợp                           | Giao diện trang chủ, danh mục, tìm kiếm, bộ lọc và sắp xếp responsive                 | Tuần 3       | Chưa bắt đầu   |
| GD-08            | Xây dựng giao diện chi tiết sản phẩm và tài khoản                 | Nguyễn Hoàng Nhi, Phương Trinh phối hợp                                        | Trang chi tiết sản phẩm, đăng ký, đăng nhập, hồ sơ và yêu thích                       | Tuần 3       | Chưa bắt đầu   |
| GD-09            | Xây dựng API sản phẩm, danh mục, tài khoản và phân quyền          | Nguyễn Hoàng Hưng                                                              | API hoạt động và cung cấp dữ liệu cho các giao diện chính                             | Tuần 3       | Chưa bắt đầu   |
| GD-10            | Xây dựng API giỏ hàng, giá và tồn kho                             | Nguyễn Huy Hoàng, Hùng phối hợp                                                | API giỏ hàng, xử lý số lượng và kiểm tra giá, tồn kho phía server                     | Tuần 3       | Chưa bắt đầu   |
| GD-11            | Tích hợp giao diện với API và kiểm tra dữ liệu                    | Lê Bảo Ngọc, Oanh, Trinh, Hoàng Nhi, Hùng, Hoàng phối hợp                      | Các trang chính kết nối được với Backend, Issues tích hợp được ghi nhận               | Tuần 3       | Chưa bắt đầu   |
| GD-12            | Xây dựng giao diện đặt hàng, voucher và theo dõi đơn              | Sạch Thị Phương Trinh, Nguyễn Hoàng Nhi                                        | Giao diện giỏ hàng, voucher, đặt hàng và theo dõi trạng thái đơn                      | Tuần 4       | Chưa bắt đầu   |
| GD-13            | Xây dựng API voucher, đơn hàng và vận chuyển                      | Nguyễn Huy Hoàng, Nguyễn Hoàng Hưng phối hợp                                   | API đặt hàng, tính phí vận chuyển, áp dụng voucher và cập nhật trạng thái             | Tuần 4       | Chưa bắt đầu   |
| GD-14            | Xây dựng bối cảnh góc phòng và thư viện sản phẩm 3D               | Nguyễn Hoàng Nhi, Lê Bảo Ngọc, Hùng hỗ trợ dữ liệu                             | Góc phòng có tường, sàn, bàn làm việc và mô hình các phụ kiện mẫu                     | Tuần 4       | Chưa bắt đầu   |
| GD-15            | Hoàn thiện Figma và rà soát tiến độ các module                    | Hoàng Huyền Nhi, Nguyễn Kiều Oanh điều phối, toàn nhóm phối hợp                | Giao diện thống nhất, tài nguyên thiết kế đầy đủ và danh sách công việc cần bổ sung   | Tuần 4       | Chưa bắt đầu   |
| GD-16            | Phát triển thao tác bố trí sản phẩm trong không gian 3D           | Nguyễn Hoàng Nhi, Lê Bảo Ngọc, Hùng hỗ trợ dữ liệu                             | Thêm, di chuyển, xoay, xóa sản phẩm và giới hạn vùng đặt trên bàn                     | Tuần 5       | Chưa bắt đầu   |
| GD-17            | Xây dựng chức năng lưu và mua bộ setup                            | Nguyễn Hoàng Hưng, Nguyễn Huy Hoàng, Nguyễn Hoàng Nhi                          | Lưu và mở lại bố cục, tính tổng giá và chuyển sản phẩm vào giỏ hàng                   | Tuần 5       | Chưa bắt đầu   |
| GD-18            | Tích hợp chatbot AI và dịch vụ tạo ảnh AI                         | Lê Bảo Ngọc, Nguyễn Hoàng Nhi, Hùng, Hoàng hỗ trợ API                          | Chatbot tư vấn dựa trên dữ liệu sản phẩm và công cụ tạo ảnh có xử lý lỗi              | Tuần 5       | Chưa bắt đầu   |
| GD-19            | Hoàn thiện giao diện responsive và trải nghiệm người dùng         | Sạch Thị Phương Trinh, Nguyễn Hoàng Nhi, Hoàng Huyền Nhi                       | Các trang chính hoạt động phù hợp trên desktop và mobile                              | Tuần 5       | Chưa bắt đầu   |
| GD-20            | Xây dựng giao diện quản trị cửa hàng                              | Lê Bảo Ngọc, Hùng, Hoàng hỗ trợ API                                            | Quản lý sản phẩm, danh mục, người dùng, đơn hàng, voucher và tài nguyên 3D            | Tuần 6       | Chưa bắt đầu   |
| GD-21            | Tích hợp thanh toán sandbox, email và vận chuyển                  | Lê Bảo Ngọc, Nguyễn Huy Hoàng, Hùng phối hợp                                   | Luồng thanh toán thử nghiệm, cập nhật trạng thái và email xác nhận                    | Tuần 6       | Chưa bắt đầu   |
| GD-22            | Xây dựng Dashboard thống kê                                       | Lê Bảo Ngọc, Nguyễn Huy Hoàng, Hùng hỗ trợ dữ liệu                             | Thống kê doanh thu đơn hoàn tất, số đơn và sản phẩm bán chạy                          | Tuần 6       | Chưa bắt đầu   |
| GD-23            | Kiểm thử các API và nghiệp vụ TMĐT                                | Nguyễn Hoàng Hưng, Nguyễn Huy Hoàng, Kiều Oanh theo dõi                        | Kết quả kiểm thử tài khoản, phân quyền, giá, tồn kho, voucher và đơn hàng             | Tuần 6       | Chưa bắt đầu   |
| GD-24            | Tích hợp toàn bộ chức năng và rà soát tiến độ                     | Lê Bảo Ngọc, Nguyễn Kiều Oanh, toàn nhóm phối hợp                              | Các module kết nối trên một phiên bản thống nhất, danh sách lỗi và phần còn thiếu     | Tuần 7       | Chưa bắt đầu   |
| GD-25            | Kiểm thử thiết kế 3D, lưu bộ setup và các chức năng AI            | Nguyễn Hoàng Nhi, Lê Bảo Ngọc, Nguyễn Hoàng Hưng                               | Các luồng 3D, mua bộ setup, chatbot và tạo ảnh được kiểm thử                          | Tuần 7       | Chưa bắt đầu   |
| GD-26            | Kiểm thử giao diện và sửa lỗi toàn hệ thống                       | Toàn nhóm, Nguyễn Kiều Oanh điều phối                                          | Checklist kiểm thử, danh sách lỗi, kết quả sửa lỗi và kiểm thử lại                    | Tuần 7       | Chưa bắt đầu   |
| GD-27            | Hoàn thiện các chức năng còn thiếu và kiểm tra bảo mật cơ bản     | Nguyễn Kiều Oanh, Nguyễn Hoàng Hưng, Nguyễn Huy Hoàng, các thành viên phối hợp | Các lỗi ưu tiên được xử lý, kiểm tra phân quyền, dữ liệu đầu vào và luồng mua hàng    | Tuần 7       | Chưa bắt đầu   |
| GD-28            | Triển khai bản demo và kiểm tra lần cuối                          | Lê Bảo Ngọc, Nguyễn Kiều Oanh, toàn nhóm phối hợp                              | Website chạy được trong môi trường demo và các luồng chính hoạt động ổn định          | Tuần 8       | Chưa bắt đầu   |
| GD-29            | Hoàn thiện README, hướng dẫn cài đặt và tài liệu kỹ thuật         | Nguyễn Kiều Oanh, Nguyễn Hoàng Hưng, Nguyễn Huy Hoàng, Lê Bảo Ngọc             | Tài liệu hướng dẫn chạy dự án, cấu hình, cơ sở dữ liệu và API                         | Tuần 8       | Chưa bắt đầu   |
| GD-30            | Hoàn thiện báo cáo và tài liệu sử dụng                            | Hoàng Huyền Nhi, Sạch Thị Phương Trinh, Nguyễn Hoàng Nhi, Kiều Oanh tổng hợp   | Báo cáo kết quả, hình ảnh giao diện, mô tả chức năng và hướng dẫn sử dụng             | Tuần 8       | Chưa bắt đầu   |
| GD-31            | Chuẩn bị kịch bản demo và thuyết trình cuối kỳ                    | Toàn nhóm, Nguyễn Kiều Oanh điều phối                                          | Kịch bản trình diễn, phân công người trình bày và bản demo hoàn chỉnh                 | Tuần 8       | Chưa bắt đầu   |

## 5. Rủi ro và phương án xử lý

Bảng 4. Đánh giá rủi ro và phương án xử lý

| **Rủi ro**                               | **Ảnh hưởng**                   | **Phương án xử lý**                                                                                                          | **Người theo dõi**                      |
| ---------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Phạm vi chức năng lớn                    | Có thể trễ tiến độ              | Ưu tiên luồng mua hàng, 3D và lưu setup, chia nhỏ Issues, các tính năng nâng cao chỉ thực hiện khi chức năng cốt lõi ổn định | Nguyễn Kiều Oanh                        |
| Mô hình 3D khó tích hợp hoặc tải chậm    | Trải nghiệm 3D không ổn định    | Thử nghiệm từ Tuần 3–4, giới hạn 8–10 mô hình và tối ưu dung lượng                                                           | Nguyễn Hoàng Nhi, Lê Bảo Ngọc           |
| Dịch vụ AI lỗi hoặc phát sinh chi phí    | Chatbot/tạo ảnh gián đoạn       | Thử nghiệm API sớm, giới hạn lượt, bảo vệ API key phía server và không chặn luồng mua hàng khi AI lỗi                        | Lê Bảo Ngọc                             |
| Frontend và Backend không thống nhất API | Chậm tích hợp                   | Chốt cấu trúc API sớm, dùng dữ liệu mẫu và tích hợp theo từng module                                                         | Nguyễn Hoàng Hưng, Nguyễn Huy Hoàng     |
| Sai giá, tồn kho hoặc voucher            | Đơn hàng không chính xác        | Xác minh ở server, kiểm thử hết hàng, hết hạn và áp dụng lặp                                                                 | Nguyễn Huy Hoàng                        |
| Thanh toán sandbox không ổn định         | Không hoàn thành luồng đặt hàng | Tích hợp và thử nghiệm trước Tuần 7, kiểm thử thành công, thất bại và hủy                                                    | Lê Bảo Ngọc, Nguyễn Huy Hoàng           |
| Xung đột mã nguồn hoặc chậm cập nhật     | Ảnh hưởng tiến độ nhóm          | Dùng nhánh riêng, Pull Request, Issues và cập nhật tiến độ định kỳ                                                           | Nguyễn Kiều Oanh                        |
| Giao diện lỗi trên mobile                | Trải nghiệm không tốt khi demo  | Kiểm thử responsive theo từng giai đoạn và sửa lỗi trước Tuần 8                                                              | Sạch Thị Phương Trinh, Nguyễn Hoàng Nhi |
