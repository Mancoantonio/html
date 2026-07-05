// ======================================================
// main.js — SELECTOR DE JUEGO
// ======================================================
// Responsabilidad única: mostrar el menú, y cuando el
// jugador elige un juego, cargarlo dentro de un <iframe>
// aislado. Cada juego vive en su propia carpeta con su
// propio HTML/CSS/JS y su propio scope de variables —
// por eso NO hay choque de IDs (#word, #timer, etc.) aunque
// ambos juegos usen los mismos nombres internamente.
//
// Para agregar un tercer juego en el futuro: solo agregas
// una carpeta en static/games/nuevo-juego/ con su propio
// index.html, y una tarjeta más en index.html + este mapa:
// ======================================================

const GAMES = {
  'word-game': 'static/games/word-game/index.html',
  'math-game': 'static/games/math-game/index.html',
};
const musica = new Audio('static/audio/music.ogg');
musica.loop = true;
const menuScreen = document.getElementById('menuScreen');
const gameScreen = document.getElementById('gameScreen');
const gameFrame = document.getElementById('gameFrame');
const backButton = document.getElementById('backButton');

document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    const gameId = card.dataset.game;
    const path = GAMES[gameId];
    if (!path) return;

    musica.play();
    gameFrame.src = path;
    menuScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
  });
});

backButton.addEventListener('click', () => {
  gameFrame.src = ''; // detiene el juego (timers, sonidos, etc.) al salir
  gameScreen.classList.add('hidden');
  menuScreen.classList.remove('hidden');
});
