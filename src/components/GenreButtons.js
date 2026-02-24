// src/components/GenreButtons.js
import React from 'react';

const GENRES = [
    { id: 'Rock', label: 'Rock', emoji: '🎸', color: 'bg-red-500/20', hover: 'hover:bg-red-500/40', border: 'border-red-500/50' },
    { id: 'Hip-hop', label: 'Hip-hop', emoji: '🎧', color: 'bg-purple-500/20', hover: 'hover:bg-purple-500/40', border: 'border-purple-500/50' },
    { id: 'Pop', label: 'Pop', emoji: '🎤', color: 'bg-pink-500/20', hover: 'hover:bg-pink-500/40', border: 'border-pink-500/50' },
    { id: 'EDM', label: 'EDM', emoji: '⚡', color: 'bg-blue-500/20', hover: 'hover:bg-blue-500/40', border: 'border-blue-500/50' },
];

export default function GenreButtons({ onSelectGenre, isLoading, currentGenre }) {
    return (
        <div className="flex flex-col items-center justify-center space-y-8 w-full z-10">

            {/* 1. 로봇 상태 및 말풍선 UI */}
            <div className="relative flex flex-col items-center h-24 mt-8 transition-all duration-300">
                {isLoading ? (
                    <div className="flex items-center space-x-4">
                        {/* LED Status Indicator - Orange Pulsing */}
                        <div className="relative flex h-6 w-6">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-6 w-6 bg-orange-500 border-2 border-white shadow-[0_0_15px_rgba(249,115,22,0.6)]"></span>
                        </div>

                        {/* Speech Bubble / 말풍선 */}
                        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-6 py-3 shadow-xl">
                            <p className="text-white text-lg font-medium animate-pulse">
                                {currentGenre} 스타일로 열심히 작곡 중이야! 🎵
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center space-x-4 opacity-50">
                        {/* Default LED - Green or Blue */}
                        <div className="relative flex h-4 w-4">
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-400 border border-white shadow-[0_0_10px_rgba(34,211,238,0.5)]"></span>
                        </div>
                        <p className="text-white/70 text-sm">대기 중... 장르를 골라줘!</p>
                    </div>
                )}
            </div>

            {/* 2. 장르 선택 버튼 리스트 (Glassmorphism 적용) */}
            <div className="flex flex-wrap gap-4 justify-center">
                {GENRES.map((genre) => (
                    <button
                        key={genre.id}
                        onClick={() => onSelectGenre(genre.id)}
                        disabled={isLoading}
                        className={`
              relative flex items-center justify-center space-x-3 px-8 py-4 
              rounded-2xl transition-all duration-300 ease-out transform
              backdrop-blur-xl border border-white/20 shadow-lg text-white font-bold
              ${genre.color} ${genre.hover} ${genre.border}
              ${isLoading ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:scale-105 hover:-translate-y-1 active:scale-95'}
              focus:outline-none focus:ring-2 focus:ring-white/50
            `}
                    >
                        <span className="text-2xl drop-shadow-md">{genre.emoji}</span>
                        <span className="text-xl tracking-wide">{genre.label}</span>
                    </button>
                ))}
            </div>

        </div>
    );
}
