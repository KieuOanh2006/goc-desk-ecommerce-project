---
title: 'Backend phần 4–7: Danh mục nội dung và dữ liệu 3D'
description: >-
  Triển khai API backend phần danh mục, nội dung và dữ liệu 3D với test/demo sau
  mỗi phần; rà soát Loyalty.
status: completed
priority: P2
branch: feature/backend-product-content
tags: []
blockedBy: []
blocks: []
created: '2026-11-24T19:37:02.912Z'
createdBy: 'ck:plan'
source: skill
---

# Backend phần 4–7: Danh mục nội dung và dữ liệu 3D

## Overview

Thực hiện phần 4–6 trên `feature/backend-product-content` theo Routes → Controller → Service → Model, CommonJS, Zod `req.validated`, response/error envelope hiện hành và MySQL schema có sẵn. Phần 7 chỉ rà soát Loyalty và bàn giao lỗi/điểm nối. Mỗi module có kiểm thử riêng và demo để người dùng xem trước khi chốt; tuyệt đối chờ xác nhận riêng trước mọi commit.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Đồng bộ và kiểm thử nền](./phase-01-ng-b-v-ki-m-th-n-n.md) | Completed |
| 2 | [Phần 4 Danh mục](./phase-02-ph-n-4-danh-m-c.md) | Completed |
| 3 | [Phần 5 Nội dung](./phase-03-ph-n-5-n-i-dung.md) | Completed |
| 4 | [Phần 6 Dữ liệu 3D](./phase-04-ph-n-6-d-li-u-3d.md) | Completed |
| 5 | [Phần 7 Loyalty và demo](./phase-05-ph-n-7-loyalty-v-demo.md) | Completed |

## Dependencies

Không đổi schema hoặc thêm dependency. Đã cấu hình kết nối local bằng `backend/.env` và khởi tạo database `goc_desk` trước đó chưa tồn tại bằng nguyên bản `database/schema.sql` (40 bảng). Lần chạy `npm.cmd test` mới nhất đạt 80/80. Test HTTP với MySQL thật đạt 39/39 tình huống, fixture tạm đã dọn; xem [báo cáo](./reports/local-backend-live-results.html). Đã sửa lỗi projection timestamp của product models và lỗi Auth ánh xạ nhầm ID phiên thành ID người dùng phát hiện khi test thật. Loyalty còn truy vấn cột `membership_tiers.description` không tồn tại; giữ ngoài phạm vi sửa. Chưa xác minh frontend tích hợp hoặc đủ fixture 8–10 sản phẩm 3D. Chờ người dùng xem demo và xác nhận riêng trước commit.
