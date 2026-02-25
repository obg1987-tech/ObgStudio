'use client';

import React, { useState } from 'react';

export const GENRES = [
  { id: 'Rock', label: 'Rock', emoji: 'R', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]', color: 'bg-[#ff7a70]/30 border-[#ff7a70]/50 text-white', hex: '#ef4444' },
  { id: 'Hip-hop', label: 'Hip-hop', emoji: 'H', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]', color: 'bg-[#9884ff]/30 border-[#9884ff]/50 text-white', hex: '#a855f7' },
  { id: 'K-Pop', label: 'K-Pop', emoji: 'K', glow: 'shadow-[0_0_15px_rgba(236,72,153,0.5)]', color: 'bg-[#ff75d8]/30 border-[#ff75d8]/50 text-white', hex: '#ec4899' },
  { id: 'Lullaby', label: 'Lullaby', emoji: 'L', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]', color: 'bg-[#5eead4]/30 border-[#5eead4]/50 text-white', hex: '#3b82f6' },
  { id: 'Jazz', label: 'Jazz', emoji: 'J', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]', color: 'bg-[#fcd34d]/30 border-[#fcd34d]/50 text-white', hex: '#f59e0b' },
];

const DEFAULT_PLACEHOLDER = '먼저 아래에서 음악 테마를 선택해 주세요.';
const themePromptText = (label) => `${label} 테마로 만들고 싶은 분위기, 악기, 템포를 자유롭게 적어 주세요.\n프롬프트 없이 "RANDOM MUSIC" 버튼만 눌러도 노래가 생성됩니다.`;

export default function PromptInput({ onGenerate, disabled, selectedGenre, onSelectGenre }) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (disabled || !selectedGenre) return;
    onGenerate(prompt, selectedGenre);
  };

  const hasGenre = Boolean(selectedGenre);
  const activeGenreObj = GENRES.find((g) => g.id === selectedGenre);
  const glowColor = activeGenreObj ? activeGenreObj.hex : 'transparent';

  const renderGenreButton = (genre, mobile = false) => {
    const isSelected = selectedGenre === genre.id;
    const btnOpacity = !hasGenre ? 'opacity-60 hover:opacity-100' : 'opacity-100';

    const sizeClass = mobile
      ? 'w-full px-2.5 py-1.5 rounded-[10px] space-x-1.5'
      : 'min-w-[86px] lg:min-w-[108px] 2xl:min-w-[180px] px-2.5 py-1.5 md:px-3 md:py-1.5 lg:px-4 lg:py-2 2xl:px-6 2xl:py-3 rounded-[10px] md:rounded-[12px] 2xl:rounded-[18px] space-x-1.5 md:space-x-2 2xl:space-x-3';

    const circleClass = mobile
      ? 'w-6 h-6'
      : 'w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 2xl:w-12 2xl:h-12';

    const textClass = mobile
      ? 'text-[11px]'
      : 'text-[11px] md:text-[12px] lg:text-[14px] 2xl:text-[22px]';

    const emojiClass = mobile
      ? 'text-[12px]'
      : 'text-[12px] md:text-[13px] lg:text-[15px] 2xl:text-[24px]';

    return (
      <button
        key={genre.id}
        disabled={disabled}
        onClick={() => onSelectGenre(genre.id)}
        className={`
          relative flex items-center justify-center
          transition-colors duration-300 ease-out
          backdrop-blur-xl font-bold border ${btnOpacity} ${sizeClass}
          ${isSelected
            ? `${genre.color} ${genre.glow}`
            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70'
          }
          disabled:opacity-50 cursor-pointer
        `}
      >
        <div className={`${circleClass} rounded-full flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-white/5'}`}>
          <span className={`${emojiClass} drop-shadow-md transition-all ${isSelected ? '' : 'opacity-50'}`}>{genre.emoji}</span>
        </div>
        <span className={`${textClass} tracking-wide whitespace-nowrap drop-shadow-sm font-bold`}>{genre.label}</span>
      </button>
    );
  };

  return (
    <div className="w-full max-w-[95%] md:max-w-[980px] xl:max-w-[1400px] 2xl:max-w-[1650px] px-2 md:px-4 py-1.5 md:py-2 mx-auto relative group z-30">
      <p className="text-white text-[11px] md:text-[13px] 2xl:text-[18px] font-bold mb-1.5 md:mb-2 tracking-widest uppercase ml-1 opacity-80">PROMPT:</p>

      <div
        className="relative rounded-2xl bg-black/40 border backdrop-blur-2xl overflow-hidden transition-all duration-700 ease-out flex flex-col"
        style={{
          boxShadow: hasGenre ? `0 0 30px ${glowColor}60, inset 0 0 20px ${glowColor}20` : '0 0 15px rgba(0,0,0,0.5)',
          borderColor: hasGenre ? `${glowColor}80` : 'rgba(255,255,255,0.1)',
        }}
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={hasGenre ? themePromptText(activeGenreObj.label) : DEFAULT_PLACEHOLDER}
          disabled={disabled}
          className="w-full bg-transparent text-white placeholder-white/30 p-3 md:p-4 2xl:p-7 outline-none resize-none min-h-[58px] md:min-h-[84px] 2xl:min-h-[150px] text-[14px] md:text-lg 2xl:text-3xl disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <div className="px-3 md:px-5 2xl:px-8 py-2 md:py-2.5 2xl:py-4 bg-white/5 border-t border-white/10">
          <div className="grid grid-cols-3 gap-1.5 md:hidden">
            {GENRES.map((genre) => renderGenreButton(genre, true))}
            <button
              onClick={handleSubmit}
              disabled={disabled || !hasGenre}
              className={`w-full flex justify-center items-center px-2 py-1.5 rounded-[10px] text-[10px] font-extrabold transition-colors duration-300
                ${hasGenre
                  ? 'bg-white/90 text-black hover:bg-white'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
                }
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {prompt.trim() ? (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              {prompt.trim() ? 'GENERATE' : 'RANDOM MUSIC'}
            </button>
          </div>

          <div className="hidden md:flex justify-between items-center gap-2 md:gap-3">
            <div className="flex flex-nowrap items-center gap-2 md:gap-2.5 2xl:gap-5 whitespace-nowrap">
              {GENRES.map((genre) => renderGenreButton(genre, false))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={disabled || !hasGenre}
              className={`min-w-[108px] lg:min-w-[136px] 2xl:min-w-[220px] flex justify-center items-center px-3 py-1.5 lg:px-4 lg:py-2 2xl:px-7 2xl:py-3 rounded-full text-[10px] md:text-[11px] lg:text-xs 2xl:text-xl font-extrabold transition-colors duration-300 whitespace-nowrap
                ${hasGenre
                  ? 'bg-white/90 text-black hover:bg-white hover:shadow-[0_0_15px_rgba(255,255,255,0.6)]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
                }
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5 2xl:h-8 2xl:w-8 mr-1.5 lg:mr-2 2xl:mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {prompt.trim() ? (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              {prompt.trim() ? 'GENERATE' : 'RANDOM MUSIC'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
