precision highp float;
uniform float uTime;
uniform float uShape;
uniform float uTurbulence;
uniform float uIntensity;
uniform int uSteps;
uniform vec3 uCore;
uniform vec3 uMid;
uniform vec3 uEdge;
uniform vec3 uBase;
varying vec3 vPosition;

float cylinderHit(vec3 ro, vec3 rd, float radius, float lowY, float highY, vec2 offset) {
  // Opaque candle geometry occludes emission behind it, at every orbit angle.
  vec2 o = ro.xz - offset;
  float a = dot(rd.xz,rd.xz);
  float b = dot(o,rd.xz);
  float c = dot(o,o)-radius*radius;
  float discriminant = b*b-a*c;
  float result = 1000.0;
  if(discriminant >= 0.0 && a > .00001) {
    float t = (-b-sqrt(discriminant))/a;
    float y = ro.y+rd.y*t;
    if(t>0.0 && y>lowY && y<highY) result=t;
  }
  if(abs(rd.y)>.00001) {
    float t = (highY-ro.y)/rd.y;
    if(t>0.0 && length(o+rd.xz*t)<radius) result=min(result,t);
    t = (lowY-ro.y)/rd.y;
    if(t>0.0 && length(o+rd.xz*t)<radius) result=min(result,t);
  }
  return result;
}

void main() {
  vec3 ro = cameraPosition;
  vec3 rd = normalize(vPosition - ro);
  vec3 inv = 1.0 / rd;
  vec3 t0 = (vec3(-1.6, -.85, -1.6) - ro) * inv;
  vec3 t1 = (vec3(1.6, 2.15, 1.6) - ro) * inv;
  vec3 lo = min(t0, t1), hi = max(t0, t1);
  float nearT = max(max(max(lo.x, lo.y), lo.z), 0.0);
  float farT = min(min(hi.x, hi.y), hi.z);
  farT = min(farT,cylinderHit(ro,rd,.032,-.90,-.15,vec2(.015,0.0)));
  farT = min(farT,cylinderHit(ro,rd,.17,-1.56,-.88,vec2(0.0)));
  if (farT <= nearT) discard;
  float ds = (farT - nearT) / float(uSteps);
  // Broaden only the integration kernel at lower resolutions; preserve emitted energy.
  float width = max(.038, ds * .65);
  vec3 radiance = vec3(0.0);
  for (int i = 0; i < 128; i++) {
    if (i >= uSteps) break;
    vec3 p = ro + rd * (nearT + (float(i) + .5) * ds);
    float h = clamp((p.y + .68) / 2.55, 0.0, 1.0);
    float sway = (sin(uTime*3.2) + sin(uTime*5.1+.7)*.3) * .038 * uTurbulence;
    vec2 axis = vec2(sway*h*h, sin(uTime*2.3)*.017*uTurbulence*h);
    float radial = length(p.xz-axis);
    float radius = .075*(1.0-h) + .46*pow(max(sin(h*3.141593),0.0),.78)*(1.0-.48*h);
    float drop = max(radial-radius,max(-.68-p.y,p.y-1.87));
    // Rounded, open-bottom candle envelope: smooth and nearly stationary.
    float breathing = .008*uTurbulence*(sin(uTime*.9)+sin(p.x*3.0+p.z*2.0-uTime*.6));
    float dome = length(vec3(p.x,(p.y+.54)/1.35,p.z)) - 1.02 - breathing;
    dome += .006*uTurbulence*sin(p.y*6.0+p.x*3.0-uTime*.8)*sin(p.z*3.0+uTime*.4);
    float d = mix(drop,dome,uShape);
    float cutoff = smoothstep(-.76,-.59,p.y);
    float shell = exp(-pow(d/width,2.0))*(.038/width)*cutoff;
    float fringe = exp(-pow(d/.11,2.0))*.025*cutoff;
    float flicker = 1.0 + uTurbulence*mix(.045,.018,uShape)*sin(uTime*3.7+p.y*2.0);
    float uneven = 1.0+.12*sin(p.x*2.1+p.y*1.7+uTime*.22);
    vec3 shellTint = mix(uEdge,uMid,.8);
    float baseMix = (1.0-smoothstep(.06,.28,h))*(1.0-uShape);
    shellTint = mix(shellTint,uBase,baseMix);
    // Optically thin chemiluminescence: bright rim, dim transparent center.
    radiance += (shell+fringe)*shellTint*ds*.95*flicker*uneven;
    // Incandescent region for the 1g reference; absent from the blue dome preset.
    float soot = (1.0-smoothstep(-.10,.015,drop))*smoothstep(.08,.32,h);
    float hot = exp(-pow(radial/max(radius*.65,.01),2.0))*smoothstep(.18,.48,h);
    vec3 sootTint = mix(uMid,uCore,hot);
    radiance += soot*sootTint*ds*7.0*(1.0-uShape)*flicker;
  }
  radiance *= uIntensity;
  if (max(max(radiance.r,radiance.g),radiance.b)<.0003) discard;
  gl_FragColor = vec4(radiance,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
