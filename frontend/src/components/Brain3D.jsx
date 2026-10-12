import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/* ── 10-20 Anatomical Coordinates in 3D Space (scaled to unit head sphere R ~ 2.05) ── */
const ELECTRODE_3D_COORDS = {
  Fp1: { x: -0.62, y:  0.60, z:  1.82 },
  Fp2: { x:  0.62, y:  0.60, z:  1.82 },
  F7:  { x: -1.65, y:  0.42, z:  0.98 },
  F3:  { x: -0.96, y:  1.18, z:  1.22 },
  Fz:  { x:  0.00, y:  1.48, z:  1.32 },
  F4:  { x:  0.96, y:  1.18, z:  1.22 },
  F8:  { x:  1.65, y:  0.42, z:  0.98 },
  T3:  { x: -1.98, y: -0.05, z:  0.00 },
  C3:  { x: -1.16, y:  1.52, z:  0.00 },
  Cz:  { x:  0.00, y:  1.98, z:  0.00 },
  C4:  { x:  1.16, y:  1.52, z:  0.00 },
  T4:  { x:  1.98, y: -0.05, z:  0.00 },
  T5:  { x: -1.65, y: -0.38, z: -0.98 },
  P3:  { x: -0.96, y:  1.15, z: -1.22 },
  Pz:  { x:  0.00, y:  1.46, z: -1.32 },
  P4:  { x:  0.96, y:  1.15, z: -1.22 },
  T6:  { x:  1.65, y: -0.38, z: -0.98 },
  O1:  { x: -0.62, y:  0.22, z: -1.86 },
  O2:  { x:  0.62, y:  0.22, z: -1.86 },
};

const REGION_MAP = {
  Fp1: 'Frontal',   Fp2: 'Frontal',   F3: 'Frontal',  Fz: 'Frontal',  F4: 'Frontal',  F7: 'Frontal',  F8: 'Frontal',
  C3:  'Central',   Cz:  'Central',   C4: 'Central',
  T3:  'Temporal',  T4:  'Temporal',  T5: 'Temporal', T6: 'Temporal',
  P3:  'Parietal',  Pz:  'Parietal',  P4: 'Parietal',
  O1:  'Occipital', O2:  'Occipital',
};

/* SapientPriors warm cognac & walnut pathway scale */
function getPathwayStyle(w) {
  if (w >= 0.80) return { hex: 0x84512e, css: '#84512E', label: 'Very Strong (≥0.80)' };
  if (w >= 0.65) return { hex: 0xa86c43, css: '#A86C43', label: 'Strong (≥0.65)' };
  if (w >= 0.50) return { hex: 0x5a544b, css: '#5A544B', label: 'Moderate (≥0.50)' };
  return { hex: 0x9e9587, css: '#9E9587', label: 'Weak (<0.50)' };
}

/* ── Create text sprite for electrode label ── */
function makeTextSprite(message) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 128, 64);
  
  ctx.font = 'bold 26px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.fillStyle = '#14161A';
  ctx.fillText(message, 64, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.65, 0.32, 1);
  return sprite;
}

