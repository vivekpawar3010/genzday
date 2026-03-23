import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const FloatingShape = ({ position, color, speed, size }: { position: [number, number, number], color: string, speed: number, size: number }) => {
  const mesh = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x += 0.01 * speed;
      mesh.current.rotation.y += 0.01 * speed;
      mesh.current.position.y += Math.sin(state.clock.getElapsedTime() * speed) * 0.005;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      <Sphere ref={mesh} position={position} args={[size, 32, 32]}>
        <MeshDistortMaterial
          color={color}
          speed={speed}
          distort={0.4}
          radius={1}
          emissive={color}
          emissiveIntensity={0.2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
};

const Scene = () => {
  const shapes = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      ] as [number, number, number],
      color: i % 2 === 0 ? '#10b981' : '#059669',
      speed: 0.5 + Math.random(),
      size: 0.2 + Math.random() * 0.5
    }));
  }, []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 8]} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
      
      {shapes.map((shape, i) => (
        <FloatingShape key={i} {...shape} />
      ))}
      
      <fog attach="fog" args={['#064e3b', 5, 20]} />
    </>
  );
};

export const ThreeDBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#064e3b]">
      <Canvas dpr={[1, 2]}>
        <Scene />
      </Canvas>
    </div>
  );
};
