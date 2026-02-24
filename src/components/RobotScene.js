"use client";

import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, ContactShadows, RoundedBox, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const matteBlack = new THREE.Color('#0b0b0f');
const aluminum = new THREE.Color('#d6dde6');

const Headphones = ({ headY, earX, earR, bandR, theme }) => {
    const earMat = (
        <meshPhysicalMaterial
            color="#0b0d12"
            roughness={0.16}
            metalness={0.82}
            clearcoat={0.85}
            clearcoatRoughness={0.08}
        />
    );
    const bandMat = (
        <meshPhysicalMaterial
            color="#12151d"
            roughness={0.2}
            metalness={0.72}
            clearcoat={0.65}
            clearcoatRoughness={0.1}
        />
    );
    const padMat = (
        <meshStandardMaterial
            color="#202636"
            roughness={0.7}
            metalness={0.05}
        />
    );

    const accentMat = (
        <meshStandardMaterial
            color={theme.accent}
            emissive={theme.accent}
            emissiveIntensity={0.9}
            toneMapped={false}
        />
    );

    return (
        <group position={[0, headY, 0.05]}>
            {/* left cup */}
            <group position={[-earX * 0.92, -earR * 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh>
                    <cylinderGeometry args={[earR * 1.15, earR * 1.15, earR * 1.25, 48]} />
                    {earMat}
                </mesh>
                <mesh position={[0, 0, -earR * 0.62]}>
                    <cylinderGeometry args={[earR * 0.82, earR * 0.82, earR * 0.25, 32]} />
                    {padMat}
                </mesh>
                <mesh position={[0, 0, earR * 0.52]}>
                    <cylinderGeometry args={[earR * 0.78, earR * 0.78, earR * 0.08, 24]} />
                    {accentMat}
                </mesh>
            </group>
            {/* right cup */}
            <group position={[earX * 0.92, -earR * 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh>
                    <cylinderGeometry args={[earR * 1.15, earR * 1.15, earR * 1.25, 48]} />
                    {earMat}
                </mesh>
                <mesh position={[0, 0, -earR * 0.62]}>
                    <cylinderGeometry args={[earR * 0.82, earR * 0.82, earR * 0.25, 32]} />
                    {padMat}
                </mesh>
                <mesh position={[0, 0, earR * 0.52]}>
                    <cylinderGeometry args={[earR * 0.78, earR * 0.78, earR * 0.08, 24]} />
                    {accentMat}
                </mesh>
            </group>
            {/* yokes */}
            <mesh position={[-earX * 0.92, earR * 0.08, 0]} rotation={[0, 0, 0]}>
                <capsuleGeometry args={[earR * 0.2, earR * 1.4, 8, 24]} />
                {bandMat}
            </mesh>
            <mesh position={[earX * 0.92, earR * 0.08, 0]} rotation={[0, 0, 0]}>
                <capsuleGeometry args={[earR * 0.2, earR * 1.4, 8, 24]} />
                {bandMat}
            </mesh>
            {/* small connectors to cups */}
            <mesh position={[-earX * 0.96, earR * -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[earR * 0.22, earR * 0.22, earR * 0.95, 16]} />
                {bandMat}
            </mesh>
            <mesh position={[earX * 0.96, earR * -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[earR * 0.22, earR * 0.22, earR * 0.95, 16]} />
                {bandMat}
            </mesh>
            {/* headband */}
            <mesh position={[0, earR * 0.78, -0.02]} rotation={[0, 0, 0]}>
                <torusGeometry args={[bandR * 0.9, earR * 0.32, 16, 64, Math.PI]} />
                {bandMat}
            </mesh>
        </group>
    );
};

const NeonStrips = ({ size, theme }) => {
    const stripMat = (
        <meshStandardMaterial
            color={theme.strip}
            emissive={theme.strip}
            emissiveIntensity={2.2}
            toneMapped={false}
        />
    );

    const armY = size.y * 0.05;
    const legY = -size.y * 0.3;
    const sideX = size.x * 0.42;
    const z = size.z * 0.35;
    const armLen = size.y * 0.22;
    const legLen = size.y * 0.24;
    const thickness = size.x * 0.06;

    return (
        <group>
            <mesh position={[-sideX, armY, z]} rotation={[0, 0, 0.3]}>
                <boxGeometry args={[thickness, armLen, thickness * 0.7]} />
                {stripMat}
            </mesh>
            <mesh position={[sideX, armY, z]} rotation={[0, 0, -0.3]}>
                <boxGeometry args={[thickness, armLen, thickness * 0.7]} />
                {stripMat}
            </mesh>
            <mesh position={[-sideX * 0.45, legY, z]}>
                <boxGeometry args={[thickness, legLen, thickness * 0.7]} />
                {stripMat}
            </mesh>
            <mesh position={[sideX * 0.45, legY, z]}>
                <boxGeometry args={[thickness, legLen, thickness * 0.7]} />
                {stripMat}
            </mesh>
        </group>
    );
};

const FaceEqualizer = ({ lipScale, barsRef, headY, faceZ, size, theme }) => {
    const barMat = (color) => (
        <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={6}
            toneMapped={false}
        />
    );

    const bars = new Array(15).fill(0).map((_, i) => i);
    const screenW = size.x * 0.9;
    const screenH = size.y * 0.22;
    const screenD = Math.max(size.z * 0.06, 0.04);
    const barW = screenW * 0.05;
    const barH = screenH * 0.55;

    return (
        <group position={[0, headY, faceZ]}>
            {/* unified black screen */}
            <RoundedBox
                args={[screenW, screenH, screenD]}
                radius={0.12}
                smoothness={32}
                position={[0, 0, -screenD * 0.2]}
                renderOrder={10}
            >
                <meshPhysicalMaterial
                    color="#06080d"
                    metalness={0.7}
                    roughness={0.08}
                    clearcoat={0.9}
                    clearcoatRoughness={0.04}
                    emissive="#000000"
                    depthTest={false}
                    depthWrite={false}
                />
            </RoundedBox>
            {/* neon equalizer inside the screen */}
            <group position={[0, -screenH * 0.05, screenD * 0.2]}>
                {bars.map((i) => (
                    <mesh
                        key={i}
                        ref={(el) => {
                            barsRef.current[i] = el;
                        }}
                        position={[-screenW * 0.42 + i * (screenW * 0.06), 0, screenD * 0.2]}
                        renderOrder={11}
                    >
                        <boxGeometry args={[barW, barH, screenD * 0.6]} />
                        {React.cloneElement(
                            barMat(
                                theme.base.clone().lerp(theme.accent, i / Math.max(bars.length - 1, 1))
                            ),
                            { depthTest: false, depthWrite: false }
                        )}
                    </mesh>
                ))}
            </group>
        </group>
    );
};

const RobotModel = ({ lipScale, headAngle, robotState, selectedGenre, dynamicColor, dynamicBpm = 120 }) => {
    const group = useRef();
    const barsRef = useRef([]);
    const frameRef = useRef(0);

    const { scene } = useGLTF('/models/robot-hiphop.glb');
    const modelData = useMemo(() => {
        const clone = scene.clone(true);
        const box = new THREE.Box3().setFromObject(clone);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        const targetHeight = 2.9;
        const scale = targetHeight / Math.max(size.y, 0.001);

        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.geometry) {
                    child.geometry.computeBoundingBox();
                    const box = child.geometry.boundingBox;
                    const c = new THREE.Vector3();
                    box.getCenter(c);
                    // Hide original angular hands by position heuristic
                    const handZoneX = size.x * 0.2;
                    const handZoneYMin = size.y * -0.2;
                    const handZoneYMax = size.y * 0.35;
                    const handZoneZMin = size.z * -0.1;
                    if (
                        Math.abs(c.x) > handZoneX &&
                        c.y > handZoneYMin &&
                        c.y < handZoneYMax &&
                        c.z > handZoneZMin
                    ) {
                        child.visible = false;
                    }
                }
                const mat = new THREE.MeshPhysicalMaterial({
                    color: aluminum,
                    metalness: 0.35,
                    roughness: 0.2,
                    clearcoat: 0.9,
                    clearcoatRoughness: 0.06,
                });
                child.material = mat;
            }
        });
        clone.position.sub(center);
        return { model: clone, size, scale };
    }, [scene]);
    const { model, size, scale } = modelData;

    const shellMat = (
        <meshPhysicalMaterial
            color="#f7f8fc"
            metalness={0.16}
            roughness={0.055}
            clearcoat={1.0}
            clearcoatRoughness={0.035}
        />
    );

    const headY = size.y * 0.28;
    const headR = size.x * 0.68;
    const bodyY = -size.y * 0.05;
    const bodyR = size.x * 0.46;
    const bodyLen = size.y * 0.52;
    const limbR = size.x * 0.14;
    const armLen = size.y * 0.22;
    const legLen = size.y * 0.24;
    const armX = size.x * 0.5;
    const legX = size.x * 0.16;
    const handR = size.x * 0.14;
    const coverR = size.x * 0.16;
    const bodyTopY = bodyY + bodyLen * 0.22;
    const handY = bodyTopY - bodyLen * 0.45;
    const handZ = size.z * 0.18;
    const handX = size.x * 0.42;

    const [logoTexture, setLogoTexture] = useState(null);
    const logoCanvasRef = useRef(null);
    const logoCtxRef = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        logoCanvasRef.current = canvas;
        logoCtxRef.current = ctx;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 3;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2 + 8);
        ctx.transform(1, 0, -0.1, 1, 0, 0);
        ctx.font = '900 225px "Impact", "Arial Black", "Helvetica", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // thick black outline
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 16;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.strokeText('OBG', 0, 0);

        // inner colored fill (will be animated)
        ctx.fillStyle = '#2ef9ff';
        ctx.fillText('OBG', 0, 0);

        // inner highlight stroke
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.strokeText('OBG', 0, 0);
        ctx.restore();

        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 8;
        texture.needsUpdate = true;
        setLogoTexture(texture);
    }, []);

    useFrame((state) => {
        if (!group.current) return;

        const target = new THREE.Vector3(
            (state.pointer.x * state.viewport.width) / 2.0,
            (state.pointer.y * state.viewport.height) / 2.0 + 1.2,
            6
        );

        const dummyAt = new THREE.Object3D();
        dummyAt.position.copy(group.current.position);
        dummyAt.lookAt(target);
        group.current.quaternion.slerp(dummyAt.quaternion, 0.1);

        const t = state.clock.getElapsedTime();
        const sway = Math.sin(t * 1.6) * 0.4;
        group.current.rotation.y = THREE.MathUtils.lerp(
            group.current.rotation.y,
            sway,
            0.08
        );

        group.current.rotation.x = THREE.MathUtils.lerp(
            group.current.rotation.x,
            headAngle * 0.28,
            0.18
        );

        frameRef.current += 1;
        if (frameRef.current % 2 === 0) {
            const energy = Math.min(Math.max(lipScale * 2.0, 0.05), 2.2);
            const amp = 0.18 + energy * 1.4;
            // Sync waveform animation with LLM-provided BPM
            const bps = Math.max(0.5, (dynamicBpm / 60) * 0.9);
            barsRef.current.forEach((bar, i) => {
                if (!bar) return;
                const wave = Math.sin(t * 6.6 * bps + i * 0.55) * 0.5 + 0.5;
                const beat = Math.sin(t * bps * Math.PI) * 0.16 + 0.84;
                let h = robotState === 'singing' ? wave * 3.5 : 0.2 + wave * 0.26 + amp * beat;
                bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, h, 0.3);
            });
            if (logoTexture && logoCanvasRef.current && logoCtxRef.current) {
                const ctx = logoCtxRef.current;
                const canvas = logoCanvasRef.current;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(0,0,0,0)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.shadowColor = 'rgba(0,0,0,0.45)';
                ctx.shadowBlur = 12;
                ctx.shadowOffsetY = 3;

                const hue = (t * 60 + energy * 40) % 360;
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                gradient.addColorStop(0, `hsl(${hue}, 100%, 65%)`);
                gradient.addColorStop(0.5, `hsl(${(hue + 40) % 360}, 100%, 70%)`);
                gradient.addColorStop(1, `hsl(${(hue + 90) % 360}, 100%, 60%)`);

                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2 + 8);
                ctx.transform(1, 0, -0.1, 1, 0, 0);
                ctx.font = '900 225px "Impact", "Arial Black", "Helvetica", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.lineWidth = 16;
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.strokeText('OBG', 0, 0);
                ctx.fillStyle = gradient;
                ctx.fillText('OBG', 0, 0);
                ctx.lineWidth = 4;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
                ctx.strokeText('OBG', 0, 0);
                ctx.restore();

                logoTexture.needsUpdate = true;
            }
        }
    });
    const genreColors = {
        'Rock': { base: '#ff4500', accent: '#ffced9', strip: '#e63900' },
        'Hip-hop': { base: '#b967ff', accent: '#eabfff', strip: '#9a3ee8' },
        'K-Pop': { base: '#ff71ce', accent: '#ffe3f8', strip: '#e94db0' },
        'Lullaby': { base: '#3b82f6', accent: '#add3ff', strip: '#2563eb' },
        'Jazz': { base: '#d4af37', accent: '#fef1d6', strip: '#b89222' }
    };

    const activeColors = {
        ...(genreColors[selectedGenre] || {
            base: '#35f2ff',
            accent: '#86ffd1',
            strip: '#4aa3ff'
        })
    };

    if (dynamicColor && robotState === 'singing') {
        const hex = dynamicColor.startsWith('#') ? dynamicColor : '#' + dynamicColor;
        activeColors.base = hex;
        activeColors.strip = hex;
    }

    const baseColor = new THREE.Color(activeColors.base);
    const accentColor = new THREE.Color(activeColors.accent);
    const stripColor = new THREE.Color(activeColors.strip);

    if (robotState === 'thinking') {
        baseColor.lerp(new THREE.Color('#ffffff'), 0.4);
        accentColor.lerp(new THREE.Color('#ffe59a'), 0.5);
    } else if (robotState === 'singing') {
        baseColor.offsetHSL(0, 0, 0.1);
        accentColor.offsetHSL(0, 0, 0.1);
    }

    const theme = {
        base: baseColor,
        accent: accentColor,
        strip: stripColor,
    };

    return (
        <Float speed={2.6} rotationIntensity={0.08} floatIntensity={0.6} floatingRange={[-0.08, 0.08]}>
            <group ref={group} position={[0, -0.6, 0]} scale={[scale * 1.04, scale, scale * 1.04]}>
                <primitive object={model} />
                {/* Rounded silhouette shell */}
                <group>
                    <mesh position={[0, headY, 0.02]}>
                        <sphereGeometry args={[headR, 64, 64]} />
                        {shellMat}
                    </mesh>
                    <mesh position={[0, bodyY, 0]}>
                        <capsuleGeometry args={[bodyR, bodyLen, 12, 32]} />
                        {shellMat}
                    </mesh>
                    {/* belly logo plate */}
                    {logoTexture && (
                        <mesh
                            position={[0, bodyY - bodyLen * 0.28, bodyR * 0.74]}
                            rotation={[0, 0, Math.sin((frameRef.current || 0) * 0.02) * 0.03]}
                            renderOrder={20}
                        >
                            <planeGeometry args={[bodyR * 1.4, bodyR * 0.55]} />
                            <meshStandardMaterial
                                map={logoTexture}
                                transparent
                                opacity={0.85}
                                roughness={0.6}
                                metalness={0.0}
                                toneMapped={false}
                                depthTest={false}
                                depthWrite={false}
                            />
                        </mesh>
                    )}
                    <mesh position={[armX, headY - armLen * 0.15, 0]}>
                        <capsuleGeometry args={[limbR, armLen, 8, 24]} />
                        {shellMat}
                    </mesh>
                    <mesh position={[-armX, headY - armLen * 0.15, 0]}>
                        <capsuleGeometry args={[limbR, armLen, 8, 24]} />
                        {shellMat}
                    </mesh>
                    {/* cute tiny mittens */}
                    <mesh position={[handX, handY, handZ + handR * 0.3]}>
                        <sphereGeometry args={[handR, 48, 48]} />
                        {shellMat}
                    </mesh>
                    <mesh position={[-handX, handY, handZ + handR * 0.3]}>
                        <sphereGeometry args={[handR, 48, 48]} />
                        {shellMat}
                    </mesh>
                    {/* finger nubs */}
                    {[-1, 1].map((sign) => (
                        <group key={sign}>
                            <mesh position={[sign * handX, handY + handR * 0.35, handZ + handR * 0.7]}>
                                <sphereGeometry args={[handR * 0.35, 24, 24]} />
                                {shellMat}
                            </mesh>
                            <mesh position={[sign * handX, handY - handR * 0.1, handZ + handR * 0.75]}>
                                <sphereGeometry args={[handR * 0.32, 24, 24]} />
                                {shellMat}
                            </mesh>
                        </group>
                    ))}
                    <mesh position={[legX, bodyY - bodyLen * 0.6, 0]}>
                        <capsuleGeometry args={[limbR * 1.1, legLen, 8, 24]} />
                        {shellMat}
                    </mesh>
                    <mesh position={[-legX, bodyY - bodyLen * 0.6, 0]}>
                        <capsuleGeometry args={[limbR * 1.1, legLen, 8, 24]} />
                        {shellMat}
                    </mesh>
                </group>
                <Headphones
                    headY={headY + size.y * 0.02}
                    earX={size.x * 0.6}
                    earR={size.x * 0.22}
                    bandR={size.x * 0.68}
                    theme={theme}
                />
                <FaceEqualizer
                    lipScale={lipScale}
                    barsRef={barsRef}
                    headY={headY + size.y * 0.02}
                    faceZ={size.z * 0.9}
                    size={{ ...size, x: size.x * 1.22, y: size.y * 1.12 }}
                    theme={theme}
                />
            </group>
        </Float>
    );
};

