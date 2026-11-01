<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <title>Football Legends - Online</title>
    <style>
        body { margin: 0; padding: 0; background: #000; overflow: hidden; }
        canvas { display: block; margin: 0 auto; }
        #status-bar {
            position: absolute; top: 10px; left: 10px; background: rgba(0, 0, 0, 0.8);
            color: white; padding: 8px 12px; font-family: Arial, sans-serif;
            font-size: 14px; border-radius: 6px; z-index: 9999;
        }
        #waiting-screen {
            display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: #1a1a1a; color: white; z-index: 10000;
            flex-direction: column; justify-content: center; align-items: center;
            font-family: Arial, sans-serif; text-align: center;
        }
        #waiting-screen h1 { color: #FFD400; font-size: 48px; margin-bottom: 20px; }
        #waiting-screen p { font-size: 24px; color: #ccc; }
        #waiting-screen .room-code { font-size: 36px; color: #4CAF50; font-weight: bold; margin: 20px 0; }
        .spinner { border: 8px solid #333; border-top: 8px solid #4CAF50; border-radius: 50%; width: 60px; height: 60px; animation: spin 1s linear infinite; margin-top: 30px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div id="status-bar">جار التحميل...</div>
    
    <div id="waiting-screen">
        <h1>غرفة الانتظار</h1>
        <p>أنت في الغرفة:</p>
        <div class="room-code" id="waiting-room-id">----</div>
        <p id="waiting-message">في انتظار بدء اللعبة من المضيف...</p>
        <div class="spinner"></div>
    </div>

    <script src="phaser.min.js"></script>
    <script src="nape.min.js"></script>
    <script src="dragonBones.min.js"></script>
    <script src="football_legends.min.js"></script>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>

    <script>
    (function() {
        const statusBar = document.getElementById('status-bar');
        const waitingScreen = document.getElementById('waiting-screen');
        const waitingRoomId = document.getElementById('waiting-room-id');
        const waitingMessage = document.getElementById('waiting-message');
        
        const log = (msg, color) => {
            console.log('[INJECT]', msg);
            statusBar.innerText = msg;
            if (color) statusBar.style.color = color;
        };

        const socket = io('https://gamemero-3795d2ad3d2d.herokuapp.com');
        let currentRoomId = null;
        let isHost = false;
        let remoteActions = { left: false, right: false, up: false, shoot: false, tackle: false, super: false };
        
        let isHooked = false;
        let hookedControllers = new WeakSet();
        let localInterval = null;
        let gameStarted = false;

        // ==========================================
        // 1. إعداد الغرف
        // ==========================================
        const urlParams = new URLSearchParams(window.location.search);
        const joinRoomId = urlParams.get('room');

        socket.on('connect', () => {
            log('✅ متصل بالسيرفر: ' + socket.id.substring(0, 6), '#4CAF50');
            
            if (joinRoomId) {
                isHost = false;
                setTimeout(() => {
                    socket.emit('joinRoom', { roomId: joinRoomId }, (res) => {
                        if (res.success) {
                            currentRoomId = joinRoomId;
                            showWaitingScreen(joinRoomId, 'في انتظار المضيف يبدأ اللعبة...');
                            log('🚪 انضممت للغرفة: ' + joinRoomId, '#2196F3');
                        } else {
                            log('❌ الغرفة مش موجودة', '#F44336');
                        }
                    });
                }, 500);
            } else {
                isHost = true;
                socket.emit('createRoom', (res) => {
                    currentRoomId = res.roomId;
                    log('🏠 غرفتك: ' + currentRoomId, '#FFC107');
                    const link = window.location.origin + window.location.pathname + '?room=' + currentRoomId;
                    console.log('%cشارك الرابط ده مع صاحبك: ' + link, 'color: yellow; font-size: 16px;');
                    alert('الغرفة جاهزة!\n\nرابط الانضمام لصاحبك:\n' + link);
                });
            }
        });

        socket.on('opponentAction', (data) => {
            remoteActions = data.actions;
        });

        // إشارة بدء اللعبة للضيف
        socket.on('startGame', () => {
            if (isHost) return;
            console.log('[INJECT] 🚀 وصلت إشارة startGame!');
            alert('المضيف بدأ اللعبة! جاري الدخول للملعب...');
            log('🚀 المضيف بدأ اللعبة!', '#4CAF50');
            hideWaitingScreen();
            gameStarted = true;
            
            // الضيف يدخل الجيم علطول
            setTimeout(() => {
                enterGameAsGuest();
            }, 500);
        });

        function showWaitingScreen(roomId, msg) {
            waitingRoomId.innerText = roomId;
            waitingMessage.innerText = msg;
            waitingScreen.style.display = 'flex';
        }

        function hideWaitingScreen() {
            waitingScreen.style.display = 'none';
        }

        // ==========================================
        // 2. دخول الضيف للجيم مباشرة
        // ==========================================
        function enterGameAsGuest() {
            if (!window.game) {
                console.log('[INJECT] ⏳ اللعبة لسه مش جاهزة، بنستنى...');
                setTimeout(enterGameAsGuest, 500);
                return;
            }

            const game = window.game;

            try {
                console.log('[INJECT] 🎮 الضيف بيبدأ اللعبة كـ 1 Player...');
                
                // نحاول نضبط بيانات المباراة
                try {
                    // نحاول نوصل لـ MatchData
                    if (window.Phaser && Phaser.GAMES && Phaser.GAMES[0]) {
                        // طريقة بديلة: نبدأ الـ Gameplay مباشرة
                    }
                } catch(e) {}

                // نبدأ اللعبة
                game.state.start('gameplay', true, false);
                gameStarted = true;
                
            } catch(e) {
                console.error('[INJECT] خطأ في دخول الضيف:', e);
                setTimeout(enterGameAsGuest, 1000);
            }
        }

        // ==========================================
        // 3. البحث عن اللعبة
        // ==========================================
        let attempts = 0;
        function findPhaserGame() {
            if (window.game && window.game.state) return window.game;
            if (typeof Phaser !== 'undefined' && Phaser.GAMES && Phaser.GAMES.length > 0) return Phaser.GAMES[0];
            for (let key in window) {
                try {
                    const obj = window[key];
                    if (obj && obj.state && obj.state.states && obj.renderer) return obj;
                } catch (e) {}
            }
            return null;
        }

        function tryIntercept() {
            attempts++;
            const foundGame = findPhaserGame();
            if (!foundGame) {
                if (attempts < 100) setTimeout(tryIntercept, 100);
                return;
            }
            window.game = foundGame;
            log('🎮 تم العثور على اللعبة!', '#4CAF50');
            
            // نعترض دالة update الرئيسية
            const originalUpdate = foundGame.update.bind(foundGame);
            foundGame.update = function(time) {
                originalUpdate(time);
                
                if (!isHooked && gameStarted) {
                    try { findPlayersAndHook(); } catch(e) {}
                }
            };
            
            // لو المضيف، نعترض زر Play
            if (isHost) {
                hookHostPlayButton();
            }
        }

        // ==========================================
        // 4. اعتراض زر "PLAY" للمضيف
        // ==========================================
        function hookHostPlayButton() {
            const checkPlayBtn = setInterval(() => {
                const menuState = window.game.state.states && window.game.state.states.menu2;
                if (menuState && menuState.playBtn) {
                    clearInterval(checkPlayBtn);
                    const originalPlay = menuState.onPlay.bind(menuState);
                    menuState.onPlay = function() {
                        if (currentRoomId) {
                            socket.emit('hostStartGame', { roomId: currentRoomId });
                            console.log('[INJECT] 🚀 المضيف بدأ - بعتنا إشارة للضيف');
                        }
                        gameStarted = true;
                        originalPlay();
                    };
                    console.log('[INJECT] ✅ اعترضنا زر Play للمضيف');
                }
            }, 500);
        }

        // ==========================================
        // 5. الرادار - أداة التفتيش
        // ==========================================
        let scanCount = 0;
        function findPlayersAndHook() {
            scanCount++;
            if (scanCount % 20 !== 0) return; // نطبع كل 20 مرة

            console.log('[INJECT] 🔍 بدء مسح جديد... (محاولة ' + scanCount + ')');
            
            let foundPlayers = [];
            
            function scanObj(obj, depth, path) {
                if (!obj || depth > 5) return;
                try {
                    // هل ده لاعب؟
                    if (obj.armature && obj.body && obj.controller) {
                        foundPlayers.push({ obj, path });
                    }
                    
                    for (let key in obj) {
                        if (['game', 'world', 'parent', 'sprite', 'graphic'].includes(key)) continue;
                        try {
                            const child = obj[key];
                            if (child && typeof child === 'object') {
                                scanObj(child, depth + 1, path + '.' + key);
                            }
                        } catch(e) {}
                    }
                } catch(e) {}
            }

            const game = window.game;
            scanObj(game.world, 0, 'game.world');
            
            if (game.state && game.state.states) {
                for (let stateName in game.state.states) {
                    scanObj(game.state.states[stateName], 0, 'state.' + stateName);
                }
            }

            console.log('[INJECT] 📊 لقينا ' + foundPlayers.length + ' كائن يشبه اللاعب');
            
            foundPlayers.forEach(({obj, path}) => {
                console.log('[INJECT] 📍 مسار اللاعب:', path, '| direction:', obj.direction, '| playerID:', obj.playerID);
                
                if (obj.controller && !hookedControllers.has(obj.controller)) {
                    hookedControllers.add(obj.controller);
                    hookPlayerController(obj);
                }
            });
        }

        // ==========================================
        // 6. ربط التحكم
        // ==========================================
        function hookPlayerController(player) {
            const controller = player.controller;
            const dir = player.direction;
            
            console.log('[INJECT] 🎮 لقينا لاعب! direction:', dir, 'playerID:', player.playerID);

            if (dir === 1) {
                controller.getMove = function() {
                    if (remoteActions.left) return -1;
                    if (remoteActions.right) return 1;
                    return 0;
                };
                controller.getJump = function() { return remoteActions.up || false; };
                controller.readyToJump = function() { return !remoteActions.up; };
                controller.getShoot = function() { return remoteActions.shoot || false; };
                controller.getTackle = function() { return remoteActions.tackle || false; };
                controller.getSuperShot = function() { return remoteActions.super || false; };
                console.log('[INJECT] ✅ تحكم اللاعب البعيد مربوط بالسيرفر (dir:1)');
                isHooked = true;
            } else if (dir === -1) {
                const origMove = controller.getMove.bind(controller);
                const origJump = controller.getJump.bind(controller);
                const origShoot = controller.getShoot.bind(controller);
                const origTackle = controller.getTackle.bind(controller);
                const origSuper = controller.getSuperShot.bind(controller);

                let lastSent = '';
                if (localInterval) clearInterval(localInterval);
                localInterval = setInterval(() => {
                    if (!currentRoomId) return;
                    const move = origMove();
                    const state = {
                        left: move === -1,
                        right: move === 1,
                        up: origJump(),
                        shoot: origShoot(),
                        tackle: origTackle(),
                        super: origSuper()
                    };
                    const stateStr = JSON.stringify(state);
                    if (stateStr !== lastSent) {
                        lastSent = stateStr;
                        socket.emit('playerAction', { roomId: currentRoomId, actions: state });
                    }
                }, 50);
                console.log('[INJECT] ✅ اللاعب المحلي مربوط بالسيرفر (dir:-1)');
                isHooked = true;
            }
        }

        setTimeout(tryIntercept, 2000);
    })();
    </script>
</body>
</html>
