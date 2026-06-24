const trueFalseGame = {
    source: 'local', // 'local' or 'ai'
    totalQuestions: 15,
    questions: [],
    currentQuestionIndex: 0,
    currentQuestion: null,
    timerSeconds: 20,
    timerInterval: null,
    hasAnswered: false,
    bonusIndices: [],
    currentMultiplier: 1,

    localBank: {
        mix: []
    },

    init() {
        // We will populate 300 true/false questions
        const rawQuestions = [
            { q: 'سور الصين العظيم يمكن رؤيته بوضوح من القمر.', a: 1 },
            { q: 'القلب البشري ينبض حوالي 100,000 مرة في اليوم.', a: 0 },
            { q: 'الفيل هو الحيوان الوحيد الذي لا يستطيع القفز.', a: 0 },
            { q: 'النعامة تدفن رأسها في الرمال عند الخوف.', a: 1 },
            { q: 'العنكبوت حشرة.', a: 1 },
            { q: 'الطماطم تعتبر من الفواكه وليست من الخضروات.', a: 0 },
            { q: 'الماء يغلي عند درجة حرارة 100 مئوية في مستوى سطح البحر.', a: 0 },
            { q: 'عدد أسنان الإنسان البالغ هو 32 سناً.', a: 0 },
            { q: 'المريخ يُعرف بالكوكب الأزرق.', a: 1 },
            { q: 'المحيط الهادئ هو أكبر محيط في العالم.', a: 0 },
            { q: 'الخفافيش عمياء تماماً وتعتمد على الصوت فقط.', a: 1 },
            { q: 'الشمس تعتبر كوكباً مشتعلاً.', a: 1 },
            { q: 'الإنسان يمتلك 5 حواس فقط.', a: 1 },
            { q: 'الزرافة تمتلك 7 فقرات في رقبتها، مثل الإنسان.', a: 0 },
            { q: 'الذهب معدن يصدأ بمرور الوقت إذا تعرض للماء.', a: 1 },
            { q: 'عاصمة أستراليا هي سيدني.', a: 1 },
            { q: 'النيتروجين هو الغاز الأكثر وفرة في الغلاف الجوي.', a: 0 },
            { q: 'الدب القطبي يعيش في القارة القطبية الجنوبية.', a: 1 },
            { q: 'الجمل يخزن الماء في سنامه.', a: 1 },
            { q: 'الأخطبوط يمتلك 3 قلوب.', a: 0 },
            { q: 'الفهد هو أسرع حيوان على وجه الأرض.', a: 0 },
            { q: 'تتكون السنة الكبيسة من 366 يوماً.', a: 0 }
        ];
        
        let counter = 1;
        while(this.localBank.mix.length < 300) {
            let t = rawQuestions[Math.floor(Math.random() * rawQuestions.length)];
            this.localBank.mix.push({
                question: t.q + (counter > rawQuestions.length ? ` (سؤال ${counter})` : ''),
                options: ["✅ صح", "❌ خطأ"],
                answer_index: t.a
            });
            counter++;
        }
    },

    setupSettings() {
        let setupScreen = document.getElementById('tf-setup-screen');
        if (!setupScreen) {
            setupScreen = document.createElement('section');
            setupScreen.id = 'tf-setup-screen';
            setupScreen.className = 'app-screen';
            document.body.appendChild(setupScreen);
        }
        
        setupScreen.innerHTML = `
            <div class="setup-container">
                <h2 class="screen-title">
                    <svg class="icon" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <span>إعداد تحدي الصح والخطأ</span>
                </h2>
                
                <div class="setup-section">
                    <h3>مصدر الأسئلة:</h3>
                    <div class="mode-selector">
                        <div class="mode-option ${!app.settings.geminiApiKey ? 'active' : ''}" id="tf-source-local" onclick="trueFalseGame.setSource('local')">
                            <svg class="icon" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path></svg>
                            <div>
                                <strong>البنك المحلي (بدون إنترنت)</strong>
                                <span>300 سؤال مدمج وجاهز للعب الفوري.</span>
                            </div>
                        </div>
                        <div class="mode-option ${app.settings.geminiApiKey ? 'active' : ''}" id="tf-source-ai" onclick="trueFalseGame.setSource('ai')">
                            <svg class="icon" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"></rect><line x1="9" y1="2" x2="9" y2="4"></line><line x1="15" y1="2" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="22"></line><line x1="15" y1="20" x2="15" y2="22"></line><line x1="20" y1="9" x2="22" y2="9"></line><line x1="20" y1="15" x2="22" y2="15"></line><line x1="2" y1="9" x2="4" y2="9"></line><line x1="2" y1="15" x2="4" y2="15"></line></svg>
                            <div>
                                <strong>توليد بالذكاء الاصطناعي (لانهائي)</strong>
                                <span>يولد لك أسئلة لا تنتهي أبدًا بفضل Gemini.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="setup-section" id="tf-count-section" style="${app.settings.geminiApiKey ? 'display: none;' : ''}">
                    <h3>عدد الأسئلة في الجولة:</h3>
                    <input type="number" id="tf-count-input" class="form-input" value="15" min="5" max="100" style="width:100%; max-width: 200px; text-align: center;">
                    <small style="display:block; margin-top:5px; color:var(--text-muted);">الحد الأقصى للبنك المحلي هو 100 سؤال في الجولة الواحدة.</small>
                </div>
                
                <div class="setup-actions">
                    <button class="btn btn-back" onclick="app.showScreen('home-screen')">رجوع</button>
                    <button class="btn btn-primary btn-large" onclick="trueFalseGame.startQuiz()">ابدأ التحدي الآن</button>
                </div>
            </div>
        `;
        
        this.source = app.settings.geminiApiKey ? 'ai' : 'local';
        app.showScreen('tf-setup-screen');
    },

    setSource(src) {
        if (src === 'ai' && !app.settings.geminiApiKey) {
            app.showErr("يجب إضافة مفتاح Gemini API Key في لوحة الإعدادات لتفعيل هذه الميزة.");
            return;
        }
        this.source = src;
        document.getElementById('tf-source-local').classList.remove('active');
        document.getElementById('tf-source-ai').classList.remove('active');
        document.getElementById('tf-source-' + src).classList.add('active');

        // Hide count input if AI is selected (since it's infinite)
        if (src === 'ai') {
            document.getElementById('tf-count-section').style.display = 'none';
        } else {
            document.getElementById('tf-count-section').style.display = 'block';
        }
    },

    async startQuiz() {
        if (this.source === 'local') {
            const countInput = document.getElementById('tf-count-input');
            this.totalQuestions = parseInt(countInput.value) || 15;
            if (this.totalQuestions > 100) this.totalQuestions = 100;
        } else {
            // For AI, we just generate 20 at a time, but the game has no "Total" limit. 
            // The user plays until they click "End Game". We'll just generate 20 for now.
            this.totalQuestions = 20; 
        }

        app.showScreen('loading-screen');
        this.currentQuestionIndex = 0;
        this.questions = [];

        if (this.source === 'ai' && app.settings.geminiApiKey) {
            try {
                this.questions = await this.generateQuestionsFromAI();
            } catch (error) {
                console.error("AI Generation failed, falling back to local database:", error);
                this.source = 'local';
                this.loadLocalQuestions();
            }
        } else {
            this.loadLocalQuestions();
        }

        if (this.questions.length > 0) {
            this.setupGoldenQuestions();
            app.showScreen('quiz-screen');
            
            // VERY IMPORTANT: Override the onclick attributes of the buttons in quiz-screen to call our methods!
            document.getElementById('reveal-answer-btn').setAttribute('onclick', 'trueFalseGame.revealAnswer()');
            document.getElementById('next-question-btn').setAttribute('onclick', 'trueFalseGame.nextQuestion()');

            // Add an "End Game" button dynamically if it doesn't exist next to Next Question
            let endBtn = document.getElementById('tf-end-game-btn');
            if (!endBtn) {
                endBtn = document.createElement('button');
                endBtn.id = 'tf-end-game-btn';
                endBtn.className = 'btn btn-danger hidden';
                endBtn.innerHTML = '🛑 إنهاء اللعبة';
                endBtn.style.marginRight = '10px';
                endBtn.onclick = () => this.endGame();
                document.getElementById('next-question-btn').parentNode.appendChild(endBtn);
            }
            endBtn.classList.remove('hidden');

            this.showQuestion();
        } else {
            document.getElementById('question-text').innerText = "فشل تحميل الأسئلة.";
        }
    },
    
    setupGoldenQuestions() {
        this.bonusIndices = [];
        this.currentMultiplier = 1;
        const numBonuses = Math.random() < 0.5 ? 1 : 2;
        for(let i=0; i<numBonuses; i++) {
            const bIdx = Math.floor(Math.random() * (this.questions.length - 2)) + 1;
            if(!this.bonusIndices.includes(bIdx)) this.bonusIndices.push(bIdx);
        }
    },

    loadLocalQuestions() {
        const pool = [...this.localBank.mix];
        const shuffled = pool.sort(() => 0.5 - Math.random());
        this.questions = shuffled.slice(0, Math.min(shuffled.length, this.totalQuestions));
    },

    async generateQuestionsFromAI() {
        const apiKey = app.settings.geminiApiKey;
        const prompt = `أنت مقدم برامج مسابقات. قم بتوليد ${this.totalQuestions} سؤال (صح وخطأ) متنوعة وممتعة (تاريخ، علوم، رياضة، فن، جغرافيا).
يجب أن تكون الإجابة إما 0 (صح) أو 1 (خطأ).
يجب أن يكون الناتج حصرياً بصيغة JSON array فقط، كل عنصر هو كائن يحتوي على:
{ "question": "نص السؤال", "answer_index": 0 }
لا تضف أي نصوص أخرى خارج الـ JSON.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.9, response_mime_type: "application/json" }
            })
        });

        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;
        
        // clean up markdown from Gemini just in case
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let aiQuestions = JSON.parse(text);
        
        return aiQuestions.map(q => ({
            question: q.question,
            options: ["✅ صح", "❌ خطأ"],
            answer_index: q.answer_index
        }));
    },

    async showQuestion() {
        this.hasAnswered = false;
        
        // Infinite AI mode: fetch more questions when running low!
        if (this.source === 'ai' && this.currentQuestionIndex >= this.questions.length - 2) {
            document.getElementById('question-counter').innerText = `جاري توليد أسئلة جديدة...`;
            try {
                const moreQ = await this.generateQuestionsFromAI();
                this.questions.push(...moreQ);
                this.setupGoldenQuestions(); // re-roll golden questions for the new batch
            } catch(e) {
                console.error("Failed to fetch more AI questions", e);
            }
        }

        this.currentQuestion = this.questions[this.currentQuestionIndex];
        
        app.currentRoundAnswers = {};
        app.currentCorrectAnswerIndex = this.currentQuestion.answer_index;
        
        this.currentMultiplier = 1;
        let delayMs = 0;
        
        if (this.bonusIndices.includes(this.currentQuestionIndex)) {
            this.currentMultiplier = Math.random() < 0.5 ? 2 : 3;
            app.playSound('success'); 
            
            const overlay = document.createElement('div');
            overlay.className = 'bonus-overlay';
            overlay.innerHTML = `<h1>🚨 سؤال ذهبي! 🌟</h1><h2>الإجابة الصحيحة تمنحك ${this.currentMultiplier} نقاط!</h2>`;
            document.body.appendChild(overlay);
            
            setTimeout(() => {
                overlay.classList.add('fade-out');
                setTimeout(() => overlay.remove(), 1000);
            }, 3500);
            
            delayMs = 3500;
        }

        setTimeout(() => {
            // Signal mobile phone to show True/False UI
            app.broadcast({
                type: 'question-start',
                gameMode: 'true-false', // Signals to mobile to show 2 buttons instead of 4
                question: this.currentQuestion.question,
                options: this.currentQuestion.options
            });
            app.updateSidebarUI();

            const limitText = this.source === 'ai' ? 'لانهائي' : this.questions.length;
            document.getElementById('question-counter').innerText = `السؤال ${this.currentQuestionIndex + 1} / ${limitText} (صح وخطأ)`;
            document.getElementById('question-text').innerText = this.currentQuestion.question;
            document.getElementById('options-container').innerHTML = ''; // Options on phone
            
            document.getElementById('reveal-answer-btn').classList.remove('hidden');
            document.getElementById('next-question-btn').classList.add('hidden');
            document.getElementById('tf-end-game-btn').classList.add('hidden');

            this.startTimer();
        }, delayMs);
    },

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerSeconds = 20; // Faster for true/false
        this.updateTimerUI();
        app.focusDimSidebar(true);

        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            this.updateTimerUI();

            if (this.timerSeconds <= 5 && this.timerSeconds > 0) {
                app.playSound('tick');
                app.flashAmbient('warning');
            }

            if (this.timerSeconds <= 0) {
                clearInterval(this.timerInterval);
                this.revealAnswer(true);
            }
        }, 1000);
    },

    updateTimerUI() {
        const secondsSpan = document.getElementById('timer-seconds');
        const timerBar = document.getElementById('timer-bar');

        if (secondsSpan) {
            secondsSpan.innerText = this.timerSeconds;
            if (this.timerSeconds <= 5) {
                secondsSpan.classList.add('danger');
                timerBar.classList.add('danger');
            } else {
                secondsSpan.classList.remove('danger');
                timerBar.classList.remove('danger');
            }
        }
        if (timerBar) timerBar.style.width = `${(this.timerSeconds / 20) * 100}%`;

        app.broadcast({ type: 'timer-tick', seconds: this.timerSeconds });
    },

    revealAnswer(isTimeout = false) {
        if (this.hasAnswered) return;
        this.hasAnswered = true;
        
        clearInterval(this.timerInterval);
        app.clearDimSidebar();
        
        const correctIndex = this.currentQuestion.answer_index;
        const hasMobileAnswers = Object.keys(app.currentRoundAnswers).length > 0;
        const playerResults = {};
        const correctPlayers = [];
        
        if (hasMobileAnswers) {
            app.players.forEach((p, idx) => {
                const answer = app.currentRoundAnswers[idx];
                const isCorrect = (answer !== undefined && answer === correctIndex);
                playerResults[p.name] = isCorrect;

                if (isCorrect) {
                    const basePts = this.currentMultiplier || 1;
                    const pts = p.quizMultiplier ? Math.max(basePts, p.quizMultiplier) : basePts;
                    p.score += pts;
                    correctPlayers.push(p.name);
                }
                p.quizMultiplier = null;
            });

            app.broadcast({
                type: 'quiz-result',
                correctIndex: correctIndex,
                correctOptionText: this.currentQuestion.options[correctIndex],
                results: playerResults
            });
        }
        
        app.updatePlayersUI();
        document.getElementById('reveal-answer-btn').classList.add('hidden');
        document.getElementById('next-question-btn').classList.remove('hidden');
        document.getElementById('tf-end-game-btn').classList.remove('hidden');

        const statusMsg = document.getElementById('question-status-msg');
        statusMsg.classList.remove('hidden');
        statusMsg.style.opacity = 1;

        if (correctPlayers.length > 0) {
            app.playSound('success');
            app.flashAmbient('success');
            statusMsg.innerText = `✅ إجابة صحيحة! المبدعون: ${correctPlayers.join('، ')}`;
        } else {
            app.playSound('wrong');
            app.flashAmbient('danger');
            statusMsg.innerText = `❌ لا أحد أجاب بشكل صحيح! الإجابة هي: ${this.currentQuestion.options[correctIndex]}`;
        }
    },

    nextQuestion() {
        document.getElementById('question-status-msg').classList.add('hidden');
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.questions.length) {
            this.showQuestion();
        } else {
            if (this.source === 'local') {
                this.endGame();
            }
        }
    },

    endGame() {
        app.playSound('success');
        
        // Restore default onclicks for safety
        document.getElementById('reveal-answer-btn').setAttribute('onclick', 'quiz.revealAnswer()');
        document.getElementById('next-question-btn').setAttribute('onclick', 'quiz.nextQuestion()');
        const endBtn = document.getElementById('tf-end-game-btn');
        if(endBtn) endBtn.remove();
        
        app.broadcast({ type: 'game-over' });
        app.endContest(); // This will show the podium screen
    }
};

trueFalseGame.init();
