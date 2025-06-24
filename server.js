import express from "express";
import http from "http";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
app.use(express.json());

const rooms = {};

app.post('/create-room', (req, res) => {
  const id = nanoid(6);
  rooms[id] = { ownerId: null, users: {} };
  res.json({ roomId: id });
});

app.get('/room/:id', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'room.html'));
});

io.on('connection', (socket) => {
  console.log('Bağlantı:', socket.id);

  socket.on('joinRoom', ({ roomId, name, role }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.name = name;
    socket.role = role;

    if (!rooms[roomId].ownerId) {
      rooms[roomId].ownerId = socket.id;
    }

    rooms[roomId].users[socket.id] = { name, role, vote: null };

    io.to(socket.id).emit('ownerInfo', { isOwner: socket.id === rooms[roomId].ownerId });
    io.to(roomId).emit('updatePlayers', getPlayers(roomId));
    io.to(roomId).emit('updateVotes', getVotes(roomId, false));
  });

  socket.on('vote', (vote) => {
    const roomId = socket.roomId;
    if (!rooms[roomId]) return;
    rooms[roomId].users[socket.id].vote = vote;
    io.to(roomId).emit('updateVotes', getVotes(roomId, false));
  });

  socket.on('reveal', () => {
    const roomId = socket.roomId;
    io.to(roomId).emit('updateVotes', getVotes(roomId, true));
  });

  socket.on('reset', () => {
    const roomId = socket.roomId;
    Object.values(rooms[roomId].users).forEach(u => u.vote = null);
    io.to(roomId).emit('updateVotes', getVotes(roomId, false));
    io.to(roomId).emit('resetSelection');
  });

  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (rooms[roomId] && rooms[roomId].users) {
      delete rooms[roomId].users[socket.id];
      io.to(roomId).emit('updatePlayers', getPlayers(roomId));
      io.to(roomId).emit('updateVotes', getVotes(roomId, false));
    }
  });
});

function getVotes(roomId, revealed) {
  if (!rooms[roomId]) return [];
  return Object.values(rooms[roomId].users)
    .filter(u => u.vote !== null || revealed)
    .map(u => ({
      name: u.name,
      role: u.role,
      vote: revealed ? u.vote : null
    }));
}

function getPlayers(roomId) {
  if (!rooms[roomId]) return [];
  return Object.values(rooms[roomId].users).map(u => ({ name: u.name, role: u.role }));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
});
