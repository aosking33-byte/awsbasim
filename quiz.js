/* ==========================================
   Arabic Family TV Games Hub - Trivia Game Engine
========================================== */

const quiz = {
    source: 'local', // 'local' or 'ai'
    currentQuestionIndex: 0,
    totalQuestions: 50,
    questions: [],
    currentQuestion: null,
    timerSeconds: 30,
    timerInterval: null,
    hasAnswered: false,

    // Local Questions Bank (Fallback or Offline Mode) - Expanded to prevent repetition
    localBank: {
        history: [
            { question: "من هو القائد المسلم الذي فتح الأندلس؟", options: ["صلاح الدين الأيوبي", "طارق بن زياد", "عقبة بن نافع", "خالد بن الوليد"], answer_index: 1 },
            { question: "في أي عام سقطت الدولة العباسية على يد التتار؟", options: ["1258 م", "1453 م", "1099 م", "1302 م"], answer_index: 0 },
            { question: "من هو أول إمبراطور للامبراطورية الرومانية؟", options: ["يوليوس قيصر", "أغسطس قيصر", "نيرون", "قسطنطين"], answer_index: 1 },
            { question: "بني تمثال أبو الهول في عهد أي فرعون؟", options: ["خوفو", "خفرع", "منقرع", "رمسيس الثاني"], answer_index: 1 },
            { question: "ما هي المعركة الشهيرة التي انتصر فيها المسلمون بقيادة قطز على المغول؟", options: ["معركة اليرموك", "معركة القادسية", "معركة عين جالوت", "معركة حطين"], answer_index: 2 },
            { question: "من هو مؤسس الدولة الأموية؟", options: ["معاوية بن أبي سفيان", "عمر بن عبد العزيز", "مروان بن الحكم", "يزيد بن معاوية"], answer_index: 0 },
            { question: "ما هو الاسم القديم لمدينة إسطنبول؟", options: ["أنقرة", "القسطنطينية", "طروادة", "روما الشرقية"], answer_index: 1 },
            { question: "من هو الملك الفرعوني الذي تم اكتشاف مقبرته كاملة عام 1922؟", options: ["توت عنخ آمون", "رمسيس الثاني", "أخناتون", "تحتمس الثالث"], answer_index: 0 },
            { question: "أي حضارة قديمة قامت ببناء مدينة 'البتراء' في الأردن؟", options: ["الفراعنة", "الأنباط", "الفينيقيون", "الرومان"], answer_index: 1 },
            { question: "من هو البحار الذي قاد أول رحلة حول العالم؟", options: ["كريستوفر كولومبوس", "ماجلان", "فاسكو دا غاما", "ابن بطوطة"], answer_index: 1 },
            { question: "في أي مدينة فرنسية وقعت الثورة الفرنسية عام 1789؟", options: ["مارسيليا", "باريس", "ليون", "نيس"], answer_index: 1 },
            { question: "من هو أول رئيس للولايات المتحدة الأمريكية؟", options: ["أبراهام لينكولن", "جورج واشنطن", "توماس جيفرسون", "جون كينيدي"], answer_index: 1 },
            { question: "ما هي الحرب الشهيرة التي استمرت بين بريطانيا وفرنسا لأكثر من قرن؟", options: ["حرب المئة عام", "حرب السبع سنوات", "الحرب الباردة", "حرب الثلاثين عام"], answer_index: 0 },
            { question: "من هو الزعيم الروحي للهند خلال حركة استقلالها؟", options: ["نهرو", "المهاتما غاندي", "أنديرا غاندي", "طاغور"], answer_index: 1 },
            { question: "في أي عام وقعت معركة القادسية التاريخية؟", options: ["636 م", "642 م", "656 م", "680 م"], answer_index: 0 },
            { question: "من هو الامبراطور الفرنسي الذي نفي إلى جزيرة سانت هيلانة؟", options: ["شارلمان", "لويس الرابع عشر", "نابليون بونابرت", "لويس السادس عشر"], answer_index: 2 },
            { question: "ما هي الحضارة التي كتبت بالخط المسماري؟", options: ["الحضارة الفرعونية", "الحضارة السومرية", "الحضارة الرومانية", "الحضارة الصينية"], answer_index: 1 },
            { question: "أي ملكة كانت آخر سلالة الفراعنة في مصر القديمة؟", options: ["نفرتيتي", "حاتشبسوت", "كليوباترا", "شجر الدر"], answer_index: 2 },
            { question: "في أي عام انتهت الحرب العالمية الثانية؟", options: ["1918 م", "1939 م", "1943 م", "1945 م"], answer_index: 3 },
            { question: "من هو الفيلسوف الإغريقي الذي كان معلماً للإسكندر الأكبر؟", options: ["سقراط", "أفلاطون", "أرسطو", "فيثاغورس"], answer_index: 2 }
        ],
        sports: [
            { question: "كم عدد لاعبي فريق كرة اليد داخل الملعب؟", options: ["5 لاعبين", "6 لاعبين", "7 لاعبين", "8 لاعبين"], answer_index: 2 },
            { question: "أي دولة فازت بكأس العالم لكرة القدم عام 2018؟", options: ["الأرجنتين", "فرنسا", "كرواتيا", "ألمانيا"], answer_index: 1 },
            { question: "من هو اللاعب الأكثر تسجيلاً للأهداف في تاريخ بطولة دوري أبطال أوروبا؟", options: ["ليونيل ميسي", "كريستيانو رونالدو", "روبرت ليفاندوفسكي", "كريم بنزيما"], answer_index: 1 },
            { question: "في أي رياضة تشتهر بطولة 'ويمبلدون'؟", options: ["التنس", "الغولف", "الفورمولا 1", "كرة السلة"], answer_index: 0 },
            { question: "كم دقيقة تستغرق مباراة كرة القدم الرسمية (بدون الأشواط الإضافية)؟", options: ["80 دقيقة", "90 دقيقة", "100 دقيقة", "120 دقيقة"], answer_index: 1 },
            { question: "ما هي الدولة التي استضافت أول بطولة لكأس العالم عام 1930؟", options: ["البرازيل", "الأرجنتين", "الأوروغواي", "إيطاليا"], answer_index: 2 },
            { question: "كم عدد الحلقات الملونة التي تشكل شعار الألعاب الأولمبية؟", options: ["4 حلقات", "5 حلقات", "6 حلقات", "7 حلقات"], answer_index: 1 },
            { question: "ما هو النادي الإسباني الأكثر فوزاً بلقب دوري أبطال أوروبا؟", options: ["برشلونة", "أتلتيكو مدريد", "ريال مدريد", "فالنسيا"], answer_index: 2 },
            { question: "من هو العداء الجامايكي صاحب الرقم القياسي العالمي في سباق 100 متر؟", options: ["كارل لويس", "يوسين بولت", "تايسون غاي", "يوهان بليك"], answer_index: 1 },
            { question: "في أي لعبة رياضية يستخدم مصطلح 'الضربة القاضية'؟", options: ["المصارعة", "الملاكمة", "الكاراتيه", "الجودو"], answer_index: 1 },
            { question: "كم عدد لاعبي فريق كرة السلة داخل الملعب أثناء المباراة؟", options: ["5 لاعبين", "6 لاعبين", "7 لاعبين", "11 لاعبين"], answer_index: 0 },
            { question: "أي بلد يعتبر موطن رياضة 'الساموراي' والـ 'جودو'؟", options: ["الصين", "كوريا الجنوبية", "اليابان", "تايلاند"], answer_index: 2 },
            { question: "لاعب كرة قدم أرجنتيني أسطوري قاد بلاده للفوز بكأس العالم 1986؟", options: ["ليونيل ميسي", "دييغو مارادونا", "باتيستوتا", "كيمبس"], answer_index: 1 },
            { question: "في أي رياضة يتنافس اللاعبون بالدراجات في سباق 'طواف فرنسا' الشهير؟", options: ["سباق السيارات", "الدراجات النارية", "الدراجات الهوائية", "الجري السريع"], answer_index: 2 },
            { question: "كم عدد الكرات الحمراء في لعبة السنوكر في بداية المباراة?؟", options: ["10 كرات", "15 كرة", "21 كرة", "7 كرات"], answer_index: 1 },
            { question: "من هي اللاعبة العربية التونسية التي وصلت لنهائي بطولة ويمبلدون للتنس؟", options: ["ميار شريف", "أنس جابر", "سليمة صفر", "فاطمة النبهاني"], answer_index: 1 },
            { question: "ما هي الرياضة التي تستخدم فيها الكرة الصغيرة المجوفة والشبكة المنخفضة في ملعب مغلق؟", options: ["الاسكواش", "التنس", "كرة الطاولة", "الريشة الطائرة"], answer_index: 0 },
            { question: "أي دولة فازت بكأس العالم لكرة القدم في قطر عام 2022؟", options: ["فرنسا", "كرواتيا", "الأرجنتين", "البرازيل"], answer_index: 2 },
            { question: "كم يبلغ طول ماراثون الجري الرسمي بالكيلومترات تقريباً؟", options: ["21 كم", "30 كم", "42 كم", "50 كم"], answer_index: 2 },
            { question: "في أي رياضة يشتهر اللاعب الأمريكي الأسطوري 'مايكل جوردان'؟", options: ["كرة القدم الأمريكية", "كرة السلة", "البيسبول", "الغولف"], answer_index: 1 }
        ],
        entertainment: [
            { question: "ما هو الفيلم الأعلى تحقيقاً للإيرادات في تاريخ السينما العالمية؟", options: ["تايتانيك", "أفاتار (Avatar)", "المنتقمون: نهاية اللعبة", "حرب النجوم"], answer_index: 1 },
            { question: "ما اسم المسلسل الخيالي الشهير الذي يحتوي على عائلات 'ستارك' و 'لانستر'؟", options: ["صراع العروش (Game of Thrones)", "عالم الغرب (Westworld)", "سيد الخواتم", "التاج"], answer_index: 0 },
            { question: "من أدى صوت شخصية 'موفاسا' في النسخة العربية لفيلم الأسد الملك؟", options: ["عبد الرحمن أبو زهرة", "أحمد بدير", "يحيى الفخراني", "محمد هنيدي"], answer_index: 0 },
            { question: "كم عدد أجزاء فيلم 'العراب' (The Godfather) الشهير؟", options: ["جزأين", "3 أجزاء", "4 أجزاء", "خمسة أجزاء"], answer_index: 1 },
            { question: "مسلسل كرتوني شهير يعيش أبطاله في مدينة 'سبرينغفيلد'؟", options: ["عائلة سيمبسون", "فاميلي غاي", "ساوث بارك", "ريك ومورتي"], answer_index: 0 },
            { question: "من هو الممثل المصري الملقب بـ 'الزعيم'؟", options: ["أحمد زكي", "عادل إمام", "محمود عبد العزيز", "نور الشريف"], answer_index: 1 },
            { question: "ما اسم كوكب موطن سوبرمان الذي تدمر؟", options: ["كريبتون", "سايبرترون", "أوكسيدوس", "مارس الفائق"], answer_index: 0 },
            { question: "أي فيلم فاز بجائزة الأوسكار لأفضل فيلم لعام 2020 وتاريخي كأول فيلم غير إنجليزي؟", options: ["1917", "طفيلي (Parasite)", "الجوكر", "روما"], answer_index: 1 },
            { question: "ما اسم الساحر الشاب بطل سلسلة الأفلام والكتب الشهيرة للكاتبة جيه كي رولينغ؟", options: ["بيرسي جاكسون", "هاري بوتر", "فرودو باجينز", "جون سنو"], answer_index: 1 },
            { question: "أي ممثل أدى دور شخصية 'الجوكر' في فيلم The Dark Knight عام 2008؟", options: ["خواكين فينيكس", "هيث ليدجر", "جيمس فرانكو", "جيرد ليتو"], answer_index: 1 },
            { question: "ما هو اسم الغوريلا العملاقة الشهيرة التي تسلقت مبنى إمباير ستيت في السينما؟", options: ["كينغ كونغ", "غودزيلا", "تارزان الغوريلا", "جيمبو"], answer_index: 0 },
            { question: "أي أنمي ياباني شهير يتحدث عن قرصان شاب يريد أن يصبح ملك القراصنة؟", options: ["ناروتو", "ون بيس (One Piece)", "هجوم العمالقة", "بليتش"], answer_index: 1 },
            { question: "ما هو اسم المحقق الذكي في مسلسل الأنمي الياباني الشهير 'المحقق كونان' قبل أن يتقلص؟", options: ["شينتشي كودو", "موري ران", "كوجورو موري", "هيجي هاتوري"], answer_index: 0 },
            { question: "ما هي الشخصية الرئيسية في لعبة وأفلام 'لارا كروفت'؟", options: ["الباحثة عن الآثار", "صائدة الأشباح", "المحاربة القديمة", "المخبرة السرية"], answer_index: 0 },
            { question: "مسلسل كرتوني عربي قديم تدور أحداثه حول فتى صياد يبحث عن والده 'جين'؟", options: ["القناص (Hunter x Hunter)", "عدنان ولينا", "مازنجر", "كابتن ماجد"], answer_index: 0 },
            { question: "ما اسم السفينة الغارقة الشهيرة في فيلم جيمس كاميرون الرومانسي لعام 1997؟", options: ["تايتانيك", "أولمبيك", "بريتانيك", "الملكة إليزابيث"], answer_index: 0 },
            { question: "من هو المخرج العالمي الشهير وراء سلسلة أفلام Jurassic Park و Schindler's List؟", options: ["كريستوفر نولان", "ستيفن سبيلبرغ", "مارتن سكورسيزي", "كوينتن تارانتينو"], answer_index: 1 },
            { question: "ما هي الدولة التي تعتبر موطن الفنون والدراما الشهيرة بـ K-Pop والمسلسلات الكورية؟", options: ["اليابان", "الصين", "كوريا الجنوبية", "تايلاند"], answer_index: 2 },
            { question: "ما اسم المسلسل الكرتوني الشهير الذي يتناول مغامرات فتى لديه ساعة فضائية تحوله لـ 10 فضائيين؟", options: ["بن 10 (Ben 10)", "ولد الأوتوبوت", "مختبر دكستر", "مغامرات جاكي شان"], answer_index: 0 },
            { question: "من هو بطل سلسلة أفلام الأكشن والمطاردات الشهيرة 'Mission Impossible'؟", options: ["براد بيت", "توم كروز", "جوني ديب", "ويل سميث"], answer_index: 1 }
        ],
        religious: [
            { question: "ما هي أطول سورة في القرآن الكريم؟", options: ["سورة آل عمران", "سورة البقرة", "سورة النساء", "سورة المائدة"], answer_index: 1 },
            { question: "كم عدد أبواب الجنة؟", options: ["7 أبواب", "8 أبواب", "9 أبواب", "10 أبواب"], answer_index: 1 },
            { question: "من هو النبي الذي أُرسل إلى قوم عاد؟", options: ["صالح عليه السلام", "هود عليه السلام", "شعيب عليه السلام", "لوط عليه السلام"], answer_index: 1 },
            { question: "في أي شهر هجري فرض الصيام على المسلمين؟", options: ["شعبان", "رمضان", "رجب", "محرم"], answer_index: 1 },
            { question: "ما هي أول قبلة للمسلمين؟", options: ["الكعبة المشرفة", "المسجد الأقصى", "المسجد النبوي", "مسجد قباء"], answer_index: 1 },
            { question: "ما هو لقب الصحابي الجليل حمزة بن عبد المطلب؟", options: ["أسد الله", "ذو النورين", "الفاروق", "أمين الأمة"], answer_index: 0 },
            { question: "كم عدد سور القرآن الكريم؟", options: ["110 سورة", "114 سورة", "118 سورة", "120 سورة"], answer_index: 1 },
            { question: "من هو النبي الملقب بـ 'كليم الله'؟", options: ["إبراهيم عليه السلام", "موسى عليه السلام", "عيسى عليه السلام", "يوسف عليه السلام"], answer_index: 1 },
            { question: "في أي مدينة ولد الرسول محمد صلى الله عليه وسلم؟", options: ["المدينة المنورة", "مكة المكرمة", "الطائف", "القدس"], answer_index: 1 },
            { question: "ما هي الغزوة التي هزم فيها جيش المشركين وتم فتح مكة بعدها بسنوات؟", options: ["غزوة بدر الكبرى", "غزوة أحد", "غزوة الخندق", "غزوة خيبر"], answer_index: 0 },
            { question: "من هو الصحابي الذي رافق النبي صلى الله عليه وسلم في الهجرة إلى المدينة؟", options: ["عمر بن الخطاب", "أبو بكر الصديق", "علي بن أبي طالب", "عثمان بن عفان"], answer_index: 1 },
            { question: "كم عدد أركان الإسلام؟", options: ["3 أركان", "4 أركان", "5 أركان", "6 أركان"], answer_index: 2 },
            { question: "ما هي السورة التي تعدل ثلث القرآن الكريم؟", options: ["سورة الفاتحة", "سورة الإخلاص", "سورة يس", "سورة الكهف"], answer_index: 1 },
            { question: "من هو النبي الذي بنى الفلك (السفينة) بأمر الله؟", options: ["نوح عليه السلام", "آدم عليه السلام", "صالح عليه السلام", "هود عليه السلام"], answer_index: 0 },
            { question: "ما هي أطول آية في القرآن الكريم؟", options: ["آية الكرسي", "آية الدين في سورة البقرة", "الآية الأولى من سورة آل عمران", "آية الربا"], answer_index: 1 },
            { question: "من هو الملك الموكل بالوحي للأنبياء؟", options: ["إسرافيل عليه السلام", "جبريل عليه السلام", "ميكائيل عليه السلام", "ملك الموت"], answer_index: 1 },
            { question: "ما هو اسم الصحابي الملقب بـ 'أمين هذه الأمة'؟", options: ["أبو عبيدة بن الجراح", "سعد بن معاذ", "خالد بن الوليد", "عبد الرحمن بن عوف"], answer_index: 0 },
            { question: "أي نبي أعطاه الله ملكاً عظيماً وعلمه لغة الطير والحيوان؟", options: ["داود عليه السلام", "سليمان عليه السلام", "يوسف عليه السلام", "موسى عليه السلام"], answer_index: 1 },
            { question: "في أي سورة وردت قصة أصحاب الكهف؟", options: ["سورة الكهف", "سورة البقرة", "سورة طه", "سورة مريم"], answer_index: 0 },
            { question: "ما هي الليلة المباركة في شهر رمضان التي هي خير من ألف شهر؟", options: ["ليلة القدر", "ليلة الإسراء والمعراج", "ليلة النصف من شعبان", "أول ليلة من رمضان"], answer_index: 0 }
        ],
        gaming: [
            { question: "ما هي اللعبة الأكثر مبيعاً في تاريخ ألعاب الفيديو بالكامل؟", options: ["ماينكرافت (Minecraft)", "جراند ثفت أوتو V", "تيتريس (Tetris)", "سوبر ماريو"], answer_index: 0 },
            { question: "ما اسم بطل سلسلة ألعاب 'أسطورة زيلدا' (The Legend of Zelda)؟", options: ["زيلدا", "لينك (Link)", "ماريو", "غانون"], answer_index: 1 },
            { question: "أي شركة طورت جهاز الألعاب الشهير 'بلايستيشن'؟", options: ["نينتندو", "سوني (Sony)", "مايكروسوفت", "سيجا"], answer_index: 1 },
            { question: "ما اسم الغابة التنافسية الرئيسية في لعبة League of Legends؟", options: ["سمنرز ريفت (Summoner's Rift)", "هاولينج abyss", "إنجيلاند", "الدرع المظلم"], answer_index: 0 },
            { question: "في أي عام تم إطلاق لعبة وورلد أوف ووركرافت (World of Warcraft) لأول مرة؟", options: ["2002", "2004", "2006", "2008"], answer_index: 1 },
            { question: "ما اسم الشخصية الرئيسية الملتحية في لعبة God of War؟", options: ["أتريوس", "كريتوس (Kratos)", "زيوس", "أودين"], answer_index: 1 },
            { question: "أي لعبة شوتر تنافسية طورتها شركة Valve وتشتهر بفك القنابل؟", options: ["كاونتر سترايك (CS:GO / CS2)", "فالورانت", "أوفرووتش", "أبيكس ليجندز"], answer_index: 0 },
            { question: "ما اسم الشركة المطورة للعبة المغامرات الغربية Red Dead Redemption 2؟", options: ["يوبي سوفت", "روكستار جيمز (Rockstar)", "إي أيه (EA)", "أكتيفيجين"], answer_index: 1 },
            { question: "ما هو اسم السباك الإيطالي الشهير بطل ألعاب نينتندو الكلاسيكية؟", options: ["لويجي", "ماريو", "واريو", "يوشي"], answer_index: 1 },
            { question: "لعبة البناء الشهيرة المكونة من مكعبات يتم توليد عالمها بشكل لا نهائي؟", options: ["روبلوكس", "ماينكرافت", "فورتنايت", "تيراريا"], answer_index: 1 },
            { question: "أي لعبة باتل رويال تشتهر بالبناء السريع وإطلاق النار ولها طور إنقاذ العالم؟", options: ["ببجي (PUBG)", "فورتنايت (Fortnite)", "وارزون", "أبيكس ليجندز"], answer_index: 1 },
            { question: "ما اسم صائد الوحوش بطل سلسلة ألعاب Witcher؟", options: ["جيرالت من ريفيا", "سيري", "ينيفير", "فيسيمير"], answer_index: 0 },
            { question: "في لعبة Pac-Man الكلاسيكية، ماذا يطارد البطل الأصفر الدائري؟", options: ["الأشباح", "الوحوش", "السيارات", "الفواكه المفترسة"], answer_index: 0 },
            { question: "ما اسم جهاز ألعاب نينتندو الهجين الذي يعمل كجهاز منزلي ومحمول في نفس الوقت؟", options: ["نينتندو سويتش", "نينتندو 3DS", "وي يو (Wii U)", "نينتندو DS"], answer_index: 0 },
            { question: "أي لعبة رعب بقاء تشتهر بمدينة 'راكون سيتي' وفايروس الـ T-Virus؟", options: ["سايلنت هيل", "ريزيدنت إيفل (Resident Evil)", "ذا لاست أوف أس", "أوت لاست"], answer_index: 1 },
            { question: "ما اسم البطل المغامر صائد الكنوز في سلسلة ألعاب Uncharted؟", options: ["نيد فور سبيد", "ناثان دريك", "سيد مير", "ماركوس فينكس"], answer_index: 1 },
            { question: "ما هي اللعبة التي يتحكم فيها اللاعب بـ 'تيتس' ومخلوقات صفراء صغيرة تدعى بوكيمون؟", options: ["أبطال الديجيتال", "بوكيمون (Pokemon)", "يوغي يو", "سوبر سماش"], answer_index: 1 },
            { question: "ما هو اسم الطور الأكثر شعبية في سلسلة ألعاب فيفا لإنشاء فريقك الخاص والبطاقات؟", options: ["ألتميت تيم (Ultimate Team)", "مهنة لاعب", "المواسم المباشرة", "الشارع (فولتا)"], answer_index: 0 },
            { question: "أي لعبة مغامرات تمثيل أدوار شهيرة نالت جائزة لعبة العام 2022 وتتميز بعالم 'الأراضي بين'؟", options: ["إيلدن رينغ (Elden Ring)", "سيرو", "دارك سولز", "بلادبورن"], answer_index: 0 },
            { question: "ما اسم البطل القنفذ الأزرق السريع لشركة سيجا؟", options: ["شادو", "سونيك (Sonic)", "تايلز", "ناكلز"], answer_index: 1 }
        ],
        geography: [
            { question: "ما هي عاصمة أستراليا؟", options: ["سيدني", "ملبورن", "كانبرا", "بيرث"], answer_index: 2 },
            { question: "ما هو أعمق محيط في العالم؟", options: ["المحيط الأطلسي", "المحيط الهندي", "المحيط الهادئ", "المحيط المتجمد الشمالي"], answer_index: 2 },
            { question: "ما هي أكبر دولة مساحة في العالم؟", options: ["كندا", "الصين", "روسيا", "الولايات المتحدة"], answer_index: 2 },
            { question: "أي نهر يعتبر أطول نهر في العالم؟", options: ["نهر الأمازون", "نهر النيل", "نهر الميسيسيبي", "نهر اليانغتسي"], answer_index: 1 },
            { question: "ما هي الدولة الأفريقية التي يمر بها خط الاستواء وتسمى عاصمتها نيروبي؟", options: ["أوغندا", "كينيا", "الصومال", "تنزانيا"], answer_index: 1 },
            { question: "ما هي عاصمة اليابان؟", options: ["طوكيو", "أوساكا", "كيوتو", "هيروشيما"], answer_index: 0 },
            { question: "ما هي الدولة التي تسمى أيضاً 'بلد الألف بحيرة'؟", options: ["النرويج", "السويد", "فنلندا", "كندا"], answer_index: 2 },
            { question: "أي بحر يفصل بين القارة الأفريقية والقارة الأوروبية؟", options: ["البحر الأحمر", "البحر الأبيض المتوسط", "بحر العرب", "بحر قزوين"], answer_index: 1 },
            { question: "ما هي أكبر قارة في العالم من حيث المساحة والسكان؟", options: ["أفريقيا", "آسيا", "أوروبا", "أمريكا الشمالية"], answer_index: 1 },
            { question: "ما هي عاصمة جمهورية مصر العربية؟", options: ["الإسكندرية", "القاهرة", "الجيزة", "الأقصر"], answer_index: 1 },
            { question: "أي جبال تعتبر الأعلى في العالم وبها قمة إفرست؟", options: ["جبال الأنديز", "جبال الألب", "جبال الهيمالايا", "جبال الأطلس"], answer_index: 2 },
            { question: "ما هي الدولة العربية التي تتكون من عدة جزر وتقع في المحيط الهندي؟", options: ["جزر القمر", "البحرين", "اليمن", "جيبوتي"], answer_index: 0 },
            { question: "أي دولة تشتهر بالبرج المائل الشهير 'برج بيزا'؟", options: ["فرنسا", "إيطاليا", "إسبانيا", "اليونان"], answer_index: 1 },
            { question: "ما هي أصغر دولة في العالم من حيث المساحة؟", options: ["موناكو", "الفاتيكان", "سان مارينو", "ليختنشتاين"], answer_index: 1 },
            { question: "ما هي القناة المائية الاصطناعية التي تربط بين البحر الأحمر والبحر المتوسط؟", options: ["قناة بنما", "قناة السويس", "مضيق جبل طارق", "مضيق هرمز"], answer_index: 1 },
            { question: "ما هي عاصمة دولة كندا؟", options: ["تورونتو", "أوتاوا", "مونتريال", "فانكوفر"], answer_index: 1 },
            { question: "ما هي الدولة التي يمر بها نهر الأمازون بأكمله تقريباً وتمثل أكبر مساحة في أمريكا الجنوبية؟", options: ["الأرجنتين", "البرازيل", "كولومبيا", "بيرو"], answer_index: 1 },
            { question: "ما هو المضيق المائي الذي يفصل بين المغرب وإسبانيا؟", options: ["مضيق هرمز", "مضيق جبل طارق", "مضيق باب المندب", "مضيق البوسفور"], answer_index: 1 },
            { question: "ما هي الدولة التي تشتهر بطواحين الهواء وحقول التوليب وعاصمتها أمستردام؟", options: ["بلجيكا", "هولندا", "الدنمارك", "ألمانيا"], answer_index: 1 },
            { question: "ما هي عاصمة المملكة العربية السعودية؟", options: ["جدة", "مكة المكرمة", "الرياض", "الدمام"], answer_index: 2 }
        ]
    },

    setSource(src) {
        this.source = src;
        const selectorOptions = document.querySelectorAll('.mode-option');
        selectorOptions.forEach(opt => {
            if (opt.getAttribute('data-source') === src) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
        app.playSound('click');
        app.checkAiWarning();
    },

    async startQuiz() {
        app.initAudio();
        this.currentQuestionIndex = 0;
        this.questions = [];
        
        const activeCategoryItem = document.querySelector('.category-item.active');
        const category = activeCategoryItem ? activeCategoryItem.getAttribute('data-category') : 'mix';
        
        document.getElementById('quiz-current-category').innerText = activeCategoryItem ? activeCategoryItem.querySelector('span').innerText : 'خلطة عشوائية';
        
        // Show loading state
        app.showScreen('quiz-game-screen');
        document.getElementById('question-text').innerText = "جاري تحضير وتوليد الأسئلة الذكية...";
        document.getElementById('options-container').innerHTML = '';
        document.getElementById('reveal-answer-btn').classList.add('hidden');
        document.getElementById('next-question-btn').classList.add('hidden');

        if (this.source === 'ai' && app.settings.geminiApiKey) {
            try {
                this.questions = await this.generateQuestionsFromAI(category);
            } catch (error) {
                console.error("AI Generation failed, falling back to local database:", error);
                this.loadLocalQuestions(category);
            }
        } else {
            this.loadLocalQuestions(category);
        }

        if (this.questions.length > 0) {
            this.showQuestion();
        } else {
            document.getElementById('question-text').innerText = "عذراً، فشل تحميل الأسئلة. يرجى المحاولة لاحقاً.";
        }
    },

    loadLocalQuestions(category) {
        let pool = [];
        if (category === 'mix') {
            Object.keys(this.localBank).forEach(key => {
                pool = pool.concat(this.localBank[key]);
            });
        } else {
            pool = this.localBank[category] || this.localBank['history'];
        }

        // Get played questions from localStorage to prevent any repetitions
        const playedQuestions = JSON.parse(localStorage.getItem('family_tv_played_questions') || '[]');

        // Filter out played questions
        let unplayedPool = pool.filter(q => !playedQuestions.includes(q.question));

        // If pool is fully depleted, reset history for a fresh cycle
        if (unplayedPool.length === 0) {
            console.log("Local pool exhausted. Resetting history for category:", category);
            // Clear played history to start fresh
            localStorage.removeItem('family_tv_played_questions');
            unplayedPool = pool;
        }

        // Shuffle pool
        const shuffled = [...unplayedPool].sort(() => 0.5 - Math.random());
        // Take up to this.totalQuestions
        this.questions = shuffled.slice(0, Math.min(shuffled.length, this.totalQuestions));

        // Save selected questions to played history immediately on start to prevent duplication even on refresh
        const updatedPlayed = JSON.parse(localStorage.getItem('family_tv_played_questions') || '[]');
        this.questions.forEach(q => {
            if (!updatedPlayed.includes(q.question)) {
                updatedPlayed.push(q.question);
            }
        });
        localStorage.setItem('family_tv_played_questions', JSON.stringify(updatedPlayed.slice(-200))); // Store last 200 questions to manage storage size
    },


    // AI API Integration: Generates highly engaging, custom, unique questions on the fly!
    async generateQuestionsFromAI(category) {
        const apiKey = app.settings.geminiApiKey;
        const playedQuestions = JSON.parse(localStorage.getItem('family_tv_played_questions') || '[]');
        
        const categoryMapAr = {
            'history': 'التاريخ القديم والمعاصر والفتوحات والشخصيات التاريخية',
            'sports': 'الرياضة العالمية والعربية وكرة القدم والألعاب الأولمبية',
            'entertainment': 'الأفلام العربية والعالمية والمسلسلات الشهيرة والفنون والأنمي',
            'religious': 'الثقافة الإسلامية، القرآن الكريم، قصص الأنبياء والغزوات',
            'gaming': 'ألعاب الفيديو الحديثة والكلاسيكية، شركات الألعاب وتاريخ صناعة الألعاب',
            'geography': 'الجغرافيا، الدول والمدن والمعالم الطبيعية والعواصم والمحيطات',
            'mix': 'مجالات متنوعة تشمل العلوم، التاريخ، الرياضة، الفنون، الجغرافيا، وأسئلة ذكاء وحيل'
        };

        const categoryPrompt = categoryMapAr[category] || categoryMapAr['mix'];
        
        // System instruction & list of played questions to prevent repetition
        const filterPrompt = playedQuestions.length > 0 
            ? `تجنب تماماً تكرار أو توليد أي من الأسئلة التالية لأننا لعبناها سابقاً: ${playedQuestions.slice(-30).join(', ')}.` 
            : '';

        const prompt = `أنت محرك أسئلة ألعاب عائلية ذكي جداً للتلفزيون. ولد لي قائمة تحتوي على 50 سؤال ذكاء ومعلومات شيقة وبارعة للغاية في مجال: ${categoryPrompt}.
المتطلبات:
1. الأسئلة يجب أن تكون باللغة العربية الفصحى المبسطة والواضحة وممتعة للجمع العائلي.
2. لكل سؤال 4 خيارات اختيار من متعدد، خيار واحد منها فقط صحيح وثلاثة خيارات خاطئة ومقنعة.
3. التنوع في الصعوبة من المتوسط للذكي جداً.
4. ${filterPrompt}
5. يجب أن يكون المخرجات بتنسيق JSON نظيف تماماً كقائمة كائنات، بدون علامات تفكيك أو أكواد إضافية، متوافقاً مع المخطط التالي:
[
  {
    "question": "السؤال هنا؟",
    "options": ["الخيار الأول", "الخيار الثاني (الصحيح مثلاً)", "الخيار الثالث", "الخيار الرابع"],
    "answer_index": 1
  }
]`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();
        let jsonText = data.candidates[0].content.parts[0].text.trim();
        
        // Clean markdown code blocks if returned by Gemini
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
        }
        
        const generatedQuestions = JSON.parse(jsonText);

        if (Array.isArray(generatedQuestions) && generatedQuestions.length > 0) {
            // Save question texts to prevent repetition in the future
            generatedQuestions.forEach(q => {
                if (q.question) {
                    playedQuestions.push(q.question);
                }
            });
            localStorage.setItem('family_tv_played_questions', JSON.stringify(playedQuestions.slice(-100))); // Keep last 100 questions to avoid huge storage size
            return generatedQuestions;
        } else {
            throw new Error("Invalid output format from AI");
        }
    },

    showQuestion() {
        this.hasAnswered = false;
        this.currentQuestion = this.questions[this.currentQuestionIndex];
        
        // Reset and broadcast question for Kahoot-style answering mode
        app.currentRoundAnswers = {};
        app.currentCorrectAnswerIndex = this.currentQuestion.answer_index;
        // Broadcast full question text and options to mobile phones
        app.broadcast({
            type: 'question-start',
            question: this.currentQuestion.question,
            options: this.currentQuestion.options
        });
        app.updateSidebarUI();
        
        document.getElementById('quiz-question-counter').innerText = `الأسئلة: ${this.currentQuestionIndex + 1} / ${this.questions.length}`;
        
        // Clear ambient effects for a fresh question
        app.clearAmbient();
        
        // Show the question text with typing effect, and prompt for mobile
        const text = this.currentQuestion.question;
        const target = document.getElementById('question-text');
        target.innerHTML = '';
        
        let i = 0;
        if (window.quizTypeInterval) clearInterval(window.quizTypeInterval);
        
        window.quizTypeInterval = setInterval(() => {
            if (i < text.length) {
                target.innerHTML += text.charAt(i);
                i++;
            } else {
                clearInterval(window.quizTypeInterval);
                // After typing is done, append the mobile prompt
                target.innerHTML += `<div style="text-align: center; margin-top: 30px; animation: fadeIn 1s ease-in-out;">
                                        <span style="font-size: 0.8em; color: var(--color-primary); background: rgba(0,0,0,0.5); padding: 10px 20px; border-radius: 20px;">الرجاء النظر إلى جوالك لاختيار الإجابة الصحيحة 📱</span>
                                     </div>`;
            }
        }, 30); // Typing speed

        
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        
        // We do not render the options buttons on the TV anymore per user request.
        // The mobile phone will handle displaying the options.

        document.getElementById('reveal-answer-btn').classList.remove('hidden');
        document.getElementById('next-question-btn').classList.add('hidden');

        this.startTimer();
    },

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerSeconds = 30;
        this.updateTimerUI();
        app.focusDimSidebar(true); // Dim the sidebar to focus on the active question

        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            this.updateTimerUI();

            if (this.timerSeconds <= 10 && this.timerSeconds > 0) {
                app.playSound('tick');
                // Trigger amber warning ambient lighting sync
                app.flashAmbient('warning');
            }

            if (this.timerSeconds <= 0) {
                clearInterval(this.timerInterval);
                this.revealAnswer(true); // Automatically reveal answer when timer ends
            }
        }, 1000);
    },

    updateTimerUI() {
        const timerSecondsSpan = document.getElementById('spot-timer-seconds'); // Just in case
        const secondsSpan = document.getElementById('timer-seconds');
        const timerBar = document.getElementById('timer-bar');

        if (secondsSpan) {
            secondsSpan.innerText = this.timerSeconds;
            
            if (this.timerSeconds <= 10) {
                secondsSpan.classList.add('danger');
                timerBar.classList.add('danger');
            } else {
                secondsSpan.classList.remove('danger');
                timerBar.classList.remove('danger');
            }
        }

        if (timerBar) {
            const percentage = (this.timerSeconds / 30) * 100;
            timerBar.style.width = `${percentage}%`;
        }
    },

    revealAnswer(isTimeout = false) {
        if (this.hasAnswered) return;
        this.hasAnswered = true;
        
        clearInterval(this.timerInterval);
        app.clearDimSidebar(); // Restore sidebar lighting on reveal
        
        if (window.quizTypeInterval) {
            clearInterval(window.quizTypeInterval);
            // Ensure full question text is shown immediately
            document.getElementById('question-text').innerText = this.currentQuestion.question;
        }

        const optionButtons = document.querySelectorAll('.option-btn');
        const correctIndex = this.currentQuestion.answer_index;

        optionButtons.forEach((btn, idx) => {
            if (idx === correctIndex) {
                btn.classList.remove('disabled');
                btn.classList.add('correct');
            }
        });

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
                
                // Reset multiplier after the question
                p.quizMultiplier = null;
            });

            // Broadcast the results to all mobiles
            app.broadcast({
                type: 'quiz-result',
                correctIndex: correctIndex,
                correctOptionText: this.currentQuestion.options[correctIndex],
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

        document.getElementById('reveal-answer-btn').classList.add('hidden');

        // Automatically load next question or winner selector after 4 seconds
        setTimeout(() => {
            // Restore mobile views to buzzer mode
            app.broadcast({ type: 'show-buzzer' });
            
            // Clear round answers
            app.currentRoundAnswers = {};
            app.currentCorrectAnswerIndex = null;
            
            if (hasMobileAnswers) {
                // Skip manual winner modal since we graded electronically
                this.nextQuestion();
            } else if (app.players.length > 0) {
                app.showWinnerSelection(() => {
                    this.nextQuestion();
                });
            } else {
                this.nextQuestion();
            }
        }, 4000);
    },

    nextQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.questions.length) {
            this.showQuestion();
        } else {
            // End of Quiz
            app.playSound('success');
            document.getElementById('question-text').innerText = "رائع! لقد أنهيتم جولة التحدي بنجاح!";
            document.getElementById('options-container').innerHTML = `
                <div style="grid-column: span 2; text-align: center; padding: 40px;">
                    <p style="font-size: 1.5rem; margin-bottom: 30px; color: var(--text-muted);">لعبتم جولة كاملة من الأسئلة المتنوعة، هل أنتم مستعدون لتحدي آخر؟</p>
                    <div style="display: flex; justify-content: center; gap: 20px;">
                        <button class="btn btn-secondary" onclick="quiz.startQuiz()"><svg class="icon" viewBox="0 0 24 24"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg> لعب مجدداً</button>
                        <button class="btn btn-back" onclick="app.showScreen('home-screen')"><svg class="icon" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> القائمة الرئيسية</button>
                    </div>
                </div>
            `;
            document.getElementById('next-question-btn').classList.add('hidden');
            document.getElementById('reveal-answer-btn').classList.add('hidden');
        }
    }
};
