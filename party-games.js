/* ==========================================
   Arabic Family TV Games Hub - Party Games Engine
   (Charades, Taboo, Word Scramble)
========================================== */

const partyGames = {
    currentGame: 'charades', // 'charades', 'taboo', 'scramble'
    timerSeconds: 60,
    timerInterval: null,
    isPlaying: false,
    hasRevealed: false,
    
    currentData: null, // Holds current word, forbidden list, or scrambled word
    
    // Local Databases - Expanded to prevent duplication
    banks: {
        charades: [
            { word: "سوبرمان يطير في الهواء", category: "شخصية وحركة" },
            { word: "البحث عن نيمو", category: "فيلم كرتون" },
            { word: "صلاح الدين الأيوبي", category: "شخصية تاريخية" },
            { word: "قرد يأكل موزة", category: "حركة وحيوان" },
            { word: "لص يسرق بنك ويلوذ بالفرار", category: "مشهد تمثيلي" },
            { word: "طباخ يحضر البيتزا الإيطالية", category: "مهنة وحركة" },
            { word: "تايتانيك", category: "فيلم عالمي" },
            { word: "طبيب الأسنان يخلع ضرساً لشخص خائف", category: "مشهد كوميدي" },
            { word: "صراع العروش", category: "مسلسل شهير" },
            { word: "عازف جيتار يغني بحماس", category: "مهنة وحركة" },
            { word: "سبايدرمان يتسلق ناطحة سحاب", category: "شخصية وحركة" },
            { word: "لاعب كورة يضيع ركلة جزاء في اللحظة الأخيرة", category: "مشهد درامي" },
            { word: "قيادة سيارة سباق سريعة جداً", category: "حركة وإثارة" },
            { word: "مصور فوتوغرافي يحاول التقاط صورة لأسد غاضب", category: "مشهد كوميدي" },
            { word: "ملاكم يتلقى ضربة قاضية ويترنح", category: "رياضة وحركة" },
            { word: "شخص يسير في العاصفة ومظلته تطير", category: "حركة وكوميديا" },
            { word: "أسد يطارد غزالاً في الغابة", category: "حيوانات وحركة" },
            { word: "رائد فضاء يمشي على القمر لأول مرة", category: "شخصية وحركة" },
            { word: "معلم يحاول تهدئة طلاب فوضويين", category: "مشهد تمثيلي" },
            { word: "سمكة قرش تهاجم قارب صيد صغير", category: "إثارة وحركة" },
            { word: "طفل صغير يتعلم المشي ويسقط", category: "مشهد لطيف" },
            { word: "ميكانيكي يحاول إصلاح محرك سيارة ينفجر دخاناً", category: "كوميديا وحركة" }
        ],
        taboo: [
            { word: "سيارة", forbidden: ["عجلات", "قيادة", "مواصلات", "بنزين"] },
            { word: "مستشفى", forbidden: ["طبيب", "مريض", "دواء", "علاج"] },
            { word: "نظارة", forbidden: ["عيون", "رؤية", "قراءة", "عدسات"] },
            { word: "هاتف", forbidden: ["اتصال", "ذكي", "تطبيقات", "شاشة"] },
            { word: "كرة القدم", forbidden: ["ملعب", "حارس", "أهداف", "ركل"] },
            { word: "بيتزا", forbidden: ["إيطالية", "جبن", "فرن", "عجين"] },
            { word: "طائرة", forbidden: ["سفر", "مطار", "طيار", "جناح"] },
            { word: "قلم", forbidden: ["كتابة", "دفتر", "حبر", "رسم"] },
            { word: "بحر", forbidden: ["ماء", "سمك", "سباحة", "مالح"] },
            { word: "ساعة", forbidden: ["وقت", "عقارب", "دقائق", "منبه"] },
            { word: "شمس", forbidden: ["نور", "نهار", "حرارة", "سماء"] },
            { word: "ثلاجة", forbidden: ["أكل", "بارد", "مطبخ", "تبريد"] },
            { word: "كاميرا", forbidden: ["صورة", "تصوير", "عدسة", "فلاش"] },
            { word: "كتاب", forbidden: ["صفحات", "قراءة", "غلاف", "مكتبة"] },
            { word: "مفتاح", forbidden: ["باب", "قفل", "حديد", "سيارة"] },
            { word: "قهوة", forbidden: ["شرب", "فنجان", "ساخن", "كافيين"] },
            { word: "كمبيوتر", forbidden: ["لوحة مفاتيح", "إنترنت", "شاشة", "ماوس"] },
            { word: "قمر", forbidden: ["ليل", "سماء", "منير", "فضاء"] },
            { word: "خبز", forbidden: ["طحين", "مخبز", "أكل", "دافئ"] },
            { word: "مروحة", forbidden: ["هواء", "صيف", "كهرباء", "شفرات"] },
            { word: "عسل", forbidden: ["نحل", "حلو", "شفاء", "طبيعي"] },
            { word: "مدرسة", forbidden: ["طلاب", "معلم", "حصة", "جرس"] }
        ],
        scramble: [
            "تلفزيون", "مدرسة", "كمبيوتر", "عائلة", "مستقبل", "رياضة", "تاريخ", "جغرافيا", "مهندس", "طبيب", "ألعاب", "مطبخ", "حديقة", "مكتبة", "حاسوب", "صيدلية", "عصفور", "شوكولاتة", "سفرة", "سيارة", "طيار", "معلم", "طائرة", "صديق", "كتاب", "تحدي", "سعادة", "موسيقى", "تلفون", "قنوات"
        ]
    },

    initGame(gameType) {
        this.currentGame = gameType;
        this.isPlaying = false;
        this.hasRevealed = false;
        
        // Reset UI
        document.getElementById('party-game-title').innerText = this.getGameNameAr(gameType);
        document.getElementById('party-next-btn').classList.add('hidden');
        
        // Prepare setup or play screen
        app.showScreen('party-game-screen');
        this.loadNewRound();
    },

    getGameNameAr(type) {
        switch(type) {
            case 'charades': return 'لعبة بدون كلام (تمثيل)';
            case 'taboo': return 'لعبة قول بس لا تقول (تابو)';
            case 'scramble': return 'تحدي الكلمات المبعثرة';
            default: return 'لعبة عائلية';
        }
    },

    async loadNewRound() {
        this.isPlaying = false;
        this.hasRevealed = false;
        
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerSeconds = 60;
        this.updateTimerUI();
        
        // Show loading/hiding states
        const wordContainer = document.getElementById('party-word-container');
        wordContainer.innerHTML = 'جاري تحضير الجولة...';
        
        const revealBtn = document.getElementById('party-reveal-btn');
        const startBtn = document.getElementById('party-start-round-btn');
        
        revealBtn.classList.remove('hidden');
        startBtn.classList.add('hidden');

        // Fetch data
        if (app.settings.geminiApiKey) {
            try {
                this.currentData = await this.generateDataFromAI();
            } catch (e) {
                console.error("AI round generation failed, using local:", e);
                this.loadLocalData();
            }
        } else {
            this.loadLocalData();
        }

        // Save shown word to localStorage history to avoid repetition
        if (this.currentData && this.currentData.word) {
            const historyKey = `family_tv_played_${this.currentGame}`;
            const playedList = JSON.parse(localStorage.getItem(historyKey) || '[]');
            if (!playedList.includes(this.currentData.word)) {
                playedList.push(this.currentData.word);
            }
            localStorage.setItem(historyKey, JSON.stringify(playedList.slice(-100)));
        }

        // Render card as hidden/locked initially (except for Word Scramble which everyone should see)
        this.renderCard(true);
    },

    loadLocalData() {
        const bank = this.banks[this.currentGame];
        const historyKey = `family_tv_played_${this.currentGame}`;
        const playedList = JSON.parse(localStorage.getItem(historyKey) || '[]');
        
        // Filter out played items
        let unplayedPool = [];
        if (this.currentGame === 'scramble') {
            unplayedPool = bank.filter(w => !playedList.includes(w));
        } else {
            unplayedPool = bank.filter(item => !playedList.includes(item.word));
        }

        // If pool is exhausted, clear history for this specific game
        if (unplayedPool.length < 2) {
            console.log(`Local bank for ${this.currentGame} exhausted. Resetting history.`);
            localStorage.removeItem(historyKey);
            unplayedPool = bank;
        }

        const randomItem = unplayedPool[Math.floor(Math.random() * unplayedPool.length)];
        
        if (this.currentGame === 'scramble') {
            this.currentData = {
                word: randomItem,
                scrambled: this.scrambleWord(randomItem)
            };
        } else {
            this.currentData = randomItem;
        }
    },

    scrambleWord(word) {
        let chars = word.split('');
        // Shuffle characters
        for (let i = chars.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        // If it accidentally remains the same, reverse it
        let scrambled = chars.join(' - ');
        if (scrambled === word.split('').join(' - ')) {
            scrambled = chars.reverse().join(' - ');
        }
        return scrambled;
    },

    async generateDataFromAI() {
        const apiKey = app.settings.geminiApiKey;
        const historyKey = `family_tv_played_${this.currentGame}`;
        const playedList = JSON.parse(localStorage.getItem(historyKey) || '[]');
        
        const filterPrompt = playedList.length > 0 
            ? `تجنب تماماً تكرار أو توليد أي من الكلمات التالية لأننا لعبناها سابقاً: ${playedList.slice(-30).join(', ')}.`
            : '';

        let prompt = '';

        if (this.currentGame === 'charades') {
            prompt = `أنت مصمم ألعاب عائلية مسلية. ولد لي فكرة واحدة عشوائية وممتازة للعبة "بدون كلام" (تمثيل الحركات).
            قد تكون اسم فيلم عربي أو عالمي شهير، أو مسلسل، أو حركة مضحكة، أو مثل شعبي معروف.
            ${filterPrompt}
            يجب أن تكون المخرجات بتنسيق JSON نظيف تماماً ومتوافق مع المخطط التالي:
            {
              "word": "اسم الفيلم أو الجملة المراد تمثيلها هنا",
              "category": "تصنيف الجملة (مثال: فيلم كوميدي، حركة وحيوان، إلخ)"
            }`;
        } else if (this.currentGame === 'taboo') {
            prompt = `أنت مصمم ألعاب عائلية مسلية. ولد لي كلمة واحدة رئيسية سهلة ومألوفة للعبة "قول بس لا تقول" (تابو)، مع قائمة من 4 كلمات محظورة (ممنوع استخدامها أثناء الشرح) تكون شديدة الارتباط بالكلمة الرئيسية.
            ${filterPrompt}
            يجب أن تكون المخرجات بتنسيق JSON نظيف تماماً ومتوافق مع المخطط التالي:
            {
              "word": "الكلمة الرئيسية (مثال: نخلة)",
              "forbidden": ["رطب", "تمر", "طويل", "شجرة"]
            }`;
        } else if (this.currentGame === 'scramble') {
            const commonWords = ["مطبخ", "حديقة", "مكتبة", "حاسوب", "مهندس", "صيدلية", "عصفور", "شوكولاتة", "سفرة"];
            const randomPick = commonWords[Math.floor(Math.random() * commonWords.length)];
            
            prompt = `أنت مصمم ألعاب عائلية. اختر لي كلمة عربية فصحى واحدة شائعة ومفهومة للعائلة مكونة من 4 إلى 8 حروف (مثال: ${randomPick}).
            ${filterPrompt}
            قم بإعطائي الكلمة الأصلية، وسأقوم أنا ببعثرتها.
            يجب أن تكون المخرجات بتنسيق JSON نظيف تماماً ومتوافق مع المخطط التالي:
            {
              "word": "الكلمة الأصلية هنا"
            }`;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!response.ok) throw new Error("API failed");
        
        const data = await response.json();
        const jsonText = data.candidates[0].content.parts[0].text;
        const res = JSON.parse(jsonText);

        if (this.currentGame === 'scramble') {
            res.scrambled = this.scrambleWord(res.word);
        }
        return res;
    },

    renderCard(isLocked) {
        const container = document.getElementById('party-word-container');
        const startBtn = document.getElementById('party-start-round-btn');
        const revealBtn = document.getElementById('party-reveal-btn');
        
        if (this.currentGame === 'scramble') {
            // Word scramble is open for everyone immediately!
            container.innerHTML = `
                <div class="scramble-box">
                    <span class="scramble-badge">رتب الأحرف التالية لتكوين كلمة مفيدة:</span>
                    <h1 class="scramble-letters">${this.currentData.scrambled}</h1>
                </div>
            `;
            revealBtn.classList.add('hidden');
            startBtn.classList.remove('hidden');
            return;
        }

        if (isLocked) {
            // Locked screen (requires player to click to view privately)
            container.innerHTML = `
                <div class="locked-card" onclick="partyGames.revealSecretWord()">
                    <svg class="icon locked-icon" viewBox="0 0 24 24" style="width: 3.5rem; height: 3.5rem;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <h3>اغمضوا أعينكم! 🫣</h3>
                    <p>يرجى نقر هذه البطاقة من قِبل المتحدث/الممثل فقط ليقرأ الكلمة سرياً ويستعد.</p>
                </div>
            `;
            startBtn.classList.add('hidden');
        } else {
            // Word is temporarily revealed to the actor
            if (this.currentGame === 'charades') {
                container.innerHTML = `
                    <div class="secret-revealed-card">
                        <span class="category-indicator">التصنيف: ${this.currentData.category}</span>
                        <h1 class="secret-word">${this.currentData.word}</h1>
                        <p class="warning-text">احفظ الجملة جيداً ثم اضغط على زر البدء بالأسفل لإخفائها وتنبيه العائلة لفتح أعينهم!</p>
                    </div>
                `;
            } else if (this.currentGame === 'taboo') {
                const forbiddenHtml = this.currentData.forbidden.map(w => `<li>${w}</li>`).join('');
                container.innerHTML = `
                    <div class="secret-revealed-card">
                        <span class="category-indicator">الكلمة الرئيسية المستهدفة:</span>
                        <h1 class="secret-word-highlight">${this.currentData.word}</h1>
                        <div class="forbidden-box">
                            <strong>الكلمات الممنوعة (المحظورة):</strong>
                            <ul>${forbiddenHtml}</ul>
                        </div>
                        <p class="warning-text">احفظ الكلمات جيداً واضغط زر البدء لإخفائها والبدء بالشرح فوراً!</p>
                    </div>
                `;
            }
            revealBtn.classList.add('hidden');
            startBtn.classList.remove('hidden');
        }
    },

    revealSecretWord() {
        app.playSound('click');
        this.renderCard(false);
    },

    startRound() {
        app.initAudio();
        this.isPlaying = true;
        
        document.getElementById('party-start-round-btn').classList.add('hidden');
        
        const container = document.getElementById('party-word-container');
        
        // Hide the secret words from the screen so family can open their eyes!
        if (this.currentGame === 'charades') {
            container.innerHTML = `
                <div class="playing-placeholder">
                    <h2>جاري التمثيل الآن... 🎭</h2>
                    <p>افتحوا أعينكم وخمنوا الجملة المطلوبة قبل انتهاء الوقت!</p>
                </div>
            `;
        } else if (this.currentGame === 'taboo') {
            container.innerHTML = `
                <div class="playing-placeholder">
                    <h2>جاري الشرح الآن... 🗣️</h2>
                    <p>افتحوا أعينكم وخمنوا الكلمة المستهدفة قبل انتهاء الوقت!</p>
                </div>
            `;
        } else if (this.currentGame === 'scramble') {
            // Keep showing the scrambled letters
            container.innerHTML = `
                <div class="scramble-box">
                    <span class="scramble-badge">أسرع! رتب الأحرف واعرف الكلمة:</span>
                    <h1 class="scramble-letters">${this.currentData.scrambled}</h1>
                </div>
            `;
        }

        this.startTimer();
    },

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerSeconds = 60;
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
                this.revealAnswer(true);
            }
        }, 1000);
    },

    updateTimerUI() {
        const secSpan = document.getElementById('party-timer-seconds');
        const timerBar = document.getElementById('party-timer-bar');
        if (secSpan) {
            secSpan.innerText = this.timerSeconds;
            if (this.timerSeconds <= 10) {
                secSpan.style.color = 'var(--color-wrong)';
                if (timerBar) timerBar.classList.add('danger');
            } else {
                secSpan.style.color = 'var(--color-secondary)';
                if (timerBar) timerBar.classList.remove('danger');
            }
        }
        if (timerBar) {
            const percentage = (this.timerSeconds / 60) * 100;
            timerBar.style.width = `${percentage}%`;
        }
    },

    revealAnswer(isTimeout = false) {
        if (this.hasRevealed) return;
        this.hasRevealed = true;
        
        clearInterval(this.timerInterval);
        app.clearDimSidebar(); // Restore sidebar lighting on reveal
        app.playSound('wrong');

        const container = document.getElementById('party-word-container');
        
        if (this.currentGame === 'charades') {
            container.innerHTML = `
                <div class="final-reveal-card">
                    <span class="reveal-badge-ar">الجملة الصحيحة هي:</span>
                    <h1 class="reveal-word-title">${this.currentData.word}</h1>
                </div>
            `;
        } else if (this.currentGame === 'taboo') {
            const forbiddenHtml = this.currentData.forbidden.map(w => `<li>${w}</li>`).join('');
            container.innerHTML = `
                <div class="final-reveal-card">
                    <span class="reveal-badge-ar">الكلمة الصحيحة هي:</span>
                    <h1 class="reveal-word-title-green">${this.currentData.word}</h1>
                    <div class="forbidden-box">
                        <strong>الكلمات الممنوعة كانت:</strong>
                        <ul>${forbiddenHtml}</ul>
                    </div>
                </div>
            `;
        } else if (this.currentGame === 'scramble') {
            container.innerHTML = `
                <div class="final-reveal-card">
                    <span class="reveal-badge-ar">الكلمة المرتبة الصحيحة هي:</span>
                    <h1 class="reveal-word-title-teal">${this.currentData.word}</h1>
                </div>
            `;
        }

        document.getElementById('party-reveal-btn').classList.add('hidden');
        document.getElementById('party-next-btn').classList.remove('hidden');

        // Automatically load next round or winner selector after 3 seconds
        setTimeout(() => {
            if (this.hasRevealed) {
                if (app.players.length > 0) {
                    app.showWinnerSelection(() => {
                        this.loadNewRound();
                    });
                } else {
                    this.loadNewRound();
                }
            }
        }, 3000);
    }
};