const LightingSetup = () => {
    return (
        <>
            <ambientLight intensity={0.48} />
            <spotLight position={[0, 11, 9]} angle={0.5} penumbra={1.0} intensity={2.7} color="#ffffff" castShadow />
            <directionalLight position={[-8, 5, 7]} intensity={1.3} color="#e8f2ff" />
            <directionalLight position={[8, 4, 5]} intensity={1.12} color="#ffffff" />
            <pointLight position={[0, -4, 6]} intensity={0.78} color="#b9dbff" distance={24} />
            <pointLight position={[0, 2, 6]} intensity={0.55} color="#7df3ff" distance={10} />
        </>
    );
};

const RobotFallback = () => (
    <group>
        <mesh position={[0, -0.2, 0]}>
            <sphereGeometry args={[1.35, 32, 32]} />
            <meshStandardMaterial color="#d8dce8" metalness={0.2} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.12, 1.05]}>
            <boxGeometry args={[1.7, 0.44, 0.22]} />
            <meshStandardMaterial color="#0b0d12" emissive="#0d1119" emissiveIntensity={0.6} />
        </mesh>
    </group>
);

const ClubLights = () => {
    const l1 = useRef();
    const l2 = useRef();
    const l3 = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (l1.current) {
            l1.current.intensity = 1.2 + Math.abs(Math.sin(t * 3.6)) * 2.4;
            l1.current.color.setHSL((t * 0.45) % 1, 1.0, 0.6);
        }
        if (l2.current) {
            l2.current.intensity = 1.0 + Math.abs(Math.sin(t * 4.2 + 1.2)) * 2.0;
            l2.current.color.setHSL((t * 0.55 + 0.33) % 1, 1.0, 0.6);
        }
        if (l3.current) {
            l3.current.intensity = 1.0 + Math.abs(Math.sin(t * 3.0 + 2.4)) * 2.0;
            l3.current.color.setHSL((t * 0.4 + 0.66) % 1, 1.0, 0.6);
        }
    });

    return (
        <>
            <pointLight ref={l1} position={[3, 3, 4]} intensity={2.0} color="#20f7ff" distance={18} />
            <pointLight ref={l2} position={[-3, 2, 4]} intensity={1.8} color="#7bffd4" distance={18} />
            <pointLight ref={l3} position={[0, -1, 5]} intensity={1.6} color="#4aa3ff" distance={18} />
        </>
    );
};

export default function RobotScene({ lipScale, headAngle, robotState, selectedGenre, dynamicColor, dynamicBpm, className = '' }) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const update = () => setIsMobile(window.innerWidth < 768);
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    return (
        <div
            className={`w-full h-full min-h-0 relative pointer-events-auto flex items-center justify-center ${className}`}
            style={{ background: 'transparent' }}
        >
            <Canvas
                camera={{ position: [0, 0, 7.8], fov: 40 }}
                dpr={isMobile ? [1, 1.2] : [1, 1.7]}
                gl={{ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' }}
                style={{ background: 'transparent' }}
            >
                <Environment preset="city" environmentIntensity={1.2} />
                <LightingSetup />
                <ClubLights />
                <Suspense fallback={<RobotFallback />}>
                    <RobotModel lipScale={lipScale} headAngle={headAngle} robotState={robotState} selectedGenre={selectedGenre} dynamicColor={dynamicColor} dynamicBpm={dynamicBpm} />
                </Suspense>
                {!isMobile && (
                    <ContactShadows position={[0, -3.2, 0]} opacity={0.4} scale={10} blur={2.5} far={4} color="#000000" />
                )}
            </Canvas>
        </div>
    );
}

useGLTF.preload('/models/robot-hiphop.glb');
