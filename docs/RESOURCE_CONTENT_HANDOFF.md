# Bàn giao phần nội dung resource còn thiếu — 2026-11-14

Backend đã có chỗ lưu nguồn cấp challenge và importer/admission cho phương án A.
Việc còn lại ở đây là bổ sung/kiểm tra nội dung nguồn; không phải sửa schema thêm.
Đây là checklist để user giao việc, chưa gửi thông điệp hoặc tự gán task cho team.

| Nguồn | Hiện trạng | Chủ trì | Bàn giao cần có |
| --- | --- | --- | --- |
| Apollo 1 | Chỉ metadata/link; tải từ máy hiện tại lỗi | Data | Bytes nguồn chính thức tải thành công, URL gốc/final, hash, ngày tải, quyền sử dụng, text và locator |
| Apollo 13 | Chỉ metadata/link; tải lỗi | Data | Tương tự Apollo 1; không bỏ xác minh TLS hoặc tự thay bằng bài không thuộc nguồn được duyệt |
| ScienceCasts video | Lưu link/page; chưa có transcript xác minh | Data, AI phối hợp kiểm tra | Transcript có nguồn và quyền rõ, đối chiếu video, locator theo mốc thời gian; giữ chỗ chưa nghe rõ |
| Researcher's Guide | Đã có landing article; chưa có nội dung PDF đầy đủ | Data | PDF gốc/hash/phiên bản, quyền sử dụng, text theo trang; tách các phần hình ảnh/nguồn bên thứ ba nếu chưa được phép |

PSI search là link khám phá dữ liệu, không phải tài liệu cần ép thành chunk. Các file
thí nghiệm PSI đã được xử lý riêng. Sáu resource đang index gồm NASA Combustion Science,
Guide landing article, Mir và ba bài Spinoff. Bốn entry chưa index là PSI search,
video và hai trang Apollo; Guide đã index một phần nhưng chưa phải toàn bộ PDF.

## Điều kiện nhận bàn giao

- Giữ raw bytes độc lập, original/stored SHA256, URL, phiên bản/ngày tải và original units.
- Text/chunk có locator kiểm chứng được: HTML section/paragraph, PDF page hoặc video timestamp.
- Quyền sử dụng khai báo riêng từng nguồn; không tự đổi unknown thành CC0.
- Không ghi đè bản đã công bố. Tạo release revision mới và cập nhật raw/manifest/registry.
- Nguồn lỗi/chưa rõ quyền/chưa xác minh tiếp tục có status thật và không tự tạo nội dung.
- Data cung cấp bundle và báo cáo nguồn; Backend chạy kiểm tra/import trên target được
  duyệt; AI thực hiện chất lượng retrieval/citation/abstention thuộc mục3. PR2/FE xử lý mục4.

Adapter hiện tại chỉ xử lý narration của HTML article. Khi bổ sung PDF/transcript,
Data cần bàn giao parser/chunks tương ứng; Backend rà mapping và rights policy theo
bằng chứng mới rồi mới import. Schema A lưu được các nguồn này, nhưng không tự làm
cho PDF/video đọc được hoặc được phép index. Không gán nhãn article/CC0 để vượt gate.

Việc có source row hoặc kiểm tra kỹ thuật pass không phải thẩm định khoa học.
