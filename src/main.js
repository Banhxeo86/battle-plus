import gsap from 'https://esm.sh/gsap';
import confetti from 'https://esm.sh/canvas-confetti';

class Game {
    constructor() {
        this.playerCount = 2;
        this.difficultyLevel = 1;
        this.winningThreshold = 10;
        this.isGameOver = false;

        this.players = {}; // Store player states
        
        this.initDOMElements();
        this.attachEvents();
        
        console.log("Game initialized");
    }

    initDOMElements() {
        this.el = {
            app: document.getElementById('app'),
            overlay: document.getElementById('overlay'),
            startBtn: document.getElementById('start-btn'),
            title: document.getElementById('overlay-title'),
            playerCountSelect: document.getElementById('player-count-select'),
            difficultySelect: document.getElementById('difficulty-select'),
            exitBtn: document.getElementById('exit-btn'),
        };
    }

    attachEvents() {
        // Use event delegation for better performance and robustness
        document.addEventListener('click', (e) => {
            const target = e.target;

            // Start Button
            if (target.id === 'start-btn' || target.closest('#start-btn')) {
                this.start();
                return;
            }

            // Exit Button
            if (target.id === 'exit-btn' || target.closest('#exit-btn')) {
                this.exit();
                return;
            }

            // Player Count Selection
            const playerCountBtn = target.closest('#player-count-select .toggle-btn');
            if (playerCountBtn) {
                this.el.playerCountSelect.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                playerCountBtn.classList.add('active');
                this.playerCount = parseInt(playerCountBtn.dataset.count);
                this.el.app.className = `players-${this.playerCount}`;
                return;
            }

            // Difficulty Selection
            const difficultyBtn = target.closest('#difficulty-select .toggle-btn');
            if (difficultyBtn) {
                this.el.difficultySelect.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                difficultyBtn.classList.add('active');
                this.difficultyLevel = parseInt(difficultyBtn.dataset.level);
                return;
            }

            // Keypad
            const keyBtn = target.closest('.key');
            if (keyBtn) {
                const keypad = keyBtn.closest('.keypad');
                if (keypad) {
                    const playerId = parseInt(keypad.dataset.player);
                    this.handleKey(playerId, keyBtn.innerText.trim());
                }
                return;
            }
        });
    }

    start() {
        console.log("Starting game with", this.playerCount, "players, level", this.difficultyLevel);
        this.isGameOver = false;
        this.players = {};
        
        // Initialize active players
        for (let i = 1; i <= 3; i++) {
            const zone = document.getElementById(`player-${i}`);
            if (i <= this.playerCount) {
                this.players[i] = {
                    score: 0,
                    q: { a: 0, b: 0, ans: 0 },
                    input: ""
                };
                document.getElementById(`score-${i}`).innerText = "0";
                document.getElementById(`stack-${i}`).innerHTML = "";
                this.generateQuestion(i);
            }
        }

        this.el.overlay.classList.add('hidden');
        this.el.exitBtn.classList.remove('hidden');
    }

    exit() {
        this.isGameOver = true;
        this.el.overlay.classList.remove('hidden');
        this.el.exitBtn.classList.add('hidden');
        this.el.title.innerText = "덧셈 배틀!";
        this.el.startBtn.innerText = "시작하기";
    }

    generateQuestion(playerId) {
        let a, b;
        switch (this.difficultyLevel) {
            case 1:
                a = Math.floor(Math.random() * 9) + 1;
                b = Math.floor(Math.random() * 9) + 1;
                break;
            case 2:
                a = Math.floor(Math.random() * 10) + 10;
                b = Math.floor(Math.random() * 9) + 1;
                break;
            case 3:
                const sum = Math.floor(Math.random() * 31) + 20; 
                a = Math.floor(Math.random() * (sum - 11)) + 10;
                b = sum - a;
                break;
        }

        const player = this.players[playerId];
        player.q = { a, b, ans: a + b };
        player.input = "";
        
        document.getElementById(`q-${playerId}`).innerText = `${a} + ${b} =`;
        document.getElementById(`a-${playerId}`).innerText = "_";
    }

    handleKey(playerId, key) {
        if (this.isGameOver || !this.players[playerId]) return;
        const p = this.players[playerId];

        if (key === 'C') {
            p.input = "";
            document.getElementById(`a-${playerId}`).innerText = "_";
        } else if (key === '제출' || key === 'OK') {
            this.checkAnswer(playerId);
        } else {
            if (p.input.length < 3) {
                p.input += key;
                document.getElementById(`a-${playerId}`).innerText = p.input;
            }
        }
    }

    checkAnswer(playerId) {
        const p = this.players[playerId];
        if (p.input === "") return;
        
        if (parseInt(p.input) === p.q.ans) {
            this.handleSuccess(playerId);
        } else {
            this.handleFailure(playerId);
        }
    }

    handleSuccess(playerId) {
        const p = this.players[playerId];
        p.score++;
        document.getElementById(`score-${playerId}`).innerText = p.score;
        
        this.addBlock(playerId);
        this.checkWinCondition(playerId);
        
        if (!this.isGameOver) {
            this.generateQuestion(playerId);
        }
    }

    handleFailure(playerId) {
        const zone = document.getElementById(`player-${playerId}`);
        zone.classList.add('shake');
        setTimeout(() => zone.classList.remove('shake'), 400);

        const p = this.players[playerId];
        if (p.score > 0) {
            p.score--;
            document.getElementById(`score-${playerId}`).innerText = p.score;
            this.removeBlock(playerId);
        }
        
        p.input = "";
        document.getElementById(`a-${playerId}`).innerText = "_";
    }

    addBlock(playerId) {
        const block = document.createElement('div');
        block.className = 'block';
        document.getElementById(`stack-${playerId}`).appendChild(block);
    }

    removeBlock(playerId) {
        const stack = document.getElementById(`stack-${playerId}`);
        if (stack.lastElementChild) {
            gsap.to(stack.lastElementChild, { 
                scale: 0, opacity: 0, duration: 0.3, 
                onComplete: () => {
                    if (stack.lastElementChild) stack.removeChild(stack.lastElementChild);
                }
            });
        }
    }

    checkWinCondition(playerId) {
        const p = this.players[playerId];
        if (p.score >= this.winningThreshold) {
            const teamNames = { 1: "청팀", 2: "홍팀", 3: "녹팀" };
            const teamColors = { 1: "#007bff", 2: "#ff4757", 3: "#2ecc71" };
            this.endGame(`${teamNames[playerId]} 승리!`, teamColors[playerId]);
        }
    }

    endGame(message, color) {
        this.isGameOver = true;
        this.el.title.innerText = message;
        this.el.overlay.classList.remove('hidden');
        this.el.exitBtn.classList.add('hidden');
        this.el.startBtn.innerText = "다시 하기";
        
        confetti({
            particleCount: 150, spread: 70, origin: { y: 0.6 },
            colors: [color, '#ffffff', '#ffd700']
        });
    }
}

// Ensure DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new Game());
} else {
    new Game();
}

