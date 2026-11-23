# BACKEND – DEVELOPMENT GUIDELINES

## 1. Công nghệ và công cụ sử dụng

| Công cụ | Mục đích |
|---|---|
| Node.js | Môi trường chạy Backend |
| Express.js | Xây dựng máy chủ và REST API |
| MySQL 8 | Quản lý cơ sở dữ liệu |
| mysql2 | Kết nối và truy vấn MySQL |
| npm | Cài đặt và quản lý thư viện |
| Visual Studio Code | Viết và chỉnh sửa mã nguồn |
| MySQL Workbench | Quản lý và kiểm tra database |
| Postman | Kiểm thử API |
| Git & GitHub | Quản lý mã nguồn, branch và Pull Request |

**Kiến trúc:** MVC kết hợp Service.

**Quy ước code:** JavaScript sử dụng CommonJS (`require`, `module.exports`).

Quy ước API, response, validation, xử lý lỗi và Git dùng chung được ghi tại
[API_CONVENTIONS.md](API_CONVENTIONS.md). Thành viên cần theo tài liệu này khi
xây dựng hoặc tích hợp endpoint mới.

### Chạy Backend trên máy cá nhân

Tạo `backend/.env` từ mẫu bên dưới và điền cấu hình MySQL của máy bạn. Điền
các biến SMTP khi cần gửi email xác minh. `CLIENT_ORIGIN` phải khớp địa chỉ
Frontend đang chạy. Giữ thông tin đăng nhập trong `.env` trên máy cá nhân.

```dotenv
NODE_ENV=development
PORT=3000
CLIENT_ORIGIN=http://127.0.0.1:5500

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=goc_desk
DB_USER=root
DB_PASSWORD=
DB_CONNECTION_LIMIT=10

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=
```

Để chạy thử qua mạng LAN, đặt `HOST=0.0.0.0` và cập nhật `CLIENT_ORIGIN` theo
địa chỉ Frontend truy cập từ thiết bị thử nghiệm. Sau khi cấu hình, chạy từ
thư mục gốc của dự án.

```bash
cd backend
npm ci
npm run dev
```

### Hosting cho bản demo

Demo trên máy cá nhân hoặc trong cùng mạng LAN có thể dùng Frontend, Backend
và MySQL đang chạy trên máy nhóm. Nếu cần gửi link cho người ngoài mạng,
triển khai website qua HTTPS. Trình duyệt tải Frontend và gọi `/api` để
Backend đọc hoặc ghi dữ liệu vào MySQL.

Phương án đề xuất cho Góc Desk là dùng một địa chỉ HTTPS cho Frontend và
`/api` để phù hợp với cookie đăng nhập hiện tại. Có thể cấu hình Express phục
vụ các file Frontend từ một thư mục công khai riêng. Nếu triển khai Frontend
và Backend thành hai dịch vụ, có thể cấu hình proxy chuyển `/api` đến Backend.
Khi triển khai, cấu hình Frontend gọi API qua địa chỉ công khai, đặt
`CLIENT_ORIGIN` bằng địa chỉ website và khai báo các biến `DB_*` trong phần
cấu hình môi trường của dịch vụ Backend.

