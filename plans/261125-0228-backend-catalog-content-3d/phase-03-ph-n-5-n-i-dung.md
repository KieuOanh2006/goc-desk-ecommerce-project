---
phase: 3
title: Phần 5 Nội dung
status: completed
effort: ''
---

# Phase 3: Phần 5 Nội dung

## Overview

Thêm API quản lý chủ đề bài viết, bài viết/video và website contents cho banner/video/policy/FAQ; văn bản thường, đường dẫn tài nguyên có sẵn/HTTPS, không upload.

## Implementation Steps

## Requirements

- Trạng thái draft/published/hidden; public list và detail đều lọc nội dung đã xuất bản, không lộ nội dung ẩn/nháp.
- Tác giả/người sửa lấy từ session; chủ đề đang dùng không xóa được.
- Nội dung văn bản được phục vụ như text; client phải render bằng text API, không diễn giải HTML.

## Related Code Files

- Tạo `backend/src/modules/content/` gồm routes, controllers, services, models, schemas.
- Sửa `backend/src/routes/index.js`, `backend/API_CONVENTIONS.md`, `backend/README.md`.
- Tạo `backend/test/content.test.js`.

## Implementation Steps

1. Viết test trạng thái xuất bản/ẩn, detail lookup, slug/contentKey conflict, category reference, pagination, media URL, role/origin.
2. Viết model cho `article_categories`, `articles`, `website_contents` với filter/pagination parameterized.
3. Viết service kiểm tra tham chiếu/chuyển trạng thái và thời điểm publish do server ghi; controller/route tuân thủ envelope/Zod.
4. Mount admin routers trước staff router; cập nhật hợp đồng API/tài liệu chạy thử.
5. Chạy test content và hồi quy; demo draft → published → hidden cho bài và website content.

## Success Criteria

- [ ] Danh sách và chi tiết public không lộ draft/hidden.
- [ ] Không nhận author/editor từ client; slug/contentKey duy nhất được xử lý an toàn.
- [ ] Validation, pagination và phân quyền được test.
- [ ] Demo và kết quả test được gửi trước khi chuyển task.
