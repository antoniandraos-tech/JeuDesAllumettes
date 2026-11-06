const matchesContainer = document.getElementById('matches-container');
const matchCountDisplay = document.getElementById('match-count');
const turnBadge = document.getElementById('turn-badge');
const turnText = document.getElementById('turn-text');
const logMessage = document.getElementById('log-message');

const btnTake1 = document.getElementById('take-1');
const btnTake2 = document.getElementById('take-2');
const btnTake3 = document.getElementById('take-3');
const actionButtons = [btnTake1, btnTake2, btnTake3];

const btnRestart = document.getElementById('btn-restart');
const modeSelect = document.getElementById('mode-select');
const initialMatchesInput = document.getElementById('initial-matches');

let nbAllumettes = 17;
let tourJoueur1 = true;
let partieTerminee = false;
let estEnAttente = false;

class SoundFX {
    constructor() { this.ctx = null; }
    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }
    playBurn() {
        try {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        } catch (e) {}
    }
    playWin() {
        try {
            this.init();
            if (!this.ctx) return;
            const notes = [261.63, 329.63, 392.00, 523.25];
            notes.forEach((freq, i) => {
                const now = this.ctx.currentTime + (i * 0.1);
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
            });
        } catch (e) {}
    }
}
const sfx = new SoundFX();

function afficherAllumettes() {
    matchesContainer.innerHTML = '';
    matchCountDisplay.textContent = nbAllumettes;

    for (let i = 0; i < nbAllumettes; i++) {
        const item = document.createElement('div');
        item.classList.add('match-item');
        item.dataset.index = i;

        const flame = document.createElement('div');
        flame.classList.add('match-flame');

        const head = document.createElement('div');
        head.classList.add('match-head');

        const body = document.createElement('div');
        body.classList.add('match-body');

        item.appendChild(flame);
        item.appendChild(head);
        item.appendChild(body);

        item.addEventListener('click', () => {
            if (partieTerminee || estEnAttente) return;
            const index = parseInt(item.dataset.index, 10);
            const countFromEnd = nbAllumettes - index;
            if (countFromEnd >= 1 && countFromEnd <= 3) {
                jouerCoup(countFromEnd);
            }
        });

        item.addEventListener('mouseenter', () => {
            if (partieTerminee || estEnAttente) return;
            const index = parseInt(item.dataset.index, 10);
            const countFromEnd = nbAllumettes - index;
            if (countFromEnd >= 1 && countFromEnd <= 3) {
                mettreEnSurbrillance(countFromEnd);
            }
        });

        item.addEventListener('mouseleave', retirerSurbrillance);

        matchesContainer.appendChild(item);
    }

    ajusterBoutons();
}

function mettreEnSurbrillance(count) {
    const items = matchesContainer.querySelectorAll('.match-item');
    for (let i = 0; i < count; i++) {
        const target = items[items.length - 1 - i];
        if (target) target.classList.add('selected');
    }
}

function retirerSurbrillance() {
    const items = matchesContainer.querySelectorAll('.match-item');
    items.forEach(el => el.classList.remove('selected'));
}

function ajusterBoutons() {
    actionButtons.forEach(btn => {
        const take = parseInt(btn.dataset.take, 10);
        btn.disabled = (take > nbAllumettes || partieTerminee || estEnAttente);
    });
}

function majAffichageTour() {
    const mode = modeSelect.value;
    if (tourJoueur1) {
        turnBadge.className = 'player-pill';
        turnText.textContent = 'Tour du Joueur 1';
    } else {
        if (mode === 'pvp') {
            turnBadge.className = 'player-pill';
            turnText.textContent = 'Tour du Joueur 2';
        } else {
            turnBadge.className = 'player-pill computer';
            turnText.textContent = "Tour de l'Ordinateur";
        }
    }
}

