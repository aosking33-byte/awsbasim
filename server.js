const http = require('http');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const PORT = process.env.PORT || 8080;

// ── Find Wi-Fi IP ──────────────────────────────────────────
function getLocalIP() {
    const ifaces = os.networkInterfaces();
    let wifi = null, fallback = null;
    for (const dev in ifaces) {
        const up = dev.toUpperCase();
        if (up.includes('VIRTUAL')||up.includes('VPN')||up.includes('TAP')||
            up.includes('TUNNEL')||up.includes('LOCAL AREA CONNECTION*')) continue;
        for (const a of ifaces[dev]) {
            if (a.family==='IPv4' && !a.internal && a.address.startsWith('192.168')) {
                if (up.includes('WI-FI')||up.includes('WIFI')||up.includes('WIRELESS')) wifi=a.address;
                else fallback = fallback || a.address;
            }
        }
    }
    const ip = wifi || fallback || 'localhost';
    console.log('✅ IP:', ip);
    return ip;
}
// Called fresh each request so it picks up IP changes (DHCP)
function getFreshIP() { return getLocalIP(); }
let localIP = getLocalIP();

// ── Game State ─────────────────────────────────────────────
// rooms[roomId] = {
//   tvEvents: [],          <- events waiting to be read by TV (HTTP poll)
//   players: {name: {avatar, powerCard, powerUsed, ready, events:[]}},
//   lastActivity: Date.now()
// }
const rooms = {};

const POWER_CARDS = [
    { icon:'⚡', name:'صاعقة المضاعفة',  desc:'تضاعف نقاطك في هذا السؤال ×2 عند التفعيل' },
    { icon:'🛡️', name:'درع الحماية',      desc:'تحمي نقاطك من الخسارة مرة واحدة' },
    { icon:'🔥', name:'النار المقدسة',    desc:'تعطي فرصة ثانية للإجابة إذا أخطأت' },
    { icon:'🌪️', name:'العاصفة',          desc:'تخصم 5 نقاط من المنافس الأقوى' },
    { icon:'💎', name:'الجوهرة',           desc:'تعطيك 10 نقاط مجانية فوراً عند التفعيل' },
    { icon:'🎯', name:'الدقة المطلقة',    desc:'إذا أجبت صح تحصل على ضعف النقاط' },
    { icon:'🌙', name:'ليلة القدر',       desc:'تجمّد نقاط جميع المنافسين لجولة واحدة' },
    { icon:'🚀', name:'الصاروخ',          desc:'ترفع نقاطك 15 نقطة فورية عند التفعيل' },
];
const AVATARS = ['😎','🤠','🥳','🤓','🤖','👾','👑','🧙','🥷','🦸'];

function getRandPowerCard() { return POWER_CARDS[Math.floor(Math.random()*POWER_CARDS.length)]; }
function getRandAvatar(used) {
    const avail = AVATARS.filter(a=>!used.includes(a));
    const pool  = avail.length ? avail : AVATARS;
    return pool[Math.floor(Math.random()*pool.length)];
}

// Push event to TV queue
function tvPush(room, evt) { room.tvEvents.push(evt); }
// Push event to specific mobile player queue
function mobilePush(room, name, evt) {
    if (room.players[name]) room.players[name].events.push(evt);
}
// Push event to ALL mobile players
function mobileAll(room, evt) {
    Object.values(room.players).forEach(p => p.events.push({...evt}));
}

// Clean stale rooms (inactive > 2 hours)
setInterval(() => {
    const now = Date.now();
    Object.keys(rooms).forEach(id => {
        if (now - rooms[id].lastActivity > 7200000) delete rooms[id];
    });
}, 60000);

// ── Mime Types ────────────────────────────────────────────
const MIME = {
    '.html':'text/html; charset=utf-8', '.css':'text/css',
    '.js':'application/javascript',     '.png':'image/png',
    '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.json':'application/json',
    '.gif':'image/gif',  '.ico':'image/x-icon'
};

// ── Helper: JSON response ─────────────────────────────────
function jsonRes(res, data, status=200) {
    res.writeHead(status, {
        'Content-Type':'application/json',
        'Access-Control-Allow-Origin':'*',
        'Cache-Control':'no-store'
    });
    res.end(JSON.stringify(data));
}

