import React from 'react';

interface MediaControlsProps {
  onKey: (key: string) => void;
  onHotkey: (keys: string[]) => void;
}

const MediaControls: React.FC<MediaControlsProps> = ({ onKey, onHotkey }) => {
  const vibrate = () => window.navigator.vibrate?.(40);

  const pressKey = (key: string) => { vibrate(); onKey(key); };
  const pressHotkey = (keys: string[]) => { vibrate(); onHotkey(keys); };

  return (
    <div className="media">
      <section className="media__section">
        <span className="media__title">Lecture</span>
        <div className="media__row">
          <button className="media-btn" onClick={() => pressKey('prevtrack')}>⏮</button>
          <button className="media-btn media-btn--primary" onClick={() => pressKey('playpause')}>⏯</button>
          <button className="media-btn" onClick={() => pressKey('nexttrack')}>⏭</button>
          <button className="media-btn" onClick={() => pressKey('stop')}>⏹</button>
        </div>
      </section>

      <section className="media__section">
        <span className="media__title">Volume</span>
        <div className="media__row">
          <button className="media-btn" onClick={() => pressKey('volumedown')}>🔉</button>
          <button className="media-btn" onClick={() => pressKey('volumemute')}>🔇</button>
          <button className="media-btn" onClick={() => pressKey('volumeup')}>🔊</button>
        </div>
      </section>

      <section className="media__section">
        <span className="media__title">Raccourcis</span>
        <div className="media__shortcuts">
          <button className="shortcut-btn" onClick={() => pressKey('winleft')}>Win</button>
          <button className="shortcut-btn" onClick={() => pressHotkey(['win', 'd'])}>Win+D</button>
          <button className="shortcut-btn" onClick={() => pressHotkey(['alt', 'tab'])}>Alt+Tab</button>
          <button className="shortcut-btn" onClick={() => pressHotkey(['ctrl', 'c'])}>Ctrl+C</button>
          <button className="shortcut-btn" onClick={() => pressHotkey(['ctrl', 'v'])}>Ctrl+V</button>
          <button className="shortcut-btn" onClick={() => pressHotkey(['ctrl', 'z'])}>Ctrl+Z</button>
          <button className="shortcut-btn" onClick={() => pressHotkey(['ctrl', 'a'])}>Ctrl+A</button>
        </div>
      </section>
    </div>
  );
};

export default MediaControls;
