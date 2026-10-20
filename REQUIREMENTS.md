# Yêu cầu dự án Góc Desk

## 1. Mục tiêu dự án

Xây dựng website bán phụ kiện góc học tập và làm việc, kết nối việc tìm sản phẩm, thử bố trí trong không gian 3D và đặt hàng. Khách hàng mục tiêu là sinh viên và người mới đi làm sử dụng laptop, có không gian và ngân sách mua phụ kiện giới hạn.

Các mục tiêu kinh doanh và giá trị mang lại cho khách hàng:

- Hỗ trợ lựa chọn các phụ kiện đồng bộ về màu sắc, công năng, kích thước và phù hợp nhu cầu sử dụng.
- Giúp khách hình dung vị trí và mức độ chiếm chỗ khi đặt nhiều món trên cùng một bàn thông qua góc mẫu 3D.
- Cập nhật danh sách sản phẩm và tổng giá khi thêm, bỏ hoặc thay món để khách kiểm soát ngân sách.
- Hỗ trợ kiểm tra kết nối, hệ điều hành hoặc dải kích thước tương thích khi có dữ liệu; đánh dấu rõ trường hợp chưa xác minh.
- Cho phép lưu bộ setup và đưa các món đã chọn vào giỏ, giảm thao tác ghi nhớ và tìm lại từng sản phẩm.
- Tạo ảnh AI minh họa phong cách từ bố cục đã chọn ở phạm vi giới hạn, hỗ trợ tham khảo trước khi mua.
- Cung cấp chức năng quản trị sản phẩm, giá, tồn kho, đơn hàng, voucher và Dashboard phục vụ hoạt động cửa hàng.

Các khó khăn của khách hàng và mức độ khác biệt với website tương tự là giả định cần được kiểm chứng bằng khảo sát, không được xem là kết quả khảo sát đã hoàn tất.

## 2. Phạm vi

### 2.1. Trong phạm vi đề xuất

- Kinh doanh phụ kiện học tập, làm việc bằng laptop và đồ trang trí nhỏ trên bàn: chuột, bàn phím, giá đỡ laptop, đèn bàn và các vật dụng phù hợp.
- Danh mục khoảng 30–40 sản phẩm mẫu; chọn 8–10 sản phẩm có mô hình phù hợp cho công cụ bố trí 3D. Tường và sàn là bối cảnh mẫu.
- **F01–F03:** Danh mục, tìm kiếm, sắp xếp, bộ lọc; chi tiết sản phẩm; tài khoản, hồ sơ, địa chỉ, sản phẩm đã xem, lịch sử mua và yêu thích.
- **F04–F07:** Giỏ hàng, voucher, đặt hàng, phí vận chuyển theo bảng phí khu vực, thanh toán qua một cổng sandbox, email xác nhận và theo dõi đơn hàng.
- **F08–F09:** Quản trị dữ liệu cửa hàng, tài nguyên 3D và Dashboard cơ bản theo dữ liệu đơn hàng.
- **F10:** Một góc mẫu 3D; thêm, di chuyển, xoay, xóa và đổi góc nhìn; giới hạn vị trí trên mặt bàn và giữ kích thước theo dữ liệu sản phẩm.
- **F11:** Lưu và mở lại bố cục; cập nhật tổng giá; kiểm tra điều kiện tương thích có dữ liệu; mua từng món hoặc thêm các món đã chọn của bộ setup vào giỏ.
- **F12:** Tạo ảnh minh họa từ ảnh chụp bố cục, danh sách sản phẩm và lựa chọn phong cách; ba phong cách, một ảnh mỗi yêu cầu; giới hạn lượt, trạng thái xử lý và cách xử lý lỗi.
- Giao diện desktop và mobile; kiểm tra đầu vào, phân quyền và xác minh giá, tồn kho, voucher, thanh toán ở máy chủ; kiểm thử luồng chính, dữ liệu biên và trường hợp lỗi.

Đây là phạm vi dự kiến của bài nộp. Mức độ ưu tiên, điều kiện khả thi và các nội dung chờ nhóm xác nhận được nêu chi tiết tại mục 4 và mục 6; F10–F12 cần được đối chiếu các điều kiện đó trước khi cam kết triển khai.

