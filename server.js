const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.get('/', (req, res) => {
  res.send('سيرفر اللعبة شغال!');
});

io.on('connection', (socket) => {
  console.log('لاعب اتصل:', socket.id);

  // 1. حدث إنشاء غرفة
  socket.on('createRoom', (callback) => {
    // نولد كود عشوائي للغرفة (مثلاً: 4 أرقام)
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    socket.join(roomId);
    console.log(`غرفة جديدة اتعملت: ${roomId} بواسطة ${socket.id}`);
    
    // نرد على اللاعب اللي عمل الغرفة
    if (callback) callback({ roomId: roomId });
  });

  // 2. حدث الانضمام لغرفة
  socket.on('joinRoom', (data, callback) => {
    const roomId = data.roomId;
    // نتأكد إن الغرفة موجودة
    if (io.sockets.adapter.rooms.has(roomId)) {
      socket.join(roomId);
      console.log(`لاعب ${socket.id} انضم للغرفة ${roomId}`);
      
      // نبلغ اللاعب اللي في الغرفة إن حد انضم
      socket.to(roomId).emit('playerJoined', { socketId: socket.id });
      
      if (callback) callback({ success: true });
    } else {
      if (callback) callback({ success: false, message: "الغرفة غير موجودة" });
    }
  });

  // 3. حدث استقبال الحركة وبثها للاعب التاني في نفس الغرفة
  socket.on('playerAction', (data) => {
    // نبعت الحركة لكل اللي في نفس الغرفة (ما عدا اللي بعتها)
    socket.to(data.roomId).emit('opponentAction', data);
  });

  socket.on('disconnect', () => {
    console.log('لاعب قطع الاتصال:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`السيرفر شغال على بورت ${PORT}`);
});
