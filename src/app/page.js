"use client";

import React, { useState, useRef, useEffect } from 'react';
import { generateLyrics, generateMusic, AudioAnalyzer } from '@/lib/MusicEngine';
import RobotScene from '@/components/RobotScene';
import PromptInput from '@/components/PromptInput';

const Starfield = ({ tempo, selectedGenre }) => {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width = 0;
        let height = 0;
        let dpr = window.devicePixelRatio || 1;

        const stars = [];
        const sparkles = [];
        const falling = [];
        const fallingCount = 6;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            stars.length = 0;
            const starCount = Math.floor((width * height) / 7000);
            for (let i = 0; i < starCount; i += 1) {
                stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    r: Math.random() * 1.4 + 0.3,
                    tw: Math.random() * 0.6 + 0.2,
                    phase: Math.random() * Math.PI * 2,
                    hidden: false,
                });
            }

            sparkles.length = 0;
            const positions = [
                [0.12, 0.22], [0.82, 0.2], [0.5, 0.12], [0.18, 0.62],
                [0.85, 0.58], [0.5, 0.78], [0.3, 0.4], [0.7, 0.42],
            ];
            for (let i = 0; i < positions.length; i += 1) {
                const [px, py] = positions[i];
                sparkles.push({
                    x: px * width,
                    y: py * height,
                    r: 6 + Math.random() * 4,
                    phase: Math.random() * Math.PI * 2,
                    tw: 0.6 + Math.random() * 0.6,
                });
            }
        };

        const spawnFaller = (f) => {
            if (stars.length === 0) return;
            const idx = Math.floor(Math.random() * stars.length);
            f.starIndex = idx;
            f.x = stars[idx].x;
            f.y = stars[idx].y;
            const angle = (Math.random() * 0.9 + 0.25) * Math.PI; // ~45°~200°
            const speed = 260 + Math.random() * 260;
            f.vx = Math.cos(angle) * speed;
            f.vy = Math.sin(angle) * speed;
            f.life = 0;
            f.delay = 2.5 + Math.random() * 4.5;
            f.active = false;
            stars[idx].hidden = true;
        };

        const initFallers = () => {
            falling.length = 0;
            for (let i = 0; i < fallingCount; i += 1) {
                const f = {};
                spawnFaller(f);
                f.delay += i * 1.7;
                falling.push(f);
            }
        };

        const currentBg = { r: 10, g: 10, b: 15 }; // Default very dark blue/black space
        const targetBgRef = { current: { r: 10, g: 10, b: 15 } };

        let last = performance.now();
        const draw = (now) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            const tempoMul = 1 + Math.min(Math.max(tempo, 0), 0.8) * 1.6;

            const themeColors = {
                'Rock': { r: 60, g: 5, b: 5 },
                'Hip-hop': { r: 35, g: 5, b: 55 },
                'K-Pop': { r: 55, g: 5, b: 35 },
                'Lullaby': { r: 5, g: 25, b: 55 },
                'Jazz': { r: 50, g: 30, b: 5 },
            };

            targetBgRef.current = selectedGenre && themeColors[selectedGenre]
                ? themeColors[selectedGenre]
                : { r: 10, g: 10, b: 15 };

            currentBg.r += (targetBgRef.current.r - currentBg.r) * dt * 2.0;
            currentBg.g += (targetBgRef.current.g - currentBg.g) * dt * 2.0;
            currentBg.b += (targetBgRef.current.b - currentBg.b) * dt * 2.0;

            const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
            bgGrad.addColorStop(0, `rgb(${Math.floor(currentBg.r)}, ${Math.floor(currentBg.g)}, ${Math.floor(currentBg.b)})`);
            bgGrad.addColorStop(1, '#020204');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // stars
            for (let i = 0; i < stars.length; i += 1) {
                const s = stars[i];
                if (s.hidden) continue;
                const twinkle = 0.5 + Math.sin(now * 0.0014 * (0.8 + s.tw) + s.phase) * 0.5;
                ctx.globalAlpha = 0.35 + twinkle * 0.65;
                ctx.fillStyle = `hsla(${200 + s.tw * 40}, 100%, 85%, 1)`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r + twinkle * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // big sparkle stars
            for (let i = 0; i < sparkles.length; i += 1) {
                const sp = sparkles[i];
                const glow = 0.6 + Math.sin(now * 0.001 + sp.phase) * 0.4;
                const size = sp.r * (0.9 + glow * 0.5);
                ctx.globalAlpha = 0.45 + glow * 0.55;
                ctx.strokeStyle = 'rgba(210,240,255,0.95)';
                ctx.lineWidth = 1.8;
                ctx.save();
                ctx.translate(sp.x, sp.y);
                ctx.rotate(Math.PI / 4);
                ctx.beginPath();
                ctx.moveTo(-size, 0);
                ctx.lineTo(size, 0);
                ctx.moveTo(0, -size);
                ctx.lineTo(0, size);
                ctx.stroke();
                ctx.restore();

                ctx.save();
                ctx.translate(sp.x, sp.y);
                ctx.beginPath();
                ctx.moveTo(-size * 0.8, 0);
                ctx.lineTo(size * 0.8, 0);
                ctx.moveTo(0, -size * 0.8);
                ctx.lineTo(0, size * 0.8);
                ctx.stroke();
                ctx.restore();

                ctx.globalAlpha = 0.25 + glow * 0.35;
                ctx.fillStyle = 'rgba(200,245,255,0.9)';
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, size * 0.35, 0, Math.PI * 2);
                ctx.fill();
            }

            // occasional falling stars (diagonal drops from fixed stars)
            ctx.globalAlpha = 1;
            for (let i = 0; i < falling.length; i += 1) {
                const f = falling[i];
                if (!f.active) {
                    f.delay -= dt * tempoMul;
                    if (f.delay <= 0) f.active = true;
                    continue;
                }

                f.life += dt * tempoMul;
                f.x += f.vx * dt * tempoMul;
                f.y += f.vy * dt * tempoMul;

                const tail = 140;
                const tx = f.x - (f.vx * 0.08);
                const ty = f.y - (f.vy * 0.08);
                const grad = ctx.createLinearGradient(f.x, f.y, tx, ty);
                grad.addColorStop(0, 'rgba(180,255,255,0.9)');
                grad.addColorStop(1, 'rgba(180,255,255,0)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(f.x, f.y);
                ctx.lineTo(tx, ty);
                ctx.stroke();

                if (f.x < -1200 || f.x > width + 1200 || f.y < -1200 || f.y > height + 1200) {
                    f.outTime = (f.outTime || 0) + dt;
                    if (f.outTime > 5 + Math.random() * 5) {
                        if (typeof f.starIndex === 'number' && stars[f.starIndex]) {
                            stars[f.starIndex].hidden = false;
                        }
                        f.outTime = 0;
                        spawnFaller(f);
                    }
                } else {
                    f.outTime = 0;
                }
            }

            rafRef.current = requestAnimationFrame(draw);
        };

        resize();
        initFallers();
        window.addEventListener('resize', resize);
        rafRef.current = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', resize);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [tempo, selectedGenre]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-0"
            aria-hidden="true"
        />
    );
};

