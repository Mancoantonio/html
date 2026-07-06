// ======================================================
// PENALTY TYPING — motor del juego
// Pensado para ser reutilizado: solo cambia WORD_BANKS
// (o el "generador de desafío") para convertirlo en un
// juego de matemáticas, sin tocar el resto del motor.
// ======================================================

// ---------- BANCO DE PALABRAS POR NIVEL ----------
const WORD_BANKS = [
  { 
    letras: 3, 
    tiempo: 15, 
    // 50 palabras
    palabras: [
      "sol", "pan", "pez", "luz", "mar", "oso", "uva", "ajo", "ojo", "sal",
      "rey", "pie", "red", "voz", "ala", "aro", "eco", "eje", "ola", "oro",
      "uso", "gas", "gol", "mes", "res", "tos", "col", "fin", "tul", "tez",
      "cal", "can", "don", "haz", "mal", "par", "paz", "tal", "pío", "lío",
      "río", "mía", "mío", "tía", "tío", "dar", "pon", "ven", "ten", "ver"
    ] 
  },
  { 
    letras: 4, 
    tiempo: 14, 
    // 50 palabras
    palabras: [
      "gato", "casa", "luna", "pelo", "dado", "pato", "rana", "toro", "vaca", "lobo",
      "sapo", "rata", "pino", "rosa", "cruz", "azul", "rojo", "gris", "pavo", "nube",
      "hoja", "rama", "vaso", "taza", "mesa", "cama", "sofá", "tren", "auto", "moto",
      "bote", "cuna", "loma", "saco", "ropa", "bota", "niño", "niña", "mamá", "papá",
      "bebé", "león", "foca", "mano", "dedo", "boca", "cara", "cien", "flor", "nido"
    ] 
  },
  { 
    letras: 6, 
    tiempo: 12, 
    // 40 palabras
    palabras: [
      "camino", "bosque", "cohete", "pelota", "conejo", "pájaro", "zapato", "camisa", "piedra", "helado",
      "tomate", "blanco", "oscuro", "verano", "ciudad", "pueblo", "puente", "jardín", "música", "pintor",
      "doctor", "médico", "granja", "ovejas", "cerdos", "gallos", "fútbol", "cancha", "equipo", "torneo",
      "trofeo", "bronce", "regalo", "alegre", "rápido", "fuerte", "saltar", "correr", "espejo", "dibujo"
    ] 
  },
  { 
    letras: 7, 
    tiempo: 10, 
    // 30 palabras
    palabras: [
      "ventana", "naranja", "manzana", "escuela", "maestro", "maestra", "estuche", "pizarra", "mochila", "colores",
      "pintura", "números", "estadio", "partido", "jugador", "árbitro", "medalla", "público", "silbato", "portero",
      "defensa", "lechuza", "tortuga", "caballo", "hormiga", "juguete", "muñecas", "pelotas", "zapatos", "camisas"
    ] 
  },
  { 
    letras: 8, 
    tiempo: 8,  
    // 30 palabras
    palabras: [
      "elefante", "mariposa", "invierno", "guitarra", "amarillo", "cuaderno", "campanas", "cangrejo", "leopardo", "pingüino",
      "deportes", "campeona", "medallas", "castillo", "princesa", "príncipe", "historia", "universo", "planetas", "silencio",
      "sorpresa", "victoria", "estrella", "zapatero", "profesor", "avioneta", "gimnasia", "pirámide", "montañas", "desierto"
    ] 
  },
  { 
    letras: 11, 
    tiempo: 6, 
    // 30 palabras
    palabras: [
      "computadora", "programador", "matematicas", "laboratorio", "temperatura", "murcielagos", "rinoceronte", "hipopotamos", "diccionario", "abecedarios",
      "competicion", "experiencia", "creatividad", "futbolistas", "entrenadora", "instrumento", "pentagramas", "telescopios", "microscopio", "helicóptero",
      "ferrocarril", "veterinario", "carpintería", "bibliotecas", "astronautas", "dinosaurios", "mantequilla", "restaurante", "campanarios", "golondrinas"
    ] 
  }
];

// ---------- ESTADO DEL JUEGO ----------
let state = {
  level: 0,
  score: 0,
  lives: 3,
  streak: 0,
  yellowCard: false,
  redCard: false,
  currentWord: "",
  typed: "",
  timeLeft: 0,
  totalTime: 0,
  timerHandle: null,
  playing: false
};

// ---------- REFERENCIAS DOM ----------
const el = {
  word: document.getElementById('word'),
  input: document.getElementById('inputWord'),
  score: document.getElementById('score'),
  level: document.getElementById('level'),
  lives: document.getElementById('lives'),
  streak: document.getElementById('streak'),
  message: document.getElementById('message'),
  timer: document.getElementById('timer'),
  startButton: document.getElementById('startButton'),
  sprite: document.getElementById('playerSprite'),
  ball: document.getElementById('ball'),
  game: document.getElementById('game'),
  yellowCard: document.getElementById('yellowCard'),
  redCard: document.getElementById('redCard'),
};