function initialiserPartie() {
    let val = parseInt(initialMatchesInput.value, 10);
    if (isNaN(val) || val < 5) val = 5;
    if (val > 40) val = 40;
    initialMatchesInput.value = val;

    nbAllumettes = val;
    tourJoueur1 = true;
    partieTerminee = false;
    estEnAttente = false;

    afficherAllumettes();
    majAffichageTour();
    logMessage.textContent = 'Partie prête. Choisissez 1, 2 ou 3 allumettes !';
}

function jouerCoup(nb) {
    if (partieTerminee || estEnAttente) return;
    if (nb > nbAllumettes || nb < 1 || nb > 3) return;

    sfx.playBurn();

    const items = matchesContainer.querySelectorAll('.match-item');
    for (let i = 0; i < nb; i++) {
        const item = items[items.length - 1 - i];
        if (item) item.classList.add('removing');
    }

    estEnAttente = true;
    ajusterBoutons();

    setTimeout(() => {
        nbAllumettes -= nb;
        afficherAllumettes();
        estEnAttente = false;

        const nomJoueur = tourJoueur1 
            ? 'Joueur 1' 
            : (modeSelect.value === 'pvp' ? 'Joueur 2' : "L'Ordinateur");

        if (nbAllumettes === 0) {
            partieTerminee = true;
            sfx.playWin();
            turnBadge.className = 'player-pill';
            turnText.textContent = '🏆 Partie Terminée !';
            logMessage.innerHTML = `<strong>VICTOIRE !</strong> ${nomJoueur} a retiré la dernière allumette et remporte le défi !`;
            ajusterBoutons();
            return;
        }

        tourJoueur1 = !tourJoueur1;
        majAffichageTour();

        const mode = modeSelect.value;
        if (!tourJoueur1 && mode !== 'pvp') {
            estEnAttente = true;
            ajusterBoutons();
            logMessage.textContent = `${nomJoueur} a pris ${nb} allumette(s). L'ordinateur calcule son coup...`;
            setTimeout(tourOrdinateur, 800);
        } else {
            const tourSuivant = tourJoueur1 ? 'Joueur 1' : 'Joueur 2';
            logMessage.textContent = `${nomJoueur} a pris ${nb} allumette(s). À ${tourSuivant} de jouer !`;
            ajusterBoutons();
        }
    }, 380);
}

function tourOrdinateur() {
    if (partieTerminee) return;

    const mode = modeSelect.value;
    let choix = 1;

    if (mode === 'ia-easy') {
        const maxTake = Math.min(3, nbAllumettes);
        choix = Math.floor(Math.random() * maxTake) + 1;
    } else if (mode === 'ia-hard') {
        const reste = nbAllumettes % 4;
        choix = (reste !== 0) ? reste : 1;
    }

    estEnAttente = false;
    logMessage.textContent = `L'ordinateur prend ${choix} allumette(s)...`;
    jouerCoup(choix);
}

btnTake1.addEventListener('click', () => jouerCoup(1));
btnTake2.addEventListener('click', () => jouerCoup(2));
btnTake3.addEventListener('click', () => jouerCoup(3));

btnRestart.addEventListener('click', initialiserPartie);
modeSelect.addEventListener('change', initialiserPartie);
initialMatchesInput.addEventListener('change', initialiserPartie);

const canvas = document.getElementById('fire-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let sparks = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Spark {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + 10;
            this.size = Math.random() * 2.5 + 1;
            this.speedY = Math.random() * 1.5 + 0.6;
            this.speedX = (Math.random() - 0.5) * 0.8;
            this.alpha = Math.random() * 0.7 + 0.3;
            this.decay = Math.random() * 0.006 + 0.003;
        }
        update() {
            this.y -= this.speedY;
            this.x += this.speedX;
            this.alpha -= this.decay;
            if (this.alpha <= 0 || this.y < -10) this.reset();
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.fillStyle = '#f97316';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ea580c';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    for (let i = 0; i < 35; i++) {
        const s = new Spark();
        s.y = Math.random() * canvas.height;
        sparks.push(s);
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        sparks.forEach(s => { s.update(); s.draw(); });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
}

initialiserPartie();