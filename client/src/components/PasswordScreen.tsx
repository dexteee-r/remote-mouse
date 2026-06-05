import React, { useState } from 'react';

interface PasswordScreenProps {
  onAuthenticate: (password: string, permanent: boolean) => void;
  hasError: boolean;
  isConnecting: boolean;
}

const PasswordScreen: React.FC<PasswordScreenProps> = ({ onAuthenticate, hasError, isConnecting }) => {
  const [password, setPassword] = useState('');

  const submit = (permanent: boolean) => {
    if (!password) return;
    onAuthenticate(password, permanent);
  };

  return (
    <div className="pwd-screen">
      <div className="pwd-card">
        <div className="pwd-icon">🖱</div>
        <h1 className="pwd-title">Remote Mouse</h1>
        <p className="pwd-subtitle">Entrez le mot de passe pour accéder au contrôle</p>

        <input
          className={`pwd-input ${hasError ? 'pwd-input--error' : ''}`}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit(false)}
          placeholder="Mot de passe…"
          autoFocus
          autoComplete="current-password"
        />

        {hasError && (
          <p className="pwd-error">Mot de passe incorrect</p>
        )}

        <div className="pwd-actions">
          <button
            className="pwd-btn pwd-btn--secondary"
            onClick={() => submit(false)}
            disabled={!password || isConnecting}
          >
            Temporaire
          </button>
          <button
            className="pwd-btn pwd-btn--primary"
            onClick={() => submit(true)}
            disabled={!password || isConnecting}
          >
            Permanent
          </button>
        </div>

        <p className="pwd-hint">
          <strong>Permanent</strong> — mémorisé sur cet appareil<br />
          <strong>Temporaire</strong> — oublié à la fermeture
        </p>
      </div>
    </div>
  );
};

export default PasswordScreen;