// ======================================================
// GENERADOR DE DESAFÍO
// (Esta es la única parte que cambiarías para "Sumas Typing",
// "Restas Typing", etc: en vez de devolver una palabra,
// devuelve "7 + 5" como texto y validas el resultado numérico)
// ======================================================
function generarDesafio() {
  const banco = WORD_BANKS[Math.min(state.level, WORD_BANKS.length - 1)];
  const palabra = banco.palabras[Math.floor(Math.random() * banco.palabras.length)];
  state.currentWord = palabra;
  state.typed = "";
  state.totalTime = banco.tiempo;
  state.timeLeft = banco.tiempo;
  renderWord();
}
const sonidoGol = new Audio('audio/gol.ogg');
const sonidoFail = new Audio('audio/fail.ogg');
const sonidoYellow = new Audio('audio/yellow.ogg');
const sonidoFinal = new Audio('audio/final.ogg');

function renderWord() {
  const word = state.currentWord;
  const typedCount = state.typed.length;
  let html = "";
  for (let i = 0; i < word.length; i++) {
    const cls = i < typedCount ? "typed" : "pending";
    html += `<span class="${cls}">${word[i].toUpperCase()}</span>`;
  }
  el.word.innerHTML = html;
}

// ======================================================
// MECHA DE TIEMPO (countdown tipo fusible)
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

function stopTimer() {
  clearInterval(state.timerHandle);
}

// ======================================================
// INPUT DEL JUGADOR
// ======================================================
el.input.addEventListener('input', () => {
  if (!state.playing) return;
  const value = el.input.value.toLowerCase();
  const expected = state.currentWord.slice(0, value.length);

  if (value === expected) {
    state.typed = value;
    renderWord();
    if (value === state.currentWord) {
      onSuccess();
    }
  } else {
    // letra incorrecta: falló el penal por escribir mal/rápido
    el.input.value = state.typed; // no deja avanzar con error
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
  state.level = Math.min(WORD_BANKS.length - 1, Math.floor(state.streak / 3));
  sonidoGol.play();
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
  el.sprite.src = "sprites/penal_gol.svg";
  el.ball.className = "goal-left, goal-right".split(",")[Math.round(Math.random())].trim();
  setMessage("¡GOOOOOL! ⚽🎉", "");
  el.game.classList.remove('goal-flash');
  requestAnimationFrame(() => el.game.classList.add('goal-flash'));
  launchConfetti();
  el.game.classList.add('shake');                          // 👈 esta línea
  setTimeout(() => el.game.classList.remove('shake'), 450); // 👈 y esta
  setTimeout(() => {
    el.game.classList.remove('goal-flash');
    el.sprite.src = "sprites/penal_idle.svg";
    el.ball.className = "";
  }, 1000);
}

// ======================================================
// FALLO: letra incorrecta por velocidad
// ======================================================
const FALLOS = [
  { clase: "wide-left", texto: "¡Se fue desviado! 🥅↗️" },
  { clase: "wide-right", texto: "¡Se fue afuera! 🥅↘️" },
  { clase: "hit-post", texto: "¡Pegó en el palo! 🥅" },
];

function onMiss() {
  state.streak = 0;
  state.lives = Math.max(0, state.lives - 1);
  updateHUD();

  const fallo = FALLOS[Math.floor(Math.random() * FALLOS.length)];
  sonidoYellow.play();  
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
    return;
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
    sonidoYellow.play();                              // 👈 aquí
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
// EFECTOS GENÉRICOS
// ======================================================
function vibrarPantalla() {
  navigator.vibrate(200); // vibra 200 milisegundos
  el.game.classList.remove('shake', 'dim-flash');
  requestAnimationFrame(() => {
    el.game.classList.add('shake', 'dim-flash');
  });
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
      x: originX,
      y: originY,
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
  state = {
    level: 0, score: 0, lives: 3, streak: 0,
    yellowCard: false, redCard: false,
    currentWord: "", typed: "", timeLeft: 0, totalTime: 0,
    timerHandle: null, playing: true
  };
  el.yellowCard.classList.add('hidden');
  el.redCard.classList.add('hidden');
  el.startButton.classList.add('hidden');
  el.input.disabled = false;
  el.input.value = "";
  el.input.focus();
  setMessage("¡Arranca el partido!", "");
  updateHUD();
  generarDesafio();
  startTimer();
}

function endGame(motivo) {
  state.playing = false;
  stopTimer();
  el.input.disabled = true;
  sonidoFinal.play();                                // 👈 aquí
  setMessage(`${motivo} Puntos finales: ${state.score}`, "bad");
  el.startButton.textContent = "Jugar otra vez";
  el.startButton.classList.remove('hidden');
}

el.startButton.addEventListener('click', startGame);

// Estado inicial visible antes de comenzar
el.word.innerHTML = `<span class="pending">TOCA "COMENZAR"</span>`;
el.input.disabled = true;
