const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // للسماح بالاتصال من أي مكان
});

app.get('/', (req, res) => {
  res.send('سيرفر اللعبة شغال!');
});

io.on('connection', (socket) => {
  console.log('لاعب اتصل:', socket.id);

  // استقبال رسالة من اللاعب
  socket.on('playerAction', (data) => {
    console.log('اللاعب عمل حركة:', data);
    // نبعت الحركة دي لكل اللاعبين التانيين في نفس الغرفة (هنضيف الغرف بعدين)
    socket.broadcast.emit('opponentAction', data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`السيرفر شغال على بورت ${PORT}`);
});