Thứ tự triển khai dự kiến: hoàn thiện luồng mua hàng, tiếp đến công cụ 3D và lưu thiết kế, sau đó tích hợp AI tạo ảnh. Khi dịch vụ AI lỗi, khách vẫn tiếp tục chỉnh sửa bố cục và mua hàng. Bố cục và mã sản phẩm là dữ liệu gốc; ảnh AI chỉ minh họa, không thay thế thông số kích thước hoặc căn cứ tính tiền.

### 2.2. Ngoài phạm vi phiên bản đầu theo bài nộp

- Chatbot tư vấn và gợi ý setup bằng AI.
- Tìm kiếm bằng ảnh và dựng phòng từ ảnh thật.
- AR, tích điểm và flash sale nâng cao.

Các chức năng này được cân nhắc cho giai đoạn sau theo thời gian, nguồn lực và kết quả kiểm thử.

**Điểm cần nhóm thống nhất:** Chatbot được xếp ngoài phiên bản đầu trong bài nộp, nhưng [PROJECT_PLAN.md](PROJECT_PLAN.md) và [docs/business-workflow.md](docs/business-workflow.md) đang đưa chatbot vào phiên bản đầu. Cần thống nhất phạm vi giữa các tài liệu trước khi triển khai.

## 3. Người dùng

| Vai trò | Nhiệm vụ chính | Quyền hạn và giới hạn |
| --- | --- | --- |
| Khách chưa đăng nhập | Tìm hiểu sản phẩm, thử bố trí góc làm việc và mua hàng. | Xem, tìm kiếm, lọc sản phẩm; quản lý giỏ hàng và bộ setup tạm thời; đặt hàng không cần tài khoản theo phương án đề xuất; tra cứu đơn bằng mã đơn và số điện thoại. Không được vào trang quản trị hoặc lưu thiết kế dài hạn vào tài khoản. |
| Khách hàng đã đăng nhập | Mua hàng, quản lý thông tin cá nhân và lưu bộ setup. | Có các quyền mua sắm của khách chưa đăng nhập; quản lý hồ sơ, địa chỉ, yêu thích, sản phẩm đã xem; xem lịch sử mua hàng; lưu và mở lại thiết kế của mình; yêu cầu tạo ảnh AI trong hạn mức nếu chức năng được triển khai. |
| Quản trị viên | Quản lý dữ liệu và hoạt động của cửa hàng. | Quản lý sản phẩm, danh mục, giá, tồn kho, người dùng, voucher, khuyến mãi, đơn hàng và tài nguyên thiết kế; xem Dashboard. Các thao tác phải được kiểm tra quyền ở máy chủ; không được xem mật khẩu gốc của khách hàng. |

Đây là vai trò sử dụng website. UI/UX, Frontend, Backend và trưởng nhóm là vai trò thành viên phát triển ở PROJECT_PLAN.md, không thay thế các vai trò người dùng trên.

Tất cả quyền riêng tư và quyền quản trị phải được kiểm tra ở máy chủ. Khách hàng chỉ thao tác dữ liệu của mình và không tự thay đổi giá, tồn kho, quyền tài khoản hoặc trạng thái thanh toán. Chưa tách thêm nhân viên kho hay nhân viên chăm sóc khách hàng trong phiên bản đầu.

## 4. Yêu cầu chức năng

“Bắt buộc” là chức năng cốt lõi trong phạm vi đề xuất. Các mục ghi “chờ chốt” phải được nhóm xác nhận trước khi cam kết. Mỗi mục bên dưới có mã, tên, mô tả, người sử dụng, ưu tiên và tiêu chí nghiệm thu.

### F01 Danh mục và tìm kiếm

- **Mô tả:** Hiển thị trang chủ, danh mục; tìm theo tên; sắp xếp và lọc theo loại, giá, thương hiệu, màu sắc, nhu cầu sử dụng.
- **Người sử dụng:** Khách chưa đăng nhập; khách hàng.
- **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu**

1. Tìm theo tên sản phẩm; kết hợp các bộ lọc theo danh mục, khoảng giá, thương hiệu, màu sắc và nhu cầu sử dụng trên dữ liệu mẫu đã chuẩn hóa.
2. Khi chọn nhiều bộ lọc, kết quả đáp ứng đồng thời các điều kiện; sắp xếp giá tăng hoặc giảm hoạt động đúng.
3. Không có kết quả thì hiển thị thông báo và cách xóa bộ lọc; bộ lọc kỹ thuật chỉ áp dụng cho danh mục có dữ liệu tương ứng.

