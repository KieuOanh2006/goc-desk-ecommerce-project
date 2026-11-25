---
phase: 4
title: Phần 6 Dữ liệu 3D
status: completed
effort: ''
---

# Phase 4: Phần 6 Dữ liệu 3D

## Overview

Thêm API đọc/ghi phòng mẫu, nội thất nền, vị trí nội thất và metadata mô hình sản phẩm dùng schema hiện có, làm dữ liệu đầu vào cho frontend 3D.

## Implementation Steps

## Requirements

- Kích thước dùng mét, rotation dùng radian; giá/stock/variant lấy từ catalog DB.
- Renderer key phải thuộc renderer hiện có; GLB cần URL HTTPS hoặc đường dẫn asset hợp lệ.
- PUT bố trí phòng là thay toàn bộ trong một transaction; asset trùng hoặc lỗi giữa chừng phải rollback.
- Không thêm saved setups, frontend scene engine hoặc fake model/size.

## Related Code Files

- Tạo `backend/src/modules/studio-assets/` gồm routes, controllers, services, models, schemas.
- Sửa `backend/src/routes/index.js`, `backend/API_CONVENTIONS.md`, `backend/README.md`.
- Tạo `backend/test/studio-assets.test.js`.

## Implementation Steps

1. Viết test renderer, dimensions/ranges, duplicate/missing/inactive relations, rollback và product variants availability.
2. Viết model cho `room_templates`, `furniture_assets`, `room_template_furniture`, `product_3d_models`.
3. Viết service transaction cho thay thế placement và validate renderer/product links.
4. Viết controller/routes: public only active resources, admin CRUD, authorization/trusted origin.
5. Kiểm tra sản phẩm thực có mô hình/kích thước; nếu database hiện chưa có fixture, không tự thêm seed giả.
6. Chạy test/hồi quy và trình demo đọc, cập nhật, rollback, ẩn và kiểm tra sold-out.

## Success Criteria

- [ ] API công khai lọc active record và biến thể; ID trả dạng chuỗi.
- [ ] Transaction placement rollback được khi một item không hợp lệ.
- [ ] Không tuyên bố đạt 8–10 mẫu cho đến khi fixture thật đã được xác minh.
- [ ] Demo và test report gửi trước khi kết thúc phase.
