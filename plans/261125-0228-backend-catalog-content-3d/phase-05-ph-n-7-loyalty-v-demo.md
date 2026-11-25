---
phase: 5
title: Phần 7 Loyalty và demo
status: completed
effort: ''
---

# Phase 5: Phần 7 Loyalty và demo

## Overview

Rà soát module Loyalty và chốt bàn giao với đơn hàng; tích hợp kiểm thử/demo toàn phạm vi. Không sửa quy tắc Loyalty trong task này.

## Implementation Steps

## Requirements

- Đối chiếu schema, truy vấn, quyền member và transaction đổi điểm với yêu cầu; lỗi phải kèm tái hiện.
- Ghi điểm nối cộng khi đơn hoàn tất, hoàn điểm khi hủy và chống phát sinh ledger lặp để owner module xác nhận.
- Không sửa schema hay Loyalty model/service ngoài phạm vi đã duyệt.
- Trước commit, gửi demo, diff, lệnh/kết quả test, lỗi còn lại và file dự kiến stage; dừng chờ xác nhận.

## Related Code Files

- Rà soát `backend/src/modules/loyalty/` và `database/schema.sql`.
- Cập nhật `backend/API_CONVENTIONS.md`, `backend/README.md` và `docs/AI_USAGE_LOG.md` theo thực tế.
- Bổ sung/cập nhật test tích hợp module tại `backend/test/`.

## Implementation Steps

1. Reproduce Loyalty query/schema mismatch bằng đọc-only SQL test hoặc model test phù hợp; ghi rõ cần owner sửa.
2. Rà soát redeem transaction, insufficient balance, rollback và kiểm tra quyền.
3. Chạy toàn bộ test; phân loại DB test theo khả năng kết nối, chạy static/syntax kiểm tra các module.
4. Chuẩn bị bộ request/response demo, dữ liệu demo thực, hướng dẫn kiểm thử, diff và danh sách file.
5. Chờ người dùng xem demo và xác nhận riêng trước lệnh commit; leader review/merge sau.

## Success Criteria

- [ ] Loyalty mismatch `membership_tiers.description` được báo cáo, không tự sửa.
- [ ] Test mới đạt; baseline failure và DB limitations được phân biệt rõ.
- [ ] Tài liệu API/demo được cập nhật và xác minh.
- [ ] Demo được người dùng kiểm tra trước khi xin xác nhận commit.
- [ ] Không có lệnh commit/push trước khi nhận xác nhận rõ ràng.

## Kết quả rà soát và kiểm thử (25/11/2026)

- Loyalty chưa bị sửa. `loyalty.model.js` chọn `membership_tiers.description` ở `getOverview` và `listTiers`, nhưng `database/schema.sql` không có cột này; cần Loyalty owner/Backend Lead chốt dùng `benefits` hay bổ sung cột qua quy trình schema riêng.
- Đổi điểm đang khóa member và reward trong transaction, kiểm tra số dư từ ledger, ghi redemption/debit và cập nhật cache cùng transaction; nhánh thiếu điểm rollback. Chưa có hàm cộng điểm đơn hoàn tất/hoàn điểm đơn hủy trong module này. `point_transactions.order_id` không có ràng buộc duy nhất chống phát sinh lặp; owner đơn hàng cần xác nhận quy tắc idempotency khi tích hợp.
- `node --test test/studio-assets.test.js test/content.test.js test/catalog.test.js`: 30/30 đạt sau khi bổ sung kiểm tra transaction, cập nhật đồng thời, public projection và rollback.
- `npm.cmd test`: 78/79 đạt. Lỗi duy nhất là `test/app.integration.test.js` nhận `503` thay vì `200` từ health DB; đây là lỗi baseline do chưa có cấu hình kết nối MySQL ở `backend/.env`, không phải lỗi phát sinh từ module mới.
- `node --check` các module thay đổi, `require('./src/routes')` và `git diff --check` đạt. Chưa chạy kiểm thử live MySQL hoặc xác nhận fixture phòng/sản phẩm 3D vì database chưa được cấu hình; không thêm seed giả.
- Demo trong phản hồi bàn giao là contract-level, gồm đọc sản phẩm có biến thể/giá/tồn kho và PUT bố trí phòng có rollback khi vượt bounds. Cần người dùng xem demo; commit vẫn chờ xác nhận riêng.

### Cập nhật kết nối MySQL local

- Người dùng đã điền mật khẩu vào `.env`; đăng nhập MySQL thành công. Chẩn đoán tiếp theo xác nhận `ER_BAD_DB_ERROR` (1049) vì database `goc_desk` chưa tồn tại.
- Chỉ sau khi xác nhận database chưa tồn tại, đã chạy nguyên bản `database/schema.sql` để tạo database local gồm 40 bảng. Không sửa schema và không thêm seed.
- `node --test test/app.integration.test.js`: 1/1 đạt; `/api/health/db` trả 200. `npm.cmd test`: 79/79 đạt, exit code 0. Các kết quả này thay thế giới hạn kết nối DB ghi ở lần chạy trước; CRUD với dữ liệu thật/fixture 3D vẫn chưa được xác minh.
- `.env` được Git ignore và không được track. Chưa commit/push.

### Kiểm thử API thật trên máy local

- Đã chạy `backend/scripts/test-local-backend.js`: 39/39 tình huống đạt với HTTP Express, MySQL và cookie đăng nhập thật; không inject service/model giả. Dùng fixture tạm cho CRUD, ẩn/xuất bản, bảo vệ tham chiếu, bounds phòng và giá/tồn kho biến thể. Fixture được dọn; ba tài khoản test được giữ lại.
- Lượt đầu phát hiện product-model query chọn `created_at/updated_at` không tồn tại trong `product_3d_models`. Đã bỏ projection đó; furniture/model hỗ trợ sort `id` thay cho `createdAt`, phòng vẫn hỗ trợ `createdAt`. Không thay schema.
- Lượt chạy lại phát hiện Auth dùng ID phiên thay vì `user_id` để tạo user identity, gây lỗi khóa ngoại tác giả khi ID phiên khác ID người dùng. Đã sửa ánh xạ `getActiveSession` và thêm regression test `auth-session-identity.test.js`. Test live so sánh ID `/auth/login` và `/auth/me` trên cả ba vai trò.
- Lượt cuối: `npm.cmd test` đạt 80/80, test live đạt 39/39, cleanup thành công. Báo cáo: [HTML](./reports/local-backend-live-results.html), [JSON](./reports/local-backend-live-results.json).
- Lỗi Loyalty `ER_BAD_FIELD_ERROR` được tái hiện trực tiếp qua model với MySQL, ghi riêng trong báo cáo; không gộp vào 39 tình huống chức năng đã đạt. Chưa xác minh frontend tích hợp, tải GLB, đủ 8–10 sản phẩm 3D hay mọi tình huống đồng thời/lỗi hạ tầng.