### F02 Chi tiết sản phẩm

- **Mô tả:** Hiển thị ảnh, mô tả, giá, tồn kho, thông số, đánh giá và sản phẩm liên quan; cho phép chọn món để mua.
- **Người sử dụng:** Khách chưa đăng nhập; khách hàng.
- **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu**

1. Hiển thị đúng tên, ảnh, mô tả, giá bán, giá khuyến mãi nếu có, tình trạng tồn kho và thông số của sản phẩm đang chọn.
2. Thông tin kết nối, kích thước hỗ trợ hoặc hệ điều hành chỉ hiển thị khi có dữ liệu; dữ liệu chưa đủ phải ghi chưa xác minh.
3. Sản phẩm hết hàng không thể được đặt mua; sản phẩm liên quan được chọn theo cùng danh mục. Phạm vi đánh giá ở bản này là hiển thị dữ liệu đánh giá mẫu, chưa cam kết luồng gửi và duyệt đánh giá mới.

### F03 Tài khoản khách hàng

- **Mô tả:** Đăng ký, đăng nhập, đăng xuất; quản lý hồ sơ, địa chỉ, yêu thích và sản phẩm đã xem; liên kết lịch sử mua hàng.
- **Người sử dụng:** Khách đăng ký; khách hàng.
- **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu**

1. Đăng ký với dữ liệu hợp lệ thành công; email trùng và thông tin thiếu được báo lỗi; đăng nhập sai bị từ chối, đăng xuất kết thúc phiên.
2. Khách hàng cập nhật được hồ sơ, địa chỉ, thêm hoặc bỏ yêu thích và xem các sản phẩm đã xem của mình.
3. Tài khoản A không đọc hoặc sửa được hồ sơ, địa chỉ, yêu thích và dữ liệu cá nhân của tài khoản B bằng cách đổi đường dẫn hoặc gọi API. Lịch sử đơn hàng sử dụng chung dữ liệu của F07.

### F04 Giỏ hàng và voucher

- **Mô tả:** Thêm, xóa, đổi số lượng; tính tiền; kiểm tra điều kiện, thời hạn và lượt sử dụng voucher.
- **Người sử dụng:** Khách chưa đăng nhập; khách hàng.
- **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu**

1. Thêm, xóa và sửa số lượng làm cập nhật đúng tổng tiền; số lượng phải là số nguyên dương và được đối chiếu tồn kho khi đặt hàng.
2. Voucher còn hạn, còn lượt và đủ điều kiện mới được áp dụng; voucher không hợp lệ phải nêu lý do. Quy tắc số voucher trên một đơn do nhóm chốt trước khi lập trình.
3. Giá và mức giảm được tính lại từ dữ liệu máy chủ; sửa giá trong trình duyệt không làm thay đổi số tiền phải trả; tiền hàng sau giảm không âm.

### F05 Đặt hàng và vận chuyển

- **Mô tả:** Nhập thông tin nhận hàng, tính phí theo khu vực, kiểm tra giá và tồn kho, tạo mã đơn và lưu chi tiết đơn.
- **Người sử dụng:** Khách chưa đăng nhập; khách hàng.
- **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu**

1. Kiểm tra họ tên, số điện thoại, địa chỉ và khu vực giao hàng; email được kiểm tra định dạng nếu khách cung cấp để nhận thông báo.
2. Trước khi khách xác nhận, hiển thị tiền hàng, giảm giá, phí giao hàng theo bảng phí khu vực và tổng phải trả; không tạo đơn từ giỏ rỗng hoặc số lượng vượt tồn khả dụng.
3. Lưu mã đơn duy nhất, thông tin người nhận, mã sản phẩm/biến thể, số lượng, đơn giá tại lúc đặt, voucher, phí giao hàng và tổng tiền; báo lỗi nếu lưu thất bại.
4. Đơn chờ thanh toán được lưu trước khi chuyển sang cổng thử nghiệm ở F06. Không coi một đơn là đã thanh toán chỉ vì người dùng quay về trang thành công.

### F06 Thanh toán sandbox

- **Mô tả:** Tích hợp một cổng thử nghiệm; xử lý thành công, thất bại, hủy và thông báo kết quả gửi lặp.
- **Người sử dụng:** Người mua; quản trị viên theo dõi.
- **Mức độ ưu tiên:** Bắt buộc theo phạm vi đề xuất.

