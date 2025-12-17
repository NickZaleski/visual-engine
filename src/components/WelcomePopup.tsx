import { useState, useEffect } from 'react';

interface WelcomePopupProps {
  onClose: () => void;
}

/**
 * Welcome popup shown on first visit announcing Spotify release
 * Works on all devices including mobile
 */
export function WelcomePopup({ onClose }: WelcomePopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };
  
  return (
    <div 
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4
                  transition-all duration-300
                  ${isVisible ? 'bg-cosmic-900/90 backdrop-blur-md' : 'bg-transparent'}`}
      onClick={handleClose}
    >
      <div 
        className={`relative w-full max-w-md rounded-3xl overflow-hidden
                    bg-gradient-to-br from-cosmic-800/95 via-cosmic-900/95 to-cosmic-800/95
                    border border-white/10 shadow-2xl shadow-nebula-purple/20
                    transition-all duration-500 ease-out
                    ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gradient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/10 via-transparent to-nebula-purple/10 pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full 
                     bg-white/5 hover:bg-white/10
                     flex items-center justify-center
                     text-cosmic-400 hover:text-white
                     transition-all duration-200 z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Content */}
        <div className="relative p-8 text-center">
          {/* Spotify Logo Animation */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#1DB954]/30 blur-2xl rounded-full animate-pulse" />
              <svg 
                className="relative w-20 h-20 text-[#1DB954] drop-shadow-lg" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
          </div>
          
          {/* Announcement Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full
                          bg-[#1DB954]/20 border border-[#1DB954]/30">
            <span className="w-2 h-2 bg-[#1DB954] rounded-full animate-pulse" />
            <span className="text-[#1DB954] text-xs font-semibold uppercase tracking-wider">New Release</span>
          </div>
          
          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3 tracking-wide">
            We're on Spotify!
          </h2>
          
          {/* Description */}
          <p className="text-cosmic-300 text-sm sm:text-base leading-relaxed mb-6 max-w-sm mx-auto">
            Enhance your focus sessions with our curated ambient music. 
            Follow us for exclusive tracks designed for deep work.
          </p>
          
          {/* Spotify Button */}
          <a
            href="https://open.spotify.com/artist/6dLjH4CwfSpjjLTa2xsIFv"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 w-full sm:w-auto
                       px-8 py-4 rounded-full
                       bg-[#1DB954] hover:bg-[#1ed760] active:bg-[#1aa34a]
                       text-white font-semibold text-base
                       transform hover:scale-[1.02] active:scale-[0.98]
                       transition-all duration-200
                       shadow-lg shadow-[#1DB954]/30"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Follow on Spotify
          </a>
          
          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
            <span className="text-cosmic-500 text-xs uppercase tracking-wider">Connect</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
          </div>
          
          {/* Social & Contact */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/calmdownspace/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl
                         bg-gradient-to-r from-[#833AB4]/20 via-[#FD1D1D]/20 to-[#F77737]/20
                         border border-[#E1306C]/30 hover:border-[#E1306C]/50
                         text-cosmic-300 hover:text-white
                         transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="text-sm font-medium">@calmdownspace</span>
            </a>
            
            {/* Email */}
            <a 
              href="mailto:sidfedner27@gmail.com"
              className="flex items-center gap-2 text-cosmic-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">sidfedner27@gmail.com</span>
            </a>
          </div>
          
          {/* Skip link */}
          <button
            onClick={handleClose}
            className="mt-6 text-cosmic-500 hover:text-cosmic-300 text-xs
                       transition-colors duration-200"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}


