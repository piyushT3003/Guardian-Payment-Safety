import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeShieldProps {
  className?: string;
}

export const ThreeShield: React.FC<ThreeShieldProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 550;
    const height = container.clientHeight || 450;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Root Group for Mouse Parallax & Scroll Movement
    const mainGroup = new THREE.Group();
    mainGroup.scale.set(0.9, 0.9, 0.9); // will animate in
    scene.add(mainGroup);

    // ---------------------------------------------------------
    // 1. Concentric Animated Scanning Rings at base
    // ---------------------------------------------------------
    const ringsGroup = new THREE.Group();
    ringsGroup.position.set(0, -1.8, 0);
    ringsGroup.rotation.x = Math.PI / 2.3;
    mainGroup.add(ringsGroup);

    const ringRadii = [1.8, 2.3, 2.8, 3.3];
    const ringMeshes: THREE.Mesh[] = [];

    ringRadii.forEach((radius, i) => {
      const ringGeo = new THREE.RingGeometry(radius, radius + 0.05, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x06b6d4 : 0x8b5cf6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55 - i * 0.08,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringsGroup.add(ringMesh);
      ringMeshes.push(ringMesh);
    });

    // Orbiting Tilted Holographic Gyroscope Ring (around the shield)
    const gyroRingGeo = new THREE.TorusGeometry(2.1, 0.02, 16, 100);
    const gyroRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
    });
    const gyroRingMesh = new THREE.Mesh(gyroRingGeo, gyroRingMat);
    gyroRingMesh.rotation.x = Math.PI / 3;
    mainGroup.add(gyroRingMesh);

    // ---------------------------------------------------------
    // 2. 3D Guardian Shield
    // ---------------------------------------------------------
    const shieldGroup = new THREE.Group();
    mainGroup.add(shieldGroup);

    // Shield shape outline
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(0, 1.6);
    shieldShape.quadraticCurveTo(1.4, 1.5, 1.4, 0.2);
    shieldShape.quadraticCurveTo(1.3, -1.1, 0, -1.8);
    shieldShape.quadraticCurveTo(-1.3, -1.1, -1.4, 0.2);
    shieldShape.quadraticCurveTo(-1.4, 1.5, 0, 1.6);

    const extrudeSettings = {
      depth: 0.35,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 2,
      bevelSize: 0.12,
      bevelThickness: 0.12,
    };

    const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, extrudeSettings);
    shieldGeo.center();

    // High-gloss metallic purple-blue material with high emissive clarity
    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x6d28d9,
      emissive: 0x3b0764,
      emissiveIntensity: 0.35,
      metalness: 0.65,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.95,
    });

    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.castShadow = true;
    shieldMesh.receiveShadow = true;
    shieldGroup.add(shieldMesh);

    // Inner shield glowing rim
    const innerShape = new THREE.Shape();
    innerShape.moveTo(0, 1.35);
    innerShape.quadraticCurveTo(1.15, 1.25, 1.15, 0.15);
    innerShape.quadraticCurveTo(1.05, -0.9, 0, -1.5);
    innerShape.quadraticCurveTo(-1.05, -0.9, -1.15, 0.15);
    innerShape.quadraticCurveTo(-1.15, 1.25, 0, 1.35);

    const innerGeo = new THREE.ExtrudeGeometry(innerShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    });
    innerGeo.center();

    const innerMat = new THREE.MeshPhysicalMaterial({
      color: 0x8b5cf6,
      emissive: 0x581c87,
      emissiveIntensity: 0.45,
      metalness: 0.4,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.position.z = 0.22;
    shieldGroup.add(innerMesh);

    // White Glowing Checkmark on Shield
    const checkShape = new THREE.Shape();
    checkShape.moveTo(-0.55, 0.0);
    checkShape.lineTo(-0.2, -0.4);
    checkShape.lineTo(0.55, 0.45);
    checkShape.lineTo(0.42, 0.58);
    checkShape.lineTo(-0.2, -0.15);
    checkShape.lineTo(-0.45, 0.12);
    checkShape.closePath();

    const checkGeo = new THREE.ExtrudeGeometry(checkShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    });
    checkGeo.center();

    const checkMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.85,
      metalness: 0.1,
      roughness: 0.08,
      clearcoat: 1.0,
    });

    const checkMesh = new THREE.Mesh(checkGeo, checkMat);
    checkMesh.position.z = 0.35;
    shieldGroup.add(checkMesh);

    // ---------------------------------------------------------
    // 3. Floating 3D Payment Cards at Varying Depths (Req 3)
    // ---------------------------------------------------------
    // Card 1: Foreground Left
    const cardGroup1 = new THREE.Group();
    cardGroup1.position.set(-1.75, 0.75, 0.85);
    cardGroup1.rotation.set(0.2, 0.45, -0.15);
    mainGroup.add(cardGroup1);

    const cardGeo1 = new THREE.BoxGeometry(1.5, 0.95, 0.04);
    const cardMat1 = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      emissive: 0x075985,
      emissiveIntensity: 0.4,
      metalness: 0.55,
      roughness: 0.2,
      clearcoat: 0.95,
    });
    const cardMesh1 = new THREE.Mesh(cardGeo1, cardMat1);
    cardGroup1.add(cardMesh1);

    // Chip on card 1
    const chipGeo1 = new THREE.BoxGeometry(0.25, 0.2, 0.06);
    const chipMat1 = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
      metalness: 0.9,
      roughness: 0.15,
    });
    const chipMesh1 = new THREE.Mesh(chipGeo1, chipMat1);
    chipMesh1.position.set(-0.45, 0.15, 0.02);
    cardGroup1.add(chipMesh1);

    // Card 1 stripe
    const stripeGeo1 = new THREE.BoxGeometry(1.0, 0.08, 0.05);
    const stripeMat1 = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const stripeMesh1 = new THREE.Mesh(stripeGeo1, stripeMat1);
    stripeMesh1.position.set(0.1, -0.15, 0.02);
    cardGroup1.add(stripeMesh1);

    // Card 2: Secondary Platinum/Emerald Card in Background Right (Deeper Z)
    const cardGroup2 = new THREE.Group();
    cardGroup2.position.set(1.65, 0.9, -0.35);
    cardGroup2.rotation.set(-0.15, -0.38, 0.18);
    mainGroup.add(cardGroup2);

    const cardGeo2 = new THREE.BoxGeometry(1.3, 0.82, 0.035);
    const cardMat2 = new THREE.MeshPhysicalMaterial({
      color: 0x059669,
      emissive: 0x064e3b,
      emissiveIntensity: 0.35,
      metalness: 0.7,
      roughness: 0.22,
      clearcoat: 0.9,
    });
    const cardMesh2 = new THREE.Mesh(cardGeo2, cardMat2);
    cardGroup2.add(cardMesh2);

    // Chip on card 2
    const chipMesh2 = new THREE.Mesh(chipGeo1, chipMat1);
    chipMesh2.position.set(-0.38, 0.12, 0.02);
    cardGroup2.add(chipMesh2);

    // ---------------------------------------------------------
    // 4. Floating 3D Security Lock (Req 5)
    // ---------------------------------------------------------
    const lockGroup = new THREE.Group();
    lockGroup.position.set(1.75, -0.45, 0.85);
    lockGroup.rotation.set(-0.15, -0.35, 0.1);
    mainGroup.add(lockGroup);

    // Lock Body
    const lockBodyGeo = new THREE.BoxGeometry(0.8, 0.7, 0.4);
    const lockBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      emissive: 0x0e7490,
      emissiveIntensity: 0.45,
      metalness: 0.65,
      roughness: 0.2,
      clearcoat: 1.0,
    });
    const lockBody = new THREE.Mesh(lockBodyGeo, lockBodyMat);
    lockGroup.add(lockBody);

    // Lock Shackle (Torus)
    const shackleGeo = new THREE.TorusGeometry(0.28, 0.07, 16, 32, Math.PI);
    const shackleMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.95,
      roughness: 0.1,
    });
    const shackle = new THREE.Mesh(shackleGeo, shackleMat);
    shackle.position.set(0, 0.35, 0);
    lockGroup.add(shackle);

    // Lock keyhole
    const keyholeGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.12, 16);
    const keyholeMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
    const keyhole = new THREE.Mesh(keyholeGeo, keyholeMat);
    keyhole.rotation.x = Math.PI / 2;
    keyhole.position.set(0, -0.05, 0.2);
    lockGroup.add(keyhole);

    // ---------------------------------------------------------
    // 5. Subtle Glowing Curved Light Trails (Req 14)
    // ---------------------------------------------------------
    const curvePoints = [
      new THREE.Vector3(-1.75, 0.75, 0.8),
      new THREE.Vector3(-0.9, 0.2, 0.4),
      new THREE.Vector3(0, -1.2, 0.2),
      new THREE.Vector3(1.0, -0.8, 0.4),
      new THREE.Vector3(1.75, -0.45, 0.8),
    ];
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.018, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.45,
    });
    const lightTrailMesh = new THREE.Mesh(tubeGeo, tubeMat);
    mainGroup.add(lightTrailMesh);

    // ---------------------------------------------------------
    // 6. Floating Security Symbols (Req 13)
    // ---------------------------------------------------------
    const symbolsGroup = new THREE.Group();
    mainGroup.add(symbolsGroup);

    const symbolCount = 3;
    const symbolMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < symbolCount; i++) {
      const symGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const symMat = new THREE.MeshPhysicalMaterial({
        color: i === 0 ? 0x10b981 : i === 1 ? 0x8b5cf6 : 0x06b6d4,
        emissive: i === 0 ? 0x059669 : i === 1 ? 0x7c3aed : 0x0891b2,
        emissiveIntensity: 0.7,
        metalness: 0.5,
        roughness: 0.2,
        wireframe: true,
      });
      const symMesh = new THREE.Mesh(symGeo, symMat);
      symbolsGroup.add(symMesh);
      symbolMeshes.push(symMesh);
    }

    // ---------------------------------------------------------
    // 7. Ambient Floating Glow Spheres/Particles (Req 7)
    // ---------------------------------------------------------
    const particlesGroup = new THREE.Group();
    mainGroup.add(particlesGroup);

    const particleCount = 26;
    const particles: THREE.Mesh[] = [];
    for (let i = 0; i < particleCount; i++) {
      const pGeo = new THREE.SphereGeometry(0.035 + Math.random() * 0.035, 12, 12);
      const pMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0x22d3ee : 0xc084fc,
        transparent: true,
        opacity: 0.45 + Math.random() * 0.4,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(
        (Math.random() - 0.5) * 5.8,
        (Math.random() - 0.5) * 4.0,
        (Math.random() - 0.5) * 2.2
      );
      particlesGroup.add(pMesh);
      particles.push(pMesh);
    }

    // ---------------------------------------------------------
    // 8. Advanced Cinematic Lighting & Specular Sheen (Req 6 & 14)
    // ---------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(0, 3, 6);
    scene.add(keyLight);

    const dirLight1 = new THREE.DirectionalLight(0x8b5cf6, 2.5);
    dirLight1.position.set(4, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 2.2);
    dirLight2.position.set(-4, -2, 4);
    scene.add(dirLight2);

    // Dynamic Moving Specular Sheen Light traversing across the shield face (Req 6)
    const sweepLight = new THREE.PointLight(0xffffff, 2.2, 6);
    sweepLight.position.set(0, 0, 1.8);
    scene.add(sweepLight);

    // ---------------------------------------------------------
    // 9. Mouse & Scroll Interaction Listeners
    // ---------------------------------------------------------
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let scrollY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.35;
      targetY = y * 0.25;
    };

    const handleScroll = () => {
      scrollY = window.scrollY || window.pageYOffset;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Entrance Animation (scale up smoothly)
    let introProgress = 0;

    // Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth intro scale
      if (introProgress < 1) {
        introProgress += 0.02;
        const currentScale = 0.9 + 0.1 * Math.min(introProgress, 1);
        mainGroup.scale.set(currentScale, currentScale, currentScale);
      }

      // Smooth mouse damping
      mouseX += (targetX - mouseX) * 0.06;
      mouseY += (targetY - mouseY) * 0.06;

      // Scroll-linked pitch and position
      const scrollTilt = Math.min(scrollY * 0.0004, 0.2);

      // Central Shield subtle floating & rotation
      shieldGroup.rotation.y = Math.sin(time * 0.75) * 0.12 + mouseX * 0.8;
      shieldGroup.rotation.x = Math.cos(time * 0.55) * 0.08 - mouseY * 0.5 + scrollTilt;
      shieldGroup.position.y = Math.sin(time * 1.2) * 0.12;

      // Dynamic light sheen traversing across shield surface (Req 6)
      sweepLight.position.x = Math.sin(time * 1.4) * 1.6;
      sweepLight.position.y = Math.cos(time * 1.1) * 1.1;

      // Floating card 1 (Foreground Left)
      cardGroup1.position.y = 0.75 + Math.sin(time * 1.4 + 1) * 0.14;
      cardGroup1.rotation.y = 0.45 + Math.cos(time * 0.9) * 0.14 + mouseX * 0.4;
      cardGroup1.rotation.z = -0.15 + Math.sin(time * 0.7) * 0.05;

      // Floating card 2 (Background Right, deeper in Z)
      cardGroup2.position.y = 0.9 + Math.cos(time * 1.2 + 2) * 0.12;
      cardGroup2.rotation.y = -0.38 + Math.sin(time * 0.8) * 0.12 - mouseX * 0.3;

      // Floating lock (Right)
      lockGroup.position.y = -0.45 + Math.cos(time * 1.5 + 2) * 0.12;
      lockGroup.rotation.y = -0.35 + Math.sin(time * 1.1) * 0.12 - mouseX * 0.3;
      lockGroup.rotation.x = -0.15 + Math.cos(time * 0.8) * 0.08;

      // Scanning rings rotation and pulse
      ringsGroup.rotation.z = time * 0.25;
      ringMeshes.forEach((mesh, idx) => {
        const scalePulse = 1 + Math.sin(time * 2 + idx * 0.8) * 0.03;
        mesh.scale.set(scalePulse, scalePulse, 1);
      });

      // Gyroscope ring rotation
      gyroRingMesh.rotation.z = -time * 0.4;
      gyroRingMesh.rotation.y = Math.sin(time * 0.5) * 0.25;

      // Orbiting security symbol cubes
      symbolMeshes.forEach((sym, idx) => {
        const angle = time * 0.8 + (idx * Math.PI * 2) / symbolCount;
        const radius = 2.3;
        sym.position.x = Math.cos(angle) * radius;
        sym.position.z = Math.sin(angle) * radius * 0.5;
        sym.position.y = Math.sin(time * 2 + idx) * 0.3;
        sym.rotation.x += 0.02;
        sym.rotation.y += 0.03;
      });

      // Ambient particles floating
      particles.forEach((p, idx) => {
        p.position.y += Math.sin(time + idx) * 0.003;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full min-h-[420px] max-h-[500px] flex items-center justify-center cursor-pointer ${className}`}
      title="Interactive 3D Guardian Shield (Move mouse or scroll to interact)"
    />
  );
};
