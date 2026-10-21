import * as THREE from './vendor/three/three.module.min.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';

/** Original, state-driven geometry. No image planes or fluid-physics claim. */
export function createStage(mount, { onFailure = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 600 ? 1.35 : 1.6));
  renderer.setClearColor(0x000000, 0); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .84;
  mount.append(renderer.domElement); renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-5, 5, 3, -3, .1, 100);
  camera.position.set(0, 10, 14); camera.lookAt(0, .9, 0);
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04).texture; scene.environment = environment; room.dispose();
  const key = new THREE.DirectionalLight(0xf9ffe8, 2.1); key.position.set(-3, 8, 5); scene.add(key, new THREE.AmbientLight(0xc1d5ae, .55));
  const fill = new THREE.PointLight(0x91b7ff, 15, 24); fill.position.set(4, 4, -4); scene.add(fill);
  const board = new THREE.Group(); scene.add(board);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xcdddc7, transparent: true, opacity: .075, roughness: .14, metalness: .05, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: .1 });
  const rim = new THREE.MeshPhysicalMaterial({ color: 0xc8d2b5, metalness: .65, roughness: .22, transparent: true, opacity: .7 });
  const tubeGeo = new THREE.CylinderGeometry(.39, .36, 2.26, 32, 1, true), rimGeo = new THREE.TorusGeometry(.385, .025, 7, 32), baseGeo = new THREE.CylinderGeometry(.36, .36, .06, 28);
  const haloGeo = new THREE.TorusGeometry(.47, .02, 6, 30), haloMat = new THREE.MeshBasicMaterial({ color: 0xd8f36b, transparent: true, opacity: .9 });
  const targetMat = new THREE.MeshBasicMaterial({ color: 0xd8f36b, transparent: true, opacity: .35 });
  const platformMat = new THREE.MeshBasicMaterial({ color: 0x1a2115 }), edgeMat = new THREE.MeshBasicMaterial({ color: 0x718b3b, transparent: true, opacity: .55 });
  const numberTextures = Array.from({ length: 8 }, (_, c) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 80;
    const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, 80, 80); ctx.font = '700 45px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 6; ctx.strokeStyle = '#11190f'; ctx.strokeText(String(c + 1), 40, 41); ctx.fillStyle = '#f7faef'; ctx.fillText(String(c + 1), 40, 41);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  });
  const numberMats = numberTextures.map(map => new THREE.SpriteMaterial({ map, transparent: true, depthTest: false, toneMapped: false }));
  let groups = [], grounds = [], liquidMats = [], current = null, signature = '', colorSignature = '', layoutSignature = '', active = null, frame = null, motion = true, disposed = false, suspended = false;
  function requestDraw() { if (frame !== null || disposed || suspended) return; frame = requestAnimationFrame(tick); }
  function disposeGroup(group) { group.traverse(o => { if (o.userData.dynamic) o.geometry?.dispose(); }); board.remove(group); }
  function clearBottles() { groups.forEach(disposeGroup); groups = []; }
  function makePlatforms(layout) {
    grounds.forEach(object => { scene.remove(object); object.geometry.dispose(); }); grounds = [];
    for (let row = 0; row < layout.rows; row++) {
      const rowItems = layout.positions.filter(p => p.row === row), width = Math.max(2.1, (rowItems.length - 1) * layout.spacing + 1.65), z = rowItems[0].z;
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .065, 60), platformMat); plate.scale.set(width / 2, 1, 1.04); plate.position.set(0, -.09, z); scene.add(plate); grounds.push(plate);
      const edge = new THREE.Mesh(new THREE.TorusGeometry(1, .008, 4, 70), edgeMat); edge.rotation.x = Math.PI / 2; edge.scale.set(width / 2, 1.04, 1); edge.position.set(0, -.05, z); scene.add(edge); grounds.push(edge);
    }
  }
  function rebuild(level, layout) {
    clearBottles(); const unit = 2.08 / level.capacity;
    level.bottles.forEach((bottle, index) => {
      const g = new THREE.Group(), p = layout.positions[index]; g.position.set(p.x, p.y, p.z); g.userData.home = g.position.clone();
      const wall = new THREE.Mesh(tubeGeo, glass); wall.position.y = 1.14; wall.renderOrder = 3; g.add(wall);
      const lip = new THREE.Mesh(rimGeo, rim); lip.rotation.x = Math.PI / 2; lip.position.y = 2.27; g.add(lip);
      const base = new THREE.Mesh(baseGeo, rim); base.position.y = .02; g.add(base);
      bottle.forEach((color, slot) => {
        const liquid = new THREE.Mesh(new THREE.CylinderGeometry(.333, .333, unit - .018, 28), liquidMats[color]); liquid.position.y = .09 + (slot + .5) * unit; liquid.userData.dynamic = true; g.add(liquid);
        const number = new THREE.Sprite(numberMats[color]); number.position.set(0, liquid.position.y, .365); number.scale.setScalar(Math.min(.28, unit * .78)); number.renderOrder = 4; g.add(number);
      });
      const halo = new THREE.Mesh(haloGeo, haloMat); halo.rotation.x = Math.PI / 2; halo.position.y = -.025; halo.name = 'selection'; halo.visible = false; g.add(halo);
      const target = new THREE.Mesh(haloGeo, targetMat); target.rotation.x = Math.PI / 2; target.position.y = -.025; target.name = 'target'; target.visible = false; g.add(target);
      board.add(g); groups.push(g);
    });
    signature = JSON.stringify(level);
  }
  function size() {
    if (!current || disposed) return;
    const width = mount.parentElement.clientWidth, height = current.layout.height; if (!width || !height) return;
    renderer.setSize(width, height, false); camera.updateMatrixWorld();
    let left = Infinity, right = -Infinity, bottom = Infinity, top = -Infinity;
    for (const p of current.layout.positions) for (const x of [-.58, .58]) for (const y of [-.52, 2.65]) for (const z of [-.5, .5]) {
      const v = new THREE.Vector3(p.x + x, y, p.z + z).applyMatrix4(camera.matrixWorldInverse);
      left = Math.min(left, v.x); right = Math.max(right, v.x); bottom = Math.min(bottom, v.y); top = Math.max(top, v.y);
    }
    const aspect = width / height, halfHeight = Math.max((top - bottom) / 2, (right - left) / 2 / aspect) * 1.03;
    const cx = (left + right) / 2, cy = (top + bottom) / 2;
    camera.left = cx - halfHeight * aspect; camera.right = cx + halfHeight * aspect; camera.top = cy + halfHeight; camera.bottom = cy - halfHeight; camera.updateProjectionMatrix();
  }
  function projectControls() {
    if (!current || disposed) return;
    const width = mount.parentElement.clientWidth, height = current.layout.height;
    const wraps = [...mount.parentElement.querySelectorAll('.bottle-wrap')]; camera.updateMatrixWorld();
    groups.forEach((g, i) => {
      if (!wraps[i]) return;
      const p = g.userData.home, corners = [];
      for (const x of [-.42, .42]) for (const y of [0, 2.3]) for (const z of [-.36, .36]) corners.push(new THREE.Vector3(p.x + x, y, p.z + z).project(camera));
      const xs = corners.map(v => (v.x + 1) * width / 2), ys = corners.map(v => (1 - v.y) * height / 2);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys), hitWidth = Math.max(44, maxX - minX);
      Object.assign(wraps[i].style, { left: `${(minX + maxX - hitWidth) / 2}px`, top: `${minY}px`, width: `${hitWidth}px`, height: `${maxY - minY}px` });
      wraps[i].classList.toggle('selected', i === current.selected);
      wraps[i].classList.toggle('legal', Boolean(wraps[i].querySelector('.legal-target')));
    });
  }
  function paint(now = performance.now()) {
    if (!current || disposed || suspended) return;
    groups.forEach((g, i) => {
      g.position.copy(g.userData.home); g.rotation.set(0, 0, 0);
      g.getObjectByName('selection').visible = current.selected === i;
      g.getObjectByName('target').visible = Boolean(mount.parentElement.querySelectorAll('.bottle-wrap')[i]?.querySelector('.legal-target'));
      if (current.selected === i && motion) g.position.y += .13;
    });
    if (active) {
      const t = Math.min(1, (now - active.started) / 620), lift = Math.sin(t * Math.PI), from = groups[active.move.from], to = groups[active.move.to];
      if (from && to) { from.position.y += lift * .65; from.position.x += (to.userData.home.x - from.userData.home.x) * lift * .18; from.rotation.z = (to.userData.home.x >= from.userData.home.x ? -1 : 1) * lift * .5; }
      if (t >= 1) { active = null; rebuild(current.level, current.layout); paint(now); return; }
    }
    renderer.render(scene, camera); projectControls();
  }
  function tick(now) { frame = null; paint(now); if (active) requestDraw(); }
  function finish() { if (frame !== null) cancelAnimationFrame(frame); frame = null; if (active && current) { active = null; rebuild(current.level, current.layout); } paint(); }
  const onContextLost = event => { event.preventDefault(); finish(); onFailure(); };
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  const resize = new ResizeObserver(() => { if (!current || disposed || suspended) return; size(); paint(); }); resize.observe(mount.parentElement);
  return {
    update(level, options) {
      suspended = false;
      const old = current, nextColors = options.colors.join('|'), nextLayout = JSON.stringify(options.layout);
      if (nextColors !== colorSignature) {
        liquidMats.forEach(m => m.dispose()); liquidMats = options.colors.map(color => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .12, roughness: .45, metalness: 0, envMapIntensity: .03 })); colorSignature = nextColors; signature = '';
      }
      if (nextLayout !== layoutSignature) { makePlatforms(options.layout); layoutSignature = nextLayout; signature = ''; }
      if (frame !== null) cancelAnimationFrame(frame); frame = null;
      const wasAnimating = Boolean(active); active = null;
      current = { level, ...options };
      const canAnimate = options.move && motion && !wasAnimating && old && groups.length === level.bottles.length && signature === JSON.stringify(old.level);
      if (canAnimate) active = { move: options.move, started: performance.now() };
      else if (signature !== JSON.stringify(level)) rebuild(level, options.layout);
      size(); paint(); if (active) requestDraw();
    },
    setMotion(on) { motion = on; if (!motion) finish(); },
    finish,
    suspend() { suspended = true; finish(); },
    dispose() {
      if (disposed) return; finish(); disposed = true; resize.disconnect(); renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      clearBottles(); grounds.forEach(o => { scene.remove(o); o.geometry.dispose(); }); liquidMats.forEach(m => m.dispose()); numberMats.forEach(m => m.dispose()); numberTextures.forEach(t => t.dispose());
      [glass, rim, haloMat, targetMat, platformMat, edgeMat].forEach(m => m.dispose()); [tubeGeo, rimGeo, baseGeo, haloGeo].forEach(g => g.dispose()); environment.dispose(); pmrem.dispose(); renderer.dispose(); renderer.domElement.remove();
    }
  };
}
