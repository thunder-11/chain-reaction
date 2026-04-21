/**
 * main.js — Entry point for Chain Reaction Game.
 * Wires up start screen, initializes all modules, connects events.
 * Includes screen transition utility and board size / player name configuration.
 */

// ===== Board size options (section 7a) =====
const BOARD_SIZES = {
  '6x6':  { rows: 6,  cols: 6  },
  '8x8':  { rows: 8,  cols: 8  },
  '10x10': { rows: 10, cols: 10 },
};

// ===== Player configuration options =====
const PLAYER_CONFIGS = {
  2: [
    { id: 'p1', name: 'Red',    color: '#e74c3c' },
    { id: 'p2', name: 'Blue',   color: '#3498db' },
  ],
  3: [
    { id: 'p1', name: 'Red',    color: '#e74c3c' },
    { id: 'p2', name: 'Blue',   color: '#3498db' },
    { id: 'p3', name: 'Green',  color: '#2ecc71' },
  ],
  4: [
    { id: 'p1', name: 'Red',    color: '#e74c3c' },
    { id: 'p2', name: 'Blue',   color: '#3498db' },
    { id: 'p3', name: 'Green',  color: '#2ecc71' },
    { id: 'p4', name: 'Yellow', color: '#f1c40f' },
  ],
};

let game = null;
let renderer = null;
let selectedPlayerCount = 2; // default
let selectedBoardSize = '8x8'; // default
let soundEngine = null;
let themeManager = null;

// ===== DOM references =====
const startScreen  = document.getElementById('start-screen');
const gameScreen   = document.getElementById('game-screen');
const winScreen    = document.getElementById('win-screen');
const newGameBtn   = document.getElementById('new-game-btn');
const playAgainBtn = document.getElementById('play-again-btn');

// ===== Screen transition utility (section 6) =====
function transitionScreens(outEl, inEl, ms = 280) {
  outEl.style.transition = `opacity ${ms}ms ease, transform ${ms}ms ease`;
  outEl.style.opacity = '0';
  outEl.style.transform = 'translateY(-10px)';
  setTimeout(() => {
    outEl.classList.add('hidden');
    outEl.style.cssText = '';
    inEl.classList.remove('hidden');
    inEl.style.opacity = '0';
    inEl.style.transform = 'translateY(10px)';
    requestAnimationFrame(() => {
      inEl.style.transition = `opacity ${ms}ms ease, transform ${ms}ms ease`;
      inEl.style.opacity = '1';
      inEl.style.transform = 'translateY(0)';
    });
  }, ms);
}

// ===== Initialize ThemeManager (section 4) =====
themeManager = new ThemeManager(['theme-btn-start', 'theme-btn-hud']);

// ===== Initialize SoundEngine (section 5) =====
soundEngine = new SoundEngine();

// Wire sound toggle button
const soundToggleBtn = document.getElementById('sound-toggle-btn');
if (soundToggleBtn) {
  soundToggleBtn.addEventListener('click', () => {
    soundEngine.toggle();
    soundToggleBtn.classList.toggle('sound-off', !soundEngine.enabled);
    soundToggleBtn.querySelector('.sound-icon').textContent = soundEngine.enabled ? '♪' : '♪̸';
  });
}

// ===== Board size selector buttons (section 7a) =====
document.querySelectorAll('.pill-btn[data-size]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.pill-btn[data-size]').forEach(function (b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');
    selectedBoardSize = btn.dataset.size;
  });
});

// ===== Player count selector buttons on start screen =====
document.querySelectorAll('.pill-btn[data-count]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.pill-btn[data-count]').forEach(function (b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');
    selectedPlayerCount = parseInt(btn.dataset.count, 10);
    _updatePlayerNameInputs();
  });
});

// ===== Player name inputs (section 7a) =====
function _updatePlayerNameInputs() {
  const container = document.getElementById('player-name-inputs');
  if (!container) return;

  const players = PLAYER_CONFIGS[selectedPlayerCount];
  let html = '';
  players.forEach(p => {
    html += '<div class="player-name-row">' +
      '<span class="player-name-dot" style="background:' + p.color + '"></span>' +
      '<input type="text" class="player-name-input" data-player-id="' + p.id + '" ' +
      'value="' + p.name + '" maxlength="12" placeholder="' + p.name + '">' +
    '</div>';
  });
  container.innerHTML = html;
}

// Initialize player name inputs on load
_updatePlayerNameInputs();

// ===== Start game button =====
document.getElementById('start-btn').addEventListener('click', function () {
  // Read custom player names from inputs
  _readPlayerNames();
  initGame(selectedPlayerCount);
  transitionScreens(startScreen, gameScreen);
});

function _readPlayerNames() {
  const inputs = document.querySelectorAll('.player-name-input');
  inputs.forEach(input => {
    const pid = input.dataset.playerId;
    const name = input.value.trim();
    if (name) {
      const players = PLAYER_CONFIGS[selectedPlayerCount];
      const player = players.find(p => p.id === pid);
      if (player) player.name = name;
    }
  });
}

// ===== New game from HUD — navigates back to Home Page =====
newGameBtn.addEventListener('click', function () {
  // Clean up game state fully
  game = null;
  renderer = null;

  // Hide win screen if visible
  winScreen.classList.add('hidden');

  // Transition back to start screen
  transitionScreens(gameScreen, startScreen);

  // Refresh player name inputs for a fresh start
  _updatePlayerNameInputs();
});

// ===== Play again from win screen =====
playAgainBtn.addEventListener('click', function () {
  transitionScreens(winScreen, gameScreen, 200);
  setTimeout(() => {
    initGame(selectedPlayerCount);
    renderer.render();
  }, 220);
});

/**
 * Initialize a new game session.
 * Creates all DSA-backed modules (Board, ExplosionEngine, PlayerManager,
 * UndoManager, GameController) and connects the Renderer + SoundEngine.
 *
 * @param {number} playerCount - 2, 3, or 4
 */
function initGame(playerCount) {
  const size = BOARD_SIZES[selectedBoardSize];
  const config = {
    rows: size.rows,
    cols: size.cols,
    players: PLAYER_CONFIGS[playerCount]
  };

  // Create all DSA-backed modules
  game = new GameController(config);

  // Create renderer and connect to controller
  renderer = new Renderer(game.board, config, game);
  game.setRenderer(renderer);
  game.setSoundEngine(soundEngine);

  // Initial render
  renderer.render();
}

// ===== Debug panel toggle wiring =====
const debugToggleBtn = document.getElementById('debug-toggle-btn');
const debugOverlay   = document.getElementById('debug-overlay');
const debugCloseBtn  = document.getElementById('debug-close-btn');

debugToggleBtn.addEventListener('click', () => {
  debugOverlay.classList.toggle('hidden');
  debugToggleBtn.classList.toggle('active');
});

debugCloseBtn.addEventListener('click', () => {
  debugOverlay.classList.add('hidden');
  debugToggleBtn.classList.remove('active');
});

// Close on backdrop click (clicking outside the panel)
debugOverlay.addEventListener('click', (e) => {
  if (e.target === debugOverlay) {
    debugOverlay.classList.add('hidden');
    debugToggleBtn.classList.remove('active');
  }
});
