// ...existing code...
const colorDisplay = document.querySelector('#colorDisplay');
const messageDisplay = document.querySelector('#message');
const currentStreakDisplay = document.querySelector('#currentStreak');
const bestStreakDisplay = document.querySelector('#bestStreak');
const colorBoxContainer = document.querySelector('#colorBoxContainer');
const colorBoxes = Array.from(document.querySelectorAll('.color-box'));
const newRoundBtn = document.querySelector('#newRoundBtn');
const easyBtn = document.querySelector('#easyBtn');
const hardBtn = document.querySelector('#hardBtn');
const difficultBtn = document.querySelector('#difficultbtn');
const resetStreakBtn = document.querySelector('#resetStreakBtn');
const hearts = Array.from(document.querySelectorAll('.heart'));
const streack = document.querySelector('.streak-number'); // streak UI element
const fox = document.querySelector('.fox'); // optional fox element for shake

let totalAttempts = 5;
let remainingAttempts = totalAttempts;
let numBoxes = 6; // default (HARD)
let colors = [];
let pickedColor = '';
let currentStreak = 0;
let bestStreak = 0;
let roundActive = true;

// start
init();

function init() {
  // load best streak
  const stored = localStorage.getItem('bestStreak');
  bestStreak = stored ? parseInt(stored, 10) : 0;
  updateStreakDisplay();

  setupModeButtons();
  if (colorBoxContainer) colorBoxContainer.addEventListener('click', onBoxClick);
  else colorBoxes.forEach(b => b.addEventListener('click', onBoxClick));
  newRoundBtn && newRoundBtn.addEventListener('click', resetGame);
  resetStreakBtn && resetStreakBtn.addEventListener('click', resetStreak);

  ensureShakeCSS();
  resetGame();
}

function setupModeButtons() {
  easyBtn && easyBtn.addEventListener('click', () => setMode(3, easyBtn));
  hardBtn && hardBtn.addEventListener('click', () => setMode(6, hardBtn));
  difficultBtn && difficultBtn.addEventListener('click', () => setMode(9, difficultBtn));
}

function setMode(n, button) {
  numBoxes = n;
  // toggle selected class
  [easyBtn, hardBtn, difficultBtn].forEach(b => b && b.classList.remove('selected'));
  button && button.classList.add('selected');

  // when easy mode selected turn it into lightgreen color, reset others
  [easyBtn, hardBtn, difficultBtn].forEach(b => {
    if (!b) return;
    if (b === button && b === easyBtn) b.style.backgroundColor = 'lightgreen';
    else b.style.backgroundColor = '';
  });

  resetGame();
}

function onBoxClick(e) {
  if (!roundActive) return;
  const box = (e.target.closest && e.target.closest('.color-box')) || (e.target.classList && e.target.classList.contains('color-box') ? e.target : null);
  if (!box) return;
  if (box.classList.contains('disabled')) return;

  const clickedColor = box.style.backgroundColor;
  if (clickedColor === pickedColor) {
    // correct - glow + yellow border on clicked box
    box.style.border = '5px solid yellow';
    box.style.boxShadow = '0 0 20px rgba(255,255,0,0.8), inset 0 0 20px rgba(255,255,0,0.4)';

    // record previous streak to detect 0 -> 1
    const prev = currentStreak;
    currentStreak++;

    // MAKE RGB BOLD & BLACK on any streak increment
    if (colorDisplay) {
      colorDisplay.style.fontWeight = '700';
      colorDisplay.style.color = 'black';
    }

    // show "first win" when going from 0 to 1
    if (prev === 0 && currentStreak === 1) {
      messageDisplay && (messageDisplay.textContent = 'First win!');
    } else {
      messageDisplay && (messageDisplay.textContent = 'Correct!');
    }

    changeAllBoxesTo(pickedColor);
    headerResetBackground(pickedColor);

    // new best streak handling
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
      localStorage.setItem('bestStreak', bestStreak);
      // when new best streak is set make RGB bold (already bold) — keep bold
      if (colorDisplay) colorDisplay.style.fontWeight = '700';
    }

    updateStreakDisplay();
    roundActive = false;
    newRoundBtn && (newRoundBtn.textContent = 'Play Again?');
    resetHearts();
  } else {
    // wrong: disable box, decrement attempts, shake the wrong box and fox
    box.classList.add('disabled');
    box.style.pointerEvents = 'none';
    box.style.opacity = '0.25';

    remainingAttempts--;
    disableOneHeart();

    // shake the clicked box
    box.classList.add('shake');
    setTimeout(() => box.classList.remove('shake'), 650);

    // fox shake
    if (fox) {
      fox.classList.add('shake');
      setTimeout(() => fox.classList.remove('shake'), 650);
    }

    // show "Try again" message with attempts left
    messageDisplay && (messageDisplay.textContent = `Try again — Attempts left: ${remainingAttempts}`);

    currentStreak = 0;
    updateStreakDisplay();

    if (remainingAttempts <= 0) {
      messageDisplay && (messageDisplay.textContent = 'Heart broke — try next time');
      roundActive = false;
      colorBoxes.forEach(b => {
        b.classList.add('disabled');
        b.style.pointerEvents = 'none';
        b.style.opacity = '0.25';
      });
      newRoundBtn && (newRoundBtn.textContent = 'Try Again');
    }
  }
}

