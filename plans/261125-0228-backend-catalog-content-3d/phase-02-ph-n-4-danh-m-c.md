---
phase: 2
title: Phần 4 Danh mục
status: completed
effort: ''
---

# Phase 2: Phần 4 Danh mục

## Overview

Thêm API công khai và quản trị cho categories, brands, use_cases; chuyển POST category cũ sang module MVC mới mà vẫn giữ URL/input/ID/error contract.

## Implementation Steps

## Requirements

- Bảo vệ thao tác quản trị bằng session, role admin/product_content_staff và trusted origin khi ghi.
- Chặn xóa các bản ghi đang được tham chiếu; trạng thái hidden category/brand không làm thay đổi API sản phẩm cũ.
- API danh sách theo q/page/limit/sort whitelist; BIGINT ID trả dạng chuỗi.

## Related Code Files

- Tạo module `backend/src/modules/catalog/` (routes, controllers, services, models, schemas).
- Sửa `backend/src/routes/index.js`; bỏ router POST danh mục cũ sau khi giữ hợp đồng.
- Tạo `backend/test/catalog.test.js`; cập nhật `backend/API_CONVENTIONS.md`.

## Implementation Steps

1. Viết test schema/service/route cho CRUD, duplicate slug, 404/409, pagination, roles, trusted origin và compatibility POST category.
2. Viết model tham số hóa cho ba bảng và kiểm tra tham chiếu khi xóa trong transaction.
3. Viết service xử lý nghiệp vụ/DB error mapping, controller envelope và route validation.
4. Mount route admin mới trước router `/admin` của staff; xóa POST router cũ khi API cũ được giữ.
5. Chạy test catalog và hồi quy API sản phẩm; trình demo CRUD + trường hợp 409 cho người dùng.

## Success Criteria

- [ ] Tests danh mục đạt; test cần DB được đánh dấu rõ nếu không kết nối được.
- [ ] Public chỉ trả category/brand active; use-case được lọc/tìm kiếm đúng.
- [ ] Admin và content staff ghi được; guest/member/order staff bị từ chối.
- [ ] POST category cũ giữ status, ID và mã xung đột.
- [ ] Demo và test report được gửi trước khi chuyển sang chốt phần.
