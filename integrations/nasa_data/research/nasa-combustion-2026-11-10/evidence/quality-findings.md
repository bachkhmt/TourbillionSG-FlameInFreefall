# Phát hiện chất lượng có locator

Các CSV dưới samples/ giữ nguyên bytes. “Dòng CSV” bên dưới tính header là dòng 1; các file được nêu không có multiline quoted records ảnh hưởng những locator này. Artifact URLs, file version và hash ở [artifacts.json](artifacts.json).

## Q1. FLEX: cùng run, giá trị khác nhau

Nguồn: PSI-69 v5, `PSI-69_Experimental table_FLEX.csv`, dòng 8/test 7/CIR `20CAL13`; `PSI-69_Raw Data_FLEX-007_TestSheet.txt`, mục TEST PARAMETERS / TEST CONDITIONS.

| Trường | CSV | Test sheet |
| --- | --- | --- |
| Initial diameter | 1.87 mm | 1.82 mm |
| Burning-rate value | 0.67, header không đủ đơn vị | 0.68 mm2/s |

Test date/time và CIR key xác nhận hai record cùng test. Chưa xác minh lý do khác nhau hoặc nguồn nào ưu tiên. Khuyến nghị: giữ cả hai, liên kết locators, mở issue; không lấy trung bình.

## Q2. FLEX: đơn vị và độ bao phủ

