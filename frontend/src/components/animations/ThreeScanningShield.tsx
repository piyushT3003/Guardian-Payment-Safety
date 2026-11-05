import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeScanningShieldProps {
  className?: string;
  isCompleted?: boolean;
}

export const ThreeScanningShield: React.FC<ThreeScanningShieldProps> = ({
  className = '',
  isCompleted = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 260;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5.0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. 3D Shield Mesh
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(0, 1.3);
    shieldShape.quadraticCurveTo(1.1, 1.2, 1.1, 0.1);
    shieldShape.quadraticCurveTo(1.0, -0.9, 0, -1.5);
    shieldShape.quadraticCurveTo(-1.0, -0.9, -1.1, 0.1);
    shieldShape.quadraticCurveTo(-1.1, 1.2, 0, 1.3);

    const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, {
      depth: 0.28,
      bevelEnabled: true,
      bevelSegments: 6,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    });
    shieldGeo.center();

    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: isCompleted ? 0x059669 : 0x6d28d9,
      emissive: isCompleted ? 0x065f46 : 0x3b0764,
      emissiveIntensity: 0.45,
      metalness: 0.7,
      roughness: 0.2,
      clearcoat: 0.9,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    mainGroup.add(shieldMesh);

    // 2. White Checkmark Mesh
    const checkShape = new THREE.Shape();
    checkShape.moveTo(-0.45, 0.0);
    checkShape.lineTo(-0.15, -0.32);
    checkShape.lineTo(0.45, 0.35);
    checkShape.lineTo(0.35, 0.45);
    checkShape.lineTo(-0.15, -0.12);
    checkShape.lineTo(-0.35, 0.1);
    checkShape.closePath();

    const checkGeo = new THREE.ExtrudeGeometry(checkShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    });
    checkGeo.center();

    const checkMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.8,
      metalness: 0.1,
      roughness: 0.1,
    });
    const checkMesh = new THREE.Mesh(checkGeo, checkMat);
    checkMesh.position.z = 0.24;
    mainGroup.add(checkMesh);

    // 3. Concentric Scanning Rings
    const ringGeo = new THREE.RingGeometry(1.6, 1.66, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: isCompleted ? 0x10b981 : 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo, ringMat);
    ringMesh1.rotation.x = Math.PI / 2.3;
    mainGroup.add(ringMesh1);

    const ringMesh2 = new THREE.Mesh(
      new THREE.RingGeometry(2.0, 2.05, 64),
      new THREE.MeshBasicMaterial({
        color: 0x8b5cf6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      })
    );
    ringMesh2.rotation.x = Math.PI / 2.5;
    mainGroup.add(ringMesh2);

    // 4. Scanning Beam
    const beamGeo = new THREE.BoxGeometry(2.4, 0.04, 0.04);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.85,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.z = 0.32;
    mainGroup.add(beamMesh);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(3, 4, 5);
    scene.add(dirLight);

    // Dynamic Moving Specular Sheen Light
    const sheenLight = new THREE.PointLight(isCompleted ? 0x34d399 : 0x38bdf8, 2.5, 6);
    sheenLight.position.set(0, 0, 1.5);
    scene.add(sheenLight);

    // Mouse rotation
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    container.addEventListener('mousemove', handleMouseMove);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Continuous subtle rotation & floating
      mainGroup.rotation.y = Math.sin(t * 1.2) * 0.25 + mouseX * 0.4;
      mainGroup.rotation.x = Math.cos(t * 1.0) * 0.12 - mouseY * 0.3;
      mainGroup.position.y = Math.sin(t * 2.0) * 0.08;

      // Scanning rings spin in opposite directions
      ringMesh1.rotation.z += 0.02;
      ringMesh2.rotation.z -= 0.015;

      // Scanning beam travels vertically
      beamMesh.position.y = Math.sin(t * 3.2) * 1.2;

      // Moving specular sheen highlight
      sheenLight.position.x = Math.sin(t * 2.2) * 1.4;
      sheenLight.position.y = Math.cos(t * 1.8) * 1.0;

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
  }, [isCompleted]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-56 flex items-center justify-center ${className}`}
      title="3D Real-time Holographic Scanning Shield"
    />
  );
};
