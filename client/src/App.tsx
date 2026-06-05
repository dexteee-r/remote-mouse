import React, { useState } from 'react';
import Trackpad from './components/Trackpad';
import KeyboardInput from './components/KeyboardInput';
import MediaControls from './components/MediaControls';
import PasswordScreen from './components/PasswordScreen';
import { useWebSocket } from './hooks/useWebSocket';
import './App.css';

type Tab = 'trackpad' | 'keyboard' | 'media';

const TABS = [
  { id: 'trackpad', icon: '◉', label: 'Trackpad' },
  { id: 'keyboard', icon: '⌨', label: 'Clavier'  },
  { id: 'media',    icon: '♪', label: 'Média'    },
] as const;

function App() {
  const serverIp = window.location.hostname || 'localhost';
  const [sensitivity, setSensitivity] = useState(() => {
    const saved = localStorage.getItem('sensitivity');
    return saved ? parseFloat(saved) : 3.0;
  });
  const [activeTab, setActiveTab] = useState<Tab>('trackpad');

  const {
    status, isAuthenticated, authError, authenticate,
    sendMove, sendClick, sendDblClick, sendScroll,
    sendType, sendKey, sendHotkey, sendMouseDown, sendMouseUp,
  } = useWebSocket(`ws://${serverIp}:8765`);

  const vibrate = (ms = 30) => window.navigator.vibrate?.(ms);

  const sliderProgress = ((sensitivity - 1) / 9) * 100;
  const statusLabel =
    status === 'connected'  ? 'En ligne'   :
    status === 'connecting' ? 'Connexion…' : 'Hors ligne';

  if (!isAuthenticated) {
    return (
      <PasswordScreen
        onAuthenticate={authenticate}
        hasError={authError}
        isConnecting={status === 'connecting'}
      />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className={`status-dot status-dot--${status}`} />
        <span className="status-label">{statusLabel}</span>
        <code className="server-addr">{serverIp}:8765</code>
      </header>

      <main className="app-content">
        {activeTab === 'trackpad' && (
          <div className="tab-pane tab-pane--trackpad">
            <div className="sensitivity-row">
              <span className="sensitivity-label">Sensibilité</span>
              <input
                className="sensitivity-slider"
                type="range" min="1" max="10" step="0.5"
                value={sensitivity}
                onChange={(e) => { const v = parseFloat(e.target.value); setSensitivity(v); localStorage.setItem('sensitivity', String(v)); }}
                style={{ '--p': `${sliderProgress}%` } as React.CSSProperties}
              />
              <span className="sensitivity-val">{sensitivity.toFixed(1)}×</span>
            </div>
            <Trackpad
              onMove={sendMove}
              onClick={sendClick}
              onDblClick={sendDblClick}
              onScroll={sendScroll}
              onMouseDown={sendMouseDown}
              onMouseUp={sendMouseUp}
              sensitivity={sensitivity}
            />
          </div>
        )}

        {activeTab === 'keyboard' && (
          <div className="tab-pane tab-pane--keyboard">
            <KeyboardInput onType={sendType} onKey={sendKey} />
          </div>
        )}

        {activeTab === 'media' && (
          <div className="tab-pane tab-pane--media">
            <MediaControls onKey={sendKey} onHotkey={sendHotkey} />
          </div>
        )}
      </main>

      <nav className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'tab-btn--active' : ''}`}
            onClick={() => { vibrate(20); setActiveTab(tab.id as Tab); }}
          >
            <span className="tab-btn__icon">{tab.icon}</span>
            <span className="tab-btn__label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
