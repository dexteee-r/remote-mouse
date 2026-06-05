import React, { useRef, useState } from 'react';

interface KeyboardInputProps {
  onType: (text: string) => void;
  onKey: (key: string) => void;
}

const KeyboardInput: React.FC<KeyboardInputProps> = ({ onType, onKey }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const vibrate = () => window.navigator.vibrate?.(40);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue) return;
    vibrate();
    onType(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      vibrate();
      onKey('enter');
      setInputValue('');
    } else if (e.key === 'Backspace' && inputValue === '') {
      vibrate();
      onKey('backspace');
    }
  };

  const pressKey = (key: string) => {
    vibrate();
    onKey(key);
    // Rend le focus à l'input après chaque touche spéciale (filet iOS)
    inputRef.current?.focus();
  };

  // Empêche les boutons spéciaux de voler le focus à l'input
  const noFocusSteal = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="keyboard">
      <form className="keyboard__form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="keyboard__input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tapez du texte…"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button type="submit" className="keyboard__submit">Envoyer</button>
      </form>

      <div className="keyboard__special">
        <button className="keyboard__special-btn" onMouseDown={noFocusSteal} onClick={() => pressKey('backspace')}>⌫ Effacer</button>
        <button className="keyboard__special-btn" onMouseDown={noFocusSteal} onClick={() => pressKey('enter')}>⏎ Entrée</button>
        <button className="keyboard__special-btn" onMouseDown={noFocusSteal} onClick={() => pressKey('esc')}>Échap</button>
        <button className="keyboard__special-btn" onMouseDown={noFocusSteal} onClick={() => pressKey('tab')}>⇥ Tab</button>
        <button className="keyboard__special-btn" onMouseDown={noFocusSteal} onClick={() => pressKey('delete')}>⌦ Suppr</button>
      </div>

      <div className="keyboard__arrows">
        <button className="keyboard__arrow-btn" style={{ gridArea: 'up' }}    onMouseDown={noFocusSteal} onClick={() => pressKey('up')}>↑</button>
        <button className="keyboard__arrow-btn" style={{ gridArea: 'left' }}  onMouseDown={noFocusSteal} onClick={() => pressKey('left')}>←</button>
        <button className="keyboard__arrow-btn" style={{ gridArea: 'down' }}  onMouseDown={noFocusSteal} onClick={() => pressKey('down')}>↓</button>
        <button className="keyboard__arrow-btn" style={{ gridArea: 'right' }} onMouseDown={noFocusSteal} onClick={() => pressKey('right')}>→</button>
      </div>
    </div>
  );
};

export default KeyboardInput;
