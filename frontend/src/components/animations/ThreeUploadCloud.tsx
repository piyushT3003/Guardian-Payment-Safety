import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeUploadCloudProps {
  isScanning?: boolean;
  className?: string;
}

export const ThreeUploadCloud: React.FC<ThreeUploadCloudProps> = ({
  isScanning = false,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 200;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Cloud Body Constructed with overlapping spheres
    const cloudGroup = new THREE.Group();
    mainGroup.add(cloudGroup);

    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x8b5cf6,
      emissive: 0x4c1d95,
      emissiveIntensity: 0.35,
      metalness: 0.3,
      roughness: 0.2,
      clearcoat: 0.9,
    });

    const spherePositions = [
      { x: 0, y: 0.2, z: 0, r: 0.65 },
      { x: -0.6, y: -0.1, z: 0, r: 0.5 },
      { x: 0.6, y: -0.1, z: 0, r: 0.5 },
      { x: -0.3, y: -0.2, z: 0.2, r: 0.45 },
      { x: 0.3, y: -0.2, z: 0.2, r: 0.45 },
    ];

    spherePositions.forEach((pos) => {
      const geo = new THREE.SphereGeometry(pos.r, 24, 24);
      const mesh = new THREE.Mesh(geo, sphereMat);
      mesh.position.set(pos.x, pos.y, pos.z);
      cloudGroup.add(mesh);
    });

    // 2. 3D Arrow pointing upwards into cloud
    const arrowGroup = new THREE.Group();
    arrowGroup.position.set(0, -0.75, 0.35);
    mainGroup.add(arrowGroup);

    const shaftGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 16);
    const arrowMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    });
    const shaftMesh = new THREE.Mesh(shaftGeo, arrowMat);
    shaftMesh.position.y = -0.1;
    arrowGroup.add(shaftMesh);

    const tipGeo = new THREE.ConeGeometry(0.24, 0.4, 16);
    const tipMesh = new THREE.Mesh(tipGeo, arrowMat);
    tipMesh.position.y = 0.25;
    arrowGroup.add(tipMesh);

    // 3. Scanning Rings
    const ringGeo = new THREE.RingGeometry(1.2, 1.25, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: isScanning ? 0.8 : 0.3,
    });
    const scanningRing = new THREE.Mesh(ringGeo, ringMat);
    scanningRing.rotation.x = Math.PI / 2.2;
    mainGroup.add(scanningRing);

    // 4. Floating particles rising into cloud
    const particleCount = 14;
    const particles: THREE.Mesh[] = [];
    const pGeo = new THREE.SphereGeometry(0.035, 12, 12);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
    });

    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(
        (Math.random() - 0.5) * 1.6,
        -1.2 + Math.random() * 0.8,
        (Math.random() - 0.5) * 0.8
      );
      mainGroup.add(p);
      particles.push(p);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(2, 4, 4);
    scene.add(dirLight);

    const colorLight = new THREE.PointLight(0x7c3aed, 2, 8);
    colorLight.position.set(-2, -1, 3);
    scene.add(colorLight);

    // Mouse parallax
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    container.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Floating oscillation
      cloudGroup.position.y = Math.sin(t * 1.8) * 0.08;
      arrowGroup.position.y = -0.75 + Math.sin(t * 3.5) * 0.12;

      // Scanning ring spin
      scanningRing.rotation.z += isScanning ? 0.05 : 0.015;
      if (isScanning) {
        scanningRing.position.y = Math.sin(t * 3) * 0.6;
      } else {
        scanningRing.position.y = -0.2;
      }

      // Floating upload particles
      particles.forEach((p, idx) => {
        p.position.y += 0.02 + (idx % 3) * 0.005;
        if (p.position.y > 0.4) {
          p.position.y = -1.2;
        }
      });

      // Smooth mouse follow
      mainGroup.rotation.y += (mouseX * 0.45 - mainGroup.rotation.y) * 0.08;
      mainGroup.rotation.x += (-mouseY * 0.35 - mainGroup.rotation.x) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMouseMove);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isScanning]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-44 flex items-center justify-center pointer-events-auto ${className}`}
      title="Interactive 3D Data Upload Visual"
    />
  );
};
