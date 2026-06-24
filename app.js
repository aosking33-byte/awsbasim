/* ==========================================
   Arabic Family TV Games Hub - Core Application Manager
========================================== */

const app = {
    settings: {
        soundEnabled: true,
        geminiApiKey: ''
    },
    audioCtx: null,
    musicInterval: null,
    musicStep: 0,
    players: [],
    activeWinnerCallback: null,
    confettiInterval: null,
    
    // Sudden Death Duel states
    isDuelActive: false,
    duelCallback: null,
    silencedPlayerIndex: null,
    piratePlayerIndex: null,
    fiftyFiftyActive: false,

    startApp() {
        this.initAudio();
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.classList.add('hidden'), 500);
        }
        
        // Play welcome fanfare
        this.playSound('success');
        
        // Start background music loop
        this.startBackgroundMusic();
    },

    startBackgroundMusic() {
        if (this.musicInterval) clearInterval(this.musicInterval);
        if (!this.settings.soundEnabled) return;
        
        this.musicStep = 0;
        
        // A deep pulsing A-minor progression for suspense/excitement
        const bassline = [110, 0, 110, 0, 130, 0, 130, 0, 146, 0, 146, 0, 174, 165, 146, 130];
        const melody =   [440, 0, 0, 523.25, 0, 0, 587.33, 0, 0, 0, 659.25, 0, 0, 523.25, 392, 0];
        
        this.musicInterval = setInterval(() => {
            if (!this.settings.soundEnabled) {
                this.stopBackgroundMusic();
                return;
            }
            
            try {
                const ctx = this.audioCtx;
                if (!ctx) return;
                const now = ctx.currentTime;
                
                const step = this.musicStep % 16;
                const bassFreq = bassline[step];
                const melFreq = melody[step];
                
                // 1. Play deep bass pulse
                if (bassFreq > 0) {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    const filter = ctx.createBiquadFilter();
                    
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(bassFreq, now);
                    
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(300, now);
                    
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                    
                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.start(now);
                    osc.stop(now + 0.27);
                }
                
                // 2. Play high suspense arpeggio note (slightly randomized for playfulness)
                if (melFreq > 0 && Math.random() > 0.4) {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(melFreq, now);
                    
                    gain.gain.setValueAtTime(0.015, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.start(now);
                    osc.stop(now + 0.52);
                }
                
                this.musicStep++;
            } catch(e) {
                console.error("Music scheduler error:", e);
            }
        }, 220);
    },

    stopBackgroundMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    },

    peer: null,
    peerConnections: [],
    isMobileController: false,
    mobileConn: null,
    roomToJoin: '',

    init() {
        // Mobile controller is now handled by mobile.html separately
        // No URL check needed here - TV always shows TV interface

        // Load settings from localStorage
        const storedApiKey = localStorage.getItem('family_tv_gemini_api_key') || localStorage.getItem('family_tv_gemini_key');
        if (storedApiKey) {
            this.settings.geminiApiKey = storedApiKey;
            const apiKeyInput = document.getElementById('api-key-input');
            if (apiKeyInput) apiKeyInput.value = storedApiKey;
            const widgetKeyInput = document.getElementById('widget-gemini-key');
            if (widgetKeyInput) widgetKeyInput.value = storedApiKey;
        }

        const storedSound = localStorage.getItem('family_tv_sound_enabled');
        if (storedSound !== null) {
            this.settings.soundEnabled = storedSound === 'true';
        }
        this.updateSoundUI();
        this.updateSoundToggleBtnInWidget();
        
        // Start TV Host WebRTC listener
        this.startTvHost();

        // Setup Category Listeners
        const categoryItems = document.querySelectorAll('.category-item');
        categoryItems.forEach(item => {
            item.addEventListener('click', () => {
                categoryItems.forEach(c => c.classList.remove('active'));
                item.classList.add('active');
                this.playSound('click');
            });
        });

        // Setup Diff Count Selector Listeners
        const diffOptions = document.querySelectorAll('.diff-count-option');
        diffOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                diffOptions.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                this.playSound('click');
            });
        });

        // Setup Theme Item Listeners
        const themeItems = document.querySelectorAll('.theme-item');
        themeItems.forEach(thm => {
            thm.addEventListener('click', () => {
                themeItems.forEach(t => t.classList.remove('active'));
                thm.classList.add('active');
                this.playSound('click');
            });
        });

        // Setup Player Add Event
        const playerInput = document.getElementById('player-name-input');
        if (playerInput) {
            playerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    app.addPlayer(playerInput.value);
                    playerInput.value = '';
                }
            });
        }

        // Setup Keyboard / Remote Control Navigation
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Setup 3D Hover Light tracking on mouse move using highly optimized event delegation
        document.addEventListener('mousemove', (e) => {
            const selectors = '.btn, .game-card, .category-item, .mode-option, .diff-count-option, .theme-item, .icon-btn, .option-btn, .player-score-btn, .power-card-btn-sidebar';
            const card = e.target.closest(selectors);
            if (card) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            }
        });

        // Make all static interactive elements focusable
        this.makeElementsFocusable();

        // Check and toggle warnings
        this.checkAiWarning();
    },

    makeElementsFocusable() {
        const selectors = '.btn, .game-card, .category-item, .mode-option, .diff-count-option, .theme-item, .icon-btn, .locked-card';
        document.querySelectorAll(selectors).forEach(elem => {
            elem.setAttribute('tabindex', '0');
        });
    },

    handleKeyDown(e) {
        const key = e.key;
        
        // Backspace or Escape to return Home
        if (key === 'Backspace' || key === 'Escape') {
            const activeScreen = document.querySelector('.app-screen.active');
            if (activeScreen && activeScreen.id !== 'home-screen') {
                e.preventDefault();
                this.showScreen('home-screen');
            }
            return;
        }

        const focusableSelectors = '.btn:not(.hidden), .game-card:not(.hidden), .category-item:not(.hidden), .option-btn:not(.hidden):not(.disabled), .mode-option:not(.hidden), .diff-count-option:not(.hidden), .theme-item:not(.hidden), .icon-btn:not(.hidden), .locked-card:not(.hidden)';
        const elements = Array.from(document.querySelectorAll(`.app-screen.active ${focusableSelectors}, .main-header ${focusableSelectors}`));
        
        if (elements.length === 0) return;

        let currentFocused = document.activeElement;
        
        if (!elements.includes(currentFocused)) {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) {
                elements[0].focus();
                e.preventDefault();
            }
            return;
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            e.preventDefault();
            const nextElem = this.getClosestElement(currentFocused, elements, key);
            if (nextElem) {
                nextElem.focus();
                this.playSound('click');
            }
        }
    },

    getClosestElement(current, elements, direction) {
        const curRect = current.getBoundingClientRect();
        const curCenterX = curRect.left + curRect.width / 2;
        const curCenterY = curRect.top + curRect.height / 2;

        let bestElem = null;
        let bestScore = Infinity;

        elements.forEach(elem => {
            if (elem === current) return;

            const rect = elem.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const dx = centerX - curCenterX;
            const dy = centerY - curCenterY;

            let isCorrectDirection = false;
            
            // Standard coordinate mapping (x: right positive, y: down positive)
            if (direction === 'ArrowRight') isCorrectDirection = dx > 5;
            if (direction === 'ArrowLeft') isCorrectDirection = dx < -5;
            if (direction === 'ArrowUp') isCorrectDirection = dy < -5;
            if (direction === 'ArrowDown') isCorrectDirection = dy > 5;

            if (isCorrectDirection) {
                const distance = Math.hypot(dx, dy);
                let alignmentPenalty = 0;
                
                if (direction === 'ArrowRight' || direction === 'ArrowLeft') {
                    alignmentPenalty = Math.abs(dy) * 1.8;
                } else {
                    alignmentPenalty = Math.abs(dx) * 1.8;
                }

                const score = distance + alignmentPenalty;
                if (score < bestScore) {
                    bestScore = score;
                    bestElem = elem;
                }
            }
        });

        return bestElem;
    },

    // SPA Navigation
    showScreen(screenId) {
        document.querySelectorAll('.app-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const activeScreen = document.getElementById(screenId);
        if (activeScreen) {
            activeScreen.classList.add('active');
        }

        // Play navigation sound
        this.playSound('click');

        // Stop timers when leaving game screens
        if (screenId !== 'quiz-game-screen') {
            if (window.quiz && quiz.timerInterval) {
                clearInterval(quiz.timerInterval);
            }
        }
        if (screenId !== 'spot-game-screen') {
            if (window.spotDiff && spotDiff.timerInterval) {
                clearInterval(spotDiff.timerInterval);
            }
        }
        if (screenId !== 'party-game-screen') {
            if (window.partyGames && partyGames.timerInterval) {
                clearInterval(partyGames.timerInterval);
            }
        }
        if (screenId !== 'celebration-screen') {
            this.stopConfetti();
        }

        // Update sidebar scoreboard when showing a game screen
        if (['quiz-game-screen', 'spot-game-screen', 'party-game-screen'].includes(screenId)) {
            this.updateSidebarUI();
        }
    },

    openGameSetup(game) {
        if (game === 'quiz') {
            this.showScreen('quiz-setup-screen');
        } else if (game === 'spot') {
            spotDiff.startGame();
        }
    },

    // Sound Engine (Web Audio API Synthesizer)
    initAudio() {
        try {
            if (!this.audioCtx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    this.audioCtx = new AudioContextClass();
                } else {
                    console.warn('AudioContext not supported in this browser.');
                }
            }
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
        } catch (e) {
            console.warn('Failed to initialize Web Audio:', e);
        }
    },

    playSound(type) {
        if (!this.settings.soundEnabled) return;
        
        try {
            this.initAudio();
            const ctx = this.audioCtx;
            if (!ctx) return;

            const now = ctx.currentTime;

            switch(type) {
                case 'click':
                    // Short soft click
                    const clickOsc = ctx.createOscillator();
                    const clickGain = ctx.createGain();
                    clickOsc.type = 'sine';
                    clickOsc.frequency.setValueAtTime(800, now);
                    clickOsc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
                    
                    clickGain.gain.setValueAtTime(0.15, now);
                    clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                    
                    clickOsc.connect(clickGain);
                    clickGain.connect(ctx.destination);
                    clickOsc.start(now);
                    clickOsc.stop(now + 0.1);
                    break;

                case 'tick':
                    // Short woodblock tick
                    const tickOsc = ctx.createOscillator();
                    const tickGain = ctx.createGain();
                    tickOsc.type = 'triangle';
                    tickOsc.frequency.setValueAtTime(1200, now);
                    
                    tickGain.gain.setValueAtTime(0.08, now);
                    tickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                    
                    tickOsc.connect(tickGain);
                    tickGain.connect(ctx.destination);
                    tickOsc.start(now);
                    tickOsc.stop(now + 0.05);
                    break;

                case 'correct':
                    // Harmonious arpeggio
                    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
                    notes.forEach((freq, idx) => {
                        const noteTime = now + (idx * 0.08);
                        const osc = ctx.createOscillator();
                        const gainNode = ctx.createGain();
                        
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, noteTime);
                        
                        gainNode.gain.setValueAtTime(0.15, noteTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.3);
                        
                        osc.connect(gainNode);
                        gainNode.connect(ctx.destination);
                        osc.start(noteTime);
                        osc.stop(noteTime + 0.35);
                    });
                    break;

                case 'wrong':
                    // Harsh drop
                    const wrongOsc = ctx.createOscillator();
                    const wrongGain = ctx.createGain();
                    wrongOsc.type = 'sawtooth';
                    wrongOsc.frequency.setValueAtTime(150, now);
                    wrongOsc.frequency.linearRampToValueAtTime(80, now + 0.4);
                    
                    wrongGain.gain.setValueAtTime(0.2, now);
                    wrongGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                    
                    wrongOsc.connect(wrongGain);
                    wrongGain.connect(ctx.destination);
                    wrongOsc.start(now);
                    wrongOsc.stop(now + 0.4);
                    break;

                case 'success':
                    // Triumphant Fanfare
                    const fanfare = [392.00, 392.00, 523.25, 659.25]; // G4, G4, C5, E5
                    fanfare.forEach((freq, idx) => {
                        const delay = idx * 0.12;
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, now + delay);
                        gain.gain.setValueAtTime(0.15, now + delay);
                        gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.4);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(now + delay);
                        osc.stop(now + delay + 0.4);
                    });
                    break;

                case 'triumph':
                    // Majestic long victory chords
                    const chords = [
                        [261.63, 329.63, 392.00], // C major
                        [349.23, 440.00, 523.25], // F major
                        [392.00, 489.99, 587.33], // G major
                        [523.25, 659.25, 783.99, 1046.50] // high C major scale
                    ];
                    chords.forEach((chord, chordIdx) => {
                        const chordTime = now + (chordIdx * 0.45);
                        chord.forEach((freq) => {
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();
                            osc.type = 'sawtooth';
                            osc.frequency.setValueAtTime(freq, chordTime);
                            
                            gain.gain.setValueAtTime(0.08, chordTime);
                            gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.65);
                            
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.start(chordTime);
                            osc.stop(chordTime + 0.7);
                        });
                    });
                    break;
                case 'siren':
                    // Alternating pitch alarm/siren for Sudden Duel
                    for (let i = 0; i < 4; i++) {
                        const start = now + (i * 0.35);
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(i % 2 === 0 ? 550 : 350, start);
                        osc.frequency.linearRampToValueAtTime(i % 2 === 0 ? 650 : 250, start + 0.3);
                        
                        gain.gain.setValueAtTime(0.12, start);
                        gain.gain.linearRampToValueAtTime(0.01, start + 0.32);
                        
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(start);
                        osc.stop(start + 0.33);
                    }
                    break;
            }
        } catch (e) {
            console.error('Audio synthesizer error:', e);
        }
    },

    toggleSound() {
        this.settings.soundEnabled = !this.settings.soundEnabled;
        localStorage.setItem('family_tv_sound_enabled', this.settings.soundEnabled);
        this.updateSoundUI();
        this.playSound('click');
        if (this.settings.soundEnabled) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
    },

    updateSoundUI() {
        const toggleBtn = document.getElementById('sound-toggle');
        const statusText = document.getElementById('sound-status-text');
        
        if (toggleBtn) {
            if (this.settings.soundEnabled) {
                toggleBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"></svg>';
                toggleBtn.classList.remove('muted');
            } else {
                toggleBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"></svg>';
                toggleBtn.classList.add('muted');
            }
        }

        if (statusText) {
            if (this.settings.soundEnabled) {
                statusText.innerText = 'مفعّل';
                statusText.className = 'status-active';
            } else {
                statusText.innerText = 'معطّل';
                statusText.className = 'status-muted';
            }
        }
    },

    // Settings Screen Management
    saveSettings() {
        const keyInput = document.getElementById('api-key-input').value.trim();
        this.settings.geminiApiKey = keyInput;
        localStorage.setItem('family_tv_gemini_key', keyInput);
        
        this.playSound('correct');
        this.checkAiWarning();
        this.showScreen('home-screen');
    },

    toggleKeyVisibility() {
        const keyInput = document.getElementById('api-key-input');
        const eyeBtn = document.getElementById('toggle-key-visibility');
        if (keyInput.type === 'password') {
            keyInput.type = 'text';
            eyeBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
        } else {
            keyInput.type = 'password';
            eyeBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
        }
        this.playSound('click');
    },

    checkAiWarning() {
        const warning = document.getElementById('ai-key-warning');
        const isKeyPresent = !!this.settings.geminiApiKey;
        
        if (warning) {
            if (isKeyPresent) {
                warning.classList.add('hidden');
            } else {
                // If AI source is active but no key, warn the user
                const activeSource = document.querySelector('.mode-option.active');
                if (activeSource && activeSource.getAttribute('data-source') === 'ai') {
                    warning.classList.remove('hidden');
                } else {
                    warning.classList.add('hidden');
                }
            }
        }
    },

    // Player/Multiplayer Management Methods
    addPlayer(name) {
        name = name.trim();
        if (!name) return -1;
        if (this.players.some(p => p.name === name)) return -1;
        
        // Cute expressive human smiley faces (فيسات) pool instead of animals
        const avatars = [
            '😎', '🤠', '🥳', '🤓', '🤖', '👾', '👽', '👑', '🧙‍♂️', '🦸‍♂️', 
            '🥷', '🕵️‍♂️', '👨‍🚀', '🧑‍🎨', '👨‍🎤', '👻', '🤡', '🎃', '😈', '🧠'
        ];
        const usedAvatars = this.players.map(p => p.avatar);
        let availableAvatars = avatars.filter(a => !usedAvatars.includes(a));
        if (availableAvatars.length === 0) availableAvatars = avatars;
        const avatar = availableAvatars[Math.floor(Math.random() * availableAvatars.length)];

        // Random Power Card
        const powerCards = [
            { icon: '🛡️', name: 'درع الحماية', desc: 'تؤمن لك نقطة إضافية عند تفعيلها' },
            { icon: '💥', name: 'سرقة نقطة', desc: 'تسرق نقطة واحدة من المتصدر وتضيفها لك' },
            { icon: '🔄', name: 'مضاعفة النقاط', desc: 'تمنحك نقطتين مضاعفتين بدلاً من واحدة' },
            { icon: '🥊', name: 'تحدي المبارزة', desc: 'تفرض مبارزة ثنائية فورية بينك وبين المتصدر في الجولة القادمة لانتزاع نقطتين مضاعفتين!' },
            { icon: '🏴‍☠️', name: 'بطاقة القرصنة', desc: 'تضع علم القرصنة لتسرق نقطة الفوز بالجولة القادمة وتنسبها لنفسك!' },
            { icon: '⚖️', name: 'بطاقة العدالة', desc: 'تساوي نقاطك بنقاط اللاعب الذي يعلوك مباشرة في الترتيب!' },
            { icon: '📉', name: 'الهبوط الاضطراري', desc: 'تخصم نقطتين كاملتين من اللاعب المتصدر لتعيده للخلف!' },
            { icon: '🎲', name: 'بطاقة الرهان', desc: 'تراهن بـ 1 من نقاطك: إما تخسرها أو تضاعفها إلى 3 نقاط مجانية! فرصة 50%!' },
            { icon: '🔍', name: 'الرؤية الثاقبة', desc: 'تحذف خيارين خاطئين من السؤال القادم في مسابقة الأسئلة (تاثير 50:50)' },
            { icon: '🎰', name: 'عجلة الفوضى', desc: 'عجلة الحظ السريعة: إما 3 نقاط مجانية، خسارة نقطة، أو تبادل بطاقة قوتك مع لاعب عشوائي!' },
            { icon: '🌪️', name: 'إعصار الفوضى', desc: 'تخلط وتوزع نقاط جميع اللاعبين عشوائياً فيما بينهم بشكل جنوني!' }
        ];
        const card = powerCards[Math.floor(Math.random() * powerCards.length)];

        this.players.push({ name: name, score: 0, avatar: avatar, powerCard: card, powerCardUsed: false, streak: 0, shieldActive: false, shockActive: false, ready: false });
        this.updatePlayersUI();
        this.playSound('click');
        return this.players.length - 1;
    },

    removePlayer(index) {
        this.players.splice(index, 1);
        this.updatePlayersUI();
        this.playSound('click');
    },

    updatePlayersUI() {
        const listContainer = document.getElementById('players-list');
        const countSpan = document.getElementById('players-count');
        if (listContainer) {
            listContainer.innerHTML = '';
            this.players.forEach((p, idx) => {
                const li = document.createElement('div');
                li.className = 'player-tag-item';
                li.innerHTML = `
                    <span style="font-size: 1.3rem;">${p.avatar}</span>
                    <span class="player-tag-name">${p.name}</span>
                    <span class="power-card-badge" title="${p.powerCard.desc}">${p.powerCard.icon} ${p.powerCard.name}</span>
                    <button class="player-del-btn" onclick="app.removePlayer(${idx})">×</button>
                `;
                listContainer.appendChild(li);
            });
        }
        if (countSpan) {
            countSpan.innerText = this.players.length;
        }
        this.updateSidebarUI();
    },

    updateSidebarUI() {
        const sidebars = document.querySelectorAll('.persistent-sidebar');
        sidebars.forEach(sidebar => {
            if (!sidebar) return;

            // Dynamically adjust sidebar width to fit many players without breaking layout
            if (this.players.length > 5) {
                sidebar.style.width = '680px';
            } else if (this.players.length > 3) {
                sidebar.style.width = '450px';
            } else {
                sidebar.style.width = '350px';
            }

            // Generate Race Track lanes HTML if players exist
            let raceTrackHtml = '';
            if (this.players.length > 0) {
                // Set a fixed target score (e.g. 50 points) to represent 100% of the track.
                // If a player surpasses 50 points, the track scales to the maximum score dynamically.
                const trackTargetScore = Math.max(...this.players.map(p => p.score), 50);
                
                const lanes = this.players.map(p => {
                    // Position percentage: minimum 0%, maximum 82% to leave space for the trophy
                    const percentage = Math.min((p.score / trackTargetScore) * 82, 82);
                    return `
                        <div class="track-lane" title="${p.name}: ${p.score} نقطة">
                            <span class="runner-avatar" style="left: ${percentage}%">${p.avatar}</span>
                            <span class="track-finish-line">🏆</span>
                        </div>
                    `;
                }).join('');

                raceTrackHtml = `
                    <div class="sidebar-race-track">
                        <div class="sidebar-race-track-title">🏃‍♂️ مضمار السباق البصري</div>
                        <div class="track-lane-container">
                            ${lanes}
                        </div>
                    </div>
                `;
            }

            // Find max score among active players to determine leader
            const maxScore = Math.max(...this.players.map(p => p.score), 0);
            
            const listStyle = this.players.length > 5 
                ? 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px;' 
                : 'display: flex; flex-direction: column; gap: 12px;';

            sidebar.innerHTML = `
                <div class="sidebar-header">
                    <h3 style="margin: 0;">👥 لوحة المتسابقين <span style="font-size: 0.9em; opacity: 0.7;">(${this.players.length})</span></h3>
                </div>
                <div class="sidebar-players-list" style="${listStyle}">
                    ${this.players.map((p, idx) => {
                        const isSilenced = (this.silencedPlayerIndex === idx);
                        const isPirating = (this.piratePlayerIndex === idx);
                        const hasStreak = (p.streak >= 3);
                        const isLeader = (p.score === maxScore && p.score > 0);
                        const isShocked = p.shockActive;
                        
                        let statusText = '';
                        if (isSilenced) statusText = ' 🤫 (صامت)';
                        if (isPirating) statusText = ' 🏴‍☠️ (متربص)';
                        if (hasStreak) statusText += ' 🔥 (حماس)';

                        // Determine dynamic title
                        let titleHtml = '';
                        if (hasStreak) {
                            titleHtml = '<span class="sidebar-player-title title-fire">🔥 ناري</span>';
                        } else if (p.shieldActive) {
                            titleHtml = '<span class="sidebar-player-title title-invincible">🛡️ محصن</span>';
                        } else if (isLeader) {
                            titleHtml = '<span class="sidebar-player-title title-king">👑 المتصدر</span>';
                        } else if (p.score === 0) {
                            titleHtml = '<span class="sidebar-player-title title-spectator">🍿 متفرج</span>';
                        }

                        let powerBtnHtml = '';
                        if (isSilenced) {
                            powerBtnHtml = `<span class="power-card-used-sidebar" style="background: var(--color-wrong); color: white;">🤫 صامت</span>`;
                        } else if (!p.powerCardUsed) {
                            powerBtnHtml = `<button class="power-card-btn-sidebar" onclick="event.stopPropagation(); app.usePowerCardFromSidebar(${idx})" title="تفعيل القدرة السرية: ${p.powerCard.desc}">${p.powerCard.icon} تفعيل</button>`;
                        } else {
                            powerBtnHtml = `<span class="power-card-used-sidebar">💨 مستعملة</span>`;
                        }
                        
                        return `
                            <div class="sidebar-player-item ${isSilenced ? 'silenced' : ''} ${hasStreak ? 'hotstreak-active' : ''} ${isLeader ? 'leader-cosmic-aura' : ''} ${isShocked ? 'electro-prank-shock' : ''}" style="position: relative; align-items: flex-start; flex-direction: column; gap: 8px;">
                                ${p.shieldActive ? '<div class="crystal-shield-overlay" title="درع البلور نشط"></div>' : ''}
                                
                                <div style="display: flex; width: 100%; align-items: center; gap: 12px;">
                                    <span class="sidebar-player-avatar">${isSilenced ? '🤫' : p.avatar}</span>
                                    <div class="sidebar-player-info" style="width: 100%;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <div style="display: flex; align-items: center; gap: 5px;">
                                                <span class="sidebar-player-name" style="font-size: 1.25rem; margin: 0; color: #fff;">${p.name}</span>
                                                <span title="حالة الاتصال" style="font-size: 0.9rem; margin-top: 3px;">${p.ready ? '🟢' : '🔴'}</span>
                                            </div>
                                            <div class="sidebar-player-score" style="font-size: 1.3rem; font-weight: 900; color: var(--color-primary); background: rgba(0, 245, 212, 0.15); border: 1px solid rgba(0, 245, 212, 0.3); padding: 2px 10px; border-radius: 10px;">
                                                ${p.score} <span style="font-size: 0.8rem; font-weight: normal; color: #aaa;">نقطة</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style="display: flex; width: 100%; justify-content: space-between; align-items: center; padding-right: 10px;">
                                    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                                        ${titleHtml}
                                        ${statusText ? `<span class="sidebar-player-title" style="background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2);">${statusText}</span>` : ''}
                                        ${(app.currentRoundAnswers && app.currentRoundAnswers[idx] !== undefined) ? '<span class="sidebar-player-title answered-badge" style="background: rgba(34,197,94,0.2); color: #4ade80; border-color: #4ade80;">✓ أرسل إجابته</span>' : ''}
                                    </div>
                                    <div class="sidebar-player-power">
                                        ${powerBtnHtml}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                ${raceTrackHtml}
            `;
        });
    },

    usePowerCardFromSidebar(playerIndex) {
        this.usePowerCard(playerIndex);
    },

    toggleSettingsWidget() {
        const panel = document.getElementById('settings-widget');
        if (!panel) return;
        
        const isClosed = panel.classList.contains('closed');
        if (isClosed) {
            panel.classList.remove('closed');
            this.playSound('click');
            
            // Load current configurations into the inputs
            const keyInput = document.getElementById('widget-gemini-key');
            if (keyInput) {
                keyInput.value = this.settings.geminiApiKey || '';
            }
            this.updateSoundToggleBtnInWidget();
        } else {
            panel.classList.add('closed');
            this.playSound('click');
        }
    },

    updateSoundToggleBtnInWidget() {
        const soundBtn = document.getElementById('widget-sound-toggle-btn');
        if (soundBtn) {
            if (this.settings.soundEnabled) {
                soundBtn.innerHTML = `🔊 المؤثرات الصوتية: مفعّلة`;
                soundBtn.style.background = 'rgba(0, 245, 212, 0.15)';
                soundBtn.style.borderColor = 'var(--color-secondary)';
                soundBtn.style.color = 'var(--color-secondary)';
            } else {
                soundBtn.innerHTML = `🔇 المؤثرات الصوتية: مكتومة`;
                soundBtn.style.background = 'rgba(230, 57, 70, 0.15)';
                soundBtn.style.borderColor = 'var(--color-wrong)';
                soundBtn.style.color = 'var(--color-wrong)';
            }
        }
    },

    toggleSoundFromWidget() {
        this.toggleSound();
        this.updateSoundToggleBtnInWidget();
    },

    saveWidgetSettings() {
        const keyInput = document.getElementById('widget-gemini-key');
        if (keyInput) {
            this.settings.geminiApiKey = keyInput.value.trim();
            localStorage.setItem('family_tv_gemini_api_key', this.settings.geminiApiKey);
            
            // Sync with main setup input if visible
            const mainKeyInput = document.getElementById('api-key-input');
            if (mainKeyInput) mainKeyInput.value = this.settings.geminiApiKey;
        }
        this.playSound('success');
        this.flashAmbient('correct');
        
        // Close settings widget panel smoothly
        this.toggleSettingsWidget();
    },

    showWinnerSelection(callback) {
        // If no players, skip immediately
        if (this.players.length === 0) {
            callback();
            return;
        }

        this.activeWinnerCallback = callback;
        
        const modal = document.getElementById('winner-modal');
        const grid = document.getElementById('winner-players-grid');
        if (!modal || !grid) {
            callback();
            return;
        }

        grid.innerHTML = '';

        // Add player buttons with avatars and power cards
        this.players.forEach((p, idx) => {
            const isSilenced = (this.silencedPlayerIndex === idx);
            const btn = document.createElement('button');
            btn.className = 'btn btn-primary player-score-btn';
            if (isSilenced) {
                btn.classList.add('silenced');
                btn.disabled = true;
                btn.style.opacity = '0.35';
                btn.style.cursor = 'not-allowed';
            }
            
            let powerBtnHtml = '';
            if (isSilenced) {
                powerBtnHtml = `<span class="power-card-used" style="background: var(--danger-color); color: white;">🤫 صامت الجولة</span>`;
            } else if (!p.powerCardUsed) {
                powerBtnHtml = `<span class="power-card-activate" onclick="event.stopPropagation(); app.usePowerCard(${idx})" title="تفعيل القدرة السرية: ${p.powerCard.desc}">${p.powerCard.icon} تفعيل</span>`;
            } else {
                powerBtnHtml = `<span class="power-card-used">💨 مستعملة</span>`;
            }

            btn.innerHTML = `
                <span style="font-size: 2.2rem; margin-bottom: 2px;">${isSilenced ? '🤫' : p.avatar}</span>
                <span class="player-name">${p.name} ${isSilenced ? '(صامت)' : ''}</span>
                <span class="player-score-badge">${p.score} نقطة</span>
                ${powerBtnHtml}
            `;
            if (!isSilenced) {
                btn.onclick = () => {
                    let pts = 1;
                    if (this.isDuelActive) {
                        pts = 2;
                        this.showToast(`⚔️ فاز ${p.name} بالمبارزة الثنائية وحصل على نقطتين مضاعفتين!`, 'success');
                        this.isDuelActive = false;
                    }
                    
                    let actualWinnerIdx = idx;
                    if (this.piratePlayerIndex !== null && this.piratePlayerIndex !== idx) {
                        actualWinnerIdx = this.piratePlayerIndex;
                        const pirate = this.players[this.piratePlayerIndex];
                        pirate.score += pts;
                        this.showToast(`🏴‍☠️ تم قرصنة النقطة! كان الفوز لـ ${p.name} ولكن ${pirate.name} سرق الـ ${pts} نقطة بالكامل بفضل بطاقة القرصنة! 😈`, 'danger');
                    } else {
                        p.score += pts;
                    }
                    
                    // Streak calculation:
                    // Increment the actual winner's streak, and reset all other players' streaks to 0
                    this.players.forEach((player, pIdx) => {
                        if (pIdx === actualWinnerIdx) {
                            player.streak = (player.streak || 0) + 1;
                            
                            // Check if they just hit a hot streak of exactly 3 consecutive wins
                            if (player.streak === 3) {
                                this.flashAmbient('hotstreak');
                                this.showToast(`🔥 حماس ناري! المتسابق ${player.name} في حالة حماس ناري خارقة بعد إحراز 3 انتصارات متتالية!`, 'success');
                            }
                        } else {
                            player.streak = 0;
                        }
                    });
                    
                    this.closeWinnerSelection();
                };
            }
            grid.appendChild(btn);
        });

        // Add "No Winner" button
        const noWinnerBtn = document.createElement('button');
        noWinnerBtn.className = 'btn btn-secondary player-score-btn no-winner';
        noWinnerBtn.innerHTML = `
            <span style="font-size: 2.2rem; margin-bottom: 2px;">❌</span>
            <span>لا يوجد فائز</span>
        `;
        noWinnerBtn.onclick = () => {
            this.isDuelActive = false; // Reset duel if no one won
            // Reset all player streaks on a blank round
            this.players.forEach(player => {
                player.streak = 0;
            });
            this.closeWinnerSelection();
        };
        grid.appendChild(noWinnerBtn);

        modal.classList.remove('hidden');
        this.playSound('success');
    },

    usePowerCard(playerIndex) {
        const player = this.players[playerIndex];
        if (player.powerCardUsed) return;
        player.powerCardUsed = true;
        
        this.playSound('success');
        this.flashAmbient('correct');
        
        const cardType = player.powerCard.icon;
        
        if (cardType === '⚡' || cardType === '🎯') {
            if (window.quizTypeInterval || document.getElementById('quiz-question-counter')) {
                player.quizMultiplier = 2;
                this.showToast(`⚡ سيحصل ${player.name} على ضعف النقاط إذا كانت إجابته صحيحة!`, 'info');
            } else {
                player.score += 2;
                this.showToast(`⚡ قام ${player.name} بتفعيل المضاعفة وحصل على نقطتين إضافيتين! 🔥`, 'success');
            }
        } else if (cardType === '🌪️') {
            const otherPlayers = this.players.map((p, idx) => ({ p, idx })).filter(item => item.idx !== playerIndex);
            if (otherPlayers.length > 0) {
                otherPlayers.sort((a, b) => b.p.score - a.p.score);
                const targetWrapper = otherPlayers[0];
                const topOpponent = targetWrapper.p;
                
                topOpponent.shockActive = true;
                this.updateSidebarUI();
                this.playSound('siren');
                
                if (topOpponent.shieldActive) {
                    topOpponent.shieldActive = false;
                    this.triggerShatterEffect(targetWrapper.idx);
                } else {
                    player.score += 1;
                }
            }
        } else if (cardType === '🛡️') {
            player.shieldActive = true;
            this.showToast(`🛡️ تم تفعيل درع بلوري زجاجي حول ${player.name}! سيقوم بصد الهجمة القادمة بالكامل! 🔮`, 'info');
        } else if (cardType === '🥊') {
            const otherPlayers = this.players.map((p, idx) => ({ p, idx })).filter(item => item.idx !== playerIndex);
            if (otherPlayers.length > 0) {
                otherPlayers.sort((a, b) => b.p.score - a.p.score);
                const leader = otherPlayers[0];
                
                const p1 = player;
                const p2 = leader.p;
                
                document.getElementById('duel-p1-avatar').innerText = p1.avatar;
                document.getElementById('duel-p1-name').innerText = p1.name;
                document.getElementById('duel-p2-avatar').innerText = p2.avatar;
                document.getElementById('duel-p2-name').innerText = p2.name;

                this.playSound('siren');
                this.flashAmbient('warning');
                
                document.getElementById('duel-modal').classList.remove('hidden');
                this.isDuelActive = true;
                
                this.showToast(`🥊 تحدي مبارزة! فرض ${p1.name} مبارزة نارية مباشرة ضد المتصدر ${p2.name}! ⚔️`, 'info');
            } else {
                this.showToast(`🥊 لا يوجد خصوم لمبارزتهم!`, 'danger');
                player.powerCardUsed = false;
            }
        } else if (cardType === '🏴‍☠️') {
            this.piratePlayerIndex = playerIndex;
            this.showToast(`🏴‍☠️ قرصنة! قام ${player.name} بنصب راية القراصنة! النقطة القادمة ستسرق لصالحه! 😈`, 'info');
        } else if (cardType === '⚖️') {
            const myScore = player.score;
            const higherPlayers = this.players.filter(p => p.score > myScore);
            if (higherPlayers.length > 0) {
                higherPlayers.sort((a, b) => a.score - b.score);
                const target = higherPlayers[0];
                player.score = target.score;
                this.showToast(`⚖️ بطاقة العدالة! ارتفعت نقاط ${player.name} لتتساوى مع نقاط ${target.name} وتصبح ${target.score} نقطة!`, 'success');
            } else {
                this.showToast(`⚖️ أنت بالفعل في الصدارة أو متعادل مع المتصدر!`, 'danger');
                player.powerCardUsed = false;
            }
        } else if (cardType === '📉') {
            const otherPlayers = this.players.map((p, idx) => ({ p, idx })).filter(item => item.idx !== playerIndex);
            if (otherPlayers.length > 0) {
                otherPlayers.sort((a, b) => b.p.score - a.p.score);
                const targetWrapper = otherPlayers[0];
                const leader = targetWrapper.p;
                
                // Trigger Prank Electro-Shock Animation
                leader.shockActive = true;
                this.updateSidebarUI();
                this.playSound('siren');
                
                // If leader has shieldActive, shatter it and block the drop!
                if (leader.shieldActive) {
                    leader.shieldActive = false;
                    this.triggerShatterEffect(targetWrapper.idx);
                    this.showToast(`حاول ${player.name} إنزال نقاط ${leader.name}، ولكن درع البلور لـ ${leader.name} تصدى للهجوم وتحطم! 🛡️📉`, 'danger');
                } else if (leader.score >= 2) {
                    leader.score -= 2;
                    this.showToast(`📉 هبوط اضطراري! تم خصم نقطتين من المتصدر ${leader.name}! 😈`, 'success');
                } else if (leader.score === 1) {
                    leader.score -= 1;
                    this.showToast(`📉 هبوط اضطراري! تم خصم نقطة واحدة من المتصدر ${leader.name}! 😈`, 'success');
                } else {
                    this.showToast(`📉 نقاط المتصدر صفر بالفعل!`, 'danger');
                    player.powerCardUsed = false;
                }
            } else {
                this.showToast(`📉 لا يوجد لاعبون آخرون لخصم نقاطهم!`, 'danger');
                player.powerCardUsed = false;
            }
        } else if (cardType === '🎲') {
            const win = Math.random() < 0.5;
            if (win) {
                player.score += 3;
                this.showToast(`🎲 كسبت الرهان! حظك أسطوري وحصلت على 3 نقاط مجانية إضافية! 🎉`, 'success');
            } else {
                if (player.score > 0) {
                    player.score -= 1;
                    this.showToast(`🎲 خسرت الرهان! تم خصم نقطة واحدة من نقاطك. 😢`, 'danger');
                } else {
                    this.showToast(`🎲 خسرت الرهان ولكن ليس لديك نقاط لتخسرها! 😝`, 'info');
                }
            }
        } else if (cardType === '🔍') {
            this.fiftyFiftyActive = true;
            this.showToast(`🔍 الرؤية الثاقبة! سيتم حذف خيارين خاطئين تلقائياً في سؤال المسابقة القادم! 👁️‍🗨️`, 'info');
        } else if (cardType === '🎰') {
            // Interactive Chaos Wheel Spinner
            player.powerCardUsed = true;
            const modal = document.getElementById('chaos-wheel-modal');
            const spinner = document.getElementById('chaos-wheel-spinner');
            const statusMsg = document.getElementById('wheel-status-msg');
            
            if (modal && spinner && statusMsg) {
                // Show chaos wheel modal
                modal.classList.remove('hidden');
                statusMsg.innerText = "تدور العجلة الآن... 🎲";
                this.playSound('siren');

                // Generate a random outcome: 0 = +3 points (Green), 1 = -1 point (Red), 2 = Swap cards (Blue)
                const outcome = Math.floor(Math.random() * 3);
                
                // Spin calculations: Spin at least 5 full rotations (1800deg) + sector rotations.
                // green slice is at 0-120deg, red is 120-240, blue is 240-360.
                // Note: The pointer is at the top (12 o'clock, 0deg). 
                // To align pointer with a slice, we rotate the spinner backwards or align the angles.
                // Let's target the middle of each sector:
                // Green (3 pts): 240 degrees rotation (pointer meets green slice)
                // Red (-1 pt): 120 degrees rotation
                // Blue (Swap): 0 degrees rotation
                let targetAngle = 1800; // base rotations
                if (outcome === 0) targetAngle += 240; 
                if (outcome === 1) targetAngle += 120;
                if (outcome === 2) targetAngle += 0;

                // Reset spinner transform to rotate nicely
                spinner.style.transform = 'rotate(0deg)';
                
                // Force a browser reflow/repaint to apply reset before animation
                void spinner.offsetHeight; 
                
                // Trigger 6-second spinning animation
                spinner.style.transform = `rotate(${targetAngle}deg)`;

                setTimeout(() => {
                    this.playSound('success');
                    if (outcome === 0) {
                        player.score += 3;
                        statusMsg.innerText = `🎉 مبروك! كسب ${player.name} ثلاثة نقاط مجانية!`;
                        this.showToast(`🎰 عجلة الفوضى: حظك ناري! 🔥 كسبت 3 نقاط مجانية إضافية! 🎉`, 'success');
                    } else if (outcome === 1) {
                        if (player.score >= 1) {
                            player.score -= 1;
                        }
                        statusMsg.innerText = `😢 أوبس! خسارة نقطة واحدة من رصيد ${player.name}.`;
                        this.showToast(`🎰 عجلة الفوضى: أوبس! 😢 خسرت نقطة واحدة من رصيدك.`, 'danger');
                    } else {
                        const candidates = this.players.filter((p, idx) => idx !== playerIndex && !p.powerCardUsed);
                        if (candidates.length > 0) {
                            const victim = candidates[Math.floor(Math.random() * candidates.length)];
                            const tempCard = player.powerCard;
                            player.powerCard = victim.powerCard;
                            victim.powerCard = tempCard;
                            player.powerCardUsed = false;
                            victim.powerCardUsed = false;
                            statusMsg.innerText = `😈 مقلب! تم تبادل البطاقات مع ${victim.name}!`;
                            this.showToast(`🎰 عجلة الفوضى: مقلب أسطوري! 😈 قمت بتبادل بطاقتك مع ${victim.name}!`, 'info');
                        } else {
                            player.score += 1;
                            statusMsg.innerText = `🎰 لم يتم العثور على بطاقات لتبادلها، كسب ${player.name} نقطة مجانية!`;
                            this.showToast(`🎰 عجلة الفوضى: لم نجد بطاقات لتبادلها، فحصلت على نقطة مجانية!`, 'success');
                        }
                    }

                    // Auto close modal after 3 seconds of showing outcome
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        const winModal = document.getElementById('winner-modal');
                        if (winModal && !winModal.classList.contains('hidden')) {
                            this.closeWinnerSelection();
                        } else {
                            this.updateSidebarUI();
                        }
                    }, 3000);

                }, 6000); // Wait 6 seconds for spin to finish
            }
        } else if (cardType === '🌪️') {
            player.powerCardUsed = true;
            this.triggerCosmicHurricane();
        }
        
        const winModal = document.getElementById('winner-modal');
        if (winModal && !winModal.classList.contains('hidden') && cardType !== '🎰' && cardType !== '🌪️') {
            this.closeWinnerSelection();
        } else if (cardType !== '🎰' && cardType !== '🌪️') {
            this.updateSidebarUI();
        }
    },

    checkAndTriggerDuel(callback) {
        // Only trigger duel if we have at least 2 players and 12% random chance
        if (this.players.length >= 2 && Math.random() < 0.12) {
            this.duelCallback = callback;
            
            // Choose 2 random distinct players
            const indices = Array.from({ length: this.players.length }, (_, i) => i);
            indices.sort(() => 0.5 - Math.random());
            const p1 = this.players[indices[0]];
            const p2 = this.players[indices[1]];

            document.getElementById('duel-p1-avatar').innerText = p1.avatar;
            document.getElementById('duel-p1-name').innerText = p1.name;
            document.getElementById('duel-p2-avatar').innerText = p2.avatar;
            document.getElementById('duel-p2-name').innerText = p2.name;

            // Trigger siren audio alert and flash warning ambient light
            this.playSound('siren');
            this.flashAmbient('warning');

            // Show duel modal
            document.getElementById('duel-modal').classList.remove('hidden');
        } else {
            callback();
        }
    },

    closeDuelModal() {
        document.getElementById('duel-modal').classList.add('hidden');
        this.playSound('click');
        this.clearAmbient();
        this.isDuelActive = true; // Duel mode flagged for next win
        
        if (this.duelCallback) {
            const cb = this.duelCallback;
            this.duelCallback = null;
            cb();
        }
    },

    closeWinnerSelection() {
        const modal = document.getElementById('winner-modal');
        if (modal) modal.classList.add('hidden');
        this.playSound('click');
        
        // Reset silenced and pirate players after round ends
        this.silencedPlayerIndex = null;
        this.piratePlayerIndex = null;
        this.players.forEach(p => { p.shockActive = false; });
        
        // Clear hotstreak ambient glow when starting a new round/question
        this.clearAmbient();
        this.clearDimSidebar(); // Restore sidebar visibility on next round start

        // Dynamically update the race track and players lists on sidebars
        this.updateSidebarUI();
        
        if (this.activeWinnerCallback) {
            const cb = this.activeWinnerCallback;
            this.activeWinnerCallback = null;
            
            // Check for Sudden Duel before starting next round
            this.checkAndTriggerDuel(() => {
                cb();
            });
        }
    },

    endContest() {
        this.playSound('triumph');
        
        // Hide winner selection modal if open
        const winModal = document.getElementById('winner-modal');
        if (winModal) winModal.classList.add('hidden');

        // Stop game sounds
        if (window.quiz && quiz.timerInterval) clearInterval(quiz.timerInterval);
        if (window.spotDiff && spotDiff.timerInterval) clearInterval(spotDiff.timerInterval);
        if (window.partyGames && partyGames.timerInterval) clearInterval(partyGames.timerInterval);

        // Sort players by score
        const sorted = [...this.players].sort((a, b) => b.score - a.score);
        
        this.showScreen('celebration-screen');

        const winnerNameEl = document.getElementById('grand-winner-name');
        const podiumContainer = document.getElementById('podium-container');

        if (sorted.length === 0) {
            if (winnerNameEl) winnerNameEl.innerText = 'لم يتم تسجيل أي متسابقين!';
            if (podiumContainer) podiumContainer.innerHTML = '';
            return;
        }

        const winner = sorted[0];
        if (winnerNameEl) {
            winnerNameEl.innerText = `${winner.name} هو بطل التحدي الكبير! 🏆 (${winner.score} نقطة)`;
        }

        // Draw CSS podium with avatars
        if (podiumContainer) {
            podiumContainer.innerHTML = '';
            
            // First place
            const p1 = document.createElement('div');
            p1.className = 'podium-place first';
            p1.innerHTML = `
                <div class="podium-avatar">${winner.avatar}</div>
                <div class="podium-block">1</div>
                <div class="podium-name">${winner.name}</div>
                <div class="podium-score">${winner.score} نقطة</div>
            `;
            
            // Second place
            let p2 = null;
            if (sorted.length > 1) {
                p2 = document.createElement('div');
                p2.className = 'podium-place second';
                p2.innerHTML = `
                    <div class="podium-avatar">${sorted[1].avatar}</div>
                    <div class="podium-block">2</div>
                    <div class="podium-name">${sorted[1].name}</div>
                    <div class="podium-score">${sorted[1].score} نقطة</div>
                `;
            }

            // Third place
            let p3 = null;
            if (sorted.length > 2) {
                p3 = document.createElement('div');
                p3.className = 'podium-place third';
                p3.innerHTML = `
                    <div class="podium-avatar">${sorted[2].avatar}</div>
                    <div class="podium-block">3</div>
                    <div class="podium-name">${sorted[2].name}</div>
                    <div class="podium-score">${sorted[2].score} نقطة</div>
                `;
            }

            // Append in correct visual order (2nd, 1st, 3rd)
            if (p2) podiumContainer.appendChild(p2);
            podiumContainer.appendChild(p1);
            if (p3) podiumContainer.appendChild(p3);
        }

        // Start falling confetti animation
        this.startConfetti();

        // Announce the grand winner with a dramatic Arabic voice
        this.announceGrandWinner(winner.name, winner.score);
    },

    announceGrandWinner(name, score) {
        // Disabling Voice Commentary as requested
    },

    speakArabicAlert(text) {
        // Disabling Voice Commentary as requested
    },

    startConfetti() {
        const container = document.getElementById('confetti-container');
        if (!container) return;
        container.innerHTML = '';

        if (this.confettiInterval) clearInterval(this.confettiInterval);

        // Premium gold, silver, metallic copper, and vibrant colors
        const colors = ['#ffd700', '#f0f0f0', '#cd7f32', '#ff007f', '#00f5d4', '#ffbe0b', '#3a86c8'];
        const shapes = ['rectangle', 'circle', 'triangle', 'star'];

        this.confettiInterval = setInterval(() => {
            const confetti = document.createElement('div');
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            confetti.className = `confetti-piece ${shape}`;
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            const size = Math.random() * 10 + 8;
            confetti.style.width = size + 'px';
            confetti.style.height = (shape === 'rectangle' ? size * 1.6 : size) + 'px';
            
            confetti.style.animationDuration = Math.random() * 3 + 2.5 + 's';
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            // Random horizontal drift
            confetti.style.setProperty('--drift', (Math.random() * 100 - 50) + 'px');
            
            container.appendChild(confetti);

            // Remove after animation completes
            setTimeout(() => confetti.remove(), 5500);
        }, 80);
    },

    stopConfetti() {
        if (this.confettiInterval) {
            clearInterval(this.confettiInterval);
            this.confettiInterval = null;
        }
        const container = document.getElementById('confetti-container');
        if (container) container.innerHTML = '';
    },

    resetScores() {
        this.players.forEach(p => {
            p.score = 0;
            p.powerCardUsed = false;
            p.streak = 0;
            p.shieldActive = false;
            p.shockActive = false;
        });
        this.updatePlayersUI();
        this.playSound('click');
        this.stopConfetti();
        this.clearAmbient();
    },

    // Ambient Lighting Sync Box
    flashAmbient(type) {
        const glowBg = document.querySelector('.glow-bg');
        if (!glowBg) return;
        
        // Clear previous states
        glowBg.classList.remove('correct-flash', 'wrong-flash', 'warning-pulse', 'hotstreak-pulse');
        
        if (type === 'correct') {
            glowBg.classList.add('correct-flash');
            setTimeout(() => glowBg.classList.remove('correct-flash'), 2000);
        } else if (type === 'wrong') {
            glowBg.classList.add('wrong-flash');
            setTimeout(() => glowBg.classList.remove('wrong-flash'), 2000);
        } else if (type === 'warning') {
            // Pulsate warning state
            glowBg.classList.add('warning-pulse');
        } else if (type === 'hotstreak') {
            // Hot streak ambient light remains until a round ends or resets
            glowBg.classList.add('hotstreak-pulse');
        }
    },
    
    clearAmbient() {
        const glowBg = document.querySelector('.glow-bg');
        if (glowBg) {
            glowBg.classList.remove('correct-flash', 'wrong-flash', 'warning-pulse', 'hotstreak-pulse');
        }
    },

    triggerShatterEffect(playerIndex) {
        // Find all player items on the visible sidebars corresponding to playerIndex
        const sidebars = document.querySelectorAll('.persistent-sidebar');
        sidebars.forEach(sidebar => {
            const playerItems = sidebar.querySelectorAll('.sidebar-player-item');
            const targetItem = playerItems[playerIndex];
            if (!targetItem) return;

            const rect = targetItem.getBoundingClientRect();
            
            // Spawn 20 glass shard particles
            for (let i = 0; i < 20; i++) {
                const shard = document.createElement('div');
                shard.className = 'glass-shard';
                
                // Position relative to the window/viewport
                const startX = rect.left + rect.width / 2;
                const startY = rect.top + rect.height / 2;
                shard.style.left = startX + 'px';
                shard.style.top = startY + 'px';
                
                // Random flight coordinates
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 120 + 40;
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance;
                const rotation = Math.random() * 720 - 360;
                
                shard.style.setProperty('--dx', `${dx}px`);
                shard.style.setProperty('--dy', `${dy}px`);
                shard.style.setProperty('--rot', `${rotation}deg`);
                
                document.body.appendChild(shard);
                
                // Remove after animation completes
                setTimeout(() => shard.remove(), 800);
            }
        });
        this.playSound('wrong'); // Dramatic break sound
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-item ${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '🎉';
        if (type === 'danger') icon = '⚠️';

        toast.innerHTML = `
            <span style="font-size: 1.4rem;">${icon}</span>
            <div style="flex: 1;">${message}</div>
        `;
        
        container.appendChild(toast);
        // Slide out and remove toast after 3.8s
        setTimeout(() => {
            toast.classList.add('toast-leave');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    focusDimSidebar(dim = true) {
        // Disabled per user request to keep players progress clearly visible
    },

    clearDimSidebar() {
        // Disabled
    },

    triggerCosmicHurricane() {
        const overlay = document.getElementById('hurricane-overlay');
        const appContainer = document.getElementById('app-container');
        if (overlay) {
            overlay.classList.remove('hidden');
            this.playSound('siren');
            if (appContainer) appContainer.classList.add('screen-hurricane-shake');
            
            // Perform score shuffling after 3s
            setTimeout(() => {
                if (this.players.length > 1) {
                    const scores = this.players.map(p => p.score);
                    // Fisher-Yates shuffle
                    for (let i = scores.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [scores[i], scores[j]] = [scores[j], scores[i]];
                    }
                    // Assign back
                    this.players.forEach((p, idx) => {
                        p.score = scores[idx];
                    });
                    
                    this.showToast("🌪️ ضرب الإعصار الكوني وتوزعت النقاط عشوائياً بين الجميع!", 'info');
                } else {
                    this.showToast("🌪️ ضرب الإعصار الكوني ولكن لا يوجد لاعبين كافيين للخلط!", 'danger');
                }
                
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    if (appContainer) appContainer.classList.remove('screen-hurricane-shake');
                    
                    const winModal = document.getElementById('winner-modal');
                    if (winModal && !winModal.classList.contains('hidden')) {
                        this.closeWinnerSelection();
                    } else {
                        this.updateSidebarUI();
                    }
                }, 1500);
            }, 3000);
        }
    },

    currentRoundAnswers: {},
    currentCorrectAnswerIndex: null,

    broadcast(msg) {
        // Send via HTTP to server which queues it for all mobile clients
        if (!this.currentRoomId) return;
        fetch('/api/room/broadcast', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ roomId: this.currentRoomId, event: msg })
        }).catch(()=>{});
    },


    startMobileController() {
        const appContainer = document.getElementById('app-container');
        if (appContainer) appContainer.style.display = 'none';
        
        const mobileScreen = document.getElementById('mobile-controller-screen');
        if (mobileScreen) mobileScreen.classList.remove('hidden');
        
        this.myPlayerIndex = null;
        this.myPowerCardUsed = false;

        if (typeof Peer === 'undefined') {
            alert('خطأ: مكتبة الاتصال اللاسلكي (PeerJS) غير متوفرة حالياً. تأكد من اتصالك بالإنترنت.');
            return;
        }
        this.peer = new Peer();
        this.peer.on('open', (id) => {
            const conn = this.peer.connect(this.roomToJoin);
            this.mobileConn = conn;
            
            conn.on('open', () => {
                // Connection established, wait for name input registration
            });
            
            conn.on('data', (data) => {
                if (data.type === 'register-ack') {
                    if (data.success) {
                        this.myPlayerIndex = data.playerIndex;
                        
                        // Hide registration, show controller panels
                        document.getElementById('mobile-register-view').classList.add('hidden');
                        document.getElementById('mobile-power-panel').classList.remove('hidden');
                        document.getElementById('mobile-buzzer-view').classList.remove('hidden');
                        
                        // Populate player info
                        document.getElementById('mobile-avatar').innerText = data.avatar;
                        document.getElementById('mobile-player-name').innerText = data.name;
                        
                        // Populate power card
                        document.getElementById('mobile-power-icon').innerText = data.powerCard.icon;
                        document.getElementById('mobile-power-name').innerText = data.powerCard.name;
                        document.getElementById('mobile-power-desc').innerText = data.powerCard.desc;
                    } else {
                        alert('فشل التسجيل: ' + (data.message || 'الاسم مستخدم بالفعل!'));
                    }
                } else if (data.type === 'question-start') {
                    // Switch to Kahoot Mode on mobile
                    document.getElementById('mobile-buzzer-view').classList.add('hidden');
                    document.getElementById('mobile-result-view').classList.add('hidden');
                    document.getElementById('mobile-question-view').classList.remove('hidden');
                    document.getElementById('mobile-question-status').innerText = "اختر إجابتك بحذر! ⏱️";
                    
                    // Enable option buttons
                    const buttons = document.querySelectorAll('.mobile-opt-btn');
                    buttons.forEach(btn => {
                        btn.disabled = false;
                        btn.style.opacity = '1';
                    });
                    
                    // Show option texts on the buttons
                    data.options.forEach((opt, idx) => {
                        const btn = document.querySelector(`.mobile-opt-btn.opt-${idx}`);
                        if (btn) {
                            const label = btn.querySelector('.opt-label');
                            const char = String.fromCharCode(65 + idx); // A, B, C, D
                            label.innerText = `${char}: ${opt}`;
                        }
                    });
                } else if (data.type === 'question-result') {
                    // Show result on mobile
                    document.getElementById('mobile-question-view').classList.add('hidden');
                    const resultView = document.getElementById('mobile-result-view');
                    const resultCard = document.getElementById('mobile-result-card');
                    const resultIcon = document.getElementById('mobile-result-icon');
                    const resultTitle = document.getElementById('mobile-result-title');
                    const resultDesc = document.getElementById('mobile-result-desc');
                    
                    resultView.classList.remove('hidden');
                    
                    if (data.isCorrect) {
                        resultCard.className = "result-card success-state";
                        resultIcon.innerText = "🎉";
                        resultTitle.innerText = "إجابة صحيحة!";
                        resultDesc.innerText = "رائع! لقد حصلت على نقاط هذه الجولة!";
                    } else {
                        resultCard.className = "result-card fail-state";
                        resultIcon.innerText = "😢";
                        resultTitle.innerText = "إجابة خاطئة!";
                        const correctLetter = String.fromCharCode(65 + data.correctIndex);
                        resultDesc.innerText = `الخيار الصحيح كان: (${correctLetter})`;
                    }
                } else if (data.type === 'show-buzzer') {
                    // Switch back to Buzzer Mode
                    document.getElementById('mobile-question-view').classList.add('hidden');
                    document.getElementById('mobile-result-view').classList.add('hidden');
                    document.getElementById('mobile-buzzer-view').classList.remove('hidden');
                }
            });
            
            conn.on('close', () => {
                alert('تم قطع الاتصال مع التلفزيون الرئيسي!');
                window.location.reload();
            });
        });
        
        this.peer.on('error', (err) => {
            console.error('PeerJS error:', err);
            alert('حدث خطأ أثناء الاتصال بغرفة التلفزيون.');
        });
    },

    registerPlayerFromMobile() {
        const nameInput = document.getElementById('mobile-reg-name-input');
        const name = nameInput.value.trim();
        if (!name) {
            alert('الرجاء كتابة اسمك أولاً للانضمام!');
            return;
        }
        if (this.mobileConn) {
            this.mobileConn.send({
                type: 'register-player',
                name: name
            });
        }
    },

    activatePowerFromMobile() {
        if (this.myPlayerIndex !== null && !this.myPowerCardUsed) {
            if (this.mobileConn) {
                this.mobileConn.send({
                    type: 'use-power-card',
                    playerIndex: this.myPlayerIndex
                });
                
                // Disable button locally
                this.myPowerCardUsed = true;
                const btn = document.getElementById('mobile-use-power-btn');
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = `💨 تم الاستعمال`;
                }
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]);
                }
            }
        }
    },

    submitMobileAnswer(optionIndex) {
        if (this.mobileConn && this.myPlayerIndex !== null) {
            this.mobileConn.send({
                type: 'submit-answer',
                playerIndex: this.myPlayerIndex,
                answerIndex: optionIndex
            });
            
            const buttons = document.querySelectorAll('.mobile-opt-btn');
            buttons.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            });
            
            document.getElementById('mobile-question-status').innerText = "تم إرسال إجابتك! انتظر كشف النتائج... ⏱️";
            
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
        }
    },

    sendMobileBuzz() {
        if (this.mobileConn && this.myPlayerIndex !== null) {
            this.mobileConn.send({
                type: 'buzz',
                playerIndex: this.myPlayerIndex
            });
            
            const btn = document.getElementById('mobile-buzzer-btn');
            if (btn) {
                btn.style.transform = 'scale(0.9)';
                setTimeout(() => btn.style.transform = 'scale(1)', 100);
            }
            if (navigator.vibrate) {
                navigator.vibrate(200);
            }
        }
    },

    async startTvHost() {
        // ── Generate Room ID ──
        const roomId = 'fam-' + Math.floor(100000 + Math.random() * 900000);
        this.currentRoomId = roomId;

        // ── Make the URL dynamic for any network/cloud hosting ──
        const joinUrl = `${window.location.origin}/mobile.html?join=${roomId}`;
        const serverHost = window.location.host;

        console.log('📱 Join URL:', joinUrl);

        // ── Show QR immediately ──
        this._renderQR('setup-qr-container',    joinUrl, serverHost);
        this._renderQR('settings-qr-container', joinUrl, serverHost);

        const rcd = document.getElementById('settings-room-code');
        if (rcd) rcd.innerText = `ROOM: ${roomId.substring(4).toUpperCase()}`;

        // ── Register room with server ──
        try {
            await fetch(`/api/room/create?room=${encodeURIComponent(roomId)}`, {
                signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
            });
        } catch(e) { console.warn('Room register failed:', e); }

        // ── Start polling ──
        if (this._tvPollTimer) clearInterval(this._tvPollTimer);
        this._tvPollTimer = setInterval(() => this._tvPoll(), 1000);
        console.log('✅ Room ready:', roomId, '| URL:', joinUrl);
    },



    _renderQR(containerId, joinUrl, serverHost) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const wrapperId = containerId + '-qr';
        container.innerHTML = `
            <div style="text-align:center; padding:4px;">
                <div id="${wrapperId}" style="display:inline-block; border-radius:8px; overflow:hidden; border:3px solid #fff; background:#fff;"></div>
                <div style="color:rgba(0,0,0,.7); font-size:.62rem; margin-top:6px; font-weight:700;">${serverHost}</div>
            </div>`;

        const el = document.getElementById(wrapperId);
        if (!el) return;

        if (typeof QRCode !== 'undefined') {
            try {
                new QRCode(el, {
                    text: joinUrl, width: 150, height: 150,
                    colorDark: '#000', colorLight: '#fff',
                    correctLevel: QRCode.CorrectLevel.M
                });
                return;
            } catch(e) { console.warn('QRCode error:', e); }
        }

        // Fallback: show the URL clearly
        container.innerHTML = `
            <div style="background:#fff;padding:12px;border-radius:10px;color:#222;font-size:.62rem;word-break:break-all;max-width:180px;text-align:center;line-height:1.5;">
                <div style="font-size:1.8rem;margin-bottom:4px;">📱</div>
                <b>اكتب هذا الرابط في جوالك:</b><br>
                <code style="background:#f0f0f0;padding:2px 4px;border-radius:4px;font-size:.7rem;word-break:break-all;">${joinUrl}</code>
            </div>`;
    },


    async _tvPoll() {
        if (!this.currentRoomId) return;
        try {
            const r = await fetch(`/api/room/tv-poll?room=${encodeURIComponent(this.currentRoomId)}`, {signal: AbortSignal.timeout(4000)});
            if (!r.ok) return;
            const data = await r.json();
            (data.events || []).forEach(msg => {
                if (msg.type === 'player-joined') {
                    const idx = this.addPlayer(msg.name);
                    if (idx !== -1) {
                        this.players[idx].avatar    = msg.avatar;
                        this.players[idx].powerCard = msg.powerCard;
                    }
                    this.showToast(`📱 ${msg.avatar} ${msg.name} انضم! (${msg.totalPlayers} لاعبين)`, 'success');
                    this.updateSidebarUI();
                }
                else if (msg.type === 'player-ready') {
                    const rIdx = this.players.findIndex(p => p.name === msg.name);
                    if (rIdx !== -1) { this.players[rIdx].ready = true; this.updateSidebarUI(); }
                    this.showToast(`✅ ${msg.name} مستعد!`, 'success');
                }
                else if (msg.type === 'player-used-power') {
                    const pi = this.players.findIndex(p => p.name === msg.name);
                    if (pi !== -1) { this.showToast(`⚡ ${msg.name} فعّل بطاقة ${msg.powerCard.name}!`,'info'); this.usePowerCard(pi); }
                }
                else if (msg.type === 'player-answer') {
                    const pi = this.players.findIndex(p => p.name === msg.name);
                    if (pi !== -1) {
                        this.currentRoundAnswers[pi] = msg.answerIndex;
                        this.playSound('click');
                        this.updateSidebarUI();
                        if (Object.keys(this.currentRoundAnswers).length >= this.players.length && this.players.length > 0)
                            this.showToast('🔔 أجاب جميع اللاعبين!','info');
                    }
                }
                else if (msg.type === 'player-left') {
                    this.showToast(`👋 ${msg.name} غادر اللعبة`,'info');
                }
            });
        } catch(e) {}
    },


    handleBuzzerPress(playerIndex) {
        const player = this.players[playerIndex];
        if (!player) return;
        
        const toast = document.getElementById('tv-buzzer-toast');
        const nameSpan = document.getElementById('tv-buzzer-name');
        if (toast && nameSpan) {
            nameSpan.innerText = `${player.avatar} ${player.name}`;
            toast.classList.remove('hidden');
            this.playSound('siren');
            
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 2500);
        }
        
        this.showToast(`🚨 ضغط ${player.name} على الـ Buzzer أولاً!`, 'info');
        
        this.updateSidebarUI();
        setTimeout(() => {
            const playerItems = document.querySelectorAll('.sidebar-player-item');
            if (playerItems[playerIndex]) {
                playerItems[playerIndex].classList.add('screen-hurricane-shake');
                setTimeout(() => playerItems[playerIndex].classList.remove('screen-hurricane-shake'), 1000);
            }
        }, 100);
    }
};

// Initialize App on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
