import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import fragmentShader from './flame.frag.glsl';

const $ = (id) => document.getElementById(id);
const host = $('scene');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const smallScreen = window.matchMedia('(max-width: 899px)');
const palettes = {
  blue: { name: 'Xanh lam', core: '#829eff', mid: '#153eff', edge: '#0616bc', base: '#163aff' },
  amber: { name: 'Hổ phách', core: '#fff2cb', mid: '#ffae32', edge: '#c82d04', base: '#243cff' },
  rose: { name: 'Hồng', core: '#ffe7f3', mid: '#ff6797', edge: '#af0b49' },
  mint: { name: 'Ngọc', core: '#defff3', mid: '#5ce1b8', edge: '#08766f' },
};
let renderer, controls, timer, observer, scene, camera, volume;
let initialized = false, failed = false, paused = reducedMotion.matches;
let elapsed = 0, shape = 1, shapeTarget = 1, dirty = true;
let qualityMode = 'auto', steps = 80, pixelRatio = 1;
let lastFocus = null, slowFrames = 0, frameCount = 0;
const cleanups = [];
const geometries = [], materials = [];
const announce = (message) => { $('announcement').textContent = message; };

function on(element, event, callback, options) {
  element.addEventListener(event, callback, options);
  cleanups.push(() => element.removeEventListener(event, callback, options));
}
function setPaused(value) {
  paused = value;
  $('pause').setAttribute('aria-pressed', String(paused));
  $('pause-label').textContent = paused ? 'Tiếp tục' : 'Tạm dừng';
  $('pause-icon').textContent = paused ? '▷' : 'Ⅱ';
  dirty = true;
}
function selectShape(value) {
  shapeTarget = value;
  if (paused) shape = value;
  $('morph').value = Math.round(value*100);
  $('morph-value').value = `${Math.round(value*100)}%`;
  document.querySelectorAll('.shape-preset').forEach((button) => {
    const selected = (value === 0 && button.dataset.shape === 'drop') ||
      (value === 1 && button.dataset.shape === 'sphere');
    button.setAttribute('aria-pressed', String(selected));
  });
  $('shape-caption').textContent = value === 1 ? 'Vòm lửa nến · tham chiếu vi trọng lực' :
    value === 0 ? 'Lửa nến thuôn dài · tham chiếu 1g' : `Dáng tùy chỉnh · ${Math.round(value*100)}% biến hình`;
  dirty = true;
}
function applyPalette(palette, key = null) {
  if (!volume) return;
  volume.material.uniforms.uCore.value.set(palette.core);
  volume.material.uniforms.uMid.value.set(palette.mid);
  volume.material.uniforms.uEdge.value.set(palette.edge);
  volume.material.uniforms.uBase.value.set(palette.base || palette.edge);
  $('palette-name').textContent = palette.name;
  $('custom-color').value = palette.mid;
  document.querySelectorAll('.color-swatch').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.palette === key));
  });
  dirty = true;
}
function setQuality(mode) {
  qualityMode = mode;
  steps = mode === 'high' ? 128 : mode === 'low' ? 48 : smallScreen.matches ? 64 : 80;
  pixelRatio = Math.min(window.devicePixelRatio || 1, mode === 'high' ? 1.7 : mode === 'low' ? .85 : 1.25);
  if (renderer) {
    renderer.setPixelRatio(pixelRatio);
    volume.material.uniforms.uSteps.value = steps;
    resize();
    $('render-status').textContent = mode === 'high' ? 'Chi tiết cao' : mode === 'low' ? 'Chế độ nhẹ' : 'Chất lượng tự động';
  }
}
function resize() {
  if (!renderer) return;
  const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
  renderer.setSize(width,height,false);
  camera.aspect = width/height;
  // Keep the complete volume in frame on tall phones, rather than clipping its sides.
  camera.fov = THREE.MathUtils.radToDeg(2*Math.atan(
    Math.tan(THREE.MathUtils.degToRad(37)/2)*Math.max(1,.72/camera.aspect),
  ));
  camera.updateProjectionMatrix();
  dirty = true;
}
function resetCamera() {
  camera.position.set(.3,.10,7.2);
  controls.target.set(0,-.05,0);
  controls.update();
  dirty = true;
}
function addMesh(geometry, material, parent = scene) {
  geometries.push(geometry); materials.push(material);
  const mesh = new THREE.Mesh(geometry,material);
  parent.add(mesh);
  return mesh;
}
function initialize() {
  try {
    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false, powerPreference:'high-performance' });
    renderer.setClearColor(0x000000);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.debug.onShaderError = () => fail('Trình duyệt không biên dịch được hiệu ứng lửa. Hãy thử tải lại hoặc dùng Edge/Chrome mới hơn.');
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden','true');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(37,1,.1,50);
    controls = new OrbitControls(camera,renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 4.5;
    controls.maxDistance = 11;
    controls.minPolarAngle = .25;
    controls.maxPolarAngle = Math.PI*.74;
    controls.autoRotateSpeed = .35;
    on(controls,'change',() => { dirty = true; });
    resetCamera();
    const uniforms = {
      uTime:{value:0}, uShape:{value:shape},
      uTurbulence:{value:.45}, uIntensity:{value:1}, uSteps:{value:80},
      uCore:{value:new THREE.Color()}, uMid:{value:new THREE.Color()}, uEdge:{value:new THREE.Color()},
      uBase:{value:new THREE.Color()},
    };
    volume = addMesh(new THREE.BoxGeometry(3.2,3,3.2).translate(0,.65,0),new THREE.ShaderMaterial({
      uniforms,
      vertexShader: 'varying vec3 vPosition; void main(){vPosition=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader,
      side:THREE.BackSide, transparent:true, depthWrite:false, depthTest:false,
      blending:THREE.AdditiveBlending,
    }));
    // A small candle and charred wick give the flame a visible physical source.
    const wax = addMesh(new THREE.CylinderGeometry(.17,.18,.68,48),
      new THREE.MeshStandardMaterial({color:0xc9beab,roughness:.94}));
    wax.position.y=-1.22;
    const wick = addMesh(new THREE.CylinderGeometry(.028,.032,.75,12),
      new THREE.MeshStandardMaterial({color:0x090807,roughness:1}));
    wick.position.set(.015,-.525,0);
    scene.add(new THREE.AmbientLight(0xffffff,.45));
    const candleLight = new THREE.PointLight(0x9293b2,2.0,4,2);
    candleLight.position.set(-.5,.3,1.2); scene.add(candleLight);
    applyPalette(palettes.blue,'blue');
    timer = new THREE.Timer(); timer.connect(document);
    setQuality($('quality').value);
    observer = new ResizeObserver(resize); observer.observe(host);
    on(renderer.domElement,'webglcontextlost',(event) => {
      event.preventDefault();
      fail('Phiên dựng 3D bị gián đoạn. Bấm “Thử tải lại” để khởi động lại.');
    });
    on(host,'keydown',(event) => {
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Home') { resetCamera(); return; }
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      if(event.key==='ArrowLeft') spherical.theta-=.12;
      if(event.key==='ArrowRight') spherical.theta+=.12;
      if(event.key==='ArrowUp') spherical.phi-=.1;
      if(event.key==='ArrowDown') spherical.phi+=.1;
      if(event.key==='+'||event.key==='=') spherical.radius*=.9;
      if(event.key==='-') spherical.radius*=1.1;
      spherical.phi=THREE.MathUtils.clamp(spherical.phi,.25,Math.PI*.74);
      spherical.radius=THREE.MathUtils.clamp(spherical.radius,4.5,11);
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
      controls.update(); dirty=true;
    });
    initialized = true;
    setPaused(paused);
    renderer.setAnimationLoop(tick);
    $('loading').hidden=true;
    ['capture','reset-camera','pause'].forEach(id => { $(id).disabled=false; });
    // Compile eagerly: shader failures must show the fallback instead of an empty stage.
    renderer.render(scene,camera);
  } catch(error) {
    console.error('Flame studio:',error);
    fail('Thiết bị chưa bật WebGL 2. Hãy bật tăng tốc phần cứng hoặc mở bằng Edge/Chrome mới hơn.');
  }
}
function tick() {
  if (failed || document.hidden) return;
  timer.update();
  const delta = Math.min(timer.getDelta(),.06);
  if (!paused) {
    elapsed+=delta;
    shape=THREE.MathUtils.damp(shape,shapeTarget,7,delta);
    dirty=true;
  }
  controls.autoRotate=$('auto-rotate').checked && !paused;
  controls.update(delta);
  if (!dirty) return;
  const begin=performance.now();
  volume.material.uniforms.uTime.value=elapsed;
  volume.material.uniforms.uShape.value=shape;
  renderer.render(scene,camera);
  dirty=false;
  if(qualityMode==='auto' && ++frameCount>90) {
    slowFrames=performance.now()-begin>38 ? slowFrames+1 : Math.max(0,slowFrames-1);
    if(slowFrames>35 && pixelRatio>.85) {
      pixelRatio=Math.max(.85,pixelRatio-.2); steps=Math.max(48,steps-16);
      renderer.setPixelRatio(pixelRatio); volume.material.uniforms.uSteps.value=steps; resize(); slowFrames=0;
      $('render-status').textContent='Tự động · giảm tải GPU';
    }
  }
}
function fail(message) {
  failed=true;
  renderer?.setAnimationLoop(null);
  $('loading').hidden=true; $('fallback').hidden=false;
  $('fallback-reason').textContent=message;
  $('render-status').textContent='Xem ảnh minh họa';
  document.querySelectorAll('#controls input,#controls select,#controls .shape-preset,#controls .color-swatch').forEach(el => {el.disabled=true;});
  ['capture','reset-camera','pause'].forEach(id => {$(id).disabled=true;});
}
function setSheet(open) {
  const panel=$('controls');
  if(open) {
    lastFocus=document.activeElement;
    panel.classList.add('open'); panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','true');
    $('sheet-backdrop').hidden=false; $('open-controls').setAttribute('aria-expanded','true');
    document.querySelector('.viewer').inert=true; document.querySelector('.studio-header').inert=true;
    document.body.style.overflow='hidden'; $('close-controls').focus();
  } else {
    panel.classList.remove('open'); panel.removeAttribute('role'); panel.removeAttribute('aria-modal');
    $('sheet-backdrop').hidden=true; $('open-controls').setAttribute('aria-expanded','false');
    document.querySelector('.viewer').inert=false; document.querySelector('.studio-header').inert=false;
    document.body.style.overflow='';
    if(lastFocus && smallScreen.matches) lastFocus.focus();
  }
}
on($('open-controls'),'click',()=>setSheet(true));
on(document.querySelector('.skip'),'click',event=>{
  event.preventDefault();
  if(smallScreen.matches)setSheet(true);
  else { $('controls').tabIndex=-1; $('controls').focus(); }
});
on($('close-controls'),'click',()=>setSheet(false));
on($('sheet-backdrop'),'click',()=>setSheet(false));
on(document,'keydown',(event)=>{
  if(!$('controls').classList.contains('open')) return;
  if(event.key==='Escape') {setSheet(false);return;}
  if(event.key==='Tab') {
    const elements=[...$('controls').querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')].filter(el=>el.getClientRects().length);
    const first=elements[0],last=elements.at(-1);
    if(event.shiftKey && document.activeElement===first) {event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last) {event.preventDefault();first.focus();}
  }
});
on(smallScreen,'change',()=>{setSheet(false); if(qualityMode==='auto')setQuality('auto');});
on(reducedMotion,'change',()=>{if(reducedMotion.matches)setPaused(true);});
document.querySelectorAll('.shape-preset').forEach(button=>on(button,'click',()=>selectShape(button.dataset.shape==='sphere'?1:0)));
on($('morph'),'input',event=>selectShape(Number(event.target.value)/100));
document.querySelectorAll('.color-swatch').forEach(button=>on(button,'click',()=>applyPalette(palettes[button.dataset.palette],button.dataset.palette)));
on($('custom-color'),'input',event=>{
  const mid=new THREE.Color(event.target.value);
  applyPalette({name:'Tùy chọn',mid:event.target.value,core:`#${mid.clone().lerp(new THREE.Color('white'),.8).getHexString()}`,edge:`#${mid.clone().multiplyScalar(.28).getHexString()}`});
});
on($('turbulence'),'input',event=>{
  $('turbulence-value').value=`${event.target.value}%`;
  if(volume)volume.material.uniforms.uTurbulence.value=Number(event.target.value)/100;
  dirty=true;
});
on($('intensity'),'input',event=>{
  const value=Number(event.target.value)/100;
  $('intensity-value').value=`${value.toLocaleString('vi-VN',{minimumFractionDigits:2})}×`;
  if(volume)volume.material.uniforms.uIntensity.value=value;
  dirty=true;
});
on($('quality'),'change',event=>setQuality(event.target.value));
on($('pause'),'click',()=>setPaused(!paused));
on($('reset-camera'),'click',resetCamera);
on($('auto-rotate'),'change',()=>{dirty=true;});
on($('retry'),'click',()=>window.location.reload());
on($('capture'),'click',()=>{
  if(!initialized || failed) return;
  try {
    volume.material.uniforms.uShape.value=shape;
    renderer.render(scene,camera);
    const link=document.createElement('a');
    link.download=`flame-${Math.round(shapeTarget*100)}-${Date.now()}.png`;
    link.href=renderer.domElement.toDataURL('image/png'); link.click();
    announce('Đã lưu ảnh PNG của góc nhìn hiện tại.');
  } catch(error) {console.error(error); announce('Chưa lưu được ảnh. Hãy thử lại.');}
});
on(window,'pagehide',(event)=>{
  if(event.persisted)return;
  renderer?.setAnimationLoop(null); observer?.disconnect();
  controls?.dispose(); timer?.dispose();
  geometries.forEach(geometry=>geometry.dispose()); materials.forEach(material=>material.dispose());
  renderer?.dispose(); cleanups.forEach(cleanup=>cleanup());
},{once:true});
initialize();
