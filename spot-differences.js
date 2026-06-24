/* ==========================================
   Arabic Family TV Games Hub - Spot the Differences Engine (MCQ Quiz Mode)
========================================== */

const spotDiff = {
    canvasOriginal: null,
    canvasModified: null,
    ctxOrig: null,
    ctxMod: null,
    
    diffCount: 5,         // The correct answer (randomly generated)
    selectedTheme: 'space',
    
    elements: [],       // Base elements drawn on both canvases
    differences: [],    // Array of difference specifications
    options: [],        // The 4 choice numbers
    
    timerSeconds: 30,
    timerInterval: null,
    isPlaying: false,
    hasAnswered: false,

    startGame() {
        app.initAudio();
        this.isPlaying = true;
        this.hasAnswered = false;
        
        // Randomize correct difference count between 3 and 7
        this.diffCount = 3 + Math.floor(Math.random() * 5); // 3, 4, 5, 6, 7
        
        // Randomize cartoon themes on each start for maximum variation
        const themes = ['space', 'neon', 'nature'];
        this.selectedTheme = themes[Math.floor(Math.random() * themes.length)];

        // Prepare screens and buttons
        app.showScreen('spot-game-screen');
        document.getElementById('spot-progress').innerText = `احسب الفروقات بين اللوحتين واختر الإجابة الصحيحة`;
        document.getElementById('spot-game-result').classList.add('hidden');
        document.getElementById('spot-next-btn').classList.add('hidden');
        document.getElementById('spot-reveal-btn').classList.remove('hidden');

        // Init Canvases
        this.canvasOriginal = document.getElementById('canvas-original');
        this.canvasModified = document.getElementById('canvas-modified');
        this.ctxOrig = this.canvasOriginal.getContext('2d');
        this.ctxMod = this.canvasModified.getContext('2d');

        // Disable canvas clicking logic (just set it to null)
        this.canvasModified.onclick = null;

        // Generate level elements
        this.generateLevel();
        
        // Generate Multiple Choice Options
        this.generateOptions();

        // Draw elements on canvas
        this.drawCanvases();
        
        // Start 60s timer
        this.startTimer();
    },

    generateOptions() {
        let optionsSet = new Set([this.diffCount]);
        
        // Generate 3 distractors close to diffCount
        while (optionsSet.size < 4) {
            let offset = Math.floor(Math.random() * 5) - 2; // -2 to +2
            let opt = this.diffCount + offset;
            if (opt >= 1 && opt <= 10) {
                optionsSet.add(opt);
            }
        }
        
        // Convert to array and sort
        this.options = Array.from(optionsSet).sort((a, b) => a - b);
        
        // Render options on TV as a prompt instead of buttons
        const optionsContainer = document.getElementById('spot-options-container');
        optionsContainer.innerHTML = `<div style="text-align: center; margin-top: 20px;">
                                <span style="font-size: 1.1em; color: #fff;">الرجاء النظر إلى جوالك لاختيار الإجابة الصحيحة 📱</span>
                            </div>`;
        
        // Broadcast to mobile
        app.currentRoundAnswers = {};
        app.currentCorrectAnswerIndex = this.options.indexOf(this.diffCount);
        app.broadcast({
            type: 'question-start',
            question: 'كم عدد الاختلافات بين الصورتين؟',
            options: this.options.map(o => `${o} اختلافات`)
        });
    },

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerSeconds = 30;
        this.updateTimerUI();
        app.focusDimSidebar(true); // Focus dimming active during countdown

        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            this.updateTimerUI();

            if (this.timerSeconds <= 10 && this.timerSeconds > 0) {
                app.playSound('tick');
            }

            if (this.timerSeconds <= 0) {
                clearInterval(this.timerInterval);
                this.revealAllDifferences(true); // Timeout reveal
            }
        }, 1000);
    },

    updateTimerUI() {
        const timerText = document.getElementById('spot-timer-seconds');
        if (timerText) {
            timerText.innerText = this.timerSeconds;
            if (this.timerSeconds <= 10) {
                timerText.style.color = 'var(--color-wrong)';
            } else {
                timerText.style.color = 'var(--color-secondary)';
            }
        }
    },

    generateLevel() {
        this.elements = [];
        this.differences = [];
        
        const width = 600;
        const height = 400;
        
        // Cute cartoon emojis pool
        const emojisPool = ['🧸', '🐶', '🐱', '🐰', '🐼', '🦊', '🦄', '🍎', '🍓', '🍔', '🍕', '🍦', '🍩', '🚗', '🎈', '🌻', '🦋', '🦖', '⚽', '🎨', '🚀', '⭐', '🌈', '🎁', '🍄', '🐢', '🐧', '🐳', '🐝', '🧁'];
        
        // Reduced element count to avoid cluttering and make differences clearer
        const elementCount = 12 + Math.floor(Math.random() * 4); // 12 to 15 elements

        for (let i = 0; i < elementCount; i++) {
            let elem;
            let attempts = 0;
            // Prevent overlapping for clean distribution
            do {
                elem = this.createRandomElement(width, height, emojisPool);
                attempts++;
            } while (this.checkOverlap(elem, this.elements) && attempts < 100);
            this.elements.push(elem);
        }

        // Shuffle element indices
        let indices = Array.from({ length: this.elements.length }, (_, k) => k);
        indices.sort(() => 0.5 - Math.random());
        
        // Select exactly diffCount elements to modify
        const selectedForDiff = indices.slice(0, this.diffCount);

        selectedForDiff.forEach((elemIdx) => {
            let originalElem = this.elements[elemIdx];
            let modifiedElem = JSON.parse(JSON.stringify(originalElem));

            // 50% chance: Present in Original (A) but Missing in Modified (B)
            // 50% chance: Missing in Original (A) but Present in Modified (B)
            if (Math.random() > 0.5) {
                originalElem.visible = true;
                modifiedElem.visible = false;
            } else {
                originalElem.visible = false;
                modifiedElem.visible = true;
            }

            this.differences.push({
                index: elemIdx,
                x: originalElem.x,
                y: originalElem.y,
                original: originalElem,
                modified: modifiedElem
            });
        });
    },

    checkOverlap(elem, existingElements) {
        for (let other of existingElements) {
            const dx = elem.x - other.x;
            const dy = elem.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // Ensure elements don't overlap too closely
            if (distance < (elem.size + other.size) * 0.95) {
                return true;
            }
        }
        return false;
    },

    createRandomElement(width, height, emojisPool) {
        const x = 60 + Math.random() * (width - 120);
        const y = 60 + Math.random() * (height - 120);
        const size = 45 + Math.random() * 15; // Enlarged from 30-55 to 45-60 for high clarity
        
        let emoji = emojisPool[Math.floor(Math.random() * emojisPool.length)];
        
        // Random slight rotation for organic feel
        const rotation = (Math.random() - 0.5) * 0.4;

        return { x, y, size, emoji, rotation, visible: true };
    },

    drawCanvases() {
        this.drawSingleCanvas(this.ctxOrig, 'original');
        this.drawSingleCanvas(this.ctxMod, 'modified');
    },

    drawSingleCanvas(ctx, mode) {
        const w = 600;
        const h = 400;
        
        // Deep magical dark-blue cartoon background matching the premium dark theme
        ctx.fillStyle = '#111424'; 
        ctx.fillRect(0, 0, w, h);
        
        // Draw soft glowing pastel cartoon clouds
        ctx.fillStyle = 'rgba(123, 44, 191, 0.15)'; // Soft purple glow
        ctx.beginPath();
        ctx.arc(100, 100, 90, 0, Math.PI * 2);
        ctx.arc(500, 300, 110, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 245, 212, 0.08)'; // Soft teal glow
        ctx.beginPath();
        ctx.arc(300, 200, 130, 0, Math.PI * 2);
        ctx.fill();

        // Draw cute cartoon clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.arc(120, 120, 50, 0, Math.PI * 2);
        ctx.arc(170, 120, 35, 0, Math.PI * 2);
        ctx.arc(80, 130, 30, 0, Math.PI * 2);
        
        ctx.arc(460, 280, 60, 0, Math.PI * 2);
        ctx.arc(520, 290, 45, 0, Math.PI * 2);
        ctx.arc(410, 300, 35, 0, Math.PI * 2);
        ctx.fill();

        // Draw tiny twinkling background stars/dots
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 20; i++) {
            const starX = (i * 97 + 50) % w;
            const starY = (i * 73 + 30) % h;
            ctx.fillRect(starX, starY, 2, 2);
        }

        this.elements.forEach((elem, index) => {
            let currentElem = elem;
            if (mode === 'modified') {
                const diff = this.differences.find(d => d.index === index);
                if (diff) {
                    currentElem = diff.modified;
                }
            }

            if (currentElem.visible) {
                this.drawElement(ctx, currentElem);
            }
        });
    },

    // Draws the emoji element with a bright white sticker backing to make it pop clearly on dark screens
    drawElement(ctx, elem) {
        ctx.save();
        ctx.translate(elem.x, elem.y);
        ctx.rotate(elem.rotation || 0);
        
        // Draw white circular sticker background (so it is bright and stands out)
        ctx.beginPath();
        ctx.arc(0, 0, elem.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // Sticker border outline
        ctx.strokeStyle = '#222538';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        
        // Shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;
        
        // Draw Emoji
        ctx.font = `${elem.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(elem.emoji, 0, 0);
        
        ctx.restore();
    },

    drawMarker(ctx, x, y, color) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    },

    revealAllDifferences(isTimeout = false) {
        if (this.hasAnswered) return;
        this.hasAnswered = true;
        
        clearInterval(this.timerInterval);
        app.clearDimSidebar(); // Restore sidebar lighting on reveal

        const correctIndex = this.options.indexOf(this.diffCount);

        // Grade mobile controllers answers
        const hasMobileAnswers = Object.keys(app.currentRoundAnswers).length > 0;
        const correctPlayers = [];
        const playerResults = {};
        
        if (hasMobileAnswers) {
            app.players.forEach((p, idx) => {
                const answer = app.currentRoundAnswers[idx];
                const isCorrect = (answer !== undefined && answer === correctIndex);
                
                playerResults[p.name] = isCorrect;

                if (isCorrect) {
                    const pts = p.quizMultiplier ? p.quizMultiplier : 1;
                    p.score += pts;
                    correctPlayers.push(p.name);
                }
                
                // Reset multiplier
                p.quizMultiplier = null;
            });

            // Broadcast the results to all mobiles
            app.broadcast({
                type: 'quiz-result',
                correctIndex: correctIndex,
                results: playerResults
            });
            
            if (correctPlayers.length > 0) {
                app.showToast(`🎉 أجاب بشكل صحيح: ${correctPlayers.join(' و ')}!`, 'success');
            } else {
                app.showToast(`😢 لم يجب أي لاعب إجابة صحيحة!`, 'danger');
            }
            app.updateSidebarUI();
        }

        if (isTimeout || (hasMobileAnswers && correctPlayers.length === 0)) {
            app.playSound('wrong');
            app.flashAmbient('wrong');
        } else {
            app.playSound('correct');
            app.flashAmbient('correct');
        }

        // Draw red markers on canvas
        this.revealDifferencesOnCanvas();

        document.getElementById('spot-reveal-btn').classList.add('hidden');

        // Restore mobile views to buzzer mode
        setTimeout(() => {
            app.broadcast({ type: 'show-buzzer' });
            app.currentRoundAnswers = {};
            app.currentCorrectAnswerIndex = null;
            
            // Start next game
            this.restartGame();
        }, 4000);
    },

    revealDifferencesOnCanvas() {
        this.differences.forEach((diff) => {
            this.drawMarker(this.ctxOrig, diff.x, diff.y, 'var(--color-wrong)');
            this.drawMarker(this.ctxMod, diff.modified.x, diff.modified.y, 'var(--color-wrong)');
        });
    },

    restartGame() {
        document.getElementById('spot-game-result').classList.add('hidden');
        this.startGame();
    }
};
