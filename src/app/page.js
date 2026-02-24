"use client";

import React, { useState, useRef, useEffect } from 'react';
import { generateLyrics, generateMusic, AudioAnalyzer } from '@/lib/MusicEngine';
import RobotScene from '@/components/RobotScene';
import PromptInput from '@/components/PromptInput';

const Starfield = ({ tempo }) => {
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

        let last = performance.now();
        const draw = (now) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            const tempoMul = 1 + Math.min(Math.max(tempo, 0), 0.8) * 1.6;

            ctx.clearRect(0, 0, width, height);

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
    }, [tempo]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            aria-hidden="true"
        />
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

    const handleGenerate = async (genre, userPrompt) => {
        try {
            setRobotState('thinking');
            setCurrentGenre(genre);
            setLyrics('');
            setAudioUrl(null);
            setLipScale(0);
            setHeadAngle(0);

            const combinedPrompt = `[${genre}] ${userPrompt}`;

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
        <main className="min-h-screen bg-space-gradient text-white flex flex-col items-center justify-between relative overflow-hidden font-sans">
            <Starfield tempo={tempo} />

            {/* 1. Header (로고) - 중앙 정렬 적용 */}
            <header className="w-full max-w-[1500px] px-10 md:px-16 py-10 flex justify-center items-center z-10">
                <div className="flex items-center cursor-pointer logo-wrap">
                    {/* 파란색/초록색 기울어진 알약 (로고 아이콘) */}
                    <div className="flex gap-2 transform -rotate-45 relative translate-y-[2px] logo-bars">
                        <div className="w-[10px] h-[22px] md:w-[12px] md:h-[26px] rounded-full drop-shadow-md logo-bar"></div>
                        <div className="w-[10px] h-[22px] md:w-[12px] md:h-[26px] rounded-full drop-shadow-md translate-y-[8px] md:translate-y-[10px] logo-bar"></div>
                    </div>
                    {/* 텍스트 폰트 및 별 모양 데코레이션 */}
                    <span className="text-2xl md:text-4xl font-[800] drop-shadow-lg tracking-[-0.03em] ml-3 logo-text">
                        ObgStudio
                    </span>
                    <svg className="w-5 h-5 md:w-7 md:h-7 drop-shadow-lg ml-[4px] -translate-y-[8px] md:-translate-y-[12px] logo-star" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
                    </svg>
                </div>
            </header>

            {/* 2. Main Center (3D 로봇 및 가사 배치) */}
            <div className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center z-10 relative mt-[-4rem]">
                <div className="w-full relative">

                    <RobotScene lipScale={lipScale} headAngle={headAngle} robotState={robotState} />

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
