// ======================================================
// PENALTY MATH — motor del juego
// Mismo motor que Penalty Typing (timer/mecha, vidas,
// tarjetas, confeti), pero el "generador de desafío"
// ahora produce un problema numérico en vez de una palabra.
// El niño ELIGE una operación fija al empezar la partida.
// ======================================================

// ---------- BANCOS NUMÉRICOS POR OPERACIÓN Y NIVEL ----------
const OPERATIONS = {
  suma: {
    simbolo: '+', label: 'Sumas',
    niveles: [
      { tiempo: 15, min: 1, max: 10 },
      { tiempo: 13, min: 5, max: 25 },
      { tiempo: 11, min: 10, max: 50 },
      { tiempo: 9,  min: 20, max: 100 },
    ]
  },
  resta: {
    simbolo: '-', label: 'Restas',
    niveles: [
      { tiempo: 15, min: 1, max: 10 },
      { tiempo: 13, min: 5, max: 25 },
      { tiempo: 11, min: 10, max: 50 },
      { tiempo: 9,  min: 20, max: 100 },
    ]
  },
  multiplicacion: {
    simbolo: '×', label: 'Multiplicar',
    niveles: [
      { tiempo: 14, min: 1, max: 5 },
      { tiempo: 12, min: 2, max: 8 },
      { tiempo: 10, min: 3, max: 10 },
      { tiempo: 9,  min: 5, max: 12 },
    ]
  },
  division: {
    simbolo: '÷', label: 'Dividir',
    niveles: [
      { tiempo: 15, min: 2, max: 5 },
      { tiempo: 13, min: 2, max: 8 },
      { tiempo: 11, min: 3, max: 10 },
      { tiempo: 10, min: 4, max: 12 },
    ]
  }
};

// ---------- ESTADO ----------
let state = {
  operation: null,     // 'suma' | 'resta' | 'multiplicacion' | 'division'
  level: 0,
  score: 0,
  lives: 3,
  streak: 0,
  yellowCard: false,
  redCard: false,
  problemText: "",     // lo que se MUESTRA, ej. "7 + 5"
  currentWord: "",     // la RESPUESTA esperada como string, ej. "12"
  typed: "",
  timeLeft: 0,
  totalTime: 0,
  timerHandle: null,
  playing: false
};

// ---------- REFERENCIAS DOM ----------
const el = {
  modeSelect: document.getElementById('modeSelect'),
  playScreen: document.getElementById('playScreen'),
  problem: document.getElementById('problem'),
  word: document.getElementById('word'),
  input: document.getElementById('inputWord'),
  score: document.getElementById('score'),
  level: document.getElementById('level'),
  lives: document.getElementById('lives'),
  streak: document.getElementById('streak'),
  message: document.getElementById('message'),
  timer: document.getElementById('timer'),
  startButton: document.getElementById('startButton'),
  changeOpButton: document.getElementById('changeOpButton'),
  sprite: document.getElementById('playerSprite'),
  ball: document.getElementById('ball'),
  game: document.getElementById('game'),
  yellowCard: document.getElementById('yellowCard'),
  redCard: document.getElementById('redCard'),
};
const sonidoGol = new Audio('audio/gol.ogg');
const sonidoFail = new Audio('audio/fail.ogg');
const sonidoYellow = new Audio('audio/yellow.ogg');
const sonidoFinal = new Audio('audio/final.ogg');
// ======================================================
// SELECCIÓN DE OPERACIÓN (fija por partida)
// ======================================================
document.querySelectorAll('.op-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.operation = btn.dataset.op;
    el.modeSelect.classList.add('hidden');
    el.playScreen.classList.remove('hidden');
    startGame();
  });
});

el.changeOpButton.addEventListener('click', () => {
  state.playing = false;
  stopTimer();
  el.playScreen.classList.add('hidden');
  el.modeSelect.classList.remove('hidden');
  el.startButton.classList.add('hidden');
});