// ── HTTP Server ───────────────────────────────────────────
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','Content-Type');
    if (req.method==='OPTIONS') { res.writeHead(204); res.end(); return; }

    const url  = new URL(req.url, `http://${req.headers.host}`);
    const p    = url.pathname;
    const q    = url.searchParams;

    // ── API: Get local IP (fresh every call) ──
    if (p === '/api/local-ip') {
        localIP = getFreshIP();
        return jsonRes(res, { ip: localIP, port: PORT, url: `http://${localIP}:${PORT}/` });
    }

    // ── API: Ping / health check ──
    if (p === '/api/ping') {
        return jsonRes(res, { ok: true, ip: localIP, port: PORT, ts: Date.now() });
    }

    // ── API: TV creates/registers a room ──
    // POST: server generates ID  |  GET ?room=fam-XXXXX: client provides ID
    if (p === '/api/room/create') {
        let roomId;
        if (req.method === 'GET') {
            roomId = q.get('room');
            if (!roomId) return jsonRes(res, { ok:false, error:'missing room param' }, 400);
        } else {
            roomId = 'fam-' + Math.floor(100000+Math.random()*900000);
        }
        rooms[roomId] = { tvEvents:[], players:{}, lastActivity:Date.now() };
        console.log(`📺 Room ready: ${roomId}`);
        return jsonRes(res, { ok:true, roomId });
    }


    // ── API: Mobile joins ──
    if (p === '/api/room/join' && req.method==='POST') {
        let body = '';
        req.on('data', c => body+=c);
        req.on('end', () => {
            try {
                const { roomId, name } = JSON.parse(body);
                const room = rooms[roomId];
                if (!room) return jsonRes(res, { ok:false, error:'الغرفة غير موجودة' });
                if (!name || !name.trim()) return jsonRes(res, { ok:false, error:'الاسم فارغ' });
                const cleanName = name.trim().substring(0,15);
                if (room.players[cleanName]) return jsonRes(res, { ok:false, error:'هذا الاسم مستخدم!' });

                const avatar    = getRandAvatar(Object.values(room.players).map(p=>p.avatar));
                const powerCard = getRandPowerCard();
                room.players[cleanName] = { avatar, powerCard, powerUsed:false, ready:false, events:[] };
                room.lastActivity = Date.now();

                // Notify TV
                tvPush(room, { type:'player-joined', name:cleanName, avatar, powerCard, totalPlayers:Object.keys(room.players).length });
                console.log(`📱 ${cleanName} joined ${roomId}`);
                return jsonRes(res, { ok:true, name:cleanName, avatar, powerCard });
            } catch(e) { return jsonRes(res, { ok:false, error:'بيانات خاطئة' }, 400); }
        });
        return;
    }

    // ── API: Mobile marks ready ──
    if (p === '/api/room/ready' && req.method==='POST') {
        let body = '';
        req.on('data', c => body+=c);
        req.on('end', () => {
            try {
                const { roomId, name } = JSON.parse(body);
                const room = rooms[roomId];
                if (!room || !room.players[name]) return jsonRes(res, { ok:false });
                room.players[name].ready = true;
                room.lastActivity = Date.now();
                tvPush(room, { type:'player-ready', name });
                return jsonRes(res, { ok:true });
            } catch(e) { return jsonRes(res, { ok:false }, 400); }
        });
        return;
    }

    // ── API: Mobile uses power card ──
    if (p === '/api/room/power' && req.method==='POST') {
        let body = '';
        req.on('data', c => body+=c);
        req.on('end', () => {
            try {
                const { roomId, name } = JSON.parse(body);
                const room = rooms[roomId];
                if (!room || !room.players[name] || room.players[name].powerUsed) return jsonRes(res, { ok:false });
                room.players[name].powerUsed = true;
                room.lastActivity = Date.now();
                tvPush(room, { type:'player-used-power', name, powerCard: room.players[name].powerCard });
                mobilePush(room, name, { type:'power-used' });
                return jsonRes(res, { ok:true });
            } catch(e) { return jsonRes(res, { ok:false }, 400); }
        });
        return;
    }

    // ── API: Mobile submits answer ──
    if (p === '/api/room/answer' && req.method==='POST') {
        let body = '';
        req.on('data', c => body+=c);
        req.on('end', () => {
            try {
                const { roomId, name, answerIndex } = JSON.parse(body);
                const room = rooms[roomId];
                if (!room || !room.players[name]) return jsonRes(res, { ok:false });
                room.lastActivity = Date.now();
                tvPush(room, { type:'player-answer', name, answerIndex });
                return jsonRes(res, { ok:true });
            } catch(e) { return jsonRes(res, { ok:false }, 400); }
        });
        return;
    }

    // ── API: Mobile polls for events ──
    if (p === '/api/room/mobile-poll') {
        const roomId = q.get('room');
        const name   = q.get('name');
        const room   = rooms[roomId];
        if (!room) return jsonRes(res, { ok:false, error:'room_not_found' });
        if (!name || !room.players[name]) return jsonRes(res, { ok:false, error:'player_not_found' });
        room.lastActivity = Date.now();
        const events = room.players[name].events.splice(0);
        return jsonRes(res, { ok:true, events });
    }

    // ── API: TV polls for events ──
    if (p === '/api/room/tv-poll') {
        const roomId = q.get('room');
        const room   = rooms[roomId];
        if (!room) return jsonRes(res, { ok:false, events:[] });
        room.lastActivity = Date.now();
        const events = room.tvEvents.splice(0);
        return jsonRes(res, { ok:true, events });
    }

    // ── API: TV broadcasts to all mobiles ──
    if (p === '/api/room/broadcast' && req.method==='POST') {
        let body = '';
        req.on('data', c => body+=c);
        req.on('end', () => {
            try {
                const { roomId, event } = JSON.parse(body);
                const room = rooms[roomId];
                if (!room) return jsonRes(res, { ok:false });
                mobileAll(room, event);
                room.lastActivity = Date.now();
                console.log(`📡 TV broadcast: ${event.type} → ${Object.keys(room.players).length} players`);
                return jsonRes(res, { ok:true });
            } catch(e) { return jsonRes(res, { ok:false }, 400); }
        });
        return;
    }

    // ── Static files ──
    let filePath = path.join(__dirname, p === '/' ? 'index.html' : p);
    const ext = path.extname(filePath).toLowerCase();
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not Found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control':'no-store' });

        // Inject the real server IP into index.html so JS never needs to fetch it
        if ((p === '/' || p === '/index.html') && ext === '.html') {
            const freshIP = getFreshIP();
            const injected = `<script>window.__SERVER_IP__="${freshIP}";window.__SERVER_PORT__=${PORT};</script>`;
            const html = data.toString().replace('</head>', injected + '\n</head>');
            res.end(html);
        } else {
            res.end(data);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(56));
    console.log('  🎮 سهرة العائلة — السيرفر يعمل!');
    console.log('='.repeat(56));
    console.log(`\n  📺 التلفزيون:\n      http://${localIP}:${PORT}/\n`);
    console.log(`  📱 الجوالات تمسح الـ QR Code\n`);
    console.log('='.repeat(56));
});
