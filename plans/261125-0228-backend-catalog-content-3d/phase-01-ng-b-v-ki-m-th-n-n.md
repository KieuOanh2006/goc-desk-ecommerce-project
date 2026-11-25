---
phase: 1
title: Đồng bộ và kiểm thử nền
status: completed
effort: ''
---

# Phase 1: Đồng bộ và kiểm thử nền

## Overview

Đồng bộ nhánh được giao với `origin/main`, cài dependencies theo lockfile và ghi nhận kiểm thử nền. Tuyệt đối không commit merge hoặc feature trong giai đoạn này.

## Implementation Steps

1. Xác nhận nhánh `feature/backend-product-content`, working tree và remote refs; không stash/reset/clean.
2. Fast-forward `main`, lấy nhánh feature đang có và ghép `origin/main` mà chưa commit.
3. Kiểm tra Node.js 26.13.1, MySQL Server 8.0.46 và cài `npm.cmd ci`; giữ nguyên `.env` nếu đã có, không đưa bí mật vào output.
4. Chạy `npm.cmd test` trước khi sửa tính năng, ghi rõ lỗi do MySQL/cấu hình.
5. Đọc README, quy ước API, yêu cầu F01/F08/F10, schema và các module đang có.

## Success Criteria

- [x] Nhánh chính đã fast-forward và nhánh feature được đồng bộ; merge `origin/main` chưa commit.
- [x] `npm.cmd ci` hoàn thành; Node.js là 26.13.1.
- [x] Baseline test đã chạy và kết quả được lưu: 48/49; test còn lại cần DB.
- [x] MySQL Server đúng 8.0.46; kết nối root không mật khẩu bị từ chối, chưa có `.env`.
