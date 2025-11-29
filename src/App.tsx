import { useState, useEffect } from 'react';
import { VisualCanvas } from './components/VisualCanvas';
import { ControlsPanel } from './components/ControlsPanel';
import { setBlobColor } from './visuals/blobColorState';

/**
 * Main application component
 * Combines the visual canvas with floating control panel
 */
function App() {
  const [modeId, setModeId] = useState('breathing-blob');
  const [loopDuration, setLoopDuration] = useState(30);
  const [blobColor, setBlobColorState] = useState('#c471ed'); // Default nebula purple
  
  // Sync blob color with the visual mode
  useEffect(() => {
    setBlobColor(blobColor);
  }, [blobColor]);
  
  return (
    <div className="relative w-full h-screen overflow-hidden bg-cosmic-900">
      {/* Visual Canvas - Background */}
      <VisualCanvas modeId={modeId} loopDuration={loopDuration} />
      
      {/* Floating Controls Panel */}
      <ControlsPanel
        modeId={modeId}
        onModeChange={setModeId}
        loopDuration={loopDuration}
        onLoopDurationChange={setLoopDuration}
        blobColor={blobColor}
        onBlobColorChange={setBlobColorState}
      />
      
      {/* Subtle branding */}
      <div className="fixed bottom-4 left-4 z-40 opacity-30 hover:opacity-60 transition-opacity duration-500">
        <p className="text-[10px] text-cosmic-400 font-display tracking-widest">
          VISUAL ENGINE v1.0
        </p>
      </div>
    </div>
  );
}

export default App;
