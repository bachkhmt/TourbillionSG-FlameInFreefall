const demos = [
  { id: 'candle', label: 'Lửa tự do', tag: '3D', title: 'Phòng quan sát lửa', description: 'Khám phá hình dạng, màu sắc và chuyển động của ngọn lửa.', hint: 'Kéo để xoay · Cuộn để thu phóng · Đổi màu và hình dạng trong bảng điều chỉnh.', file: 'candle' },
  { id: 'mist', label: 'MIST', tag: '01', title: 'Mồi lửa & dập tắt', description: 'Que PMMA, gia nhiệt bức xạ và lan lửa ngược dòng.', hint: 'Bấm “Chạy thí nghiệm”, rồi thử pha loãng N₂, giảm dòng hoặc xả khí khi lửa đang lan.', file: 'mist' },
  { id: 'nca', label: 'NCA', tag: '02', title: 'Lan lửa trong khe hẹp', description: 'Đặt cạnh nhau: 1g kênh mở, 1g khe hẹp và vi trọng lực.', hint: 'Thay đổi khe kênh và dòng khí để quan sát ba khung cùng lúc.', file: 'nca' },
  { id: 'rtdfs', label: 'RTDFS', tag: '03', title: 'Lan lửa trên PMMA mỏng', description: 'Khám phá ảnh hưởng của dòng khí, độ dày và oxy lên hình ảnh lan lửa.', hint: 'Thử các nút V=1, V=8 và V=50; mở “Chú thích” để xem các giả định.', file: 'rtdfs' },
  { id: 'smurf', label: 'SMµRF', tag: '04', title: 'Trái Đất & vi trọng lực', description: 'Cùng vật liệu và điều kiện đầu, quan sát hai môi trường trọng lực.', hint: 'Thử nút “Trái Đất tắt, vũ trụ vẫn cháy”, rồi đổi oxy và tốc độ gió.', file: 'smurf' },
  { id: 'gel-comparison', label: 'GEL · đối chiếu', tag: '05', title: 'Quả cầu cháy ở 1g & μg', description: 'Hai góc nhìn về quá trình phát triển và suy giảm của lửa quanh cầu PMMA.', hint: 'Đổi oxy hoặc đường kính, bấm “Mồi lửa / Chạy lại”; thử “Xả N₂”.', file: 'gel-comparison' },
  { id: 'gel', label: 'GEL · dập tắt', tag: '06', title: 'Giới hạn dập tắt quanh cầu', description: 'Bốn kịch bản minh họa: dòng thấp, thổi tắt, trung gian và dòng cực thấp.', hint: 'Chọn kịch bản A–D hoặc bấm lên bản đồ dòng × O₂ để thử điều kiện khác.', file: 'gel' },
];

const $ = (id) => document.getElementById(id);
const navigation = $('demo-list');
let current = null;
let requestVersion = 0;
let readinessTimer;

for (const demo of demos) {
  const link = document.createElement('a');
  link.href = `#${demo.id}`;
  link.className = 'demo-link';
  link.dataset.demo = demo.id;
  const number = document.createElement('span');
  number.className = 'demo-number';
  number.textContent = demo.tag;
  const label = document.createElement('span');
  label.textContent = demo.label;
  const arrow = document.createElement('span');
  arrow.className = 'demo-arrow';
  arrow.textContent = '↗';
  arrow.setAttribute('aria-hidden', 'true');
  link.append(number, label, arrow);
  navigation.append(link);
}

function showState(kind, message) {
  $('frame-state').hidden = kind === 'ready';
  $('frame-state').dataset.state = kind;
  $('state-message').textContent = message;
  $('retry-demo').hidden = kind !== 'error';
  $('demo-status').textContent = kind === 'ready' ? 'Đang hiển thị' : kind === 'error' ? 'Chưa tải được' : 'Đang chuẩn bị';
}

async function selectDemo(force = false) {
  const requested = location.hash.slice(1);
  const demo = demos.find((item) => item.id === requested) || demos[0];
  if (requested !== demo.id) history.replaceState(null, '', `#${demo.id}`);
  if (!force && current === demo.id) return;
  current = demo.id;
  const version = ++requestVersion;
  clearTimeout(readinessTimer);
  // Removing the browsing context stops its animation loops and releases its renderer.
  $('demo-frame')?.remove();
  for (const link of navigation.children) {
    if (link.dataset.demo === demo.id) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  $('demo-title').textContent = demo.title;
  $('demo-description').textContent = demo.description;
  $('demo-hint').textContent = demo.hint;
  $('demo-kind').textContent = demo.id === 'candle' ? 'QUAN SÁT 3D' : 'SOFIE / MINH HỌA';
  $('provenance').textContent = demo.id === 'candle'
    ? 'Minh họa hình ảnh tương tác. Hình dạng và màu sắc phục vụ quan sát.'
    : 'Minh họa định tính · Có tham số giả định · Nguồn các mốc số chưa xác minh · Chưa kết nối số đo PSI.';
  const url = `/studio/experiments/${demo.file}.html`;
  $('open-demo').href = url;
  document.title = `${demo.label} · Studio · Flame in Freefall`;
  showState('loading', 'Đang chuẩn bị minh họa…');
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    if (!html.includes('data-studio-demo')) throw new Error('Invalid demo document');
    if (version !== requestVersion) return;
    const frame = document.createElement('iframe');
    frame.id = 'demo-frame';
    frame.title = `${demo.label} — ${demo.title}`;
    frame.allow = 'fullscreen';
    frame.src = url;
    $('frame-host').prepend(frame);
    readinessTimer = setTimeout(() => {
      if (version === requestVersion) showState('error', 'Minh họa chưa phản hồi. Hãy thử tải lại hoặc mở riêng.');
    }, 20000);
  } catch {
    if (version === requestVersion) showState('error', 'Không tải được minh họa. Hãy thử tải lại hoặc mở riêng.');
  }
}

window.addEventListener('message', (event) => {
  const frame = $('demo-frame');
  if (event.origin !== location.origin || event.source !== frame?.contentWindow || event.data?.type !== 'studio-demo') return;
  if (!['ready', 'error'].includes(event.data.state)) return;
  clearTimeout(readinessTimer);
  showState(event.data.state, event.data.state === 'error' ? event.data.detail : '');
});
window.addEventListener('hashchange', () => selectDemo());
document.querySelector('.skip').addEventListener('click', (event) => {
  event.preventDefault();
  $('demo-title').focus();
});
$('reload-demo').addEventListener('click', () => selectDemo(true));
$('retry-demo').addEventListener('click', () => selectDemo(true));
selectDemo();
