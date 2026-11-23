# Quy ước API Backend Góc Desk

Tài liệu này áp dụng cho cả bốn thành viên Backend. Dùng CommonJS và Express hiện có; không tự đổi cấu trúc database hoặc quy tắc nghiệp vụ khi chưa được Backend Lead duyệt.

## 1. URL và HTTP method

- Prefix hiện tại là `/api`; giữ nguyên các URL hiện có như `/api/health` và `/api/health/db`.
- Dùng danh từ số nhiều, chữ thường, kebab-case cho resource: `/products`, `/saved-setups`.
- Dùng HTTP method theo thao tác: `GET` đọc, `POST` tạo/thực hiện thao tác, `PUT` thay toàn bộ, `PATCH` cập nhật một phần, `DELETE` xóa.
- Không mã hóa động từ nghiệp vụ vào URL nếu method đã thể hiện thao tác. Dùng route con cho hành động đặc biệt khi cần, ví dụ `POST /orders/:orderId/cancel`.
- Dùng `:id` cho khóa định danh trong path; luôn kiểm tra định dạng và quyền truy cập ở Backend.
- API hiện chưa thêm version segment. Trước khi công bố hợp đồng ổn định, nhóm cần thống nhất versioning; nếu cần version, áp dụng nhất quán `/api/v1` và không âm thầm phá hợp đồng đang dùng.

## 2. Truyền dữ liệu

- **Params**: định danh tài nguyên trong path, ví dụ `/products/:productId`.
- **Query**: tìm kiếm, lọc, sắp xếp và phân trang; không dùng query để gửi dữ liệu bí mật.
- **Body**: dữ liệu tạo/cập nhật qua JSON với `Content-Type: application/json`.
- Không tin `user_id`, giá, tồn kho, quyền, tổng tiền hoặc trạng thái thanh toán do Client tự gửi. Backend lấy danh tính từ phiên đã xác thực và tự xác minh dữ liệu nghiệp vụ.
- Tất cả dữ liệu đầu vào phải được kiểm tra ở Backend. Dùng middleware validation ở mục 6 và chỉ đọc dữ liệu đã kiểm tra từ `req.validated`.

## 3. Tìm kiếm, lọc, sắp xếp và phân trang

- Tên query thống nhất: `q` tìm kiếm; filter dùng tên trường rõ nghĩa, ví dụ `categoryId`, `minPrice`, `maxPrice`.
- Chỉ hỗ trợ các filter và trường sort đã cho phép trong từng module. Không nối trực tiếp giá trị `sort` từ request vào SQL.
- Sắp xếp theo dạng `sort=field:asc` hoặc `sort=field:desc`; mặc định và danh sách trường hợp lệ do module ghi rõ.
- Phân trang theo `page` và `limit`: `page` bắt đầu từ `1`, mặc định `1`; `limit` mặc định `20`, tối đa `100`. Giá trị sai trả `422`.
- Response có phân trang đặt thông tin trong `meta`, gồm `page`, `limit`, `totalItems`, `totalPages`.

Ví dụ: `GET /api/products?q=desk&categoryId=3&page=1&limit=20&sort=price:asc`.

## 4. Response thống nhất

Mọi response JSON thành công có `success`, `message`, `data`. Chỉ thêm `meta` khi có phân trang hoặc metadata liên quan.

```json
{
  "success": true,
  "message": "Lấy danh sách sản phẩm thành công.",
  "data": [{ "id": 12, "name": "Đèn bàn" }],
  "meta": { "page": 1, "limit": 20, "totalItems": 1, "totalPages": 1 }
}
```

Response thành công không phân trang:

```json
{
  "success": true,
  "message": "Backend đang hoạt động.",
  "data": { "status": "ok", "timestamp": "2026-11-22T06:29:24.950Z" }
}
```

Mọi response lỗi có `success: false`, `message` và `error.code`. Chỉ trả `error.details` khi cần chỉ rõ lỗi validation. Không trả stack trace, câu SQL, thông tin kết nối, giá trị nhạy cảm hoặc nội dung lỗi nội bộ.

```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ.",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      { "path": "body.email", "code": "invalid_format", "message": "Email không hợp lệ." }
    ]
  }
}
```

## 5. HTTP status và mã lỗi

| HTTP | Dùng khi | Mã lỗi ví dụ |
| --- | --- | --- |
| `200` | Đọc hoặc cập nhật thành công | — |
| `201` | Tạo tài nguyên thành công | — |
| `400` | JSON/cú pháp request không hợp lệ | `INVALID_JSON`, `BAD_REQUEST` |
| `401` | Chưa xác thực | `UNAUTHENTICATED` |
| `403` | Đã xác thực nhưng không có quyền | `FORBIDDEN` |
| `404` | Endpoint hoặc tài nguyên không tồn tại | `ROUTE_NOT_FOUND`, `RESOURCE_NOT_FOUND` |
| `409` | Xung đột trạng thái hoặc dữ liệu | `CONFLICT` |
| `422` | Dữ liệu đúng cú pháp nhưng không qua validation | `VALIDATION_ERROR` |
| `500` | Lỗi bất ngờ phía Backend | `INTERNAL_SERVER_ERROR` |
| `503` | Dịch vụ phụ thuộc tạm thời không khả dụng | `DATABASE_UNAVAILABLE` |

