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

## Ví dụ lỗi

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

## 10. Catalog API

Public read endpoints:

| Method | Endpoint | Ghi chú |
| --- | --- | --- |
| GET | `/api/categories` | Chỉ trả category `active`; hỗ trợ `q`, `page`, `limit`, `sort` |
| GET | `/api/categories/:id` | ID là chuỗi BIGINT; category hidden trả `404` |
| GET | `/api/brands` | Chỉ trả brand `active` |
| GET | `/api/brands/:id` | Brand hidden trả `404` |
| GET | `/api/use-cases` | Use-case không có cột trạng thái trong schema |
| GET | `/api/use-cases/:id` | Truy vấn theo ID |

Admin và `product_content_staff` được đọc/quản lý catalog tại các đường dẫn tương ứng dưới `/api/admin`: `GET/POST /categories`, `GET/PATCH/DELETE /categories/:id`, và cùng bộ thao tác cho `/brands` và `/use-cases`. Mọi request ghi phải có Origin/Referer tin cậy.

Danh sách dùng `q`, `page` (mặc định 1), `limit` (mặc định 20, tối đa 100) và sort whitelist. Category/brand hỗ trợ sort `name` hoặc `createdAt`, use-case chỉ hỗ trợ `name`; admin có thể lọc trạng thái category/brand. Category image nhận HTTPS hoặc đường dẫn asset `images/`/`Videos/` có sẵn.

Xóa category, brand hoặc use-case đang được sản phẩm hay category con tham chiếu trả `409 CATALOG_RESOURCE_IN_USE`. Trùng slug lần lượt trả `CATEGORY_SLUG_EXISTS`, `BRAND_SLUG_EXISTS` hoặc `USE_CASE_SLUG_EXISTS`. Ẩn category/brand chỉ ảnh hưởng API catalog; API sản phẩm hiện tại vẫn lọc theo trạng thái sản phẩm.

## 11. Content API

| Method | Endpoint | Ghi chú |
| --- | --- | --- |
| GET | `/api/article-categories` | Danh sách chủ đề |
| GET | `/api/article-categories/:id` | Chi tiết chủ đề theo ID |
| GET | `/api/articles` | Chỉ bài/video đã xuất bản; lọc theo `categoryId`, `contentType` |
| GET | `/api/articles/:slug` | Chi tiết đã xuất bản theo slug |
| GET | `/api/contents` | Chỉ nội dung website đã xuất bản; lọc theo `contentKey`, `contentType` |
| GET | `/api/contents/:contentKey` | Tra cứu theo khóa vị trí duy nhất |

Admin và `product_content_staff` có CRUD cho `article-categories`, `articles` và `contents` tại `/api/admin`. Tác giả bài viết và người cập nhật website content lấy từ session; không nhận các ID này từ body. Trạng thái mặc định là `draft`; nội dung cần gỡ chuyển sang `hidden`.

`contentType` của bài viết là `article` hoặc `video`; của website content là `banner`, `video`, `policy` hoặc `faq`. Bài `article`/policy/FAQ cần body text để xuất bản; video/banner cần `mediaUrl`. Body là văn bản thuần; client phải hiển thị bằng text API. Media chỉ nhận HTTPS hoặc đường dẫn asset dưới `images/` hay `Videos/`; API không tải file lên và không hỗ trợ rich HTML. Bản ghi draft/hidden không được trả qua public list/detail route.

Slug bài viết và khóa nội dung trùng trả `409`; xóa chủ đề đang được bài viết tham chiếu trả `409 CONTENT_RESOURCE_IN_USE`. `published_at` do server đặt khi xuất bản; bài chỉ công khai khi ngày xuất bản đã đến. Public projection không trả ID nhân viên tạo bài hoặc cập nhật nội dung website.

## 12. Studio 3D API

Public endpoints:

| Method | Endpoint | Ghi chú |
| --- | --- | --- |
| GET | `/api/studio/rooms` | Chỉ phòng mẫu đang bật, kèm bố trí nội thất bật và hợp lệ |
| GET | `/api/studio/rooms/:id` | Phòng ẩn hoặc không tồn tại trả `404` |
| GET | `/api/studio/furniture-assets` | Chỉ nội thất bật; renderer procedural chỉ nhận khóa renderer hiện có |
| GET | `/api/studio/product-models` | Mô hình đang bật của sản phẩm/danh mục đang hoạt động, kèm biến thể đang bán |
| GET | `/api/studio/product-models/:id` | Chi tiết mô hình và các biến thể còn hoạt động |

Admin quản lý tại `/api/admin/studio`: CRUD `/rooms`, `/furniture-assets`, `/product-models`; thay toàn bộ bố trí nội thất bằng `PUT /rooms/:id/furniture`. Tất cả yêu cầu quản trị cần session role `admin`; mọi thao tác ghi cần Origin/Referer tin cậy.

Danh sách phòng sắp xếp theo `name` hoặc `createdAt`; furniture theo `name` hoặc `id`; product model theo `productName` hoặc `id`, với hậu tố `:asc`/`:desc`. Hai bảng furniture/model không có cột ngày tạo trong schema, nên API không trả hoặc sắp xếp theo ngày tạo cho hai loại này.

`roomConfig` theo cùng cấu trúc renderer hiện tại: `room` chứa `minX`, `maxX`, `minZ`, `maxZ`; `backWindow`, `balcony` là boolean; `cameraPresets` có `room`, `desk`, `top`, mỗi góc gồm `label`, `theta`, `phi`, `radius`, `target: {x,y,z}`. Kích thước và tọa độ dùng mét; `rotation` dùng radian. Bố trí furniture chỉ được lưu nếu asset tồn tại, đang bật và toàn bộ kích thước xoay vẫn nằm trong bounds phòng. `PUT` là thay thế toàn bộ danh sách, chạy một transaction; dữ liệu cũ được khôi phục nếu một asset không hợp lệ hoặc insert thất bại. ID luôn serialize thành chuỗi.

Đổi `roomConfig` phải giữ các vị trí furniture hiện có trong bounds. Khi asset đang được phòng mẫu hoặc saved setup tham chiếu, không cho đổi kích thước, renderer, loại nội thất hoặc trạng thái; cần gỡ tham chiếu rồi cập nhật để tránh scene cũ bị sai.

Renderer procedural chỉ nhận nội thất `desk`, `cabinet`, `bed`, `chair`, `rug`, `plant` và nhóm sản phẩm `keyboard`, `mouse`, `lamp`, `stand`, `pad`, `organize`. Product model procedural phải khớp slug danh mục. GLB cần URL HTTPS không chứa user/password hoặc đường dẫn `/models/*.glb`; metadata GLB chưa được trang 3D hiện tại tải vì frontend chưa có GLB loader hay API adapter.

Product model công khai chỉ kèm biến thể `active`; mỗi biến thể trả ID, SKU, màu, giá hiện tại/giá sale, `effectivePrice`, `stockQuantity`, `available` và ảnh. `available` chỉ phản ánh tồn kho lúc đọc. Giỏ hàng/checkout vẫn phải gửi `variantId` và kiểm tra lại trạng thái, tồn kho và giá từ database; không dùng giá của scene làm nguồn quyết định.

Schema hiện không có fixture xác minh số phòng mẫu hoặc 8–10 sản phẩm 3D. Không thêm dữ liệu mẫu giả và không xem API metadata là bằng chứng frontend 3D đã tích hợp.
