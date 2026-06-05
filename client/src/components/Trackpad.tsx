import React, { useRef, useState } from 'react';

interface TrackpadProps {
  onMove: (dx: number, dy: number) => void;
  onClick: (button: 'left' | 'right') => void;
  onDblClick: () => void;
  onScroll: (dy: number) => void;
  onMouseDown: () => void;
  onMouseUp: () => void;
  sensitivity: number;
}

const Trackpad: React.FC<TrackpadProps> = ({
  onMove, onClick, onDblClick, onScroll, onMouseDown, onMouseUp, sensitivity,
}) => {
  const lastPos        = useRef({ x: 0, y: 0 });
  const isScrolling    = useRef(false);
  const initialTouchY  = useRef(0);
  const touchStartTime = useRef(0);
  const hasMoved       = useRef(false);
  const lastScrollTime = useRef(0);
  const lastLeftTap    = useRef(0);
  const dragTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging     = useRef(false);

  const [isActive, setIsActive]   = useState(false);
  const [dragMode, setDragMode]   = useState(false);
  const [ripple, setRipple]       = useState<{ x: number; y: number; id: number } | null>(null);

  const vibrate = (ms: number) => window.navigator.vibrate?.(ms);

  /* ── Surface handlers ── */

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartTime.current = Date.now();
    hasMoved.current = false;
    setIsActive(true);

    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: touch.clientX - rect.left, y: touch.clientY - rect.top, id: Date.now() });

    if (e.touches.length === 2) {
      isScrolling.current = true;
      // Moyenne des 2 doigts pour un scroll stable
      initialTouchY.current = (e.touches[0].pageY + e.touches[1].pageY) / 2;
    } else {
      isScrolling.current = false;
      lastPos.current = { x: touch.clientX, y: touch.clientY };

      // Long-press → drag mode
      dragTimer.current = setTimeout(() => {
        if (!hasMoved.current) {
          isDragging.current = true;
          setDragMode(true);
          vibrate(80);
          onMouseDown();
        }
      }, 450);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const dx = touch.clientX - lastPos.current.x;
    const dy = touch.clientY - lastPos.current.y;

    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      hasMoved.current = true;
      // Cancel pending drag timer if user starts moving before long-press fires
      if (dragTimer.current && !isDragging.current) {
        clearTimeout(dragTimer.current);
        dragTimer.current = null;
      }
    }

    if (e.touches.length === 2) {
      const avgY = (e.touches[0].pageY + e.touches[1].pageY) / 2;
      onScroll((avgY - initialTouchY.current) / 5);
      if (Date.now() - lastScrollTime.current > 100) {
        vibrate(10);
        lastScrollTime.current = Date.now();
      }
      initialTouchY.current = avgY;
      return;
    }

    onMove(dx * sensitivity, dy * sensitivity);
    lastPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Un doigt reste encore → on est en train de lever le 2e doigt après un scroll
    // Ne pas interpréter ce relâchement comme un tap
    if (e.touches.length > 0) {
      isScrolling.current = false;
      return;
    }

    if (dragTimer.current) {
      clearTimeout(dragTimer.current);
      dragTimer.current = null;
    }

    setIsActive(false);
    setRipple(null);

    // Release drag
    if (isDragging.current) {
      isDragging.current = false;
      setDragMode(false);
      vibrate(40);
      onMouseUp();
      return;
    }

    // Tap-to-click — ignoré si on était en train de scroller
    const duration = Date.now() - touchStartTime.current;
    if (!hasMoved.current && !isScrolling.current && duration < 200) {
      vibrate(50);
      onClick('left');
    }

    isScrolling.current = false;
  };

  /* ── Click bar handlers ── */

  const handleLeftClick = () => {
    vibrate(50);
    const now = Date.now();
    if (now - lastLeftTap.current < 300) {
      onDblClick();
    } else {
      onClick('left');
    }
    lastLeftTap.current = now;
  };

  const handleRightClick = () => {
    vibrate(50);
    onClick('right');
  };

  return (
    <div className={`trackpad ${dragMode ? 'trackpad--drag' : ''}`}>
      {/* ── Touch surface ── */}
      <div
        className={`trackpad__surface ${isActive ? 'trackpad__surface--active' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="trackpad__grid" />

        {dragMode ? (
          <div className="trackpad__drag-indicator">
            <span className="trackpad__drag-icon">⊹</span>
            <span className="trackpad__drag-text">Maintien actif</span>
          </div>
        ) : (
          <div className="trackpad__hint">
            <span className="trackpad__hint-icon">◉</span>
            <span className="trackpad__hint-text">Glissez — 2 doigts pour scroller</span>
          </div>
        )}

        {ripple && (
          <div
            className="trackpad__ripple"
            style={{ left: ripple.x, top: ripple.y }}
          />
        )}
      </div>

      {/* ── Click bar ── */}
      <div className="trackpad__clickbar">
        <button className="trackpad__click-btn" onPointerDown={handleLeftClick}>
          Clic gauche
        </button>
        <div className="trackpad__click-divider" />
        <button className="trackpad__click-btn" onPointerDown={handleRightClick}>
          Clic droit
        </button>
      </div>
    </div>
  );
};

export default Trackpad;