// ======================================================
// GENERADOR DE DESAFÍO (la única parte realmente distinta
// respecto a Penalty Typing)
// ======================================================
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generarDesafio() {
  const op = OPERATIONS[state.operation];
  const banco = op.niveles[Math.min(state.level, op.niveles.length - 1)];

  let a = randInt(banco.min, banco.max);
  let b = randInt(banco.min, banco.max);
  let resultado;

  switch (state.operation) {
    case 'suma':
      resultado = a + b;
      break;
    case 'resta':
      if (b > a) [a, b] = [b, a]; // evita resultados negativos
      resultado = a - b;
      break;
    case 'multiplicacion':
      resultado = a * b;
      break;
    case 'division':
      // construir división exacta: resultado conocido, dividendo derivado
      resultado = a;
      b = randInt(2, Math.max(2, banco.max - 1));
      a = resultado * b;
      break;
  }

  state.problemText = `${a} ${op.simbolo} ${b}`;
  state.currentWord = String(resultado); // esto es lo que el niño debe escribir
  state.typed = "";
  state.totalTime = banco.tiempo;
  state.timeLeft = banco.tiempo;

  el.problem.textContent = state.problemText;
  renderWord();
}

function renderWord() {
  const target = state.currentWord;
  const typedCount = state.typed.length;
  let html = "";
  for (let i = 0; i < target.length; i++) {
    if (i < typedCount) {
      html += `<span class="typed">${target[i]}</span>`;
    } else {
      html += `<span class="pending">_</span>`; // placeholder, no revela el dígito
    }
  }
  el.word.innerHTML = html;
}

// ======================================================
// MECHA DE TIEMPO
// ======================================================
function startTimer() {
  clearInterval(state.timerHandle);
  const stepMs = 100;
  state.timerHandle = setInterval(() => {
    state.timeLeft -= stepMs / 1000;
    const pct = Math.max(0, (state.timeLeft / state.totalTime) * 100);
    el.timer.style.width = pct + "%";
    if (state.timeLeft <= 0) {
      clearInterval(state.timerHandle);
      onTimeOut();
    }
  }, stepMs);
}
function stopTimer() { clearInterval(state.timerHandle); }

// ======================================================
// INPUT DEL JUGADOR
// (la respuesta se valida dígito por dígito contra
// state.currentWord, igual que las letras en Penalty Typing)
// ======================================================
el.input.addEventListener('input', () => {
  if (!state.playing) return;
  const value = el.input.value.trim();
  const expected = state.currentWord.slice(0, value.length);

  if (value === expected) {
    state.typed = value;
    renderWord();
    if (value === state.currentWord) {
      onSuccess();
    }
  } else {
    el.input.value = state.typed;
    onMiss();
  }
});

// ======================================================
// ÉXITO: GOL
// ======================================================
function onSuccess() {
  stopTimer();
  state.score += state.currentWord.length * 10;
  state.streak += 1;
  const op = OPERATIONS[state.operation];
  state.level = Math.min(op.niveles.length - 1, Math.floor(state.streak / 3));

  updateHUD();
  mostrarGol();

  setTimeout(() => {
    if (state.playing) {
      el.input.value = "";
      generarDesafio();
      startTimer();
    }
  }, 1100);
}

function mostrarGol() {
  sonidoGol.play();
  el.sprite.src = "sprites/penal_gol.svg";
  el.ball.className = Math.random() > 0.5 ? "goal-left" : "goal-right";
  setMessage("¡GOOOOOL! ⚽🎉", "");
  el.game.classList.remove('goal-flash');
  requestAnimationFrame(() => el.game.classList.add('goal-flash'));
  launchConfetti();
  setTimeout(() => {
    el.game.classList.remove('goal-flash');
    el.sprite.src = "sprites/penal_idle.svg";
    el.ball.className = "";
  }, 1000);
}

// ======================================================
// FALLO: dígito incorrecto por escribir rápido
// ======================================================
const FALLOS = [
  { clase: "wide-left", texto: "¡Se fue desviado! 🥅↗️" },
  { clase: "wide-right", texto: "¡Se fue afuera! 🥅↘️" },
  { clase: "hit-post", texto: "¡Pegó en el palo! 🥅" },
];

function onMiss() {
  sonidoYellow.play();
  state.streak = 0;
  state.lives = Math.max(0, state.lives - 1);
  updateHUD();

  const fallo = FALLOS[Math.floor(Math.random() * FALLOS.length)];
  el.sprite.src = "sprites/penal_fail.svg";
  el.ball.classList.remove("goal-left", "goal-right", "hit-post", "wide-left", "wide-right");
  el.ball.classList.add(fallo.clase);
  setMessage(fallo.texto, "bad");
  vibrarPantalla();

  setTimeout(() => {
    el.sprite.src = "sprites/penal_idle.svg";
    el.ball.className = "";
  }, 500);

  if (state.lives <= 0) {
    endGame("¡Se acabaron tus intentos!");
  }
}

