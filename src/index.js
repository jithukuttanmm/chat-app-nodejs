const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage } = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(message)) return callback("No bad words");

    io.to(user.room).emit("broadcast", generateMessage(message, user.username));
    callback("Delivered");
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "broadcast",
        generateMessage(`${user.username} has left.`, "Admin")
      );
      //update users list
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ room, username, id: socket.id });

    if (error) return callback(error);
    socket.join(user.room); /// only in server local to room

    socket.emit("broadcast", generateMessage("Welcome!", "Admin"));
    //update users list
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    socket.broadcast
      .to(user.room)
      .emit(
        "broadcast",
        generateMessage(`${user.username} has joined !`, "Admin")
      );
  });
});

server.listen(port, () => {
  console.log(`Server started ! on port ${port}.`);
});
