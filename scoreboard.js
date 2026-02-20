/* ============================================
   SCOREBOARD.JS — Win98 Game Over Scoreboard
   

   ============================================ */

/* ----------------------------------------
   1. INJECT HTML INTO THE PAGE
---------------------------------------- */
(function injectScoreboardHTML() {
  const html = `
    <div id="scoreboard-overlay" style="display:none"></div>
    <div id="scoreboard-window" style="display:none" role="dialog" aria-modal="true">

      <div id="scoreboard-titlebar">
        <div id="scoreboard-titlebar-left">
          <img src="https://win98icons.alexmeub.com/icons/png/game_hearts.png" alt="">
          <span>GAME OVER — High Scores</span>
        </div>
        <div id="scoreboard-close" title="Close" onclick="closeScoreboard()">✕</div>
      </div>

      <div id="scoreboard-body">

        <div id="scoreboard-gameover">
          <span id="scoreboard-gameover-text">★ GAME OVER ★</span>
          <span id="scoreboard-final-score">SCORE: 0</span>
        </div>

        <hr class="scoreboard-divider">

        <div id="scoreboard-entry-section">
          <span id="scoreboard-entry-label">ENTER YOUR INITIALS:</span>
          <div id="scoreboard-entry-row">
            <input
              id="scoreboard-initials"
              type="text"
              maxlength="4"
              placeholder="AAAA"
              autocomplete="off"
              spellcheck="false"
            >
            <button id="scoreboard-submit-btn" onclick="submitScore()">OK</button>
          </div>
          <div id="scoreboard-entry-msg"></div>
        </div>

        <div id="scoreboard-list-section">
          <div id="scoreboard-list-header">
            <span>#</span>
            <span>NAME</span>
            <span style="text-align:right">SCORE</span>
          </div>
          <div id="scoreboard-list">
            <div id="scoreboard-empty">No scores yet. Be the first!</div>
          </div>
        </div>

        <div id="scoreboard-buttons">
          <button class="scoreboard-btn" onclick="closeScoreboard()">CLOSE</button>
          <button class="scoreboard-btn" onclick="closeScoreboardAndRestart()">▶ PLAY AGAIN</button>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
})();

/* ----------------------------------------
   2. STORAGE HELPERS
   Uses window.storage (Claude persistent storage)
   with a fallback to localStorage for local testing
---------------------------------------- */
const STORAGE_KEY = 'dinorawrbite-spaceshooter-scores';
const MAX_SCORES = 10;

async function loadScores() {
  try {
    if (window.storage) {
      const result = await window.storage.get(STORAGE_KEY, true); // shared = true
      return result ? JSON.parse(result.value) : [];
    } else {
      // Local testing fallback
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }
  } catch (e) {
    return [];
  }
}

async function saveScores(scores) {
  try {
    if (window.storage) {
      await window.storage.set(STORAGE_KEY, JSON.stringify(scores), true); // shared = true
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    }
  } catch (e) {
    console.warn('Scoreboard: could not save scores', e);
  }
}

/* ----------------------------------------
   3. SCOREBOARD LOGIC
---------------------------------------- */
let _currentScore = 0;
let _justSubmitted = false;
let _newEntryIndex = -1;

// Call this when game over — pass in the player's score
async function showScoreboard(finalScore) {
  _currentScore = finalScore;
  _justSubmitted = false;
  _newEntryIndex = -1;

  // Update the score display
  document.getElementById('scoreboard-final-score').textContent = `SCORE: ${finalScore}`;

  // Reset entry form
  const input = document.getElementById('scoreboard-initials');
  input.value = '';
  input.disabled = false;
  document.getElementById('scoreboard-submit-btn').disabled = false;
  document.getElementById('scoreboard-entry-msg').textContent = '';
  document.getElementById('scoreboard-entry-section').style.display = 'block';

  // Show overlay + window (inline styles override any site CSS conflicts)
  document.getElementById('scoreboard-overlay').style.display = 'block';
  const win = document.getElementById('scoreboard-window');
  win.style.display = 'block';
  win.style.position = 'fixed';
  win.style.top = '0';
  win.style.left = '0';
  win.style.right = '0';
  win.style.bottom = '0';
  win.style.margin = 'auto';
  win.style.width = '360px';
  win.style.zIndex = '99999';

  // Load and render existing scores
  await renderLeaderboard();

  // Focus the initials input
  setTimeout(() => input.focus(), 100);
}

async function submitScore() {
  if (_justSubmitted) return;

  const raw = document.getElementById('scoreboard-initials').value.trim().toUpperCase();
  const msg = document.getElementById('scoreboard-entry-msg');

  if (raw.length < 1) {
    msg.textContent = 'Enter 1–4 letters!';
    return;
  }

  // Pad to 3 chars
  const initials = raw.padEnd(4, '_').slice(0, 4);

  _justSubmitted = true;
  document.getElementById('scoreboard-submit-btn').disabled = true;
  document.getElementById('scoreboard-initials').disabled = true;
  msg.textContent = 'Saving...';

  // Load, add, sort, trim, save
  let scores = await loadScores();

  const entry = {
    name: initials,
    score: _currentScore,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  };

  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  if (scores.length > MAX_SCORES) scores = scores.slice(0, MAX_SCORES);

  _newEntryIndex = scores.findIndex(
    s => s.name === entry.name && s.score === entry.score
  );

  await saveScores(scores);
  await renderLeaderboard(scores);

  msg.textContent = _newEntryIndex >= 0 ? `#${_newEntryIndex + 1} on the board! 🎉` : 'Score saved!';

  // Hide the entry form after a moment
  setTimeout(() => {
    document.getElementById('scoreboard-entry-section').style.display = 'none';
  }, 1500);
}

async function renderLeaderboard(scores) {
  if (!scores) scores = await loadScores();

  const list = document.getElementById('scoreboard-list');

  if (scores.length === 0) {
    list.innerHTML = '<div id="scoreboard-empty">No scores yet. Be the first!</div>';
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];

  list.innerHTML = scores.map((s, i) => {
    const isNew = i === _newEntryIndex && _justSubmitted;
    const rankClass = i < 3 ? `rank-${i + 1}` : '';
    const highlightClass = isNew ? 'highlight' : '';
    const rankDisplay = i < 3 ? medals[i] : `${i + 1}.`;

    return `
      <div class="scoreboard-row ${rankClass} ${highlightClass}">
        <span class="sb-rank">${rankDisplay}</span>
        <span class="sb-name">${escapeHtml(s.name)}</span>
        <span class="sb-score">${s.score.toLocaleString()}</span>
      </div>
    `;
  }).join('');
}

function closeScoreboard() {
  document.getElementById('scoreboard-overlay').style.display = 'none';
  document.getElementById('scoreboard-window').style.display = 'none';
}

function closeScoreboardAndRestart() {
  closeScoreboard();
  // Calls the restartGame() function already defined in your index.html
  if (typeof restartGame === 'function') {
    restartGame();
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* ----------------------------------------
   4. KEYBOARD SUPPORT
   Enter key submits initials while input is focused
---------------------------------------- */
document.addEventListener('keydown', function(e) {
  const win = document.getElementById('scoreboard-window');
  if (!win || win.style.display === 'none') return;

  if (e.code === 'Enter') {
    const input = document.getElementById('scoreboard-initials');
    // If input is still active, submit
    if (!input.disabled && document.activeElement === input) {
      submitScore();
    }
  }

  // Prevent game controls firing while scoreboard is open
  if (['ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
    e.stopPropagation();
  }
}, true);

/* ----------------------------------------
   5. UPPERCASE INPUT AS YOU TYPE
---------------------------------------- */
document.addEventListener('DOMContentLoaded', function() {
  const input = document.getElementById('scoreboard-initials');
  if (input) {
    input.addEventListener('input', () => {
      input.value = input.value.toUpperCase().replace(/[^A-Z]/g, '');
    });
  }

// video window

function closeVideoWindow() {
  // Stop the video by resetting the iframe src
  document.getElementById('videoWin').style.display = 'none';
}

});