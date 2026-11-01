const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // للسماح بالاتصال من أي مكان
});

app.get('/', (req, res) => {
  res.send('سيرفر اللعبة شغال! 🚀');
});

io.on('connection', (socket) => {
  console.log('لاعب اتصل:', socket.id);

  // 1. إنشاء غرفة جديدة (للمضيف)
  socket.on('createRoom', (callback) => {
    // نولد كود عشوائي للغرفة (4 أرقام)
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    socket.join(roomId);
    console.log(`🏠 غرفة جديدة اتعملت: ${roomId} بواسطة ${socket.id}`);
    
    // نرد على اللاعب اللي عمل الغرفة
    if (callback) callback({ roomId: roomId });
  });

  // 2. الانضمام لغرفة (للضيف)
  socket.on('joinRoom', (data, callback) => {
    const roomId = data.roomId;
    
    // نتأكد إن الغرفة موجودة
    if (io.sockets.adapter.rooms.has(roomId)) {
      socket.join(roomId);
      console.log(`🚪 لاعب ${socket.id} انضم للغرفة ${roomId}`);
      
      // نبلغ اللاعب اللي في الغرفة إن حد انضم (اختياري)
      socket.to(roomId).emit('playerJoined', { socketId: socket.id });
      
      if (callback) callback({ success: true });
    } else {
      console.log(`❌ محاولة انضمام لغرفة غير موجودة: ${roomId}`);
      if (callback) callback({ success: false, message: "الغرفة غير موجودة" });
    }
  });

  // 3. المضيف بدأ اللعبة
  socket.on('hostStartGame', (data) => {
    // نبعت إشارة لكل اللي في الغرفة (ما عدا المضيف)
    socket.to(data.roomId).emit('startGame');
    console.log(`🚀 المضيف بدأ اللعبة في الغرفة ${data.roomId}`);
  });

  // 4. استقبال حركة اللاعب وبثها للاعب التاني في نفس الغرفة
  socket.on('playerAction', (data) => {
    // نبعت الحركة لكل اللي في نفس الغرفة (ما عدا اللي بعتها)
    socket.to(data.roomId).emit('opponentAction', data);
  });

  // 5. عند قطع الاتصال
  socket.on('disconnect', () => {
    console.log('❌ لاعب قطع الاتصال:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ السيرفر شغال على بورت ${PORT}`);
});
