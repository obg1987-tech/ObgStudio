"use client";

import React, { useState, useRef, useEffect } from 'react';
import { AudioAnalyzer } from '@/lib/MusicEngine';
import RobotScene from '@/components/RobotScene';
import PromptInput from '@/components/PromptInput';

const Starfield = ({ selectedGenre }) => {
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
            const angle = (Math.random() * 0.9 + 0.25) * Math.PI; // ~45deg-200deg
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
            const tempoMul = 1;

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
    }, [selectedGenre]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-0"
            aria-hidden="true"
        />
    );
};

const DynamicLogo = ({ genre }) => {
    const frameClass = "w-[min(96vw,1320px)] grid grid-cols-[clamp(42px,11vw,150px)_1fr_clamp(42px,11vw,150px)] items-center justify-items-center";

    if (genre === 'Rock') {
        return (
            <div className={`${frameClass} cursor-pointer relative theme-rock-jitter`}>
                <svg className="w-14 h-14 md:w-20 md:h-20 2xl:w-32 2xl:h-32 text-[#ff4500] drop-shadow-[0_0_15px_#ff4500] justify-self-center" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
                </svg>
                <span className="text-5xl md:text-8xl 2xl:text-[10rem] font-black italic tracking-[-0.08em] text-white drop-shadow-[0_0_10px_rgba(255,69,0,0.8)] uppercase leading-[1.4] py-[0.15em]">
                    ObgStudio
                </span>
                <svg className="w-8 h-8 md:w-12 md:h-12 2xl:w-20 2xl:h-20 text-yellow-400 -translate-y-1 md:-translate-y-3 2xl:-translate-y-6 drop-shadow-[0_0_10px_#ffeb3b] justify-self-center" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.5 11c0 0-3.5 0-3.5-3.5 0-3.5 3.5-3.5 3.5-3.5S14 4 14 7.5S17.5 11 17.5 11zM6.5 11c0 0 3.5 0 3.5-3.5 0-3.5-3.5-3.5-3.5-3.5S10 4 10 7.5S6.5 11 6.5 11zM12 21c-4.4 0-8-3.6-8-8c0-3.3 2.1-6.2 5.2-7.4c.5-.2 1.1-.3 1.7-.5c-.8.6-1.4 1.4-1.6 2.4c-.6 2.3 1.8 4.3 3.8 5.6c.4.3 1.1.6 1.6.4c.4-.2.6-.7.4-1.2c-.3-.9-1-1.7-1.8-2.3c-.6-.5-1.4-1.2-1.3-2.1c.1-.8.7-1.3 1.3-1.6c-2.4-.6-4-.6-6.4 0c3.7-2.3 8.3-1.8 11.5 1.5c3.2 3.3 3.6 8.1 1 11.8C16.8 20.3 14.5 21 12 21z" />
                </svg>
            </div>
        );
    }

    if (genre === 'Lullaby') {
        return (
            <div className={`${frameClass} cursor-pointer relative theme-lofi-float overflow-visible`}>
                <svg className="w-14 h-14 md:w-20 md:h-20 2xl:w-32 2xl:h-32 text-[#81ecec] drop-shadow-[0_0_15px_#81ecec] justify-self-center" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
                </svg>
                <span className="text-5xl md:text-8xl 2xl:text-[10rem] font-semibold tracking-wide theme-lofi-text capitalize leading-[1.26] pb-[0.3em] inline-block" style={{ fontFamily: 'Quicksand, Nunito, sans-serif' }}>
                    ObgStudio
                </span>
                <svg className="w-10 h-10 md:w-16 md:h-16 2xl:w-24 2xl:h-24 text-[#a29bfe] -translate-y-1 md:-translate-y-3 2xl:-translate-y-6 animate-[pulse_4s_infinite] justify-self-center" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                </svg>
            </div>
        );
    }

    if (genre === 'Hip-hop') {
        return (
            <div className={`${frameClass} cursor-pointer relative`}>
                <div className="relative flex items-center justify-center justify-self-center">
                    <div className="theme-edm-neon-ring"></div>
                    <svg className="w-14 h-14 md:w-20 md:h-20 2xl:w-32 2xl:h-32 text-white animate-[spin_2s_linear_infinite]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
                    </svg>
                </div>
                <span className="text-5xl md:text-8xl 2xl:text-[10rem] font-black italic tracking-widest theme-edm-glitch-text uppercase leading-[1.4] py-[0.15em]" style={{ fontFamily: 'monospace' }}>
                    ObgStudio
                </span>
                <svg className="w-8 h-8 md:w-12 md:h-12 2xl:w-20 2xl:h-20 text-[#ff00ff] -translate-y-1 md:-translate-y-3 2xl:-translate-y-6 justify-self-center" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8V2z" />
                </svg>
            </div>
        );
    }

    if (genre === 'K-Pop') {
        return (
            <div className={`${frameClass} cursor-pointer relative overflow-visible`}>
                <svg className="w-14 h-14 md:w-20 md:h-20 2xl:w-32 2xl:h-32 text-[#ff71ce] drop-shadow-[0_0_15px_#ff71ce] theme-kpop-heartbeat justify-self-center" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className="text-6xl md:text-8xl 2xl:text-[10rem] font-black tracking-tight theme-kpop-text leading-[1.26] pb-[0.3em] inline-block" style={{ fontFamily: '"Comic Sans MS", "Arial Rounded MT Bold", sans-serif' }}>
                    ObgStudio
                </span>
                <svg className="w-8 h-8 md:w-14 md:h-14 2xl:w-24 2xl:h-24 text-[#01cdfe] -translate-y-1 md:-translate-y-3 2xl:-translate-y-6 animate-[spin_3s_linear_infinite_reverse] drop-shadow-[0_0_10px_#01cdfe] justify-self-center" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9h-4V5h-2v4h-4v2h4v4h2v-4h4V9zm-7 13c-5.52 0-10-4.48-10-10S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" opacity="0" />
                    <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" />
                </svg>
            </div>
        );
    }

    if (genre === 'Jazz') {
        return (
            <div className={`${frameClass} cursor-pointer relative transition-all duration-1000`}>
                <svg className="w-10 h-10 md:w-14 md:h-14 2xl:w-20 2xl:h-20 drop-shadow-[0_0_8px_rgba(212,175,55,0.8)] justify-self-center translate-x-[12px] md:translate-x-[16px] 2xl:translate-x-[24px]" style={{ color: '#d4af37' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
                <span className="text-5xl md:text-6xl 2xl:text-[8rem] font-serif tracking-[0.05em] theme-jazz-shimmer-text">
                    ObgStudio
                </span>
                <svg className="w-6 h-6 md:w-8 md:h-8 2xl:w-14 2xl:h-14 text-white drop-shadow-[0_0_10px_white] -translate-y-4 md:-translate-y-6 2xl:-translate-y-12 opacity-80 justify-self-center -translate-x-[12px] md:-translate-x-[16px] 2xl:-translate-x-[24px]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6-6.2-4.5-6.2 4.5 2.4-7.6L2 9.6h7.6L12 2z" />
                </svg>
            </div>
        );
    }

    return (
        <div className={`${frameClass} cursor-pointer logo-wrap relative overflow-visible`}>
            <div className="flex gap-2 2xl:gap-4 transform -rotate-45 relative translate-y-[2px] logo-bars transition-all duration-500 justify-self-center">
                <div className="w-[14px] h-[30px] md:w-[22px] md:h-[48px] 2xl:w-[32px] 2xl:h-[75px] rounded-full drop-shadow-md logo-bar transition-all duration-500"></div>
                <div className="w-[14px] h-[30px] md:w-[22px] md:h-[48px] 2xl:w-[32px] 2xl:h-[75px] rounded-full drop-shadow-md translate-y-[12px] md:translate-y-[20px] 2xl:translate-y-[32px] logo-bar transition-all duration-500"></div>
            </div>
            <span className="text-5xl md:text-8xl 2xl:text-[10rem] font-[800] tracking-[-0.03em] logo-text transition-all duration-500 leading-[1.26] pb-[0.3em] inline-block">
                ObgStudio
            </span>
            <svg className="w-8 h-8 md:w-14 md:h-14 2xl:w-20 2xl:h-20 -translate-y-[12px] md:-translate-y-[24px] 2xl:-translate-y-[40px] logo-star transition-all duration-500 justify-self-center" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
            </svg>
        </div>
    );
};
export default function Home() {
    const [currentGenre, setCurrentGenre] = useState('');
    const [displayGenre, setDisplayGenre] = useState('');
    const [robotState, setRobotState] = useState('idle');
    const [lyrics, setLyrics] = useState('');
    const [audioUrl, setAudioUrl] = useState(null);
    const [voiceText, setVoiceText] = useState('');
    const [isMockAudio, setIsMockAudio] = useState(false);
    const [dynamicColor, setDynamicColor] = useState(null);
    const [dynamicBpm, setDynamicBpm] = useState(120);
    const [needsManualPlay, setNeedsManualPlay] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);

    const [lipScale, setLipScale] = useState(0);
    const [headAngle, setHeadAngle] = useState(0);

    const audioRef = useRef(null);
    const analyzerRef = useRef(null);
    const speechRef = useRef(null);
    const audioFallbackTriedRef = useRef(false);
    const selectedGenreRef = useRef('');
    const isThemeLockedByTrack = Boolean(audioUrl);

    useEffect(() => {
        const setAppHeight = () => {
            const h = window.innerHeight;
            document.documentElement.style.setProperty('--app-h', `${h}px`);
        };
        setAppHeight();
        window.addEventListener('resize', setAppHeight);
        window.addEventListener('orientationchange', setAppHeight);
        return () => {
            window.removeEventListener('resize', setAppHeight);
            window.removeEventListener('orientationchange', setAppHeight);
        };
    }, []);

    const handleSelectGenre = (nextGenre) => {
        selectedGenreRef.current = nextGenre;
        setCurrentGenre(nextGenre);
        if (!isThemeLockedByTrack) {
            setDisplayGenre(nextGenre);
        }
    };

    useEffect(() => {
        if (!isThemeLockedByTrack) {
            setDisplayGenre(currentGenre);
        }
    }, [currentGenre, isThemeLockedByTrack]);

    const handleGenerate = async (userPrompt, requestedGenre) => {
        try {
            const effectiveGenre = requestedGenre || selectedGenreRef.current || currentGenre || "Jazz";
            selectedGenreRef.current = effectiveGenre;
            setRobotState('thinking');
            setLyrics('LLM Prompt Orchestrating...');
            setAudioUrl(null);
            setDynamicColor(null);
            setLipScale(0);
            setHeadAngle(0);
            setNeedsManualPlay(false);
            setIsAudioPlaying(false);
            setVoiceText('');
            setIsMockAudio(false);
            audioFallbackTriedRef.current = false;
            setDisplayGenre(effectiveGenre);

            let isPolling = true;
            while (isPolling) {
                const res = await fetch('/api/orchestrate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: userPrompt, genre: effectiveGenre })
                });

                if (res.status === 503) {
                    const errorData = await res.json();
                    if (errorData.status === 'loading') {
                        setLyrics(`AI ?묎끝 ?붿쭊 以鍮?以?.. (${Math.ceil(errorData.estimated_time || 30)}珥??덉긽)`);
                        // Wait and poll again.
                        await new Promise((r) => setTimeout(r, 5000));
                        continue;
                    }
                }

                if (!res.ok) throw new Error("Orchestration API Failed");

                const data = await res.json();

                setDynamicColor(data.color_code);
                setDynamicBpm(data.bpm);
                const sourceTag = data.provider ? ` | ${data.provider}` : '';
                setLyrics(`[${data.target_theme} | ${data.bpm}BPM${sourceTag}]\n${data.refined_prompt}`);
                setDisplayGenre(effectiveGenre);
                setAudioUrl(data.audio_url);
                setVoiceText(data.voice_text || '');
                setIsMockAudio(Boolean(data.is_mock_audio));
                if (data.warning) {
                    setLyrics((prev) => `${prev}\n\n[二쇱쓽] ${data.warning}`);
                }
                isPolling = false;
            }

        } catch (error) {
            console.error("Music Generation Error:", error);
            setLyrics('Error occurred during orchestration.');
            setRobotState('idle');
        }
    };

    useEffect(() => {
        if (audioUrl && audioRef.current) {
            audioRef.current.crossOrigin = "anonymous";
            audioRef.current.volume = 1;
            audioRef.current.muted = false;

            audioRef.current.play().then(() => {
                setRobotState('singing');
                setNeedsManualPlay(false);
                setIsAudioPlaying(true);

                if (!analyzerRef.current) {
                    analyzerRef.current = new AudioAnalyzer(
                        audioRef.current,
                        (lips) => setLipScale(lips),
                        (angle) => setHeadAngle(angle)
                    );
                }
                analyzerRef.current.start();
                if (isMockAudio && voiceText && typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(voiceText);
                    utterance.rate = 0.95;
                    utterance.pitch = 1.05;
                    utterance.volume = 0.9;
                    speechRef.current = utterance;
                    window.speechSynthesis.speak(utterance);
                }
            }).catch(err => {
                console.error("Auto-play blocked or error:", err);
                setNeedsManualPlay(true);
                setRobotState('idle');
                setIsAudioPlaying(false);
            });
        }

        return () => {
            if (analyzerRef.current) {
                analyzerRef.current.stop();
            }
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, [audioUrl, isMockAudio, voiceText]);

    // Keep background behavior fixed regardless of music playback.
    const handlePlay = async () => {
        if (!audioRef.current) return;
        try {
            await audioRef.current.play();
            setNeedsManualPlay(false);
            setRobotState('singing');
            setIsAudioPlaying(true);
            if (!analyzerRef.current) {
                analyzerRef.current = new AudioAnalyzer(
                    audioRef.current,
                    (lips) => setLipScale(lips),
                    (angle) => setHeadAngle(angle)
                );
            }
            analyzerRef.current.start();
            if (isMockAudio && voiceText && typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(voiceText);
                utterance.rate = 0.95;
                utterance.pitch = 1.05;
                utterance.volume = 0.9;
                speechRef.current = utterance;
                window.speechSynthesis.speak(utterance);
            }
        } catch (err) {
            console.error("Manual play failed:", err);
        }
    };

    const handlePause = () => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        setRobotState('idle');
        setIsAudioPlaying(false);
        if (analyzerRef.current) analyzerRef.current.stop();
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    };

    const handleStop = () => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setRobotState('idle');
        setIsAudioPlaying(false);
        if (analyzerRef.current) analyzerRef.current.stop();
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    };

    return (
        <main
            className="bg-black text-white relative overflow-hidden font-sans pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
            style={{
                height: 'var(--app-h, 100svh)',
                minHeight: 'var(--app-h, 100svh)',
            }}
        >
            <Starfield selectedGenre={displayGenre} />

            <div className="relative z-10 h-full w-full grid grid-rows-[minmax(56px,15%)_minmax(220px,45%)_minmax(170px,40%)] md:grid-rows-[minmax(68px,11%)_minmax(320px,1fr)_minmax(132px,21%)] 2xl:grid-rows-[minmax(98px,12%)_minmax(400px,1fr)_minmax(168px,20%)] [@media(min-width:1920px)]:grid-rows-[minmax(116px,13%)_minmax(500px,1fr)_minmax(185px,19%)] [@media(min-width:2560px)]:grid-rows-[minmax(138px,14%)_minmax(590px,1fr)_minmax(215px,18%)]">
                <header className="w-full px-2 md:px-10 flex justify-center items-center min-h-0 relative z-30 overflow-visible pb-1 md:pb-2">
                    <div className="origin-center translate-y-[3px] md:translate-y-[8px] 2xl:translate-y-[12px] [@media(min-width:1920px)]:translate-y-[14px] [@media(min-width:2560px)]:translate-y-[16px] scale-[0.38] sm:scale-[0.5] md:scale-[0.86] xl:scale-95 2xl:scale-105 [@media(min-width:1920px)]:scale-[1.2] [@media(min-width:2560px)]:scale-[1.34] overflow-visible">
                        <DynamicLogo genre={displayGenre} />
                    </div>
                </header>

                <div className="w-full min-h-0 flex items-center justify-center px-2 md:px-6 [@media(min-width:1920px)]:px-8 [@media(min-width:2560px)]:px-10 relative z-20 -translate-y-[4px] sm:-translate-y-[2px] md:-translate-y-[10px] [@media(min-width:1920px)]:-translate-y-[16px] [@media(min-width:2560px)]:-translate-y-[20px]">
                    <div className="w-full max-w-[96vw] md:max-w-6xl 2xl:max-w-7xl [@media(min-width:1920px)]:max-w-[1800px] [@media(min-width:2560px)]:max-w-[2200px] h-full min-h-[220px] md:min-h-[320px] relative scale-[0.86] sm:scale-[0.92] md:scale-100">
                        <RobotScene
                            lipScale={lipScale}
                            headAngle={headAngle}
                            robotState={robotState}
                            selectedGenre={displayGenre}
                            dynamicColor={dynamicColor}
                            dynamicBpm={dynamicBpm}
                        />

                        {(robotState === 'singing' || robotState === 'thinking') && lyrics && (
                            <div className="absolute bottom-2 md:bottom-8 left-1/2 -translate-x-1/2 w-[96%] md:w-full px-2 md:px-4 text-center pointer-events-none z-20">
                                <div className="backdrop-blur-xl bg-black/40 border border-white/20 rounded-2xl md:rounded-full px-4 py-2.5 md:px-8 md:py-3 inline-block shadow-[0_0_20px_rgba(255,255,255,0.15)] max-w-4xl min-w-[240px]">
                                    <p className="text-white text-xs md:text-base 2xl:text-xl font-medium tracking-wide drop-shadow-md break-keep whitespace-pre-wrap line-clamp-3">
                                        {lyrics}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full z-20 flex items-end justify-center px-2 pb-1.5 pt-0 md:pt-0 md:pb-4 2xl:pb-6 [@media(min-width:1920px)]:pb-8 [@media(min-width:2560px)]:pb-9 min-h-0">
                    <div className="w-full max-w-[98vw] md:max-w-[92vw] xl:max-w-[1400px] 2xl:max-w-[1650px] [@media(min-width:1920px)]:max-w-[1920px] [@media(min-width:2560px)]:max-w-[2200px] origin-bottom scale-[0.74] sm:scale-[0.8] md:scale-[0.96] 2xl:scale-[1.01] [@media(min-width:1920px)]:scale-[1.06] [@media(min-width:2560px)]:scale-[1.16]">
                        <PromptInput
                            onGenerate={handleGenerate}
                            disabled={robotState === 'thinking'}
                            selectedGenre={currentGenre}
                            onSelectGenre={handleSelectGenre}
                        />
                        <div className={`mt-2 md:mt-3 flex justify-end min-h-[52px] md:min-h-[58px] ${audioUrl ? '' : 'opacity-0 pointer-events-none'}`}>
                            {audioUrl && (
                                <div className="flex items-center gap-2 rounded-full bg-black/60 border border-white/20 px-2 py-2 backdrop-blur-md">
                                    <button
                                        onClick={handlePlay}
                                        className={`rounded-full px-3 py-1.5 text-xs md:text-sm font-bold ${isAudioPlaying ? 'bg-white/20 text-white' : 'bg-white text-black'}`}
                                    >
                                        Play
                                    </button>
                                    <button
                                        onClick={handlePause}
                                        className="rounded-full px-3 py-1.5 text-xs md:text-sm font-bold bg-white/10 text-white hover:bg-white/20"
                                    >
                                        Pause
                                    </button>
                                    <button
                                        onClick={handleStop}
                                        className="rounded-full px-3 py-1.5 text-xs md:text-sm font-bold bg-red-500/80 text-white hover:bg-red-500"
                                    >
                                        Stop
                                    </button>
                                    {needsManualPlay && <span className="text-[11px] text-white/70 px-1">Tap Play</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {
                audioUrl && (
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        className="hidden"
                        onPlay={() => setIsAudioPlaying(true)}
                        onPause={() => setIsAudioPlaying(false)}
                        onError={() => {
                            if (!audioFallbackTriedRef.current) {
                                audioFallbackTriedRef.current = true;
                                setAudioUrl('/fallback.wav');
                                return;
                            }
                            setLyrics('Audio source failed to load.');
                            setNeedsManualPlay(false);
                            setRobotState('idle');
                            setIsAudioPlaying(false);
                        }}
                        onEnded={() => {
                            setRobotState('idle');
                            setLyrics('');
                            setIsAudioPlaying(false);
                            if (analyzerRef.current) analyzerRef.current.stop();
                            if (typeof window !== 'undefined' && window.speechSynthesis) {
                                window.speechSynthesis.cancel();
                            }
                        }}
                    />
                )
            }
            <svg className="fixed bottom-24 right-[25%] w-8 h-8 text-white/50 drop-shadow-lg z-0 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z" />
            </svg>
            <svg className="fixed bottom-12 right-[5%] w-12 h-12 text-white/40 drop-shadow-lg z-0 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
            </svg>

        </main >
    );
}