Có thể thử chạy Express và MySQL trên Railway Free bằng tên miền do Railway
cấp. Gói Free có hạn mức tài nguyên và dịch vụ có thể ngủ khi rảnh.
[Railway Free Plan](https://docs.railway.com/pricing/free-plan)

Luồng email xác minh hiện dùng Gmail SMTP. Railway chỉ cho phép gửi qua SMTP
từ gói Pro. Nếu cần demo đăng ký và xác minh email trực tuyến trên gói thấp
hơn, nhóm cần chuyển chức năng gửi mail sang dịch vụ hỗ trợ API HTTPS hoặc
chọn nơi chạy Backend có hỗ trợ SMTP.
[Railway Outbound Networking](https://docs.railway.com/networking/outbound-networking)

## 2. Phân công nhiệm vụ

| Thành viên | Vai trò | Phạm vi phụ trách |
|---|---|---|
| **Kiều Oanh** | Backend Lead | Cấu trúc Backend, cấu hình môi trường, kết nối MySQL, quy ước API, xác thực, phân quyền, tài khoản, địa chỉ, khôi phục mật khẩu và Loyalty |
| **Huyền Nhi** | Product & Content Backend | Sản phẩm, danh mục, thương hiệu, tìm kiếm, lọc, biến thể, tồn kho, hình ảnh, bài viết, video, banner, chính sách, FAQ và dữ liệu phòng mẫu/nội thất |
| **Bảo Ngọc** | Order & Customer Service Backend | Giỏ hàng Member, gộp giỏ Guest, checkout, đơn hàng, thanh toán, voucher, đánh giá và yêu cầu hỗ trợ |
| **Huy Hoàng** | Recommendation & 3D Backend | Lịch sử xem, gợi ý sản phẩm, lưu và quản lý thiết kế phòng 3D; phối hợp triển khai góc chat trực tiếp với nhân viên CSKH |

### Nguyên tắc phân công

- Mỗi thành viên chịu trách nhiệm chính đối với các module được giao.
- Không tự ý chỉnh sửa cấu hình chung hoặc module do thành viên khác phụ trách khi chưa trao đổi.
- Các nghiệp vụ có liên quan phải phối hợp với người phụ trách module tương ứng.
- Kiều Oanh quản lý cấu trúc chung, thống nhất quy ước kỹ thuật, review và duyệt Pull Request.

## 3. Quy định về cơ sở dữ liệu

- Sử dụng `database/schema.sql` làm cơ sở thiết kế database chung.
- Không tự ý thêm, xóa hoặc đổi tên bảng, cột, khóa chính và khóa ngoại khi chưa thống nhất.
- Mọi thay đổi schema phải được trao đổi với Kiều Oanh trước khi thực hiện.
- Kiểm tra mối quan hệ giữa các bảng trước khi viết truy vấn.
- Sử dụng truy vấn có tham số khi làm việc với MySQL.
- Các thao tác quan trọng như tạo đơn hàng, thanh toán, sử dụng voucher và cộng/trừ điểm cần đảm bảo tính nhất quán dữ liệu.

### Auth Core

Auth API dùng các bảng `users`, `auth_sessions` và `email_verification_tokens` đã có trong
`database/schema.sql`; không tự chạy lại schema hoặc migration trên database đang có dữ liệu.

Các endpoint hiện có trong module Auth:

| Method | Endpoint | Mục đích |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký Member đang chờ xác minh email |
| POST | `/api/auth/verify-email` | Xác minh token một lần và đăng nhập Member |
| POST | `/api/auth/verify-email/resend` | Gửi lại email xác minh với response chống dò email |
| POST | `/api/auth/login` | Đăng nhập bằng email hoặc số di động Việt Nam; tạo session theo thiết bị |
| POST | `/api/auth/logout` | Thu hồi session hiện tại |
| GET | `/api/auth/me` | Lấy thông tin an toàn của tài khoản hiện tại |
| GET | `/api/auth/sessions` | Liệt kê session đang hoạt động của chính tài khoản |
| DELETE | `/api/auth/sessions/:sessionId` | Thu hồi một session thuộc chính tài khoản |
| POST | `/api/auth/sessions/logout-others` | Thu hồi các session khác |
| POST | `/api/auth/sessions/logout-all` | Thu hồi mọi session |

Session ID ngẫu nhiên nằm trong cookie HttpOnly; Database chỉ lưu SHA-256 hash.
Mọi request có cookie xác thực phải kiểm tra lại role và trạng thái tài khoản từ Database.
`CLIENT_ORIGIN` hỗ trợ danh sách origin phân cách bằng dấu phẩy; yêu cầu thay đổi dữ liệu
Auth phải có Origin/Referer khớp danh sách này để chống CSRF.
Client trình duyệt cần gửi cookie bằng `credentials: 'include'`. Gửi lại xác minh bị giới
hạn tối đa 5 yêu cầu mỗi IP mỗi giờ trong một tiến trình và tối đa 3 token mỗi user mỗi giờ
(có thể gồm token đăng ký mới tạo trong cùng giờ).

Số điện thoại di động Việt Nam được chuẩn hóa và lưu theo E.164 (`+84` và 9 chữ số thuê bao).
Đăng nhập và kiểm tra trùng sử dụng cùng quy tắc chuẩn hóa.

Email xác minh cần cấu hình `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`,
`SMTP_PASSWORD` và `MAIL_FROM`. Với Gmail, dùng App Password 16 ký tự; service loại bỏ
khoảng trắng phân nhóm trước khi xác thực. `EMAIL_VERIFICATION_URL` là tùy chọn; mặc định
link dùng `CLIENT_ORIGIN/account.html`.
Khi SMTP chưa cấu hình hoặc gửi lỗi, API trả lỗi dịch vụ an toàn, không trả token.
Email URL chỉ đưa token một lần; Frontend cần tích hợp gọi `/api/auth/verify-email` sau
khi người dùng mở URL.

Chạy kiểm thử Backend bằng `npm test` trong thư mục `backend`.
Kiểm tra kết nối Gmail và gửi email thử đến tài khoản `SMTP_USER` bằng `npm run email:test`.

### Các quy tắc nghiệp vụ cần tuân thủ

1. Guest lưu giỏ hàng và thiết kế 3D bằng `localStorage`; Member lưu dữ liệu tương ứng trong MySQL.
2. Backend lấy `user_id` từ phiên đăng nhập đã xác thực, không tin tưởng `user_id` do Frontend tự gửi.
3. Khi đăng nhập, gộp giỏ Guest vào Member theo `variant_id`; chỉ xóa giỏ localStorage sau khi lưu thành công.
4. Số lượng sản phẩm trong giỏ giới hạn từ 1 đến 99.
5. Khi tạo đơn, Backend phải xác minh giá, tồn kho, địa chỉ, phí vận chuyển và voucher.
6. Thông tin sản phẩm, SKU, màu sắc và đơn giá tại thời điểm đặt hàng phải được lưu vào snapshot của đơn hàng.
7. Xác minh callback thanh toán trước khi cập nhật trạng thái đơn hàng; tránh xử lý trùng callback.
8. Lịch sử điểm thưởng phải được ghi nhận trong `point_transactions`. Nghiệp vụ cộng/trừ/hoàn điểm cần phối hợp giữa Kiều Oanh và Bảo Ngọc.
9. Hai sản phẩm cùng biến thể trong thiết kế 3D phải được lưu thành hai vật thể riêng biệt, có vị trí và góc xoay độc lập.

## 4. Quy định về cấu trúc và code

- Tuân thủ cấu trúc thư mục Backend đã thống nhất.
- Mỗi chức năng được tổ chức theo module riêng.
- Áp dụng MVC kết hợp Service: Routes, Controller, Service và Model.
- Không viết truy vấn SQL trực tiếp trong Routes hoặc Controller.
- Không xử lý nghiệp vụ phức tạp trực tiếp trong Controller.
- Đặt tên file, biến, hàm và API rõ ràng, thống nhất.
- Kiểm tra và validate dữ liệu đầu vào trước khi xử lý.
- Xử lý lỗi có kiểm soát, không trả thông tin nhạy cảm ra Frontend.
- Không đưa mật khẩu, khóa bí mật hoặc file `.env` lên GitHub.
- Không commit `node_modules/`.
- Khi thêm thư viện mới, phải trao đổi và cập nhật `package.json`, `package-lock.json`.

## 5. Quy định Git và GitHub

### 5.1. Branch sử dụng

| Branch | Mục đích |
|---|---|
| `main` | Phiên bản chính thức, ổn định |
| `feature/backend-auth-core` | Backend tài khoản, xác thực và Loyalty |
| `feature/backend-product-content` | Backend sản phẩm và nội dung |
| `feature/backend-order-cart` | Backend giỏ hàng, đơn hàng và CSKH |
| `feature/backend-recommendation-3d` | Backend Recommendation và thiết kế 3D |

### 5.2. Quy trình làm việc

**Bước 1 – Đồng bộ mã nguồn**

Trước khi bắt đầu công việc, cập nhật `main` từ `origin/main`. Nếu cần tạo
nhánh chức năng mới, tạo nhánh từ `main` đã cập nhật.

**Bước 2 – Code trên branch cá nhân**

Mỗi thành viên phát triển và kiểm thử chức năng trên branch được phân công.

**Bước 3 – Commit và Push**

Sau khi hoàn thành một phần chức năng:

```bash
git add .
git commit -m "feat: mô tả chức năng đã thực hiện"
git push origin ten-branch-cua-ban
```

**Bước 4 – Tạo Pull Request**

Truy cập GitHub → Pull requests → New pull request.

Chọn:

- Base: `main`.
- Compare: branch chức năng của thành viên.

Pull Request cần mô tả chức năng đã làm, file đã thay đổi và kết quả kiểm thử.

**Bước 5 – Review và Merge**

- Kiều Oanh kiểm tra mã nguồn, nghiệp vụ và khả năng tích hợp.
- Nếu có lỗi, thành viên phụ trách phải chỉnh sửa và Push lại trên branch của mình.
- Chỉ Merge khi Pull Request đã được Kiều Oanh duyệt.
- Không tự ý Merge Pull Request của chính mình.

**Quy định bắt buộc.** Mọi thay đổi vào `main` phải qua Pull Request đã được duyệt.

## 6. Tích hợp và kiểm thử

### P2 – Tích hợp Backend với Frontend

Cả 4 thành viên phối hợp:

- Kết nối API với các trang Frontend hiện có.
- Kiểm tra dữ liệu gửi từ Frontend và phản hồi từ Backend.
- Kiểm tra luồng Guest và Member.
- Kiểm tra quyền truy cập theo từng vai trò.
- Đảm bảo các module hoạt động thống nhất.

### P3 – Kiểm thử và bàn giao

- Kiểm thử chức năng theo yêu cầu CN01–CN25.
- Kiểm tra các trường hợp dữ liệu hợp lệ và không hợp lệ.
- Kiểm tra giỏ hàng, voucher, tồn kho, thanh toán và điểm thưởng.
- Kiểm tra callback trùng, thanh toán thất bại và thao tác không đủ quyền.
- Kiểm tra khả năng lưu và khôi phục thiết kế 3D.
- Sửa lỗi và cập nhật tài liệu trước khi bàn giao.

## 7. Các lưu ý cần thống nhất trước khi triển khai

1. `users.role` trong schema hiện dùng `VARCHAR(30)` với các role `member`, `admin`, `product_content_staff` và `order_support_staff`; Backend phải kiểm tra quyền theo role ở máy chủ.
2. `product_views` hiện chỉ lưu lịch sử xem của Member; chưa hỗ trợ lưu lịch sử xem Guest trong MySQL.
3. `setup_furniture` hiện chưa hỗ trợ nhiều bản sao của cùng một món nội thất trong một thiết kế.
4. Góc chat trực tiếp với nhân viên CSKH là yêu cầu bổ sung. Schema hiện tại chưa có bảng hội thoại và tin nhắn; cần thống nhất cách lưu trữ và triển khai trước khi làm chức năng này.
5. Không tự ý tạo thêm bảng hoặc thay đổi nghiệp vụ khi chưa trao đổi với Backend Lead.

---

**Người phụ trách quản lý và duyệt Backend: Kiều Oanh**
