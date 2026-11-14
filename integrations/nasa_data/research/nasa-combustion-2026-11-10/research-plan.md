# Kế hoạch nghiên cứu dữ liệu NASA combustion

Ngày: 2026-11-10. Phạm vi: nghiên cứu nguồn và đặc điểm đầu vào cho backend FlameGuard AI; không sửa ứng dụng, ERD, migrations, README hay frontend.

## Câu hỏi và tiêu chí hoàn thành

1. Xác minh các cổng dữ liệu chính thức, yêu cầu truy cập và cách lấy dữ liệu; phân biệt metadata, bài báo, dữ liệu gốc và nội dung truyền thông.
2. Lập bản đồ các họ thí nghiệm combustion tiêu biểu (droplet, gaseous flames, solid fuels và large-scale spacecraft fires), ưu tiên nguồn NASA và công bố gốc.
3. Kiểm tra trực tiếp một số artifact/manifest để mô tả format, granularity, đơn vị, provenance và giới hạn; không suy ra file tồn tại chỉ từ trang giới thiệu.
4. Đề xuất pipeline ingestion/RAG phù hợp với 21 entities hiện tại; ghi rõ khoảng trống cần quyết định, không tự thay đổi hợp đồng.
5. Lưu báo cáo tiếng Việt và evidence notes có URL/locator, tách quan sát đã xác minh khỏi suy luận/khuyến nghị.

## Cách nghiên cứu

- Tìm và mở nguồn primary: NASA PSI/OSDR, NASA experiment pages, NASA NTRS, publications/datasets của tác giả.
- Ưu tiên đọc metadata và tài liệu hướng dẫn trước; chỉ tải mẫu nhỏ khi cần, không tải toàn bộ video/archive lớn.
- Tìm phản chứng: login/data request, dữ liệu thiếu conditions, cấu trúc khác nhau giữa campaigns, nguồn review không phải raw data, giới hạn provenance/uncertainty.
- Không gọi NASA discovery endpoint chưa xác minh như một API contract ổn định; ghi rõ ngày kiểm tra và hạn chế môi trường.

## Đầu ra và kiểm tra

- `report.md`: tổng hợp, ma trận dữ liệu, mapping và đề xuất thứ tự triển khai.
- `evidence/`: ghi chú nguồn và mẫu manifest/metadata nhỏ đã kiểm tra khi phù hợp.
- `sources.json`: nguồn đã đọc và phân loại khả năng truy cập.
- Rà lại mỗi khẳng định quan trọng với nguồn, kiểm tra link/citation trong tài liệu và Git diff. Không tuyên bố kiểm thử backend hay kiểm chứng khoa học ngoài phạm vi nghiên cứu.
