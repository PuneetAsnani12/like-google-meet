const express = require("express");
const path = require("path");
// const fs = require("fs");
// const cors = require("cors")
// const fileUpload = require("express-fileupload");
let app = express();

const PORT = process.env.PORT || 5000;

let server = app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});

const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname, "build")));
// app.use(cors())
// app.get("/downloadFile", (req, res) => {
//   let filePath = req.query.path;
//   res.download(path.join(__dirname, filePath));
// });

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// app.use(fileUpload());

// app.post("/attachment", (req, res) => {
//   let data = req.body;
//   let imageFile = req.files.zipfile;

//   let dir = "public/attachments/" + data.meeting_id + "/";
//   let systemPath = path.join(__dirname, dir);

//   if (!fs.existsSync(path.join(__dirname, "public")))
//     fs.mkdirSync(path.join(__dirname, "public"));
//   if (!fs.existsSync(path.join(__dirname, "public/attachments")))
//     fs.mkdirSync(path.join(__dirname, "public/attachments"));
//   if (!fs.existsSync(systemPath)) {
//     fs.mkdirSync(systemPath);
//   }

//   imageFile.mv(path.join(systemPath, imageFile.name), (err) => {
//     if (err)
//       res
//         .status(500)
//         .send({ status: false, msg: "couldn't upload the image file" });
//     else
//       res
//         .status(200)
//         .send({ status: true, msg: "Image file successfully uploaded" });
//   });
// });

let userConnections = [];
io.on("connection", (socket) => {
  // console.log("socket id is ", socket.id);

  socket.on("userconnect", (data) => {
    let other_users = userConnections.filter((user) => {
      return user.meeting_id === data.meeting_id;
    });
    // console.log(
    //   "userconnect",
    //   data.displayName,
    //   data.meeting_id,
    //   data.photoURL
    // );
    userConnections.push({
      connectionId: socket.id,
      user_id: data.displayName,
      meeting_id: data.meeting_id,
      photoURL: data.photoURL,
    });

    other_users.forEach((user) => {
      socket.to(user.connectionId).emit("inform_others_about_me", {
        other_user_id: data.displayName,
        connId: socket.id,
        photoURL: data.photoURL,
        userNumber: other_users.length + 1,
      });
    });

    socket.emit("inform_me_about_other_user", other_users);
  });

  socket.on("inform_others_about_my_video_disconnection", (meeting_id) => {
    let other_users = userConnections.filter((user) => {
      return user.meeting_id === meeting_id;
    });
    other_users.forEach((user) => {
      socket.to(user.connectionId).emit("someones_video_disconnected", {
        disconnectedUser: socket.id,
      });
    });
  });

  socket.on("SDPProcess", (data) => {
    socket.to(data.to_connid).emit("SDPProcess", {
      message: data.message,
      from_connid: socket.id,
    });
  });

  socket.on("sendMessage", (message) => {
    let mUser = userConnections.find((user) => user.connectionId === socket.id);
    if (mUser) {
      let meeting_id = mUser.meeting_id;
      let from = mUser.user_id;
      let list = userConnections.filter((p) => p.meeting_id === meeting_id);
      list.forEach((user) => {
        socket.to(user.connectionId).emit("showChatMessage", {
          from,
          message,
        });
      });
    }
  });

  socket.on("fileTransferToOthers", (data) => {
    let { user_id, meeting_id, attachedFilePath, attachedFileName, uploadedLink } = data;
    let mUser = userConnections.find((user) => user.connectionId === socket.id);
    if (mUser) {
      let meeting_id = mUser.meeting_id;
      let from = mUser.user_id;
      let list = userConnections.filter((p) => p.meeting_id === meeting_id);
      list.forEach((user) => {
        socket.to(user.connectionId).emit("showFileMessage", {
          user_id,
          meeting_id,
          attachedFilePath,
          attachedFileName,
          uploadedLink
        });
      });
    }
  });

  socket.on("disconnect", () => {
    // console.log("user disconnected");
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
            userNumber: list.length,
          });
      });
    }
  });
});
