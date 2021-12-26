const express = require("express");
const path = require("path");
let app = express();

const PORT = process.env.PORT || 5000;

let server = app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});

const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

let userConnections = [];
io.on("connection", (socket) => {
  console.log("socket id is ", socket.id);

  socket.on("userconnect", (data) => {
    let other_users = userConnections.filter((user) => {
      return user.meeting_id === data.meeting_id;
    });
    console.log("userconnect", data.displayName, data.meeting_id);
    userConnections.push({
      connectionId: socket.id,
      user_id: data.displayName,
      meeting_id: data.meeting_id,
    });

    other_users.forEach((user) => {
      socket.to(user.connectionId).emit("inform_others_about_me", {
        other_user_id: data.displayName,
        connId: socket.id,
      });
    });

    socket.emit("inform_me_about_other_user", other_users);
  });

  socket.on("SDPProcess", (data) => {
    socket.to(data.to_connid).emit("SDPProcess", {
      message: data.message,
      from_connid: socket.id,
    });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    let disconnectedUser = userConnections.find(
      (user) => user.connectionId === socket.id
    );
    if (disconnectedUser) {
      let meeting_id = disconnectedUser.meeting_id;
      userConnections = userConnections.filter(
        (user) => user.connectionId !== socket.id
      );
      let list = userConnections.filter(
        (user) => user.meeting_id === meeting_id
      );
      list.forEach((user) => {
        socket
          .to(user.connectionId)
          .emit("inform_others_about_disconnected_user", {
            connId: socket.id,
          });
      });
    }
  });
});
