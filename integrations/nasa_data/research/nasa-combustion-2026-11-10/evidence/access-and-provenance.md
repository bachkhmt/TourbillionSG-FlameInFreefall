# Ghi chú truy cập và provenance

Ngày nghiên cứu: 2026-11-10. Phân biệt quan sát HTTP trực tiếp, nội dung tài liệu và đề xuất kỹ thuật.

## A1. PSI website và endpoint quan sát được

Nguồn: [PSI repository](https://psi.nasa.gov/physci/repo/) và JavaScript công khai mà chính trang tải: `main.21055b7de96cb7f9.js`.

- HTML trả HTTP 200 nhưng không chứa investigation text có thể đọc trực tiếp. Không diễn giải kết quả đó thành catalog rỗng.
- Đọc bundle để nhận diện request của website, rồi gọi đúng chức năng public retrieval; không đăng nhập hay gửi submission.
- Metadata GET ví dụ: [PSI-69 JSON](https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-69). Đã xác minh cho 18 accession trong catalog snapshot.
- Discovery GET: `https://psi.nasa.gov/geode-py/ws/repo/search?term=combustion&source=psi&type=investigation&size=100`. Response có `hits.total` và `hits.hits[].['_source']`; bản ghi rút gọn tại discovery-snapshot.json.
- File manifest: POST `/geode-py/ws/files/v2`, body ví dụ `{"folder":"PSI-69/","fileType":"study","studyId":"PSI-69","version":5,"obfuscationcode":""}`. Đây là thao tác đọc danh sách, không tạo/sửa investigation. Request bodies và response hashes của 6 bộ ở manifest-summaries.json.
- Download GET `/geode-py/ws/studies/PSI-69/download` với `file`, `version`, `redirect=false`; với file ID có thể thêm `studyVersion`. Response chứa URL để lấy file. Không lưu URL có chữ ký vào artifact registry.
- Tải experimental CSV bằng `file_name`; TXT/DOCX theo file ID lấy từ manifest. Đã so kích thước tải với kích thước metadata, giữ hash và byte gốc.

**Giới hạn:** endpoint thực tế hoạt động không đồng nghĩa NASA công bố API contract, SLA, rate limit hay compatibility guarantee cho PSI. Chưa tìm thấy tài liệu chính thức xác nhận những điều này. Cần cô lập adapter và hỗ trợ manual import khi thiết kế implementation.

## A2. PSI guide

Nguồn: [Complete PSI Database Guide](https://assets.science.nasa.gov/content/dam/science/bps/bps-general/bps-data_osdr_psi/Complete_PSI_Database_Guide.pdf), 11 trang, đã đọc phần text extraction:

- Trang PDF 2: accession/DOI và citation.
- Trang 4: Experiment Table liên quan samples/runs, có bản tải xuống.
- Trang 6: files theo nhóm; raw/analyzed có thể tách Earth/reduced gravity.
- Trang 7-9: workflow tải lớn, chia phần, link có thời hạn.
- Trang 11: version history có ngày thay đổi và thêm/bớt file.

Không suy ra mọi experiment table có cùng granularity. Kiểm tra CSV cho thấy một số bảng chỉ tóm tắt theo ngày hoặc dải điều kiện.

## A3. NTRS cho RAG

Nguồn: [Harvesting Data](https://www.sti.nasa.gov/harvesting-data-from-ntrs/) và [OpenAPI documentation 2022-11-22](https://www.sti.nasa.gov/docs/20221122_OpenAPI_Documentation.pdf), PDF trang 2-5.

- NASA khuyến nghị OpenAPI; có search, citation metadata và download endpoints.
- Tài liệu mô tả truy cập public không cần authentication, giới hạn 500 requests/15 phút và 10.000 records/query; đây là con số của tài liệu đã đọc, cần xác minh lại khi triển khai.
- Yêu cầu theo dõi redistributions ít nhất hàng tuần và đồng bộ khi record không còn khả dụng. Trích dẫn ưu tiên landing citation URL.
- Đã gọi metadata GET của 4 records, rồi lấy đường `downloads[].links.fulltext` do server trả. Không tự tạo tên file TXT.
- Fulltext 20240008602 có markup HTML dù đường dẫn kết thúc bằng `.txt`; cần nhận diện nội dung thay vì chỉ extension.

Bốn record: [20150023456](https://ntrs.nasa.gov/citations/20150023456), [20210011385](https://ntrs.nasa.gov/citations/20210011385), [20240008602](https://ntrs.nasa.gov/citations/20240008602), [20220005205](https://ntrs.nasa.gov/citations/20220005205). Metadata về rights và fulltext hashes ở sources.json. Chỉ đọc mục liên quan, không tuyên bố review hoàn chỉnh các công trình.

## A4. AWS và quyền truy cập

[AWS registry](https://registry.opendata.aws/nasa-psi/) cho phép anonymous S3 listing. [Root listing](https://nasa-psi.s3.us-west-2.amazonaws.com/?list-type=2&delimiter=/&max-keys=100) trả `IsTruncated=false`, các prefix `DSI/`, `OASIS/`, `pk4/` và `index.html`. Chỉ kết luận không có combustion prefix ở root được kiểm tra, không kết luận toàn bộ NASA thiếu combustion trên AWS.

Submission portal login dành cho upload không chứng minh public dataset download cần login. Trong các request nghiên cứu này, metadata/manifests và 28 artifact đều lấy được không đăng nhập. Chưa kiểm tra mọi file và không vượt qua restricted access.

## A5. Phạm vi discovery và thiếu coverage

Discovery keyword `combustion` trả 26 hits; 24 có Research Area = Combustion Science, gồm 19 Microgravity và 5 Ground Investigations. Không phải census toàn bộ PSI. Các Ground Investigation có thể chứa simulation/reanalysis, không phải flight observations mới.

Search `Saffire` trả PSI-98/99/100. Search `SoFIE` chỉ trả PSI-25 có nhắc SoFIE trong mô tả. Đây là kết quả truy vấn đã quan sát, không phải bằng chứng không tồn tại dataset ở nơi khác. [NASA SoFIE](https://science.nasa.gov/mission/sofie/) và [NASA mô tả các investigations](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/solid-fuel-ignition-and-extinction-sofie/) dùng để discovery; chưa xác minh raw package SoFIE.

## A6. Trạng thái lưu bằng chứng

- Giữ 28 file gốc nhỏ, tổng 339.134 byte, dưới samples/; mỗi file có SHA-256 và URL lấy lại trong artifacts.json.
- Metadata JSON lớn và full manifests chỉ lưu tạm khi nghiên cứu; file dài nhất của metadata được đọc đầy đủ khoảng 8,1 MB. Bản lưu trong repo là projection và summary, không phải bản sao đầy đủ của responses.
- Hai lần đọc metadata CFI/s-Flame đầu tiên bị cắt bởi giới hạn 3 MB do script đặt; đã lấy lại thành công với giới hạn cao hơn. Không coi response bị cắt là dataset hỏng.
- Fulltext NTRS và DOCX XML extraction được dùng đọc nội dung; không thay thế visual QA bảng/hình. Không tải hai PDF FLEX/BASS-II lớn sau khi web reader báo quá giới hạn.
- Không gửi email yêu cầu download lớn, không tải archives lớn, không nạp DB và không chạy backend tests trong nghiên cứu này.
