# Phòng quan sát lửa 3D

Mở `/flame` sau khi chạy `python -m ragkit serve`. Kho nghiên cứu có liên kết **Lửa 3D**.
Trang dùng Three.js 0.186.1 và WebGL 2, không gọi API hay tải CDN lúc chạy.

## Cách dùng

- **Giọt nước / Vòm cầu** chọn hai dáng tham chiếu; **Biến hình** chuyển tiếp liên tục.
- Bốn màu có sẵn và dấu **+** để chọn màu bất kỳ, độc lập với hình dạng.
- Kéo hoặc vuốt để xoay; cuộn/chụm để zoom. Phím mũi tên xoay, `+`/`-` zoom, `Home` đặt lại.
- Chỉnh dao động, độ sáng, tự xoay; tạm dừng để quan sát và **Lưu ảnh PNG**.
- **Tự động / Chi tiết / Nhẹ** thay đổi số bước lấy mẫu và độ phân giải dựng.
- Trên điện thoại, **Điều chỉnh** mở bảng dưới; Escape đóng và trả focus.

## Phạm vi khoa học

Đây là minh họa hình ảnh thể tích, không phải bộ giải phản ứng cháy, CFD hay dự báo an toàn.
Bản hiện tại tham chiếu ảnh lửa nến của NASA: vòm xanh trong vi trọng lực và dáng thuôn ở 1g;
dòng khí và nhiên liệu vẫn ảnh hưởng hình dạng. Xem
[NASA: Candle Flame – 1g vs Microgravity](https://www.nasa.gov/image-article/candle-flame-1g-vs-microgravity/).
Thanh biến hình **không** ánh xạ sang g, áp suất hay nồng độ oxy. Màu tùy chọn không biểu diễn
nhiệt độ hoặc thành phần hóa học. Không đọc dữ liệu RAG vào shader và không tạo số đo giả.

## Thiết kế và cấu trúc

Taste app direction **true-black-flat**, seed `699374517`, lưu trong `.taste-skill/flame/direction.json`.
Câu hỏi trung tâm: “Ngọn lửa trông thế nào khi tôi đổi hình dạng và màu?”
Đối tượng chính là thể tích sáng; nền và điều khiển dùng màu trung tính. Các màu bão hòa thuộc
ngọn lửa và bảng chọn màu, theo yêu cầu người dùng. Không dùng gradient hoặc glow trang trí trên UI.

Inventory: một canvas chính; một bảng chỉnh; hai preset hình; một thanh morph; bốn màu và màu riêng;
hai thanh dao động/độ sáng; một công tắc xoay; một chọn chất lượng; đặt lại góc nhìn; tạm dừng; lưu PNG;
trạng thái tải, ảnh dự phòng khi WebGL lỗi, bố cục điện thoại và phím tắt.

- `web/flame.html`: giao diện độc lập, `/flame` được FastAPI phục vụ.
- `web/src/flame.js`: scene, OrbitControls, Timer, tương tác, xuất PNG và giải phóng tài nguyên.
- `web/src/flame.frag.glsl`: raymarch phát xạ qua vỏ lửa mỏng và chuyển động nhẹ.
- `web/assets/flame.css`: bố cục studio và bảng dưới trên điện thoại.
- `web/assets/flame.js`: bundle có sẵn để chạy offline; sửa nguồn thì phải build lại.
- `web/assets/flame-poster.png`: ảnh xuất từ chính renderer, dùng khi thiết bị thiếu WebGL 2.
- `web/assets/THREE-LICENSE.txt`, `web/assets/fonts/OFL.txt`: giấy phép thư viện và font.

Raymarch tích lũy phát xạ qua vỏ lửa mỏng, thêm vùng phát sáng của lửa nến 1g.
Không dùng texture nhiễu dạng mây hoặc bệ trưng bày. Bấc nến che phần ánh sáng phía sau nó.
Chuyển giữa trường khoảng cách giọt nước và vòm cầu; màu được quản lý trong linear space,
ACES tone mapping và chuyển sang sRGB. Chế độ tự động giới hạn pixel ratio và giảm tải khi
CPU gửi khung hình quá chậm; chưa đo GPU bằng timer query. Chất lượng chi tiết tốn GPU hơn.
Ưu tiên reduced-motion khởi động ở trạng thái tạm dừng; tab ẩn không dựng khung hình.

## Build và kiểm tra

```powershell
cd web
npm ci --ignore-scripts
npm run build
cd ..
pytest -q
ruff check src tests scripts/check_flame_studio.py
```

QA trình duyệt dùng Edge cài sẵn, thêm `pip install playwright pillow` rồi chạy:

```powershell
python scripts/check_flame_studio.py --url http://127.0.0.1:8000
```

Script kiểm tra WebGL thật, pixel màu và hình dạng, màu riêng, xoay bằng phím, tạm dừng/chuyển động,
PNG tải được, chất lượng, các chiều rộng 768/390/320 và ảnh dự phòng khi WebGL không khả dụng.
Ảnh QA mặc định nằm ở `.taste-skill/flame/qa`. Không cần cài Playwright để chạy sản phẩm.

## Sửa hình ảnh theo phản hồi

Bản đầu bị đánh giá giống quả cầu plasma/khói. Đã bỏ texture nhiễu 3D, bỏ bệ tròn,
giảm cường độ vỏ xanh, làm tối phần giữa và thêm nến/bấc làm nguồn nhiên liệu.
Preset vi trọng lực hiện là **vòm lửa nến** theo ảnh tham chiếu, không đại diện mọi loại lửa trong không gian.
QA có kiểm tra vùng giữa tối hơn mép và không biến thành lõi trắng.