`error.code` là mã ổn định để Client xử lý; `message` dành cho người đọc. Không đổi ý nghĩa mã đã được dùng nếu chưa phối hợp các thành viên.

## 6. Validation bằng Zod

Tạo schema riêng cạnh module sở hữu dữ liệu; chưa dùng schema của module này để thay thế validation nghiệp vụ do thành viên khác quản lý. Middleware chung chỉ nhận schema cho `body`, `params`, `query`.

```js
const { z } = require('zod');
const validate = require('../../middlewares/validate');

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get('/', validate({ query: querySchema }), controller.list);
```

Trong controller, dữ liệu đã parse/validate nằm ở `req.validated.query`, `req.validated.params` hoặc `req.validated.body`. Nếu schema biến đổi dữ liệu (ví dụ `z.coerce` hoặc `.default()`), hãy dùng giá trị trong `req.validated`, không dùng lại giá trị thô trong `req.query`/`req.body`.

Validation thất bại trả `422 VALIDATION_ERROR`; `details` gồm đường dẫn trường, mã Zod và mô tả lỗi, không gồm giá trị người dùng gửi. JSON sai cú pháp bị parser trả `400 INVALID_JSON`.

## 7. Routes, controllers, services, models và middleware

- `src/routes/index.js`: đăng ký routes cấp API; mỗi module gắn router của mình dưới prefix phù hợp.
- `src/modules/<module>/<module>.routes.js`: khai báo method/path và ghép middleware validation/xác thực/controller.
- Controller: nhận request, lấy `req.validated`, gọi service và trả response theo envelope chung; không viết SQL hoặc nghiệp vụ phức tạp.
- Service: xử lý nghiệp vụ, kiểm tra ràng buộc và phối hợp model; không phụ thuộc trực tiếp vào HTTP response.
- Model: truy vấn database bằng tham số hóa; không nối input Client vào SQL.
- Middleware dùng chung đặt tại `src/middlewares/`; middleware đặc thù module để trong module nếu chỉ module đó sử dụng.
- Routes/controllers/services/models dùng CommonJS (`require`, `module.exports`) và tên file kebab-case.
- Khi có lỗi dự kiến, chuyển lỗi sang error handler chung bằng `next(error)` hoặc `throw` trong async route. Dùng `createApiError(status, code, message, details)` cho lỗi nghiệp vụ đã được kiểm soát; không gửi lỗi thô của driver/database cho Client.

Thứ tự middleware cấp ứng dụng: CORS → JSON parser → routes → not-found handler → error handler. Error handler phải đứng cuối để nhận lỗi từ parser, routes và middleware.

## 8. Xác thực và phân quyền

Các vai trò đã thống nhất trong Backend: `member`, `admin`, `product_content_staff`, `order_support_staff`. Không tự thêm hoặc đổi tên role khi chưa được Backend Lead duyệt. `guest` không có tài khoản trong bảng `users`; không biểu diễn Guest thành role lưu trong bảng đó.

Backend lấy danh tính và role từ phiên/token đã xác thực. Không tin `user_id` hoặc role gửi trong body/query. Kiểm tra quyền ở API cho mọi thao tác dữ liệu riêng tư hoặc quản trị; chỉ trả dữ liệu người dùng được phép truy cập.

## 9. Git và Pull Request

| Branch | Người/phạm vi |
| --- | --- |
| `main` | Phiên bản ổn định |
| `feature/backend-auth-core` | Kiều Oanh — tài khoản, xác thực, Loyalty |
| `feature/backend-product-content` | Huyền Nhi — sản phẩm và nội dung |
| `feature/backend-order-cart` | Bảo Ngọc — giỏ hàng, đơn hàng, CSKH |
| `feature/backend-recommendation-3d` | Huy Hoàng — gợi ý và 3D |

- Cập nhật `main` từ `origin/main` và tạo feature branch từ `main` nếu cần nhánh mới. Thành viên phát triển và kiểm thử trên branch được phân công.
- Tạo Pull Request từ feature branch vào `main` và ghi kết quả kiểm thử trong PR. Kiều Oanh review và duyệt trước khi merge. Không tự merge PR của mình.
- Mọi thay đổi vào `main` phải qua Pull Request đã được duyệt.
- Không commit `.env`, `node_modules/`, mật khẩu, token, API key hoặc dữ liệu nhạy cảm.
- Không tự thay đổi Branch Rulesets trên GitHub.

Ví dụ tạo nhánh chức năng mới

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/backend-ten-chuc-nang
```

## 10. Ví dụ lỗi

Endpoint không tồn tại (`404`):

```json
{
  "success": false,
  "message": "Không tìm thấy endpoint.",
  "error": { "code": "ROUTE_NOT_FOUND" }
}
```

Lỗi bất ngờ (`500`):

```json
{
  "success": false,
  "message": "Đã xảy ra lỗi máy chủ.",
  "error": { "code": "INTERNAL_SERVER_ERROR" }
}
```

Backend chỉ log status và mã lỗi an toàn; không log request body, thông tin xác thực, SQL hoặc thông báo thô từ database/driver.