// ======================================================
// TIEMPO AGOTADO: tarjeta amarilla -> roja
// ======================================================
function onTimeOut() {
  state.streak = 0;
  state.lives = Math.max(0, state.lives - 1);

  if (!state.yellowCard) {
    state.yellowCard = true;
    el.yellowCard.classList.remove('hidden');
    setMessage("🟨 Tarjeta amarilla: ¡se acabó el tiempo!", "warn");
    vibrarPantalla();
  } else if (!state.redCard) {
    state.redCard = true;
    el.redCard.classList.remove('hidden');
    setMessage("🟥 Tarjeta roja: ¡expulsado!", "bad");
    vibrarPantalla();
    endGame("Fuiste expulsado del partido.");
    return;
  }

  updateHUD();

  if (state.lives <= 0) {
    endGame("¡Se acabaron tus intentos!");
    return;
  }

  setTimeout(() => {
    if (state.playing) {
      el.input.value = "";
      generarDesafio();
      startTimer();
    }
  }, 900);
}

// ======================================================
// EFECTOS GENÉRICOS (idénticos a Penalty Typing)
// ======================================================
function vibrarPantalla() {
  el.game.classList.remove('shake', 'dim-flash');
  requestAnimationFrame(() => el.game.classList.add('shake', 'dim-flash'));
  setTimeout(() => el.game.classList.remove('shake', 'dim-flash'), 450);
}

function setMessage(text, type) {
  el.message.textContent = text;
  el.message.classList.remove('bad', 'warn');
  if (type) el.message.classList.add(type);
}

function updateHUD() {
  el.score.textContent = state.score;
  el.level.textContent = state.level + 1;
  el.lives.textContent = state.lives;
  el.streak.textContent = state.streak;
}

// ======================================================
// CONFETI / SERPENTINAS NATIVO (sin librerías externas)
// ======================================================
const canvas = document.getElementById('fxCanvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let particles = [];
const COLORS = ['#E8B84B', '#F2C230', '#F4F4ED', '#1E40AF', '#D4202A'];

function launchConfetti() {
  const rect = document.getElementById('goal').getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  for (let i = 0; i < 70; i++) {
    particles.push({
      x: originX, y: originY,
      vx: (Math.random() - 0.5) * 9,
      vy: Math.random() * -7 - 3,
      gravity: 0.22,
      size: Math.random() * 6 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 12,
      shape: Math.random() > 0.5 ? "rect" : "streamer",
      life: 100
    });
  }
  if (!confettiRunning) {
    confettiRunning = true;
    requestAnimationFrame(animateConfetti);
  }
}

let confettiRunning = false;
function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.rot += p.vr;
    p.life -= 1.2;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rot * Math.PI) / 180);
    ctx.globalAlpha = Math.max(0, p.life / 100);
    ctx.fillStyle = p.color;
    if (p.shape === "rect") {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    } else {
      ctx.fillRect(-p.size / 4, -p.size * 1.4, p.size / 2, p.size * 2.8);
    }
    ctx.restore();
  });

  particles = particles.filter(p => p.life > 0 && p.y < canvas.height + 50);

  if (particles.length > 0) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiRunning = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// ======================================================
// CICLO DE PARTIDA
// ======================================================
function startGame() {
  const operation = state.operation;
  state = {
    operation, level: 0, score: 0, lives: 3, streak: 0,
    yellowCard: false, redCard: false,
    problemText: "", currentWord: "", typed: "",
    timeLeft: 0, totalTime: 0, timerHandle: null, playing: true
  };
  el.yellowCard.classList.add('hidden');
  el.redCard.classList.add('hidden');
  el.input.disabled = false;
  el.input.value = "";
  el.input.focus();
  setMessage(`¡Arranca el partido de ${OPERATIONS[operation].label}!`, "");
  updateHUD();
  generarDesafio();
  startTimer();
}

function endGame(motivo) {
  sonidoFinal.play()
  state.playing = false;
  stopTimer();
  el.input.disabled = true;
  setMessage(`${motivo} Puntos finales: ${state.score}`, "bad");
  el.changeOpButton.textContent = "Jugar otra vez 🔁";
}
