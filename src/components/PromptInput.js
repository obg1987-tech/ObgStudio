'use client';
import React, { useState } from 'react';

const GENRES = [
    { id: 'Rock', label: 'Rock', emoji: '🎸', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]', color: 'bg-[#ff7a70]/30 border-[#ff7a70]/50 text-white' },
    { id: 'Hip-hop', label: 'Hip-hop', emoji: '🎧', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]', color: 'bg-[#9884ff]/30 border-[#9884ff]/50 text-white' },
    { id: 'K-Pop', label: 'K-Pop', emoji: '🎹', glow: 'shadow-[0_0_15px_rgba(236,72,153,0.5)]', color: 'bg-[#ff75d8]/30 border-[#ff75d8]/50 text-white' },
    { id: 'Lullaby', label: 'Lullaby', emoji: '🌙', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]', color: 'bg-[#5eead4]/30 border-[#5eead4]/50 text-white' },
    { id: 'Jazz', label: 'Jazz', emoji: '🎵', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]', color: 'bg-[#fcd34d]/30 border-[#fcd34d]/50 text-white' },
];

export default function PromptInput({ onGenerate, disabled }) {
    const [prompt, setPrompt] = useState('');
    const [selectedGenre, setSelectedGenre] = useState(GENRES[0].id);

    const handleSubmit = () => {
        if (!prompt.trim() || disabled) return;
        onGenerate(selectedGenre, prompt);
    };

    return (
        <div className="w-full max-w-[800px] px-4 py-2 mx-auto relative group z-30">
            <p className="text-white text-[13px] font-bold mb-2 tracking-widest uppercase ml-1 opacity-80">PROMPT:</p>

            {/* Glassmorphism Container with Neon Glow Focus */}
            <div className="relative rounded-2xl bg-black/20 border border-white/10 backdrop-blur-xl overflow-hidden transition-all duration-300 focus-within:bg-white/5 focus-within:border-white/30 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.15)] focus-within:ring-1 focus-within:ring-white/20 shadow-lg">

                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="어떤 스타일의 음악을 만들고 싶으신가요?"
                    disabled={disabled}
                    className="w-full bg-transparent text-white placeholder-white/40 p-5 outline-none resize-none min-h-[100px] text-base md:text-lg disabled:opacity-50"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />

                {/* Bottom Section: Genre Tags & Submit Button */}
                <div className="flex justify-between items-center px-5 py-3 bg-white/5 border-t border-white/10">
                    <div className="flex flex-wrap gap-2 md:gap-3">
                        {GENRES.map((genre) => {
                            const isSelected = selectedGenre === genre.id;
                            return (
                                <button
                                    key={genre.id}
                                    disabled={disabled}
                                    onClick={() => setSelectedGenre(genre.id)}
                                    className={`
                                        relative flex items-center justify-center space-x-1.5 px-3 py-1.5 md:px-4 md:py-2
                                        rounded-[12px] transition-all duration-300 ease-out transform
                                        backdrop-blur-xl font-bold border
                                        ${isSelected
                                            ? `${genre.color} ${genre.glow} scale-105`
                                            : `bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70 hover:scale-105`
                                        } 
                                        disabled:opacity-50 disabled:hover:scale-100 cursor-pointer
                                    `}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-white/5'}`}>
                                        <span className={`text-[14px] drop-shadow-md ${isSelected ? '' : 'opacity-50'}`}>{genre.emoji}</span>
                                    </div>
                                    <span className="text-[12px] md:text-[13px] tracking-wide whitespace-nowrap drop-shadow-sm">{genre.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={disabled || !prompt.trim()}
                        className="flex justify-center items-center bg-white/90 text-black px-6 py-2 rounded-full text-sm font-extrabold hover:bg-white hover:shadow-[0_0_15px_rgba(255,255,255,0.6)] hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        GENERATE
                    </button>
                </div>
            </div>
        </div>
    );
}