CSV header ghi `Burning rate; mm`; test sheet ghi `kavg (mm2/s)`. [NTRS 20150023456](https://ntrs.nasa.gov/citations/20150023456), Appendix A.1 và A.2/Table IX, giải thích burning-rate constant từ fit đường kính bình phương theo thời gian, đơn vị mm2/s.

Bảng CSV tải về có 274 data rows, trong khi abstract báo cáo nói 284 tests. Chưa giải thích discrepancy và không tuyên bố CSV đại diện toàn bộ test trong báo cáo. Web UI từng hiển thị tổng 275, nên không dùng UI row count làm số run.

## Q3. FLEX: time series và missingness

Nguồn: `PSI-69_Raw Data_FLEX-007_DropletData.txt` và `PSI-69_Raw Data_FLEX-007_LLUVData.txt`, header và các hàng đầu.

- Phân cách tab, line endings có carriage return.
- Thời gian âm có trong nguồn; không tự bỏ hay clamp thành zero.
- Vị trí hoặc flame-standoff có ô trống; không nội suy khi chưa có chính sách.
- Channel time/axis khác nhau. Không mặc định dữ liệu camera đồng bộ từng hàng.

Các quan sát không xác nhận frame rate/uncertainty cho toàn dataset. Time origin phải kiểm tra theo phương pháp từng run; không suy ra epoch timestamps từ time-series offset.

## Q4. BASS-II: cần README để hiểu số đo

Nguồn: PSI-25 v4, `PSI-25_Science Documents_BASS-II_ReadMe.docx`; các đoạn dưới Test Matrix explanation / Columns in test matrix.

- Cùng sample có thể dùng nhiều runs; suffix `a/b` phân biệt lần thử.
- Ngày video lệch ngày thực một ngày do phần mềm không xử lý leap year đúng; GMT là day-of-year.
- Fan display là điện áp nhân 10 hoặc có thể là pot setting; không phải airflow.
- Air display đo cm/s nhưng đáp ứng chậm khoảng một phút.
- Radiometer gain chưa calibrated tuyệt đối; có thể dùng cho mức tương đối theo hướng dẫn, không đổi thẳng thành physical heat flux.
- O2 sensor được hiệu chỉnh offset theo MCA trong ngày.
- `OR` có nghĩa trên 1000 ppm, không phải số chính xác hoặc null thông thường.

Đây là quy tắc riêng của bộ dữ liệu được hướng dẫn, không áp cho sensor khác chỉ vì trùng tên cột.

## Q5. BASS-II: anomaly và trạng thái định tính

Nguồn: `PSI-25_Experimental table_BASS-II.csv`:

- Dòng 52, test O4: air display có text về giảm flow đến extinction, final CO là `OR`.
- Dòng 62, test O12: air display mô tả không ignition ở các flow đã thử.
- Dòng 129, T28b: final O2 = `40.4`; initial CO2 và CO là `none`.
- Dòng 130, T29: fan/air display chứa nhiều mức; initial CO = `-1`.

[NTRS 20210011385](https://ntrs.nasa.gov/citations/20210011385), Appendix B/test T28b trong fulltext, cũng chứa `40.4`. Xác nhận số xuất hiện ở hai biểu diễn không xác nhận nó đúng về mặt đo lường. Không sửa hoặc xóa dựa riêng trên trực giác/range UI.

## Q6. Summary rows không phải run

- PSI-68 FLEX-2, 8 dòng: fuel/mixed-fuel và ranges/sets của diameter/O2/pressure/flow; không có ID từng ignition.
- PSI-20 BRE: ngày thử + `Flames Ignited`, có note pressure thay đổi nhưng không liệt kê trong summary.
- PSI-21 CLD: `Test Day`, MFC maxima, fuel-concentration range và số flames; MFC maximum không phải flow thực của mọi run.
- PSI-22 E-FIELD: các dòng 4/7 và nhiều dòng cuối chỉ tiếp diễn fuel concentration, không có test-day. Không tự forward-fill rồi tạo run mới.

Khuyến nghị: phân cấp staging và dùng raw logs/test sheets để phục hồi run; không đưa summary vào `TestRun` nhằm lấp dữ liệu.

## Q7. Saffire: notes, images và units

Nguồn: PSI-99 v5, `PSI-99_Experimental table_SAFFIRE-2.csv`:

- Dòng 2-10 là chín sample; dòng 11-12 là flow records; dòng 13-16 là notes.
- Có đơn vị trong ô, giá trị approximate, kết quả định tính và tham chiếu hình thay số thickness.
- Không điền material trống từ dòng phía trên nếu chưa có bằng chứng.

Nguồn bổ sung: PSI-98 v4, `PSI-98_Science Documents_SAFFIRE-I and SAFFIRE-III Readme.docx`, Table 1 / Table 3 và đoạn raw data. File giải thích camera/sample identities, telemetry Excel, image transformations và RAW có offset trước color interpolation. Một phần bảng diagnostics là hình trong DOCX, chưa đọc trực quan; không trích đầy đủ sensor list từ XML extraction.

## Q8. Blanks, encoding và derived variables

- PSI-159 inverse CSV: 1.015 rows sau header, chỉ 154 nonempty; 861 rows rỗng không được tạo `TestRun`.
- PSI-69 CSV: UTF-8 decoding lỗi tại byte `0x96` offset 2389; CP1252 decoding thành công. Đây là encoding observation, chưa phải khai báo chính thức của nhà cung cấp.
- PSI-10/159 có `Tad`, `Zst` và các cột mixture/flow. Cần phương pháp để phân biệt input, measured và derived values; không coi mọi numeric field là sensor output.

## Q9. Phạm vi suy luận khoa học

[NTRS 20220005205](https://ntrs.nasa.gov/citations/20220005205), phần 2-3: ACME có chamber constant-volume, diagnostics quang học và các cấu hình burner khác nhau. BRE emulates condensed-phase burning bằng gas-fed burner. Khuyến nghị retrieval phải giữ experiment configuration và observation type, không dùng hai kết quả cùng keyword như hai phép đo tương đương.

[NTRS 20240008602](https://ntrs.nasa.gov/citations/20240008602): nghiên cứu Saffire V kết hợp sensor data với vehicle modeling. Đây là nguồn về phương pháp/kết quả mô hình; chưa tìm được raw package Saffire V bằng các PSI query đã thử. Không gắn output model thành flight observation mới.

## Q10. Accession cũ trong filename

Manifest PSI-25 v4 có metadata ZIP tên `PSI-25_metadata_PSI_metadata_PSI-101_BASS-II.zip`; manifest PSI-69 v5 có `PSI-69_metadata_PSI-133_FLEX.zip`. Trong catalog hiện tại đã kiểm tra, PSI-101 là SAME-R. Không dùng regex lấy mọi chuỗi `PSI-<number>` trong filename để gán investigation. Giữ raw filename, canonical accession và legacy alias cùng ngữ cảnh/version, không ghi đè identity theo tên file.
