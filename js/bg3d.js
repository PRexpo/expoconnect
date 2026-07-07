/* ═══════════════════════════════════════════════════
   bg3d.js — ExpoConnect 3D Animated Background
   Call: initBG() after DOM is ready
   ═══════════════════════════════════════════════════ */

function initBG(options = {}) {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const {
    particleCount = 700,
    ringCount     = 3,
    icoCount      = 8,
    intensity     = 1,   // 0.5 = lighter for form pages
  } = options;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  camera.position.set(0, 0, 28);

  // Resize
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));
  const dL = new THREE.DirectionalLight(0xff6633, 1.0 * intensity);
  dL.position.set(10, 10, 10);
  scene.add(dL);
  const bL = new THREE.DirectionalLight(0x4466ff, 0.6 * intensity);
  bL.position.set(-10, -5, 5);
  scene.add(bL);

  // Colour palette
  const pal = [
    new THREE.Color(0xe8572a),
    new THREE.Color(0x5b8fff),
    new THREE.Color(0x00c97a),
    new THREE.Color(0xf0a500),
  ];

  // ── PARTICLES ──
  const pos = new Float32Array(particleCount * 3);
  const col = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    pos[i*3]   = (Math.random() - .5) * 110;
    pos[i*3+1] = (Math.random() - .5) * 110;
    pos[i*3+2] = (Math.random() - .5) * 70;
    const c = pal[i % pal.length];
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  const pMat = new THREE.PointsMaterial({
    size: .14, vertexColors: true,
    transparent: true, opacity: .5 * intensity, sizeAttenuation: true,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ── TORUS RINGS ──
  const ringDefs = [[6, 0xe8572a], [10, 0x5b8fff], [14, 0x00c97a]].slice(0, ringCount);
  const rings = ringDefs.map(([r, c], i) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(r, .03, 8, 90),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: (.14 - i*.03) * intensity })
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    mesh.position.set((Math.random()-.5)*16, (Math.random()-.5)*12, 0);
    scene.add(mesh);
    return mesh;
  });

  // ── ICOSAHEDRA ──
  const icos = Array.from({ length: icoCount }, (_, i) => {
    const sz   = .3 + Math.random() * .85;
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(sz, 0),
      new THREE.MeshPhongMaterial({
        color: pal[i % 4], transparent: true,
        opacity: .18 * intensity, wireframe: i % 2 === 0,
      })
    );
    mesh.position.set((Math.random()-.5)*48, (Math.random()-.5)*38, (Math.random()-.5)*14);
    mesh.userData = {
      ax:    new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
      sp:    .003 + Math.random() * .005,
      baseY: mesh.position.y,
      amp:   .07 + Math.random() * .12,
      freq:  .3  + Math.random() * .5,
      ph:    Math.random() * Math.PI * 2,
    };
    scene.add(mesh);
    return mesh;
  });

  // ── BIG WIREFRAME BACKDROP ──
  const bgMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(17, 0),
    new THREE.MeshBasicMaterial({ color: 0x5b8fff, wireframe: true, transparent: true, opacity: .022 * intensity })
  );
  scene.add(bgMesh);

  // ── MOUSE PARALLAX ──
  const mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth  - .5) * 2;
    mouse.y = (e.clientY / window.innerHeight - .5) * 2;
  });

  // ── ANIMATE ──
  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += .011;

    particles.rotation.y = t * .032;
    particles.rotation.x = t * .016;

    rings.forEach((r, i) => {
      r.rotation.x += .0009 * (i + 1);
      r.rotation.z += .0006 * (i + 1);
    });

    icos.forEach(m => {
      m.rotateOnAxis(m.userData.ax, m.userData.sp);
      m.position.y = m.userData.baseY + Math.sin(t * m.userData.freq + m.userData.ph) * m.userData.amp * 5;
    });

    bgMesh.rotation.y = t * .022;
    bgMesh.rotation.x = t * .011;

    camera.position.x += (mouse.x * 3.5 - camera.position.x) * .036;
    camera.position.y += (-mouse.y * 2.5 - camera.position.y) * .036;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  })();
}