const DynamicLogo = ({ genre }) => {
    // 1. Rock / Metal
    if (genre === 'Rock') {
        return (
            <div className="flex items-center justify-center cursor-pointer relative theme-rock-jitter">
                {/* 락: 번개 아이콘 */}
                <svg className="w-10 h-10 md:w-14 md:h-14 text-[#ff4500] drop-shadow-[0_0_15px_#ff4500]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
                </svg>
                {/* 날카로운 폰트 */}
                <span className="text-4xl md:text-6xl font-black italic tracking-[-0.08em] ml-2 text-white drop-shadow-[0_0_10px_rgba(255,69,0,0.8)] uppercase">
                    ObgStudio
                </span>
                {/* 데코: 불꽃 or 작은 번개 */}
                <svg className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 ml-1 -translate-y-5 md:-translate-y-6 drop-shadow-[0_0_10px_#ffeb3b]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.5 11c0 0-3.5 0-3.5-3.5 0-3.5 3.5-3.5 3.5-3.5S14 4 14 7.5S17.5 11 17.5 11zM6.5 11c0 0 3.5 0 3.5-3.5 0-3.5-3.5-3.5-3.5-3.5S10 4 10 7.5S6.5 11 6.5 11zM12 21c-4.4 0-8-3.6-8-8c0-3.3 2.1-6.2 5.2-7.4c.5-.2 1.1-.3 1.7-.5c-.8.6-1.4 1.4-1.6 2.4c-.6 2.3 1.8 4.3 3.8 5.6c.4.3 1.1.6 1.6.4c.4-.2.6-.7.4-1.2c-.3-.9-1-1.7-1.8-2.3c-.6-.5-1.4-1.2-1.3-2.1c.1-.8.7-1.3 1.3-1.6c-2.4-.6-4-.6-6.4 0c3.7-2.3 8.3-1.8 11.5 1.5c3.2 3.3 3.6 8.1 1 11.8C16.8 20.3 14.5 21 12 21z" />
                </svg>
            </div>
        );
    }

    // 2. Lullaby (Lo-fi / Chill)
    if (genre === 'Lullaby') {
        return (
            <div className="flex items-center justify-center cursor-pointer relative theme-lofi-float">
                {/* 로파이: 달 아이콘 */}
                <svg className="w-10 h-10 md:w-14 md:h-14 text-[#81ecec] drop-shadow-[0_0_15px_#81ecec]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
                </svg>
                {/* 둥글고 부드러운 폰트 */}
                <span className="text-4xl md:text-6xl font-semibold tracking-wide ml-3 theme-lofi-text capitalize" style={{ fontFamily: 'Quicksand, Nunito, sans-serif' }}>
                    ObgStudio
                </span>
                {/* 데코: 구름/Zzz */}
                <svg className="w-8 h-8 md:w-10 md:h-10 text-[#a29bfe] ml-2 -translate-y-5 md:-translate-y-8 animate-[pulse_4s_infinite]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                </svg>
            </div>
        );
    }

    // 3. EDM / Hip-hop
    if (genre === 'Hip-hop') {
        return (
            <div className="flex items-center justify-center cursor-pointer relative">
                {/* EDM: 바이닐/레코드판 아이콘을 감싸는 박스 */}
                <div className="relative flex items-center justify-center">
                    <div className="theme-edm-neon-ring"></div>
                    <svg className="w-10 h-10 md:w-14 md:h-14 text-white animate-[spin_2s_linear_infinite]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
                    </svg>
                </div>
                {/* 글리치 & 모노스페이스 폰트 */}
                <span className="text-4xl md:text-6xl font-black italic tracking-widest ml-4 md:ml-6 theme-edm-glitch-text uppercase" style={{ fontFamily: 'monospace' }}>
                    ObgStudio
                </span>
                {/* 데코: 디지털 픽셀 십자 */}
                <svg className="w-5 h-5 md:w-8 md:h-8 text-[#ff00ff] ml-2 -translate-y-6 md:-translate-y-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8V2z" />
                </svg>
            </div>
        );
    }

    // 4. K-POP
    if (genre === 'K-Pop') {
        return (
            <div className="flex items-center justify-center cursor-pointer relative transition-transform duration-300 hover:scale-105">
                {/* Kpop: 심장/하트 아이콘 비트 모션 */}
                <svg className="w-10 h-10 md:w-14 md:h-14 text-[#ff71ce] drop-shadow-[0_0_15px_#ff71ce] theme-kpop-heartbeat" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {/* Kpop: 둥글고 귀여운 폰트에 멀티컬러 그라데이션 */}
                <span className="text-4xl md:text-6xl font-black tracking-tight ml-3 theme-kpop-text" style={{ fontFamily: '"Comic Sans MS", "Arial Rounded MT Bold", sans-serif' }}>
                    ObgStudio
                </span>
                {/* 데코: 스파클(Sparkles) 아이콘 */}
                <svg className="w-7 h-7 md:w-10 md:h-10 text-[#01cdfe] ml-1 -translate-y-5 md:-translate-y-8 animate-[spin_3s_linear_infinite_reverse] drop-shadow-[0_0_10px_#01cdfe]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9h-4V5h-2v4h-4v2h4v4h2v-4h4V9zm-7 13c-5.52 0-10-4.48-10-10S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" opacity="0" />
                    <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" />
                </svg>
            </div>
        );
    }

    // 4. Jazz / Classic
    if (genre === 'Jazz') {
        return (
            <div className="flex items-center justify-center cursor-pointer relative transition-all duration-1000">
                <div className="theme-jazz-ornament"></div>
                {/* 재즈: 음표 아이콘 */}
                <svg className="w-10 h-10 md:w-14 md:h-14 drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" style={{ color: '#d4af37' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
                {/* 엘레강스 세리프 폰트 */}
                <span className="text-4xl md:text-6xl font-serif tracking-[0.05em] ml-3 md:ml-4 theme-jazz-shimmer-text">
                    ObgStudio
                </span>
                {/* 데코: 다이아몬드 별 */}
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-[0_0_10px_white] ml-2 -translate-y-4 md:-translate-y-6 opacity-80" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6-6.2-4.5-6.2 4.5 2.4-7.6L2 9.6h7.6L12 2z" />
                </svg>
            </div>
        );
    }

    // Default (Original Space Sheen)
    return (
        <div className="flex items-center justify-center cursor-pointer logo-wrap hover:scale-105 transition-transform duration-500 relative">
            {/* 파란색/초록색 기울어진 알약 (로고 아이콘) */}
            <div className="flex gap-2 transform -rotate-45 relative translate-y-[2px] logo-bars transition-all duration-500">
                <div className="w-[12px] h-[26px] md:w-[15px] md:h-[32px] rounded-full drop-shadow-md logo-bar transition-all duration-500"></div>
                <div className="w-[12px] h-[26px] md:w-[15px] md:h-[32px] rounded-full drop-shadow-md translate-y-[10px] md:translate-y-[14px] logo-bar transition-all duration-500"></div>
            </div>
            {/* 텍스트 폰트 및 별 모양 데코레이션 */}
            <span className="text-4xl md:text-6xl font-[800] tracking-[-0.03em] ml-4 md:ml-5 logo-text transition-all duration-500">
                ObgStudio
            </span>
            <svg className="w-6 h-6 md:w-9 md:h-9 ml-[6px] -translate-y-[10px] md:-translate-y-[16px] logo-star transition-all duration-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
            </svg>
        </div>
    );
};

export default function Home() {
    const [currentGenre, setCurrentGenre] = useState('');
    const [robotState, setRobotState] = useState('idle');
    const [lyrics, setLyrics] = useState('');
    const [audioUrl, setAudioUrl] = useState(null);

    const [lipScale, setLipScale] = useState(0);
    const [headAngle, setHeadAngle] = useState(0);

    const audioRef = useRef(null);
    const analyzerRef = useRef(null);

    const handleGenerate = async (userPrompt) => {
        try {
            setRobotState('thinking');
            setLyrics('');
            setAudioUrl(null);
            setLipScale(0);
            setHeadAngle(0);

            const combinedPrompt = `[${currentGenre}] ${userPrompt}`;

            const newLyrics = await generateLyrics(combinedPrompt);
            setLyrics(newLyrics);

            const generatedAudioUrl = await generateMusic(newLyrics, combinedPrompt);
            setAudioUrl(generatedAudioUrl);

        } catch (error) {
            console.error("Music Generation Error:", error);
            setRobotState('idle');
        }
    };

    useEffect(() => {
        if (audioUrl && audioRef.current) {
            audioRef.current.crossOrigin = "anonymous";

            audioRef.current.play().then(() => {
                setRobotState('singing');

                if (!analyzerRef.current) {
                    analyzerRef.current = new AudioAnalyzer(
                        audioRef.current,
                        (lips) => setLipScale(lips),
                        (angle) => setHeadAngle(angle)
                    );
                }
                analyzerRef.current.start();
            }).catch(err => {
                console.error("Auto-play blocked or error:", err);
            });
        }

        return () => {
            if (analyzerRef.current) {
                analyzerRef.current.stop();
            }
        };
    }, [audioUrl]);

    const tempo = audioUrl ? headAngle : 0;

    return (
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-between relative overflow-x-hidden font-sans">
            <Starfield tempo={tempo} selectedGenre={currentGenre} />

            {/* 1. Header (로고) - 중앙 정렬 적용 */}
            <header className="w-full max-w-[1500px] px-6 md:px-16 pt-8 pb-4 md:py-10 flex justify-center items-center z-10 transition-all duration-500 shrink-0">
                <DynamicLogo genre={currentGenre} />
            </header>

            {/* 2. Main Center (3D 로봇 및 가사 배치) */}
            <div className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center z-10 relative mt-[-1rem] md:mt-[-4rem]">
                <div className="w-full relative">

                    <RobotScene lipScale={lipScale} headAngle={headAngle} robotState={robotState} selectedGenre={currentGenre} />

                    {/* 가사 말풍선 */}
                    {robotState === 'singing' && lyrics && (
                        <div className="absolute -bottom-2 md:bottom-12 left-1/2 -translate-x-1/2 w-[90%] md:w-full px-4 text-center pointer-events-none z-20">
                            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-8 py-3 inline-block shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                <p className="text-white text-lg font-medium tracking-wider drop-shadow-md whitespace-nowrap">
                                    {lyrics.split('\n')[0]}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Bottom UI (프롬프트 입력창) */}
            <div className="w-full pb-10 pt-4 z-20 flex flex-col items-center">
                <PromptInput
                    onGenerate={handleGenerate}
                    disabled={robotState === 'thinking'}
                    selectedGenre={currentGenre}
                    onSelectGenre={setCurrentGenre}
                />
            </div>

            {/* 오디오 엘리먼트 */}
            {
                audioUrl && (
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        className="hidden"
                        controls
                        onEnded={() => {
                            setRobotState('idle');
                            setLyrics('');
                            if (analyzerRef.current) analyzerRef.current.stop();
                        }}
                    />
                )
            }

            {/* 4. 우측 하단 고정 로고 이동됨 */}

            {/* 왼쪽 하단 십자별 장식 */}
            <svg className="fixed bottom-24 right-[25%] w-8 h-8 text-white/50 drop-shadow-lg z-0 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z" />
            </svg>
            {/* 우측 하단 십자별 장식 */}
            <svg className="fixed bottom-12 right-[5%] w-12 h-12 text-white/40 drop-shadow-lg z-0 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
            </svg>

        </main >
    );
}
