
# QUY ĐỊNH LÀM VIỆC VÀ PHỐI HỢP PHÁT TRIỂN DỰ ÁN GÓC DESK

Tài liệu này quy định cách tổ chức mã nguồn, sử dụng GitHub Branch, phối hợp giữa các thành viên, gửi Pull Request và khai báo việc sử dụng công cụ AI trong quá trình phát triển dự án Góc Desk.

Tất cả thành viên cần đọc và tuân thủ trước khi bắt đầu thực hiện nhiệm vụ được phân công.

---

# 1. QUY ĐỊNH LÀM VIỆC TRÊN GITHUB BRANCH

## 1.1. Nguyên tắc chung

Nhóm sử dụng GitHub Branch để phân chia công việc, quản lý mã nguồn và hạn chế việc các thành viên chỉnh sửa trực tiếp trên cùng một nhánh.

Các nguyên tắc bắt buộc:

- Mỗi thành viên thực hiện công việc trên branch được phân công, không tự ý chuyển sang branch của thành viên khác.
- Không chỉnh sửa và commit trực tiếp lên `main`.
- Không chỉnh sửa và commit trực tiếp lên `feature/backend` khi đang thực hiện một chức năng Backend riêng.
- Mỗi branch cần có phạm vi công việc cụ thể, tránh nhiều thành viên cùng chỉnh sửa một chức năng hoặc một nhóm file mà chưa thống nhất.
- Các thay đổi phải được commit và push lên GitHub để lưu lại quá trình thực hiện.
- Khi hoàn thành nhiệm vụ, thành viên phải tạo Pull Request để đề xuất tích hợp mã nguồn vào branch đích.
- Không tự ý Merge Pull Request nếu chưa được người phụ trách hoặc trưởng nhóm kiểm tra và đồng ý.

## 1.2. Cấu trúc Branch hiện tại của dự án

Dự án Góc Desk tổ chức các branch theo hai nhóm chính:

### A. Nhóm Frontend

Các branch Frontend được tạo từ `main` và khi hoàn thành sẽ gửi Pull Request về `main`.

| Branch | Phạm vi công việc |
|---|---|
| `main` | Nhánh chính, lưu trữ phiên bản ổn định của website |
| `feature/homepage` | Phát triển giao diện trang chủ |
| `feature/product-catalog` | Quản lý dữ liệu và hiển thị danh mục sản phẩm |
| `feature/search-filter` | Chức năng tìm kiếm, lọc và sắp xếp sản phẩm |
| `feature/cart` | Chức năng giỏ hàng và LocalStorage |
| `feature/3d-setup` | Chức năng thiết kế góc làm việc 3D |

### B. Nhóm Backend

Nhóm sử dụng `feature/backend` làm branch tổng hợp và tích hợp các chức năng Backend.

Các branch chức năng Backend được tạo từ `feature/backend` và gửi Pull Request về chính branch này.

| Branch | Phạm vi công việc |
|---|---|
| `feature/backend` | Nhánh tổng hợp, tích hợp và kiểm thử Backend |
| `feature/backend-database` | Thiết kế cơ sở dữ liệu, ERD và các bảng MySQL |
| `feature/backend-auth` | Xử lý tài khoản, đăng ký, đăng nhập và xác thực |
| `feature/backend-products` | Xây dựng API quản lý sản phẩm |
| `feature/backend-orders` | Xây dựng API giỏ hàng và đơn hàng |

Lưu ý: Các branch Backend chưa được tạo sẽ được bổ sung khi nhóm phân công công việc. Không tự ý tạo branch trùng với branch đã có.

## 1.3. Cách xác định branch cần làm việc

Trước khi bắt đầu, mỗi thành viên cần kiểm tra nhiệm vụ được phân công và chuyển sang đúng branch.

Ví dụ:

- Thành viên phụ trách giỏ hàng Frontend làm trên `feature/cart`.
- Thành viên phụ trách thiết kế cơ sở dữ liệu làm trên `feature/backend-database`.
- Thành viên phụ trách API sản phẩm làm trên `feature/backend-products`.

Không sử dụng chung một branch cho nhiều nhiệm vụ không liên quan nếu chưa được thống nhất.

---

# 2. QUY TRÌNH THỰC HIỆN CÔNG VIỆC TRÊN BRANCH

Mỗi thành viên thực hiện công việc theo trình tự sau:

## Bước 1. Kiểm tra và cập nhật mã nguồn

Trước khi làm việc:

1. Mở GitHub Desktop hoặc công cụ Git đang sử dụng.
2. Fetch origin để cập nhật danh sách branch và các thay đổi mới nhất từ GitHub.
3. Chuyển sang branch được phân công.
4. Kiểm tra xem branch có đang thiếu những cập nhật mới từ branch đích hay không.

Branch đích được xác định như sau:

- Công việc Frontend: cập nhật từ `main`.
- Công việc Backend: cập nhật từ `feature/backend`.

Nếu branch đang làm việc chưa có các cập nhật mới từ branch đích, cần đồng bộ trước khi tiếp tục để hạn chế xung đột mã nguồn.

## Bước 2. Tiến hành thực hiện nhiệm vụ

Thành viên thực hiện đúng phạm vi công việc được giao.

Yêu cầu trong quá trình code:

- Tìm hiểu cấu trúc thư mục và các file liên quan trước khi chỉnh sửa.
- Tuân thủ công nghệ và cấu trúc hiện có của dự án.
- Không tự ý thay đổi cấu trúc chung hoặc xóa chức năng do thành viên khác thực hiện.
- Không tạo thêm file hoặc thư mục không cần thiết.
- Đảm bảo các chức năng mới không làm ảnh hưởng đến những chức năng đang hoạt động.
- Nếu cần chỉnh sửa file thuộc phạm vi của thành viên khác, phải trao đổi trước với người phụ trách.
- Nếu gặp lỗi hoặc cần thay đổi kiến trúc chung, báo lại trưởng nhóm để thống nhất.

Đối với Backend, cần thống nhất cấu trúc dữ liệu, cách đặt tên bảng, API và cách xử lý nghiệp vụ trước khi phát triển các chức năng có liên quan.

## Bước 3. Kiểm tra kết quả

Sau khi hoàn thành một phần công việc, thành viên phải tự kiểm tra:

- Chức năng có hoạt động đúng yêu cầu không?
- Có phát sinh lỗi trên các chức năng liên quan không?
- Có file nào bị chỉnh sửa ngoài phạm vi được giao không?
- Có dữ liệu hoặc thông tin nhạy cảm bị đưa vào mã nguồn không?
- Các thay đổi có thể kết hợp với những phần còn lại của dự án không?

Đối với Backend, cần kiểm tra API, dữ liệu trả về và khả năng kết nối cơ sở dữ liệu.

Đối với Frontend, cần kiểm tra giao diện, tương tác và khả năng hiển thị trên các kích thước màn hình phù hợp.

## Bước 4. Commit và Push mã nguồn

Khi đã kiểm tra, thành viên tiến hành lưu thay đổi bằng Commit và Push lên đúng branch của mình.

Quy ước đặt tên Commit:

- `feat:` Thêm chức năng mới.
- `fix:` Sửa lỗi.
- `refactor:` Tái cấu trúc mã nguồn.
- `style:` Điều chỉnh giao diện hoặc định dạng.
- `docs:` Cập nhật tài liệu.

Ví dụ:

- `feat: add product API`
- `feat: implement user authentication`
- `fix: resolve cart quantity issue`
- `docs: update AI usage log`

Không nên gộp quá nhiều thay đổi không liên quan vào một Commit.

## Bước 5. Khai báo việc sử dụng AI

Trước khi gửi Pull Request, thành viên phải cập nhật thông tin sử dụng AI (nếu có) vào file:

[AI_USAGE_LOG.md](https://github.com/KieuOanh2006/goc-desk-ecommerce-project/blob/feature/backend-database/docs/AI_USAGE_LOG.md)

Nội dung khai báo được hướng dẫn chi tiết tại Mục 4 của tài liệu này.

---

# 3. QUY TRÌNH GỬI PULL REQUEST VÀ NỘP KẾT QUẢ

## 3.1. Pull Request là gì?

Pull Request (PR) là yêu cầu đề xuất đưa những thay đổi từ branch đang thực hiện vào một branch khác.

Khi tạo Pull Request, cần xác định chính xác hai thông tin:

- **Base:** Branch nhận những thay đổi.
- **Compare:** Branch chứa những thay đổi muốn gửi đi.

Cần ghi nhớ:

- Base là nơi nhận code.
- Compare là nơi chứa code mà thành viên đã thực hiện.

Không được chọn ngược Base và Compare.

## 3.2. Quy định Base và Compare theo từng nhóm

Đây là quy định quan trọng nhất khi gửi Pull Request của dự án Góc Desk.

### A. Đối với Frontend

Các branch Frontend gửi Pull Request về `main`.

| Base | Compare |
|---|---|
| `main` | `feature/homepage` |
| `main` | `feature/product-catalog` |
| `main` | `feature/search-filter` |
| `main` | `feature/cart` |
| `main` | `feature/3d-setup` |

Ví dụ: Thành viên hoàn thành chức năng giỏ hàng trên `feature/cart`.

Khi tạo Pull Request phải chọn:

- Base: `main`
- Compare: `feature/cart`

### B. Đối với Backend

Các branch chức năng Backend gửi Pull Request về `feature/backend`.

| Base | Compare |
|---|---|
| `feature/backend` | `feature/backend-database` |
| `feature/backend` | `feature/backend-auth` |
| `feature/backend` | `feature/backend-products` |
| `feature/backend` | `feature/backend-orders` |

Ví dụ: Thành viên hoàn thành thiết kế cơ sở dữ liệu trên `feature/backend-database`.

Khi tạo Pull Request phải chọn:

- Base: `feature/backend`
- Compare: `feature/backend-database`

Sau khi được kiểm tra và chấp nhận, trưởng nhóm tiến hành Merge vào `feature/backend`.

### C. Đối với nhánh tổng hợp Backend

Sau khi các chức năng Backend đã được tích hợp, kiểm thử và kết nối với Frontend, trưởng nhóm mới tạo Pull Request cuối cùng:

- Base: `main`
- Compare: `feature/backend`

Đây là bước đưa toàn bộ phần Backend đã hoàn thiện vào nhánh chính của dự án.

Không gửi từng branch Backend riêng lẻ trực tiếp vào `main`.

## 3.3. Các bước tạo Pull Request trên GitHub

1. Truy cập repository Góc Desk trên GitHub.
2. Chọn tab **Pull requests**.
3. Nhấn **New pull request**.
4. Chọn Base và Compare theo quy định tại Mục 3.2.
5. Kiểm tra danh sách Commit và các file trong mục **Files changed**.
6. Nhập tiêu đề và mô tả những nội dung đã thực hiện.
7. Nhấn **Create pull request** để gửi yêu cầu kiểm tra.

Tiêu đề Pull Request nên ngắn gọn, thể hiện rõ chức năng được thực hiện.

Ví dụ:

- `[Frontend] Hoàn thiện giao diện trang chủ`
- `[Frontend] Xây dựng chức năng giỏ hàng`
- `[Backend] Thiết kế cơ sở dữ liệu MySQL`
- `[Backend] Xây dựng API quản lý sản phẩm`

## 3.4. Nội dung mô tả Pull Request

Thành viên cần mô tả rõ kết quả công việc để người kiểm tra có thể hiểu được những thay đổi đã thực hiện.

Mẫu mô tả:

**1. Công việc đã thực hiện**
- Liệt kê các chức năng hoặc nội dung đã hoàn thành.

**2. Các file đã chỉnh sửa**
- Nêu những file quan trọng đã thêm hoặc thay đổi.

**3. Kết quả kiểm tra**
- Nêu chức năng đã được kiểm tra như thế nào.
- Ghi rõ các lỗi còn tồn tại nếu có.

**4. Sử dụng AI**
- Xác nhận đã cập nhật AI_USAGE_LOG.md.
- Nếu không sử dụng AI, ghi rõ không sử dụng AI trong phần việc này.

## 3.5. Kiểm tra và Merge Pull Request

Sau khi gửi Pull Request:

- Trưởng nhóm hoặc người được phân công sẽ kiểm tra nội dung thay đổi.
- Nếu có lỗi, thành viên cần chỉnh sửa trên chính branch đã gửi Pull Request.
- Sau khi chỉnh sửa, tiếp tục Commit và Push. Pull Request sẽ tự động cập nhật.
- Khi thay đổi đáp ứng yêu cầu, người có trách nhiệm mới tiến hành Merge.

Không tự ý Merge khi chưa được đồng ý.

Sau khi Merge thành công, thành viên cần cập nhật mã nguồn từ branch đích trước khi bắt đầu nhiệm vụ tiếp theo.

---

# 4. QUY ĐỊNH KHAI BÁO VIỆC SỬ DỤNG AI

## 4.1. Nguyên tắc chung

Trong quá trình thực hiện dự án, thành viên có thể sử dụng các công cụ AI để hỗ trợ nghiên cứu, lập trình, phân tích, thiết kế, sửa lỗi, kiểm thử hoặc hoàn thiện tài liệu.

Tuy nhiên, mọi trường hợp sử dụng AI có đóng góp vào phần việc của mình đều phải được khai báo trong file:

[docs/AI_USAGE_LOG.md](https://github.com/KieuOanh2006/goc-desk-ecommerce-project/blob/feature/backend-database/docs/AI_USAGE_LOG.md)

Việc khai báo nhằm đảm bảo tính minh bạch trong quá trình thực hiện đồ án và ghi nhận đúng mức độ hỗ trợ của công cụ AI.

Thành viên cần tuân thủ:

- Khai báo đúng công cụ AI đã sử dụng.
- Ghi rõ họ tên đầy đủ, phần việc được phân công và mục đích sử dụng AI.
- Mô tả cụ thể AI đã hỗ trợ nội dung nào.
- Không khai báo chung chung như "dùng AI hỗ trợ code".
- Không ghi nhận nội dung do AI đề xuất là kết quả tự thực hiện hoàn toàn.
- Thành viên phải tự đọc, hiểu, kiểm tra và chịu trách nhiệm với phần nội dung hoặc mã nguồn được sử dụng.
- Không xóa hoặc sửa thông tin khai báo của thành viên khác.

## 4.2. Những nội dung bắt buộc khi khai báo

Mỗi thành viên phải cung cấp các thông tin sau:

1. Họ và tên đầy đủ: Ghi chính xác họ tên của thành viên.
2. Phần việc phụ trách: Ghi rõ chức năng hoặc nhiệm vụ được phân công.
3. Branch thực hiện: Ghi tên branch đã sử dụng.
4. Công cụ AI: Ghi tên công cụ như ChatGPT, Gemini, GitHub Copilot, Claude, Codex hoặc công cụ khác.
5. Mục đích sử dụng: Nêu rõ AI được sử dụng để làm gì.
6. Nội dung AI hỗ trợ: Mô tả cụ thể công việc đã yêu cầu AI thực hiện.
7. Kết quả áp dụng: Nêu phần nào đã được sử dụng, chỉnh sửa hoặc tham khảo.
8. Kiểm tra và xác minh: Nêu cách thành viên kiểm tra kết quả trước khi đưa vào dự án.

## 4.3. Mẫu khai báo sử dụng AI

Thành viên bổ sung nội dung theo mẫu sau vào cuối file AI_USAGE_LOG.md:

### [HỌ VÀ TÊN THÀNH VIÊN] – [PHẦN VIỆC PHỤ TRÁCH]

- **Họ và tên:** [Ghi đầy đủ họ tên]
- **Phần việc phụ trách:** [Tên chức năng hoặc nhiệm vụ]
- **Branch:** [Tên branch]
- **Công cụ AI sử dụng:** [Tên công cụ AI]
- **Mục đích sử dụng:** [Nêu mục đích]
- **Nội dung AI hỗ trợ:**
  - [Nội dung hỗ trợ thứ nhất]
  - [Nội dung hỗ trợ thứ hai]
- **Kết quả áp dụng:** [Nêu nội dung đã sử dụng, điều chỉnh hoặc tham khảo]
- **Kiểm tra và xác minh:** [Mô tả cách kiểm tra, chạy thử hoặc đối chiếu kết quả]

## 4.4. Ví dụ khai báo

### NGUYỄN VĂN A – CHỨC NĂNG QUẢN LÝ SẢN PHẨM

- **Họ và tên:** Nguyễn Văn A
- **Phần việc phụ trách:** Xây dựng API quản lý sản phẩm.
- **Branch:** `feature/backend-products`
- **Công cụ AI sử dụng:** ChatGPT.
- **Mục đích sử dụng:** Hỗ trợ tìm hiểu cấu trúc Backend sử dụng Node.js và Express.js.
- **Nội dung AI hỗ trợ:**
  - Giải thích cách tổ chức Routes, Controllers và Models.
  - Gợi ý cấu trúc API lấy danh sách và chi tiết sản phẩm.
  - Hỗ trợ phân tích và sửa lỗi trong quá trình truy vấn MySQL.
- **Kết quả áp dụng:** Tham khảo cấu trúc xử lý API, điều chỉnh mã nguồn theo cấu trúc dự án.
- **Kiểm tra và xác minh:** Tự kiểm tra API bằng dữ liệu thử nghiệm và đối chiếu kết quả trả về với yêu cầu chức năng.

Lưu ý: Đây chỉ là ví dụ minh họa cách khai báo, mỗi thành viên phải ghi đúng công việc và công cụ thực tế mình đã sử dụng.

## 4.5. Trường hợp không sử dụng AI

Nếu thành viên không sử dụng bất kỳ công cụ AI nào trong phần việc được phân công, cần khai báo rõ:

- **Họ và tên:** [Họ tên đầy đủ]
- **Phần việc phụ trách:** [Tên phần việc]
- **Công cụ AI sử dụng:** Không sử dụng.
- **Mô tả:** Phần việc được thực hiện thủ công, không sử dụng công cụ AI hỗ trợ.

## 4.6. Lưu ý khi nhiều thành viên cùng cập nhật AI_USAGE_LOG.md

Vì nhiều thành viên có thể bổ sung nội dung vào cùng một file trên các branch khác nhau, cần tuân thủ:

- Chỉ bổ sung phần khai báo của bản thân vào cuối file.
- Không xóa nội dung cũ hoặc ghi đè toàn bộ file.
- Không chỉnh sửa phần khai báo của thành viên khác nếu chưa được thống nhất.
- Trước khi gửi Pull Request, kiểm tra lại file để đảm bảo nội dung khai báo của mình vẫn còn đầy đủ.
- Nếu phát sinh xung đột khi hợp nhất file, cần phối hợp với trưởng nhóm để giữ lại đầy đủ nội dung của tất cả thành viên.

---

# 5. QUY ĐỊNH KHI SỬ DỤNG CHATGPT VÀ CÁC CÔNG CỤ AI

Khi sử dụng ChatGPT hoặc công cụ AI khác để hỗ trợ dự án, thành viên cần cung cấp tài liệu quy định chung và thông tin liên quan đến phần việc của mình trước khi yêu cầu AI thực hiện.

Yêu cầu AI phải:

- Đọc và tuân thủ quy định làm việc của dự án.
- Hiểu đúng công nghệ và cấu trúc mã nguồn hiện tại.
- Chỉ hỗ trợ trong phạm vi nhiệm vụ được phân công.
- Không tự ý thay đổi kiến trúc, công nghệ hoặc chức năng ngoài phạm vi.
- Không tự ý tạo thêm file hoặc thư mục khi chưa được yêu cầu.
- Không đưa ra kết luận rằng chức năng đã hoàn thành hoặc chạy tốt nếu chưa được kiểm tra thực tế.
- Giải thích những thay đổi quan trọng để thành viên hiểu và có thể tự chỉnh sửa.
- Không tạo hoặc tiết lộ mật khẩu, API key, thông tin tài khoản và dữ liệu bí mật của dự án.

Thành viên không được sao chép toàn bộ kết quả từ AI mà không đọc, hiểu và kiểm tra.

Mọi mã nguồn, nội dung và kết quả sử dụng AI đều thuộc trách nhiệm kiểm tra của thành viên thực hiện.

---

# 6. CHECKLIST TRƯỚC KHI NỘP PHẦN VIỆC

Trước khi gửi Pull Request, mỗi thành viên phải tự kiểm tra các nội dung sau:

- [ ] Đã làm việc đúng branch được phân công.
- [ ] Đã cập nhật mã nguồn từ branch đích khi cần thiết.
- [ ] Đã hoàn thành đúng phạm vi công việc được giao.
- [ ] Đã kiểm tra chức năng và các thành phần liên quan.
- [ ] Đã Commit và Push đầy đủ mã nguồn lên GitHub.
- [ ] Đã cập nhật AI_USAGE_LOG.md nếu có sử dụng AI.
- [ ] Đã tạo Pull Request đúng Base và Compare.
- [ ] Đã kiểm tra danh sách file thay đổi trong Pull Request.
- [ ] Đã mô tả rõ công việc và kết quả thực hiện.
- [ ] Đã chờ người phụ trách kiểm tra và đồng ý Merge.

---

# 7. TỔNG KẾT QUY TRÌNH LÀM VIỆC

Quy trình phối hợp chung của dự án Góc Desk:

1. Nhận nhiệm vụ và xác định branch được phân công.
2. Cập nhật mã nguồn từ branch đích.
3. Thực hiện chức năng trên branch riêng.
4. Kiểm tra và hoàn thiện phần việc.
5. Commit và Push mã nguồn lên GitHub.
6. Cập nhật khai báo sử dụng AI vào AI_USAGE_LOG.md.
7. Tạo Pull Request đúng Base và Compare.
8. Chờ trưởng nhóm kiểm tra, phản hồi và Merge.
9. Cập nhật mã nguồn mới nhất trước khi tiếp tục nhiệm vụ tiếp theo.

**Quy định chung:** Mỗi thành viên chịu trách nhiệm về chất lượng phần việc được phân công, tính minh bạch trong quá trình sử dụng AI và việc tuân thủ quy trình quản lý mã nguồn của nhóm.

