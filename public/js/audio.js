let timerAudio = null;
let startAudio = null;
let gameOverAudio = null;
let guessAudio = null;

guessAudio = document.createElement('audio');
timerAudio = document.createElement('audio');
startAudio = document.createElement('audio');
gameOverAudio = document.createElement('audio');

gameOverAudio.style.display = 'none';
guessAudio.style.display = 'none';
startAudio.style.display = 'none';
timerAudio.style.display = 'none';

startAudio.src = window.location.hostname + '/public/game-start.mp3';
guessAudio.src = window.location.hostname + '/public/guess.mp3';
gameOverAudio.src = window.location.hostname + '/public/game-winner.mp3';
timerAudio.src = window.location.hostname + '/public/Timer_Audio.mp3';