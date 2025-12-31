import { useState } from 'react';

export function AboutModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex fixed bottom-4 left-1/2 -translate-x-1/2 z-40 items-center gap-1.5 px-3 py-1.5 rounded-lg
                   bg-cosmic-800/30 backdrop-blur-sm border border-cosmic-600/15
                   text-xs text-cosmic-400 font-display tracking-wider
                   opacity-30 hover:opacity-80 hover:bg-cosmic-700/40 hover:text-cosmic-200 hover:border-cosmic-500/25
                   transition-all duration-300"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>About</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-cosmic-900/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <div 
            className="relative w-full max-w-md mx-4 glass rounded-2xl overflow-hidden shadow-2xl shadow-cosmic-900/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-cosmic-800/50 
                         flex items-center justify-center text-cosmic-400 hover:text-white 
                         hover:bg-cosmic-700/50 transition-all duration-200 z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-xl font-display font-bold text-white tracking-wide">
                About Calm Down Space
              </h2>
              <p className="mt-2 text-sm text-cosmic-300 leading-relaxed">
                A visual meditation tool to help you focus, relax, and enter a flow state.
              </p>
            </div>

            {/* Spotify Section */}
            <div className="px-6 pb-4">
              <h3 className="text-xs font-display text-cosmic-400 uppercase tracking-widest mb-3">
                Listen on Spotify
              </h3>
              <div className="rounded-xl overflow-hidden">
                <iframe 
                  src="https://open.spotify.com/embed/artist/6dLjH4CwfSpjjLTa2xsIFv?utm_source=generator&theme=0" 
                  width="100%" 
                  height="152" 
                  frameBorder="0" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-cosmic-600/10 bg-cosmic-800/20">
              <p className="text-xs text-cosmic-500 text-center">
                Made with ♥ by Nick Zaleski
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