**Tiêu chí nghiệm thu**

1. Dùng một cổng thanh toán trong môi trường thử nghiệm do nhóm lựa chọn; gắn giao dịch với đúng mã đơn và đúng số tiền.
2. Máy chủ xác minh tính hợp lệ của thông báo kết quả; kiểm thử thanh toán thành công, thất bại và khách hủy.
3. Một thông báo thanh toán gửi nhiều lần không tạo đơn mới, không ghi nhận tiền hoặc cập nhật tồn kho nhiều lần.
4. Trạng thái thanh toán được lưu riêng với trạng thái xử lý đơn; thanh toán thất bại hoặc bị hủy không được ghi là đã thanh toán.

### F07 Theo dõi đơn hàng

- **Mô tả:** Xem lịch sử và trạng thái đơn; khách vãng lai tra cứu đơn; gửi email xác nhận khi có email hợp lệ.
- **Người sử dụng:** Khách hàng; khách tra cứu đơn.
- **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu**

1. Khách đã đăng nhập chỉ xem được đơn thuộc tài khoản của mình; hệ thống không cho đổi mã đơn để đọc đơn của người khác.
2. Theo phương án mua không cần tài khoản, khách phải nhập đồng thời mã đơn khó đoán và số điện thoại khớp mới tra cứu được; giới hạn yêu cầu tra cứu và chỉ hiển thị thông tin cần thiết.
3. Hiển thị trạng thái xử lý theo dữ liệu quản trị: Chờ xác nhận, Đã xác nhận, Đang giao, Hoàn thành hoặc Đã hủy; hiển thị trạng thái thanh toán riêng.
4. Nếu có email hợp lệ, hệ thống gửi thông báo tiếp nhận đơn và ghi đúng trạng thái thanh toán; lỗi gửi email không làm mất hoặc tạo lại đơn.

### F08 Quản trị cửa hàng

- **Mô tả:** Quản lý sản phẩm, danh mục, người dùng, giá, tồn kho, đơn, khuyến mãi, voucher và tài nguyên 3D.
- **Người sử dụng:** Quản trị viên.
- **Mức độ ưu tiên:** Bắt buộc.

**Tiêu chí nghiệm thu**

1. Tài khoản không có quyền quản trị bị từ chối ở cả giao diện và API; quản trị viên được thêm, sửa, ẩn sản phẩm và quản lý các dữ liệu thuộc phạm vi.
2. Sản phẩm đã xuất hiện trong đơn hàng được ẩn hoặc ngừng bán, không xóa làm mất lịch sử mua hàng; thay đổi giá hiện tại không làm đổi giá trong đơn đã lưu.
3. Cập nhật trạng thái đơn tuân theo chuyển trạng thái hợp lệ; ghi người cập nhật và thời điểm. Không chuyển đơn hoàn thành hoặc đã hủy trở lại đang xử lý tùy ý.
4. Kiểm tra tồn kho, voucher và dữ liệu mô hình; mỗi tài nguyên thiết kế gắn với sản phẩm tương ứng. Khách hàng không tự sửa giá, tồn kho, quyền tài khoản hoặc trạng thái thanh toán.

### F09 Dashboard cơ bản

- **Mô tả:** Thống kê doanh thu đơn hoàn thành, số đơn, sản phẩm bán chạy, đơn chờ giao và số khách hàng.
- **Người sử dụng:** Quản trị viên.
- **Mức độ ưu tiên:** Bắt buộc theo phạm vi đề xuất.

**Tiêu chí nghiệm thu**

1. Có số đơn, đơn chờ giao, số tài khoản khách hàng và sản phẩm bán chạy; thống nhất khoảng thời gian thống kê.
2. Đề xuất cách tính doanh thu: cộng tiền hàng sau giảm giá của đơn Hoàn thành, không gồm phí giao hàng; loại đơn hủy. Đây là doanh thu bán hàng, không phải lợi nhuận.
3. Kiểm thử bằng bộ dữ liệu đơn hàng đã biết kết quả và đối chiếu phép cộng thủ công; chỉ quản trị viên truy cập được.

### F10 Thiết kế góc 3D

