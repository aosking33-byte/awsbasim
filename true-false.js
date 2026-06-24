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
                question: t.q + (counter > rawQuestions.length ? ` (تحدي رقم ${counter})` : ''),
                options: ["✅ صح", "❌ خطأ"],
                answer_index: t.a
            });
            counter++;
        }
    },

    setupSettings() {
        app.showScreen('settings-screen');
        const container = document.getElementById('settings-container');
        container.innerHTML = `
            <h2 style="margin-bottom:20px;">إعدادات لعبة الصح والخطأ 🚦</h2>
            <div style="margin-bottom:20px;">
                <label>مصدر الأسئلة:</label>
                <select id="tf-source-select" class="form-input">
                    <option value="local" ${!app.settings.geminiApiKey ? 'selected' : ''}>البنك المحلي (بدون إنترنت)</option>
                    <option value="ai" ${app.settings.geminiApiKey ? 'selected' : ''}>الذكاء الاصطناعي (أسئلة لانهائية)</option>
                </select>
                <small style="display:block; margin-top:5px; color:var(--text-muted);">ملاحظة: الذكاء الاصطناعي يتطلب إضافة المفتاح في إعدادات اللعبة.</small>
            </div>
            <div style="margin-bottom:20px;">
                <label>عدد الأسئلة في الجولة:</label>
                <input type="number" id="tf-count-input" class="form-input" value="15" min="5" max="50">
            </div>
            <button class="btn btn-primary" onclick="trueFalseGame.startQuiz()">بدء اللعب الان! 🚀</button>
            <button class="btn btn-secondary" style="margin-top:10px;" onclick="app.showScreen('home-screen')">عودة للمتعة</button>
        `;
    },

    async startQuiz() {
        const sourceSelect = document.getElementById('tf-source-select');
        const countInput = document.getElementById('tf-count-input');
        
        if (sourceSelect) this.source = sourceSelect.value;
        if (countInput) this.totalQuestions = parseInt(countInput.value) || 15;

        app.showScreen('loading-screen');
        this.currentQuestionIndex = 0;
        this.questions = [];

        if (this.source === 'ai' && app.settings.geminiApiKey) {
            try {
                this.questions = await this.generateQuestionsFromAI();
            } catch (error) {
                console.error("AI Generation failed, falling back to local database:", error);
                this.loadLocalQuestions();
            }
        } else {
            this.loadLocalQuestions();
        }

        if (this.questions.length > 0) {
            this.setupGoldenQuestions();
            app.showScreen('quiz-screen');
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
        let aiQuestions = JSON.parse(text);
        
        return aiQuestions.map(q => ({
            question: q.question,
            options: ["✅ صح", "❌ خطأ"],
            answer_index: q.answer_index
        }));
    },

    showQuestion() {
        this.hasAnswered = false;
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

            document.getElementById('question-counter').innerText = `السؤال ${this.currentQuestionIndex + 1} من ${this.questions.length} (صح وخطأ)`;
            document.getElementById('question-text').innerText = this.currentQuestion.question;
            document.getElementById('options-container').innerHTML = ''; // Options on phone
            
            document.getElementById('reveal-answer-btn').classList.remove('hidden');
            document.getElementById('next-question-btn').classList.add('hidden');

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
            app.playSound('success');
            document.getElementById('question-text').innerText = "🎉 انتهت جولة الصح والخطأ!";
            document.getElementById('options-container').innerHTML = `
                <div style="grid-column: span 2; text-align: center; padding: 40px;">
                    <button class="btn btn-secondary" onclick="trueFalseGame.setupSettings()">العب مرة أخرى</button>
                    <button class="btn btn-back" onclick="app.showScreen('home-screen')">القائمة الرئيسية</button>
                </div>
            `;
            document.getElementById('reveal-answer-btn').classList.add('hidden');
            document.getElementById('next-question-btn').classList.add('hidden');
            app.broadcast({ type: 'game-over' });
        }
    }
};

trueFalseGame.init();