export default function Brain3D({ graphData }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameIdRef = useRef(null);

  const [minWeight, setMinWeight] = useState(0.35);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showPulses, setShowPulses] = useState(true);
  const [cortexStyle, setCortexStyle] = useState('wireframe');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false });

  const electrodeMeshesRef = useRef([]);
  const edgeTubesRef = useRef([]);
  const pulseParticlesRef = useRef([]);
  const cortexMeshRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2(-999, -999));

  const { nodesList, edgesList } = useMemo(() => {
    if (!graphData?.nodes) return { nodeMap: {}, nodesList: [], edgesList: [] };
    const nMap = {};
    const nList = graphData.nodes.map(n => {
      const reg = REGION_MAP[n.label] || 'Central';
      const pos = ELECTRODE_3D_COORDS[n.label] || { x: 0, y: 1.5, z: 0 };
      const item = { ...n, region: reg, pos };
      nMap[n.id] = item;
      return item;
    });

    const eList = (graphData.edges || []).map(e => {
      const srcNode = nMap[e.source];
      const tgtNode = nMap[e.target];
      return {
        ...e,
        srcLabel: srcNode?.label || `Ch${e.source}`,
        tgtLabel: tgtNode?.label || `Ch${e.target}`,
        srcPos: srcNode?.pos,
        tgtPos: tgtNode?.pos,
        srcRegion: srcNode?.region,
        tgtRegion: tgtNode?.region,
      };
    });

    return { nodeMap: nMap, nodesList: nList, edgesList: eList };
  }, [graphData]);

  const activeEdges = useMemo(() => {
    return edgesList.filter(e => e.weight >= minWeight);
  }, [edgesList, minWeight]);

  /* ── Initialize Three.js Scene matching SapientPriors warm paper tone ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe6dfd3); // Exact SapientPriors warm background
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.8, 3.2, 4.6);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.0;
    controls.maxDistance = 9.0;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.8;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff6ea, 0.9);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xd9d0c2, 0.6);
    dirLight2.position.set(-5, -3, -5);
    scene.add(dirLight2);

    const headGroup = new THREE.Group();

    // Cranium Ellipsoid
    const headGeom = new THREE.SphereGeometry(1.95, 36, 32);
    headGeom.scale(1.0, 1.06, 1.16);

    const cortexMat = new THREE.MeshStandardMaterial({
      color: 0xb8afa0,
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 0.28,
      wireframe: cortexStyle === 'wireframe',
      wireframeLinewidth: 1.0,
    });
    const cortexMesh = new THREE.Mesh(headGeom, cortexMat);
    cortexMeshRef.current = cortexMesh;
    headGroup.add(cortexMesh);

    // Inner subtle core sphere
    const innerGeom = new THREE.SphereGeometry(1.65, 24, 20);
    innerGeom.scale(0.95, 1.0, 1.1);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xc8c0b2,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });
    headGroup.add(new THREE.Mesh(innerGeom, innerMat));

    // Nose indicator
    const noseGeom = new THREE.ConeGeometry(0.18, 0.45, 16);
    noseGeom.rotateX(Math.PI / 2);
    const noseMat = new THREE.MeshBasicMaterial({ color: 0x84512e, transparent: true, opacity: 0.45 });
    const nose = new THREE.Mesh(noseGeom, noseMat);
    nose.position.set(0, 0.55, 2.3);
    headGroup.add(nose);

    // Ear indicators
    const earGeom = new THREE.TorusGeometry(0.25, 0.05, 8, 16, Math.PI);
    const earMat = new THREE.MeshBasicMaterial({ color: 0x9c9485, transparent: true, opacity: 0.45 });
    const leftEar = new THREE.Mesh(earGeom, earMat);
    leftEar.position.set(-2.0, 0.0, 0);
    leftEar.rotation.y = Math.PI / 2;
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeom, earMat);
    rightEar.position.set(2.0, 0.0, 0);
    rightEar.rotation.y = -Math.PI / 2;
    headGroup.add(rightEar);

    scene.add(headGroup);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      controls.update();

      if (showPulses && pulseParticlesRef.current.length > 0) {
        pulseParticlesRef.current.forEach(p => {
          p.t = (p.t + p.speed * delta) % 1.0;
          if (p.curve) {
            const pt = p.curve.getPoint(p.t);
            p.mesh.position.copy(pt);
            const scale = 0.032 + Math.sin(p.t * Math.PI) * 0.015;
            p.mesh.scale.set(scale, scale, scale);
          }
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  useEffect(() => {
    if (cortexMeshRef.current) {
      cortexMeshRef.current.material.wireframe = cortexStyle === 'wireframe';
      cortexMeshRef.current.material.opacity = cortexStyle === 'wireframe' ? 0.28 : 0.16;
      cortexMeshRef.current.material.needsUpdate = true;
    }
  }, [cortexStyle]);

  /* ── Build Electrodes & Connections ── */
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    electrodeMeshesRef.current.forEach(item => {
      scene.remove(item.group);
      if (item.geom) item.geom.dispose();
      if (item.mat) item.mat.dispose();
    });
    electrodeMeshesRef.current = [];

    edgeTubesRef.current.forEach(tube => {
      scene.remove(tube.mesh);
      if (tube.geom) tube.geom.dispose();
      if (tube.mat) tube.mat.dispose();
    });
    edgeTubesRef.current = [];

    pulseParticlesRef.current.forEach(p => {
      scene.remove(p.mesh);
      if (p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mesh.material) p.mesh.material.dispose();
    });
    pulseParticlesRef.current = [];

    /* 1. Electrode Meshes */
    const newElectrodeMeshes = [];
    nodesList.forEach(node => {
      const p = node.pos;
      if (!p) return;

      const group = new THREE.Group();
      group.position.set(p.x, p.y, p.z);

      const importance = node.value || 0.5;
      const radius = 0.08 + importance * 0.05;

      const geom = new THREE.SphereGeometry(radius, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x14161a,
        roughness: 0.35,
      });
      const sphere = new THREE.Mesh(geom, mat);
      sphere.userData = { isElectrode: true, node };
      group.add(sphere);

      const glowGeom = new THREE.SphereGeometry(radius * 1.35, 12, 12);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x84512e,
        transparent: true,
        opacity: 0.3,
        wireframe: true,
      });
      const outerGlow = new THREE.Mesh(glowGeom, glowMat);
      group.add(outerGlow);

      const sprite = makeTextSprite(node.label);
      const radialDir = new THREE.Vector3(p.x, p.y, p.z).normalize().multiplyScalar(0.24);
      sprite.position.copy(radialDir);
      group.add(sprite);

      scene.add(group);

      newElectrodeMeshes.push({
        node,
        group,
        sphere,
        outerGlow,
        geom,
        mat,
      });
    });
    electrodeMeshesRef.current = newElectrodeMeshes;

    /* 2. Connection Arcs */
    const newEdgeTubes = [];
    const newPulseParticles = [];
    const particleGeom = new THREE.SphereGeometry(1, 8, 8);

    activeEdges.forEach(edge => {
      if (!edge.srcPos || !edge.tgtPos) return;

      const v1 = new THREE.Vector3(edge.srcPos.x, edge.srcPos.y, edge.srcPos.z);
      const v2 = new THREE.Vector3(edge.tgtPos.x, edge.tgtPos.y, edge.tgtPos.z);

      const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
      const dist = v1.distanceTo(v2);
      const lift = Math.min(dist * 0.40, 0.90);
      const normal = mid.clone().normalize();
      const controlPoint = mid.add(normal.multiplyScalar(lift));

      const curve = new THREE.QuadraticBezierCurve3(v1, controlPoint, v2);

      const tubeRadius = 0.012 + (edge.weight - minWeight) * 0.024;
      const tubeGeom = new THREE.TubeGeometry(curve, 24, tubeRadius, 8, false);

      const style = getPathwayStyle(edge.weight);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: style.hex,
        transparent: true,
        opacity: Math.min(0.45 + edge.weight * 0.5, 0.92),
        roughness: 0.4,
      });

      const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
      tubeMesh.userData = { isEdge: true, edge };
      scene.add(tubeMesh);

      newEdgeTubes.push({
        edge,
        mesh: tubeMesh,
        geom: tubeGeom,
        mat: tubeMat,
        curve,
        baseColor: style.hex,
      });

      if (showPulses) {
        const pMat = new THREE.MeshBasicMaterial({
          color: 0x84512e,
          transparent: true,
          opacity: 0.9,
        });
        const pMesh = new THREE.Mesh(particleGeom, pMat);
        scene.add(pMesh);

        newPulseParticles.push({
          mesh: pMesh,
          curve,
          t: Math.random(),
          speed: 0.2 + edge.weight * 0.35,
        });
      }
    });

    edgeTubesRef.current = newEdgeTubes;
    pulseParticlesRef.current = newPulseParticles;

  }, [nodesList, activeEdges, minWeight, showPulses]);

  /* ── Raycast Hover ── */
  const handlePointerMove = (e) => {
    const container = containerRef.current;
    if (!container || !cameraRef.current) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mouseRef.current.set(x, y);

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const electrodeSpheres = electrodeMeshesRef.current.map(em => em.sphere);
    const intersects = raycasterRef.current.intersectObjects(electrodeSpheres, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object.userData.node;
      setHoveredNode(hit);
      setTooltipPos({
        x: e.clientX - rect.left + 14,
        y: e.clientY - rect.top + 14,
        visible: true,
      });
      container.style.cursor = 'pointer';
    } else {
      setHoveredNode(null);
      setTooltipPos(prev => ({ ...prev, visible: false }));
      container.style.cursor = 'grab';
    }
  };

  const handleClick = () => {
    if (hoveredNode) {
      setSelectedNode(prev => (prev?.id === hoveredNode.id ? null : hoveredNode));
    }
  };

  const activeFocusNode = selectedNode || hoveredNode;
  useEffect(() => {
    if (!edgeTubesRef.current.length) return;

    edgeTubesRef.current.forEach(tube => {
      const e = tube.edge;
      if (!activeFocusNode) {
        tube.mat.opacity = Math.min(0.45 + e.weight * 0.5, 0.92);
      } else {
        const isConnected = e.source === activeFocusNode.id || e.target === activeFocusNode.id;
        tube.mat.opacity = isConnected ? 1.0 : 0.08;
      }
      tube.mat.needsUpdate = true;
    });

    electrodeMeshesRef.current.forEach(em => {
      if (!activeFocusNode) {
        em.sphere.scale.set(1, 1, 1);
      } else {
        const isSelf = em.node.id === activeFocusNode.id;
        const isNeighbor = activeEdges.some(
          e => (e.source === activeFocusNode.id && e.target === em.node.id) ||
               (e.target === activeFocusNode.id && e.source === em.node.id)
        );
        if (isSelf) {
          em.sphere.scale.set(1.4, 1.4, 1.4);
        } else if (isNeighbor) {
          em.sphere.scale.set(1.15, 1.15, 1.15);
        } else {
          em.sphere.scale.set(0.7, 0.7, 0.7);
        }
      }
    });
  }, [activeFocusNode, activeEdges]);

  const setCameraView = (type) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    setAutoRotate(false);
    switch (type) {
      case 'top':
        camera.position.set(0, 5.5, 0.01);
        break;
      case 'front':
        camera.position.set(0, 0.5, 5.5);
        break;
      case 'left':
        camera.position.set(-5.5, 0.5, 0);
        break;
      case 'right':
        camera.position.set(5.5, 0.5, 0);
        break;
      case 'iso':
      default:
        camera.position.set(3.8, 3.2, 4.6);
        break;
    }
    controls.target.set(0, 0.3, 0);
    controls.update();
  };

  const nodeStats = useMemo(() => {
    if (!activeFocusNode) return null;
    const nodeEdges = activeEdges.filter(
      e => e.source === activeFocusNode.id || e.target === activeFocusNode.id
    );
    const sortedEdges = [...nodeEdges].sort((a, b) => b.weight - a.weight);
    return {
      count: nodeEdges.length,
      topLinks: sortedEdges.slice(0, 4).map(e => ({
        partner: e.source === activeFocusNode.id ? e.tgtLabel : e.srcLabel,
        weight: e.weight,
      })),
    };
  }, [activeFocusNode, activeEdges]);

  return (
    <div style={{
      background: '#FAF6F0',
      border: '1px solid #D8D1C4',
      borderRadius: 8,
      padding: 18,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12, flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#84512E',
            display: 'block',
            marginBottom: 2,
          }}>
            Spatial Topography
          </span>
          <h3 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 18,
            fontWeight: 600,
            color: '#14161A',
            margin: 0,
          }}>
            3D Anatomical Connectivity Cortex
          </h3>
        </div>

        {/* Camera Views Quick Switch */}
        <div style={{
          display: 'flex', gap: 3, background: '#F3EDE3',
          borderRadius: 6, padding: 3, border: '1px solid #D8D1C4',
        }}>
          {[
            { id: 'iso', label: 'Isometric' },
            { id: 'top', label: 'Axial' },
            { id: 'front', label: 'Coronal' },
            { id: 'left', label: 'Left' },
            { id: 'right', label: 'Right' },
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setCameraView(view.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#3A3E45',
                fontSize: 11,
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                padding: '4px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#84512E'; e.currentTarget.style.background = '#FAF6F0'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#3A3E45'; e.currentTarget.style.background = 'transparent'; }}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Controls Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10, marginBottom: 12, padding: '8px 12px',
        background: '#F3EDE3', borderRadius: 6,
        border: '1px solid #D8D1C4',
      }}>
        {/* Threshold Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7078', fontWeight: 600 }}>THRESHOLD:</span>
          <input
            type="range"
            min={0.20}
            max={0.80}
            step={0.05}
            value={minWeight}
            onChange={e => setMinWeight(parseFloat(e.target.value))}
            style={{ width: 100, accentColor: '#84512E', cursor: 'pointer', height: 4 }}
          />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#84512E',
            padding: '2px 6px', background: '#FAF6F0', border: '1px solid #D8D1C4', borderRadius: 4, minWidth: 32, textAlign: 'center',
          }}>
            {minWeight.toFixed(2)}
          </span>
          <span style={{ fontSize: 11, color: '#6B7078' }}>
            ({activeEdges.length} active pairs)
          </span>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setAutoRotate(r => !r)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #D8D1C4',
              background: autoRotate ? '#84512E' : '#FAF6F0',
              color: autoRotate ? '#FFFFFF' : '#3A3E45',
              fontSize: 11,
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
            }}
          >
            {autoRotate ? 'Pause Rotation' : 'Auto-Rotate'}
          </button>

          <button
            onClick={() => setShowPulses(p => !p)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #D8D1C4',
              background: showPulses ? '#84512E' : '#FAF6F0',
              color: showPulses ? '#FFFFFF' : '#3A3E45',
              fontSize: 11,
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
            }}
          >
            {showPulses ? 'Pulses Active' : 'Pulses Off'}
          </button>

          <button
            onClick={() => setCortexStyle(s => s === 'wireframe' ? 'solid' : 'wireframe')}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #D8D1C4',
              background: '#FAF6F0',
              color: '#3A3E45',
              fontSize: 11,
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            Mesh: {cortexStyle}
          </button>
        </div>
      </div>

      {/* ── 3D Viewport ── */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        style={{
          width: '100%',
          height: 460,
          position: 'relative',
          borderRadius: 6,
          overflow: 'hidden',
          background: '#E6DFD3',
          border: '1px solid #D8D1C4',
        }}
      >
        <div style={{
          position: 'absolute', bottom: 10, left: 10, zIndex: 10,
          background: 'rgba(250,246,240,0.92)',
          padding: '4px 10px', borderRadius: 4, border: '1px solid #D8D1C4',
          fontSize: 11, color: '#6B7078', display: 'flex', alignItems: 'center', gap: 6,
          pointerEvents: 'none',
        }}>
          <span>Drag to orbit</span>
          <span>•</span>
          <span>Scroll to zoom</span>
          <span>•</span>
          <span>Hover / Click electrode</span>
        </div>

        {selectedNode && (
          <div style={{
            position: 'absolute', top: 10, left: 10, zIndex: 10,
            background: '#FAF6F0',
            padding: '6px 12px', borderRadius: 4, border: '1px solid #84512E',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#84512E' }}>
              PINNED: {selectedNode.label} ({selectedNode.region})
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              style={{
                background: '#F3EDE3', border: '1px solid #D8D1C4', color: '#6B7078',
                fontSize: 10, borderRadius: 3, padding: '2px 5px', cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>
        )}

        {tooltipPos.visible && hoveredNode && (
          <div style={{
            position: 'absolute',
            left: Math.min(tooltipPos.x, (containerRef.current?.clientWidth || 400) - 180),
            top: Math.min(tooltipPos.y, 340),
            zIndex: 20,
            background: '#FAF6F0',
            border: '1px solid #D8D1C4',
            borderRadius: 6,
            padding: '8px 12px',
            pointerEvents: 'none',
            boxShadow: '0 4px 10px rgba(20, 22, 26, 0.08)',
            minWidth: 150,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#14161A' }}>
                {hoveredNode.label}
              </span>
              <span style={{ fontSize: 10, color: '#84512E', fontFamily: 'var(--font-mono)' }}>
                {hoveredNode.region}
              </span>
            </div>

            <div style={{ fontSize: 11, color: '#3A3E45', marginBottom: 4 }}>
              Attention Weight: <strong style={{ color: '#84512E' }}>{((hoveredNode.value || 0) * 100).toFixed(1)}%</strong>
            </div>

            {nodeStats && (
              <div style={{ borderTop: '1px solid #E2DBD0', paddingTop: 4 }}>
                <div style={{ fontSize: 10, color: '#6B7078', fontWeight: 600, marginBottom: 3 }}>
                  Connected Channels: {nodeStats.count}
                </div>
                {nodeStats.topLinks.map((link, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                    <span style={{ color: '#3A3E45' }}>↔ {link.partner}</span>
                    <span style={{ color: '#84512E', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {link.weight.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div style={{
        marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 10, paddingTop: 10, borderTop: '1px solid #E2DBD0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B7078', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Path Coherence:
          </span>
          {[
            { label: '≥ 0.80 Very Strong', color: '#84512E' },
            { label: '≥ 0.65 Strong', color: '#A86C43' },
            { label: '≥ 0.50 Moderate', color: '#5A544B' },
            { label: '< 0.50 Weak', color: '#9E9587' },
          ].map(w => (
            <div key={w.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 3, borderRadius: 2, background: w.color }} />
              <span style={{ fontSize: 11, color: '#3A3E45' }}>{w.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