- **Mô tả:** Một góc bàn mẫu, 8-10 sản phẩm có mô hình; thêm, di chuyển, xoay, xóa và đổi góc nhìn trong vùng cho phép.
- **Người sử dụng:** Khách chưa đăng nhập; khách hàng.
- **Mức độ ưu tiên:** Ưu tiên cao; chờ chốt khả thi.

**Tiêu chí nghiệm thu**

1. Nếu nhóm chốt phạm vi 3D: tải được một góc mẫu và thư viện 8-10 sản phẩm có mô hình gắn đúng mã sản phẩm.
2. Thêm, di chuyển, xoay, xóa và đổi góc nhìn hoạt động; vật thể không đặt ngoài vùng mặt bàn; kích thước mô hình dựa trên dữ liệu sản phẩm.
3. Lỗi tải mô hình phải được thông báo, không chặn việc xem và mua các sản phẩm thông thường. Chưa cam kết dựng phòng từ ảnh, AR hoặc mô phỏng va chạm đầy đủ.
4. Nếu dùng 2D phân lớp hoặc vị trí cố định thay 3D, nhóm phải sửa đồng thời mô tả đề tài, F10, quy trình và tiêu chí nghiệm thu; không gọi bản 2D là chức năng 3D đã hoàn thành.

### F11 Lưu và mua bộ setup

- **Mô tả:** Lưu và mở lại bố cục; cập nhật tổng giá; kiểm tra tương thích có dữ liệu; đưa các món đã chọn vào giỏ.
- **Người sử dụng:** Khách hàng lưu; mọi khách chọn mua.
- **Mức độ ưu tiên:** Ưu tiên cao; phụ thuộc F10.

**Tiêu chí nghiệm thu**

1. Khách hàng lưu và mở lại bộ setup gồm mã sản phẩm/biến thể, số lượng, vị trí và góc xoay; tài khoản khác không được truy cập hoặc sửa thiết kế riêng tư.
2. Khách chưa đăng nhập giữ bộ setup tạm thời trong phiên; muốn lưu dài hạn phải đăng nhập. Cả hai nhóm đều có thể chọn các món để thêm vào giỏ.
3. Mỗi món chuyển thành một dòng hàng theo sản phẩm/biến thể và số lượng; thêm lại cùng sản phẩm không tạo dòng sai lệch; kiểm tra lại giá và tồn kho hiện tại, báo nếu có thay đổi.
4. Tổng giá bộ setup là tổng tiền sản phẩm, chưa gồm voucher và vận chuyển. Điều kiện tương thích chỉ được kết luận khi có dữ liệu; trường hợp thiếu thông số ghi chưa xác minh.

### F12 Tạo ảnh AI minh họa

- **Mô tả:** Tạo một ảnh từ bố cục và lựa chọn của khách, ba phong cách; giới hạn lượt, thông báo xử lý và lỗi.
- **Người sử dụng:** Khách hàng đã đăng nhập theo đề xuất.
- **Mức độ ưu tiên:** Nâng cao; chờ chốt API và hạn mức.

**Tiêu chí nghiệm thu**

1. Nếu triển khai API thật, gửi ảnh chụp bố cục, danh sách sản phẩm và phong cách lựa chọn từ máy chủ; ba phong cách và một ảnh cho mỗi yêu cầu.
2. Đề xuất yêu cầu đăng nhập để quản lý hạn mức; mức lượt tạo, thời gian chờ và ngân sách API phải được nhóm chốt, hiển thị rõ cho người dùng.
3. Có trạng thái đang xử lý, thành công, thất bại hoặc quá hạn; khi AI lỗi, khách vẫn chỉnh sửa bố cục và mua hàng bằng danh sách sản phẩm.
4. Ảnh có nhãn ảnh minh họa do AI tạo; không dùng chi tiết trong ảnh làm căn cứ tính giá, tồn kho hoặc kích thước. Không để API key trong frontend; ảnh dựng sẵn không được mô tả là kết quả gọi API trực tiếp.

### Quy tắc nghiệp vụ cần thống nhất khi triển khai