function resetGame() {
  remainingAttempts = totalAttempts;
  roundActive = true;
  newRoundBtn && (newRoundBtn.textContent = 'New Round');
  messageDisplay && (messageDisplay.textContent = 'Pick a color!');
  // reset boxes
  colorBoxes.forEach(b => {
    b.classList.remove('disabled');
    b.style.pointerEvents = 'auto';
    b.style.opacity = '1';
    b.style.display = 'none';
    b.style.border = 'none';
    b.style.boxShadow = 'none';
  });
  resetHearts();
  if (colorDisplay) {
    colorDisplay.style.fontWeight = ''; // remove bold if any
    colorDisplay.style.color = ''; // reset color
  }

  colors = generateRandomColors(numBoxes);
  pickedColor = pickColor();
  colorDisplay && (colorDisplay.textContent = pickedColor.toUpperCase());

  for (let i = 0; i < colorBoxes.length; i++) {
    if (i < numBoxes) {
      colorBoxes[i].style.display = 'block';
      colorBoxes[i].style.backgroundColor = colors[i];
      colorBoxes[i].textContent = '';
    } else {
      colorBoxes[i].style.display = 'none';
    }
  }
}

function changeAllBoxesTo(color) {
  colorBoxes.forEach((b, i) => {
    if (i < numBoxes) {
      b.style.backgroundColor = color;
      b.style.opacity = '1';
      b.classList.remove('disabled');
      b.style.pointerEvents = 'auto';
    }
  });
}

function pickColor() {
  const idx = Math.floor(Math.random() * colors.length);
  return colors[idx];
}

function generateRandomColors(n) {
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(randomColor());
  return arr;
}

function randomColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r}, ${g}, ${b})`;
}

function updateStreakDisplay() {
  currentStreakDisplay && (currentStreakDisplay.textContent = currentStreak);
  bestStreakDisplay && (bestStreakDisplay.textContent = bestStreak);

  // when current score >=3 streak message in green
  if (streack) {
    streack.style.color = (currentStreak >= 3) ? 'green' : '';
  }
}

function resetStreak() {
  currentStreak = 0;
  bestStreak = 0;
  localStorage.removeItem('bestStreak');
  updateStreakDisplay();
}

function disableOneHeart() {
  // disable left-to-right based on attempts used
  const idx = totalAttempts - remainingAttempts - 1;
  if (idx >= 0 && idx < hearts.length) {
    const h = hearts[idx];
    h.style.opacity = '0.25';
    h.style.filter = 'grayscale(100%)';
    h.style.transform = 'scale(0.9)';
  }
}

function resetHearts() {
  hearts.forEach(h => {
    h.style.opacity = '1';
    h.style.filter = 'none';
    h.style.transform = 'none';
  });
}

function headerResetBackground(color) {
  const header = document.querySelector('header');
  if (header) header.style.backgroundColor = color;
}

// ensure shake CSS is available
function ensureShakeCSS() {
  if (document.getElementById('inject-shake-css')) return;
  const s = document.createElement('style');
  s.id = 'inject-shake-css';
  s.textContent = `
    @keyframes shake {
      10%, 90% { transform: translateX(-1px); }
      20%, 80% { transform: translateX(10px); }
      30%, 50%, 70% { transform: translateX(-20px); }
      40%, 60% { transform: translateX(4px); }
    }
    .shake { animation: shake 0.65s; will-change: transform; }
  `;
  document.head.appendChild(s);
}
// ...existing code...