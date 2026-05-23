import { useState } from 'react';
import type { GameMode, Difficulty, Theme, PlayerConfig } from '../types';
import { playClickSound } from '../utils/audio';

interface GameLobbyProps {
  onStartGame: (config: {
    mode: GameMode;
    difficulty: Difficulty;
    theme: Theme;
    blitzSeconds: number | null;
    player1: PlayerConfig;
    player2: PlayerConfig;
  }) => void;
  initialTheme: Theme;
}

export const GameLobby: React.FC<GameLobbyProps> = ({ onStartGame, initialTheme }) => {
  const [mode, setMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('unbeatable');
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [blitzSeconds, setBlitzSeconds] = useState<number | null>(null);

  // Player Names
  const [p1Name, setP1Name] = useState('Player 1');
  const [p2Name, setP2Name] = useState('Player 2');
  const [aiName, setAiName] = useState('Nebula AI');
  
  // Who plays X or O in AI mode?
  const [p1Sign, setP1Sign] = useState<'X' | 'O'>('X');

  const handleModeChange = (newMode: GameMode) => {
    playClickSound();
    setMode(newMode);
  };

  const handleDifficultyChange = (diff: Difficulty) => {
    playClickSound();
    setDifficulty(diff);
    // Custom names for AI depending on difficulty for added polish
    if (diff === 'easy') setAiName('Novice Bot');
    else if (diff === 'medium') setAiName('Spark AI');
    else setAiName('Nebula AI');
  };

  const handleThemeChange = (newTheme: Theme) => {
    playClickSound();
    setTheme(newTheme);
    
    // Apply theme class to body immediately so the background transitions smoothly
    const body = document.body;
    body.className = `theme-${newTheme}`;
  };

  const handleBlitzChange = (seconds: number | null) => {
    playClickSound();
    setBlitzSeconds(seconds);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    const p1Color = theme === 'retro' ? 'var(--color-x)' : (theme === 'space' ? 'var(--color-x)' : 'var(--color-x)');
    const p2Color = theme === 'retro' ? 'var(--color-o)' : (theme === 'space' ? 'var(--color-o)' : 'var(--color-o)');

    const player1: PlayerConfig = {
      name: p1Name.trim() || 'Player 1',
      sign: mode === 'ai' ? p1Sign : 'X',
      color: p1Sign === 'X' ? p1Color : p2Color,
    };

    const player2: PlayerConfig = {
      name: mode === 'ai' ? aiName : (p2Name.trim() || 'Player 2'),
      sign: mode === 'ai' ? (p1Sign === 'X' ? 'O' : 'X') : 'O',
      color: (mode === 'ai' ? (p1Sign === 'X' ? p2Color : p1Color) : p2Color),
    };

    onStartGame({
      mode,
      difficulty,
      theme,
      blitzSeconds,
      player1,
      player2,
    });
  };

  return (
    <div className="glass-panel fade-enter-active">
      <h2 className="lobby-title">Game Setup</h2>

      <form onSubmit={handleSubmit}>
        {/* Game Mode */}
        <div className="setup-group">
          <div className="lobby-section-label">Select Mode</div>
          <div className="mode-cards">
            <button
              type="button"
              className={`mode-card ${mode === 'ai' ? 'active' : ''}`}
              onClick={() => handleModeChange('ai')}
            >
              <div className="mode-icon">🤖</div>
              <div className="mode-name">Single Player</div>
              <div className="mode-desc">Challenge the AI</div>
            </button>
            <button
              type="button"
              className={`mode-card ${mode === 'local' ? 'active' : ''}`}
              onClick={() => handleModeChange('local')}
            >
              <div className="mode-icon">👥</div>
              <div className="mode-name">Local PvP</div>
              <div className="mode-desc">Pass and Play</div>
            </button>
          </div>
        </div>

        {/* Player Customization */}
        <div className="setup-group">
          <div className="lobby-section-label">Players</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
                {mode === 'ai' ? 'Your Name' : 'Player 1 Name (Plays X)'}
              </label>
              <input
                type="text"
                className="lobby-input"
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                maxLength={15}
                required
              />
            </div>

            {mode === 'local' && (
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
                  Player 2 Name (Plays O)
                </label>
                <input
                  type="text"
                  className="lobby-input"
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  maxLength={15}
                  required
                />
              </div>
            )}

            {mode === 'ai' && (
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
                  Choose Your Marker
                </label>
                <div className="pill-selector">
                  <button
                    type="button"
                    className={`pill-btn ${p1Sign === 'X' ? 'active' : ''}`}
                    onClick={() => { playClickSound(); setP1Sign('X'); }}
                  >
                    Play as X
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${p1Sign === 'O' ? 'active' : ''}`}
                    onClick={() => { playClickSound(); setP1Sign('O'); }}
                  >
                    Play as O
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Difficulty (AI Mode only) */}
        {mode === 'ai' && (
          <div className="setup-group">
            <div className="lobby-section-label">AI Difficulty</div>
            <div className="pill-selector">
              <button
                type="button"
                className={`pill-btn ${difficulty === 'easy' ? 'active' : ''}`}
                onClick={() => handleDifficultyChange('easy')}
              >
                Easy
              </button>
              <button
                type="button"
                className={`pill-btn ${difficulty === 'medium' ? 'active' : ''}`}
                onClick={() => handleDifficultyChange('medium')}
              >
                Medium
              </button>
              <button
                type="button"
                className={`pill-btn ${difficulty === 'unbeatable' ? 'active' : ''}`}
                onClick={() => handleDifficultyChange('unbeatable')}
              >
                Unbeatable
              </button>
            </div>
          </div>
        )}

        {/* Blitz Turn Timer */}
        <div className="setup-group">
          <div className="lobby-section-label">Turn Timer (Blitz)</div>
          <div className="pill-selector">
            <button
              type="button"
              className={`pill-btn ${blitzSeconds === null ? 'active' : ''}`}
              onClick={() => handleBlitzChange(null)}
            >
              Classic (Infinite)
            </button>
            <button
              type="button"
              className={`pill-btn ${blitzSeconds === 3 ? 'active' : ''}`}
              onClick={() => handleBlitzChange(3)}
            >
              3s (Chaos)
            </button>
            <button
              type="button"
              className={`pill-btn ${blitzSeconds === 5 ? 'active' : ''}`}
              onClick={() => handleBlitzChange(5)}
            >
              5s (Blitz)
            </button>
            <button
              type="button"
              className={`pill-btn ${blitzSeconds === 10 ? 'active' : ''}`}
              onClick={() => handleBlitzChange(10)}
            >
              10s (Tactical)
            </button>
          </div>
        </div>

        {/* Theme Picker */}
        <div className="setup-group">
          <div className="lobby-section-label">Select Theme</div>
          <div className="theme-picker">
            <button
              type="button"
              className={`theme-option ${theme === 'cyberpunk' ? 'active' : ''}`}
              onClick={() => handleThemeChange('cyberpunk')}
            >
              <div className="theme-preview-circle theme-preview-cyberpunk" />
              <div className="theme-option-name">Cyberpunk</div>
            </button>

            <button
              type="button"
              className={`theme-option ${theme === 'space' ? 'active' : ''}`}
              onClick={() => handleThemeChange('space')}
            >
              <div className="theme-preview-circle theme-preview-space" />
              <div className="theme-option-name">Celestial</div>
            </button>

            <button
              type="button"
              className={`theme-option ${theme === 'retro' ? 'active' : ''}`}
              onClick={() => handleThemeChange('retro')}
            >
              <div className="theme-preview-circle theme-preview-retro" />
              <div className="theme-option-name">Classic Arcade</div>
            </button>
          </div>
        </div>

        <button type="submit" className="action-btn">
          Launch Match
        </button>
      </form>
    </div>
  );
};