- Tổng thanh toán = tiền hàng sau giảm giá + phí giao hàng. Giá bộ setup chỉ gồm tiền sản phẩm; giao diện phải nói rõ phần chưa tính.
- Danh sách sản phẩm và dữ liệu bố cục là dữ liệu gốc; ảnh AI chỉ minh họa, không quyết định giá hay kích thước.
- Phân biệt trạng thái xử lý đơn và trạng thái thanh toán; tạo bản ghi đơn chờ thanh toán trước khi chuyển sang cổng sandbox.
- Trước khi lập trình, nhóm chốt thời điểm giữ/trừ tồn kho, thời hạn giữ và điều kiện hoàn tồn; thao tác hủy hoặc thông báo lặp chỉ được hoàn/trừ một lần. Không ghi quy tắc này là đã được chốt khi mới có đề xuất.
- Các bên liên quan cập nhật docs/business-workflow.md khi thay đổi quy trình, đặc biệt cơ chế thanh toán, tồn kho và mua không cần tài khoản.

## 5. Yêu cầu phi chức năng

| Mã | Yêu cầu | Cách kiểm tra dự kiến |
| --- | --- | --- |
| NFR01 | Giao diện và khả năng sử dụng | Kiểm tra các trang chính ở chiều rộng 360, 768 và 1366 px; chữ, nút và trường nhập không bị che hoặc tràn ngang ngoài chủ đích. Có trạng thái trống, đang tải và lỗi. |
| NFR02 | Kiểm tra đầu vào | Kiểm tra ở cả giao diện và máy chủ với dữ liệu thiếu, email sai định dạng, số lượng không hợp lệ và mã sản phẩm không tồn tại; thông báo đủ để người dùng sửa. |
| NFR03 | Phân quyền và bảo vệ tài khoản | Kiểm thử truy cập trái phép ở API, không chỉ ẩn nút; khách A không truy cập dữ liệu riêng của khách B. Mật khẩu được băm bằng cơ chế phù hợp; bí mật chỉ đặt ở máy chủ. |
| NFR04 | Tính nhất quán dữ liệu | Tính tiền ở máy chủ; đơn lưu giá tại lúc mua; thao tác lặp không tạo đơn hoặc ghi nhận thanh toán lặp; không cho tồn kho âm. Kiểm thử hai yêu cầu đặt hàng cùng lúc với số lượng tồn nhỏ. |
| NFR05 | Hiệu năng | Đo trang chủ, danh mục và chi tiết bằng Lighthouse trong cùng điều kiện; lưu thiết bị, trình duyệt và kết quả. Đo riêng thời gian tải 3D và phản hồi AI; nhóm chốt ngưỡng sau bản thử nghiệm, không ghi số chưa đo là đã đạt. |
| NFR06 | Mã nguồn và khôi phục | Có hướng dẫn chạy, cấu hình mẫu không chứa bí mật, script tạo dữ liệu mẫu hoặc bản sao lưu phù hợp; kiểm tra phục hồi được dữ liệu demo. |
| NFR07 | Dịch vụ bên ngoài | Có hạn mức API và cách xử lý lỗi; AI hoặc email gặp sự cố không làm mất đơn hàng. Chỉ dùng dữ liệu mẫu cho kiểm thử và không công khai thông tin cá nhân thật trong repository. |

## 6. Giới hạn và giả định

- Quy mô nhóm: 7 thành viên theo tài liệu phân công. Lịch dự kiến dùng 8 tuần theo Project Plan; cần xác nhận với deadline học phần vì phần AI phân tích dùng 6 tuần.
- Công nghệ frontend, backend, cơ sở dữ liệu, thư viện 3D, nhà cung cấp AI và cổng thanh toán chưa được xác nhận trong nguồn đã đọc; điền sau khi nhóm thống nhất, không tự đặt tên công nghệ như một quyết định có sẵn.
- Có khoảng 30-40 sản phẩm mẫu; 8-10 sản phẩm có tài nguyên 3D nếu triển khai phương án 3D. Dữ liệu thông số, giá, tồn kho và quyền sử dụng tài nguyên phải được chuẩn bị trước.
- Kiểm thử bằng tài khoản, người nhận và đơn hàng mẫu. Các dịch vụ thật chỉ tích hợp khi có quyền truy cập và hạn mức phù hợp.
- Cần chốt thêm: quy tắc voucher trên mỗi đơn; cơ chế tồn kho; hạn mức và thời gian chờ AI; quyền tạo ảnh của khách chưa đăng nhập; phạm vi đánh giá sản phẩm; cách tính doanh thu.
- Chưa có bằng chứng các chức năng đã chạy hoặc đã đạt tiêu chí; tài liệu này mô tả yêu cầu và phương án kiểm tra.
