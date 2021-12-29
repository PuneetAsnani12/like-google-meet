import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import pImage from "../../assets/images/other.jpg";
import axios from "axios";
// const download = require("downloadjs");

let serverProcess;
let peers_connection_ids = {};
let peers_connection = {};
let remote_vid_stream = {};
let remote_aud_stream = {};
let audio;
let isAudioMute = true;
let rtp_aud_senders = {};
let video_states = {
  none: 0,
  camera: 1,
  screenshare: 2,
};
let video_state = video_states.none;
let videoCamTrack;
let local_div;
let rtp_vid_senders = {};

function MeetingPage({ socket }) {
  let params = useParams();
  let navigate = useNavigate();
  let [messages, setMessages] = useState([]);
  let messagesDIVS = useRef([]);
  let [participants, setParticipants] = useState([]);
  let [showLeaveDialog, setShowLeaveDialog] = useState(false);
  let [showMeetingDetails, setShowMeetingDetails] = useState(false);
  let [attachedAreaDiv, setAttachedAreaDiv] = useState([]);
  let participantsDIVS = useRef([]);
  let formRef = useRef("uploadForm");

  const AppProcessInit = async (SDP_function, my_connid) => {
    await _init(SDP_function, my_connid);
  };
  const _init = async (SDP_function, my_connid) => {
    serverProcess = SDP_function;
    // my_connection_id = my_connid;
    eventProcess();
    local_div = document.getElementById("localVideoPlayer");
  };
  const eventProcess = () => {
    document.getElementById("micMuteUnmute").onclick = async function () {
      if (!audio) {
        await loadAudio();
      }
      if (!audio) {
        alert("Audio permission has not been granted");
        return;
      }
      if (isAudioMute) {
        audio.enabled = true;
        this.innerHTML =
          '<span class="material-icons" style="width:100%">mic</span>';
        updateMediaSenders(audio, rtp_aud_senders);
      } else {
        audio.enabled = false;
        this.innerHTML =
          '<span class="material-icons" style="width:100%">mic_off</span>';
        removeMediaSenders(rtp_aud_senders);
      }
      isAudioMute = !isAudioMute;
    };
    document.getElementById("videoCamOnOff").onclick = async function () {
      if (video_state == video_states.camera) {
        await videoProcess(video_states.none);
      } else {
        await videoProcess(video_states.none);
        await videoProcess(video_states.camera);
      }
    };
    document.getElementById("btnScreenShareOnOff").onclick = async function () {
      if (video_state == video_states.screenshare) {
        await videoProcess(video_states.none);
      } else {
        await videoProcess(video_states.none);
        await videoProcess(video_states.screenshare);
      }
    };
  };

  const loadAudio = async () => {
    try {
      let aStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
      audio = aStream.getAudioTracks()[0];
      audio.enabled = false;
    } catch (error) {
      console.log("error in getting audio");
    }
  };

  const connection_status = (connection) => {
    if (
      connection &&
      (connection.connectionState == "new" ||
        connection.connectionState == "connecting" ||
        connection.connectionState == "connected")
    ) {
      return true;
    } else {
      return false;
    }
  };

  const updateMediaSenders = async (track, rtp_senders) => {
    for (let con_id in peers_connection_ids) {
      if (connection_status(peers_connection[con_id])) {
        if (rtp_senders[con_id] && rtp_senders[con_id].track) {
          rtp_senders[con_id].replaceTrack(track);
        } else {
          rtp_senders[con_id] = peers_connection[con_id].addTrack(track);
        }
      }
    }
  };

  const removeMediaSenders = (rtp_senders) => {
    for (let con_id in peers_connection_ids) {
      if (rtp_senders[con_id] && connection_status(peers_connection[con_id])) {
        peers_connection[con_id].removeTrack(rtp_senders[con_id]);
        rtp_senders[con_id] = null;
      }
    }
  };
  const removeVideoStream = (rtp_vid_senders) => {
    if (videoCamTrack) {
      videoCamTrack.stop();
      videoCamTrack = null;
      local_div.srcObject = null;
      removeMediaSenders(rtp_vid_senders);
    }
  };
  const getDevice = async () => {
    let deviceID = null;
    let gotDevices = await navigator.mediaDevices.enumerateDevices();
    gotDevices.forEach(function (device) {
      if (device.kind === "videoinput" && !device.label.includes("OBS")) {
        deviceID = device.deviceId;
      }
    });
    return deviceID;
  };
  const videoProcess = async (newVideoState) => {
    if (newVideoState == video_states.none) {
      document.getElementById("videoCamOnOff").innerHTML =
        '<span class="material-icons" style="width:100%">videocam_off</span>';
      document.getElementById("btnScreenShareOnOff").innerHTML =
        '<span class="material-icons">present_to_all</span> <div>Present Now</div>';
      video_state = newVideoState;
      removeVideoStream(rtp_vid_senders);
      return;
    }
    try {
      let vStream = null;
      if (newVideoState == video_states.camera) {
        let deviceID = await getDevice();
        vStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: deviceID ? { exact: deviceID } : undefined,
            width: 1920,
            height: 1080,
          },
          audio: false,
        });
      } else if (newVideoState == video_states.screenshare) {
        vStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: 1920,
            height: 1080,
          },
          audio: true,
        });
        vStream.oninactive = (e) => {
          removeVideoStream(rtp_vid_senders);
          document.getElementById("videoCamOnOff").innerHTML =
            '<span class="material-icons" style="width:100%">videocam_off</span>';
          document.getElementById("btnScreenShareOnOff").innerHTML =
            '<span class="material-icons">present_to_all</span> <div>Present Now</div>';
        };
      }
      if (vStream && vStream.getVideoTracks().length > 0) {
        videoCamTrack = vStream.getVideoTracks()[0];
        if (videoCamTrack) {
          local_div.srcObject = new MediaStream([videoCamTrack]);
          updateMediaSenders(videoCamTrack, rtp_vid_senders);
        }
      }
    } catch (error) {
      console.log(error);
    }
    video_state = newVideoState;
    if (newVideoState == video_states.camera) {
      document.getElementById("btnScreenShareOnOff").innerHTML =
        '<span class="material-icons" width="100%">present_to_all</span> <div>Present Now</div>';
      document.getElementById("videoCamOnOff").innerHTML =
        '<span class="material-icons" style="width:100%">videocam_on</span>';
    } else if (newVideoState == video_states.screenshare) {
      document.getElementById("videoCamOnOff").innerHTML =
        '<span class="material-icons" style="width:100%">videocam_off</span>';
      document.getElementById("btnScreenShareOnOff").innerHTML =
        '<span class="material-icons" width="100%">close</span> <div>Stop Presenting</div>';
    }
  };
  const addUser = (other_user_id, connId, userNum) => {
    let newDivId = document.getElementById("otherTemplate").cloneNode(true);
    newDivId.setAttribute("id", connId);
    newDivId.classList.add("other");
    newDivId.firstChild.textContent = other_user_id;
    newDivId.getElementsByTagName("video")[0].setAttribute("id", "v_" + connId);
    newDivId.getElementsByTagName("audio")[0].setAttribute("id", "a_" + connId);
    newDivId.style.display = "flex";
    document.getElementById("divUsers").append(newDivId);
    let participantDiv = (
      <div
        key={"participant_" + connId}
        id={"participant_" + connId}
        className="in-call-wrap d-flex justify-content-between align-items-center mb-3"
        style={{ flex: 1 }}
      >
        <div className="participant-img-name-wrap display-center">
          <div className="participant-img">
            <img
              src={pImage}
              alt="participant"
              className="border border-secondary"
              style={{
                height: 40,
                width: 40,
                borderRadius: "50%",
              }}
            />
          </div>
          <div className="participant-name ml-2">{other_user_id}</div>
        </div>
        <div className="participant-action-wrap display-center">
          <div className="participant-action-dot display-center cursor-pointer mr-2">
            <span className="material-icons">more_vert</span>
          </div>
          <div className="participant-action-pin display-center cursor-pointer mr-2">
            <span className="material-icons">push_pin</span>
          </div>
        </div>
      </div>
    );
    participantsDIVS.current.push(participantDiv);
    setParticipants(participantsDIVS.current);
    document.querySelectorAll(".participant-count").forEach((e) => {
      e.textContent = userNum;
    });
  };

  let iceConf = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  const setOffer = async (connId) => {
    let connection = peers_connection[connId];
    let offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    serverProcess(
      JSON.stringify({ offer: connection.localDescription }),
      connId
    );
  };
  const setConnection = async (connId) => {
    let connection = new RTCPeerConnection(iceConf);

    connection.onnegotiationneeded = async function (event) {
      await setOffer(connId);
    };

    connection.onicecandidate = function (event) {
      if (event.candidate) {
        serverProcess(
          JSON.stringify({ icecandidate: event.candidate }),
          connId
        );
      }
    };
    connection.ontrack = function (event) {
      if (!remote_vid_stream[connId]) {
        remote_vid_stream[connId] = new MediaStream();
      }
      if (!remote_aud_stream[connId]) {
        remote_aud_stream[connId] = new MediaStream();
      }
      if (event.track.kind === "video") {
        remote_vid_stream[connId]
          .getVideoTracks()
          .forEach((t) => remote_vid_stream[connId].removeTrack(t));
        remote_vid_stream[connId].addTrack(event.track);

        let remoteVideoPlayer = document.getElementById("v_" + connId);
        remoteVideoPlayer.srcObject = null;
        remoteVideoPlayer.srcObject = remote_vid_stream[connId];
        remoteVideoPlayer.load();
      } else if (event.track.kind === "audio") {
        remote_aud_stream[connId]
          .getAudioTracks()
          .forEach((t) => remote_aud_stream[connId].removeTrack(t));
        remote_aud_stream[connId].addTrack(event.track);

        let remoteAudioPlayer = document.getElementById("a_" + connId);
        remoteAudioPlayer.srcObject = null;
        remoteAudioPlayer.srcObject = remote_aud_stream[connId];
        remoteAudioPlayer.load();
      }
    };

    peers_connection_ids[connId] = connId;
    peers_connection[connId] = connection;

    if (
      video_state == video_states.camera ||
      video_state == video_states.screenshare
    ) {
      if (videoCamTrack) {
        updateMediaSenders(videoCamTrack, rtp_vid_senders);
      }
    }
    return connection;
  };

  const setNewConnection = async (connId) => {
    await setConnection(connId);
  };

  const SDPProcess = async (message, from_connid) => {
    message = JSON.parse(message);
    if (message.answer) {
      await peers_connection[from_connid].setRemoteDescription(
        new RTCSessionDescription(message.answer)
      );
    } else if (message.offer) {
      if (!peers_connection[from_connid]) {
        await setConnection(from_connid);
      }
      await peers_connection[from_connid].setRemoteDescription(
        new RTCSessionDescription(message.offer)
      );
      let answer = await peers_connection[from_connid].createAnswer();
      await peers_connection[from_connid].setLocalDescription(answer);
      serverProcess(JSON.stringify({ answer }), from_connid);
    } else if (message.icecandidate) {
      if (!peers_connection[from_connid]) {
        await setConnection(from_connid);
      }
      try {
        await peers_connection[from_connid].addIceCandidate(
          message.icecandidate
        );
      } catch (error) {
        console.log(error);
      }
    }
  };

  const processClientFunction = async (data, from_connid) => {
    await SDPProcess(data, from_connid);
  };

  const closeConnection = async (connId) => {
    delete peers_connection_ids[connId];
    if (peers_connection[connId]) {
      peers_connection[connId].close();
      delete peers_connection[connId];
    }
    if (remote_aud_stream[connId]) {
      remote_aud_stream[connId].getTracks().forEach((t) => {
        if (t.stop) t.stop();
      });
      delete remote_aud_stream[connId];
    }
    if (remote_vid_stream[connId]) {
      remote_vid_stream[connId].getTracks().forEach((t) => {
        if (t.stop) t.stop();
      });
      delete remote_vid_stream[connId];
    }
  };

  const _handleAppInit = (user_id, meeting_id) => {
    socket = socket.connect("/");
    const SDP_function = function (data, to_connid) {
      socket.emit("SDPProcess", {
        message: data,
        to_connid,
      });
    };
    socket.on("connect", () => {
      alert("connected to client side");
      if (socket.connected) {
        AppProcessInit(SDP_function, socket.id);
        if (user_id != "" && meeting_id != "") {
          socket.emit("userconnect", {
            displayName: user_id,
            meeting_id,
          });
        }
      }
    });

    socket.on("inform_others_about_me", (data) => {
      addUser(data.other_user_id, data.connId, data.userNumber);
      setNewConnection(data.connId);
    });

    socket.on("inform_me_about_other_user", (other_users) => {
      if (other_users) {
        other_users.forEach((user) => {
          addUser(user.user_id, user.connectionId, other_users.length + 1);
          setNewConnection(user.connectionId);
        });
      }
    });

    socket.on("SDPProcess", async (data) => {
      await processClientFunction(data.message, data.from_connid);
    });

    socket.on("inform_others_about_disconnected_user", (data) => {
      document.getElementById(data.connId).remove();
      document.querySelectorAll(".participant-count").forEach((e) => {
        e.textContent = data.userNumber;
      });
      document.getElementById("participant_" + data.connId).remove();
      closeConnection(data.connId);
    });

    socket.on("showChatMessage", (data) => {
      let time = new Date();
      let lTime = time.toLocaleString("en-us", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      let messageDiv = (
        <div key={time}>
          <span className="font-weight-bold mr-3" style={{ color: "black" }}>
            {data.from}
          </span>
          {lTime}
          <br></br>
          {data.message}
        </div>
      );
      messagesDIVS.current.push(messageDiv);
      setMessages([...messagesDIVS.current]);
      var objDiv = document.getElementById("messages");
      objDiv.scrollTop = objDiv.scrollHeight;
    });

    socket.on("showFileMessage", (data) => {
      let time = new Date();
      let lTime = time.toLocaleString("en-us", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      let { user_id, meeting_id, attachedFilePath, attachedFileName } = data;

      let newAttachedDiv = (
        <>
          <div
            key={time}
            className="left-align"
            style={{ display: "flex", alignItems: "center" }}
          >
            <img
              src={pImage}
              alt="caller"
              height="40px"
              width="40px"
              className="caller-image-circle"
            />
            <div style={{ fontWeight: "bold", margin: "0 5px" }}>{user_id}</div>
            :
            <div>
              <a
                href={
                  window.location.origin +
                  "/downloadFile?path=" +
                  attachedFilePath
                }
                style={{ color: "#007bff" }}
                download
              >
                {attachedFileName}{" "}
              </a>
            </div>
          </div>
          <br />
        </>
      );
      setAttachedAreaDiv(newAttachedDiv);
    });
  };

  const _handleSendMessage = function () {
    let msg = document.getElementById("msgBox").value;
    if (msg) {
      socket.emit("sendMessage", msg);
      let time = new Date();
      let lTime = time.toLocaleString("en-us", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      let messageDiv = (
        <div key={time} style={{ marginBottom: 10 }}>
          <span className="font-weight-bold mr-3" style={{ color: "black" }}>
            You
          </span>
          {lTime}
          <br></br>
          {msg}
        </div>
      );
      document.getElementById("msgBox").value = "";
      messagesDIVS.current.push(messageDiv);
      setMessages([...messagesDIVS.current]);
      var objDiv = document.getElementById("messages");
      objDiv.scrollTop = objDiv.scrollHeight;
    }
  };
  const _handleSidebar = (user_id, meeting_id) => {
    document.getElementById("customFile").onchange = function () {
      let filename = this.value.split("\\").pop();
      this.nextElementSibling.classList.add("selected");
      this.nextElementSibling.innerHTML = filename;
    };
    document.querySelector(".share-attach").onclick = async (e) => {
      // fails on heroku for now
      try {
        console.log("inside");
        e.preventDefault();
        let img_attr = document.querySelector("#customFile")["files"][0];
        let formData = new FormData();
        formData.append("zipfile", img_attr);
        formData.append("meeting_id", meeting_id);
        formData.append("user_id", user_id);
        const res = await axios.post(
          window.location.origin + "/attachment",
          formData
        );
        if (!res.status) return;
        console.log("more inside");
        let attachFileArea = document.querySelector(".show-attach-file");
        let attachedFileName = document
          .querySelector("#customFile")
          .value.split("\\")
          .pop();
        let attachedFilePath =
          "./public/attachments/" + meeting_id + "/" + attachedFileName;
        let newAttachedDiv = (
          <>
            <div
              className="left-align"
              style={{ display: "flex", alignItems: "center" }}
            >
              <img
                src={pImage}
                alt="caller"
                height="40px"
                width="40px"
                className="caller-image-circle"
              />
              <div style={{ fontWeight: "bold", margin: "0 5px" }}>
                {user_id}
              </div>
              :
              <div
                // style={{
                //   color: "blue",
                //   cursor: "pointer",
                //   textDecoration: "underline",
                // }}
                // onClick={async () => {
                //   try {
                //     console.log("here");
                //     let formData = new FormData();
                //     formData.append("path", attachedFilePath);
                //     debugger;
                //     const res = await axios.get(
                //       window.location.origin +
                //         "/downloadFile?path=" +
                //         attachedFilePath
                //     );
                      // const blob = await res.blob();
                      // download(blob, 'test.pdf');
                //     console.log("here2");
                //     console.log(res);
                //     debugger;
                //   } catch (err) {
                //     console.log(err);
                //   }
                // }}
              >
                <a
                  href={
                    window.location.origin +
                    "/downloadFile?path=" +
                    attachedFilePath
                  }
                  download
                >
                  {attachedFileName}{" "}
                </a>
              </div>
            </div>
            <br />
          </>
        );
        setAttachedAreaDiv(newAttachedDiv);
        document.querySelector(".custom-file-label").innerHTML = "";
        socket.emit("fileTransferToOthers", {
          user_id,
          meeting_id,
          attachedFilePath,
          attachedFileName,
        });
      } catch (err) {
        console.log(err);
      }
    };
    document.querySelector(".g-details-heading-attachment").onclick = () => {
      document.querySelector(".g-details-heading-show").style.display = "none";
      document.querySelector(
        ".g-details-heading-show-attachment"
      ).style.display = "flex";
      document
        .querySelector(".g-details-heading-attachment")
        .classList.add("active");
      document
        .querySelector(".g-details-heading-detail")
        .classList.remove("active");
    };
    document.querySelector(".g-details-heading-detail").onclick = () => {
      document.querySelector(".g-details-heading-show").style.display = "flex";
      document.querySelector(
        ".g-details-heading-show-attachment"
      ).style.display = "none";
      document
        .querySelector(".g-details-heading-detail")
        .classList.add("active");
      document
        .querySelector(".g-details-heading-attachment")
        .classList.remove("active");
    };
    document.querySelector("#copy_meet_details").onclick = () => {
      try {
        navigator.clipboard.writeText(window.location.href);
        document.querySelector(".link-conf").style.display = "block";
        setTimeout(() => {
          document.querySelector(".link-conf").style.display = "none";
        }, 1000);
      } catch (err) {
        console.log(err);
      }
    };
    document.querySelector(".meeting_url").textContent = window.location.href;
    document.querySelector(".end-call-wrap").onclick = () => {
      setShowLeaveDialog(true);
    };

    document.getElementById("btnsend").onclick = function () {
      _handleSendMessage();
    };
    document.getElementById("msgBox").onkeydown = (ev) => {
      if (ev.key.toLowerCase() === "enter") {
        _handleSendMessage();
      }
    };
    document.getElementById("people-heading").onclick = function () {
      document.getElementsByClassName("chat-show-wrap")[0].style.display =
        "none";
      document.getElementsByClassName("in-call-wrap-up")[0].style.display =
        "flex";
      this.classList.add("active");
      document.getElementById("chat-heading").classList.remove("active");
    };
    document.getElementById("chat-heading").onclick = function () {
      document.getElementsByClassName("chat-show-wrap")[0].style.display =
        "flex";
      document.getElementsByClassName("in-call-wrap-up")[0].style.display =
        "none";
      this.classList.add("active");
      document.getElementById("people-heading").classList.remove("active");
    };
    document.getElementById("meeting-heading-cross").onclick = function () {
      document.querySelector(".g-right-details-wrap").style.display = "none";
    };
    document.getElementById("participants").onclick = () => {
      document.querySelector(".g-right-details-wrap").style.display = "block";
      document.getElementsByClassName("chat-show-wrap")[0].style.display =
        "none";
      document.getElementsByClassName("in-call-wrap-up")[0].style.display =
        "flex";
      document.getElementById("people-heading").classList.add("active");
      document.getElementById("chat-heading").classList.remove("active");
    };
    document.getElementById("chat").onclick = () => {
      document.querySelector(".g-right-details-wrap").style.display = "block";
      document.getElementsByClassName("chat-show-wrap")[0].style.display =
        "flex";
      document.getElementsByClassName("in-call-wrap-up")[0].style.display =
        "none";
      document.getElementById("chat-heading").classList.add("active");
      document.getElementById("people-heading").classList.remove("active");
    };
  };
  useEffect(() => {
    debugger;
    serverProcess = undefined;
    peers_connection_ids = {};
    peers_connection = {};
    remote_vid_stream = {};
    remote_aud_stream = {};
    audio = undefined;
    isAudioMute = true;
    rtp_aud_senders = {};
    video_states = {
      none: 0,
      camera: 1,
      screenshare: 2,
    };
    video_state = video_states.none;
    videoCamTrack = undefined;
    local_div = undefined;
    rtp_vid_senders = {};
    document.title = "Google Meet";
    document.body.style.paddingTop = 0;
    let meeting_id = params.meetid;
    let user_id = window.prompt("Enter you username");
    if (!user_id || !meeting_id) {
      alert("User id or Meeting id missing");
      navigate("/");
      return;
    }
    document.getElementById("meetingContainer").style.display = "unset";
    document.getElementById("me").append(user_id + "(Me)");
    document.title = user_id;
    _handleAppInit(user_id, meeting_id);
    _handleSidebar(user_id, meeting_id);
  }, []);

  return (
    <>
      <main className="d-flex flex-column home-wrap">
        <div className="g-top text-light">
          <div className="top-remote-video-show-wrap d-flex">
            <div
              id="meetingContainer"
              style={{
                display: "none",
                flexBasis: "75%",
              }}
            >
              <div
                className="call-wrap"
                style={{
                  backgroundColor: "black",
                }}
              >
                <div
                  className="video-wrap"
                  id="divUsers"
                  style={{
                    display: "flex",
                    flexWrap: "wrap ",
                  }}
                >
                  <div id="me" className="userBox display-center flex-column">
                    <h2
                      className="display-center"
                      style={{
                        fontSize: 14,
                      }}
                    ></h2>
                    <div className="display-center">
                      <video autoPlay muted id="localVideoPlayer"></video>
                    </div>
                  </div>
                  <div
                    id="otherTemplate"
                    className="userBox display-center flex-column"
                    style={{
                      display: "none",
                    }}
                  >
                    <h2
                      className="display-center"
                      style={{
                        fontSize: 14,
                      }}
                    ></h2>
                    <div className="display-center">
                      <video autoPlay muted></video>
                      <audio
                        autoPlay
                        controls
                        style={{
                          display: "none",
                        }}
                      ></audio>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="g-right-details-wrap bg-light text-secondary h-100"
              style={{
                flexBasis: "25%",
                zIndex: 1,
                display: "none",
              }}
            >
              <div
                className="meeting-heading-wrap d-flex justify-content-between align-items-center pr-3 pl-3"
                style={{ height: "10vh" }}
              >
                <div className="meeting-heading font-weight-bold">
                  Meeting Details
                </div>
                <div
                  id="meeting-heading-cross"
                  className="meeting-heading-cross display-center cursor-pointer"
                >
                  <span className="material-icons">clear</span>
                </div>
              </div>
              <div
                className="people-chat-wrap d-flex justify-content-between align-items-center ml-3 mr-3 pr-3 pl-3"
                style={{
                  height: "10vh",
                  fontSize: 14,
                }}
              >
                <div
                  id="people-heading"
                  className="people-heading display-center cursor-pointer"
                >
                  <div className="people-heading-icon display-center mr-1">
                    <span className="material-icons">people</span>
                  </div>
                  <div className="people-heading-text display-center">
                    Participants (<span className="participant-count">1</span>)
                  </div>
                </div>
                <div
                  id="chat-heading"
                  className="chat-heading d-flex justify-centent-round align-items-center cursor-pointer active"
                >
                  <div className="chat-heading-icon display-center mr-1">
                    <span className="material-icons">message</span>
                  </div>
                  <div className="chat-heading-text">Chat</div>
                </div>
              </div>
              <div
                className="in-call-chat-wrap mr-3 ml-3 pl-3 pr-3"
                style={{
                  fontSize: 14,
                }}
              >
                <div
                  className="in-call-wrap-up"
                  style={{ display: "none", flexDirection: "column" }}
                >
                  <div
                    className="in-call-wrap d-flex justify-content-between align-items-center mb-3"
                    style={{ flex: 1 }}
                  >
                    <div className="participant-img-name-wrap display-center">
                      <div className="participant-img">
                        <img
                          src={pImage}
                          alt="participant"
                          className="border border-secondary"
                          style={{
                            height: 40,
                            width: 40,
                            borderRadius: "50%",
                          }}
                        />
                      </div>
                      <div className="participant-name ml-2">You</div>
                    </div>
                    <div className="participant-action-wrap display-center">
                      <div className="participant-action-dot display-center cursor-pointer mr-2">
                        <span className="material-icons">more_vert</span>
                      </div>
                      <div className="participant-action-pin display-center cursor-pointer mr-2">
                        <span className="material-icons">push_pin</span>
                      </div>
                    </div>
                  </div>
                  {participants}
                </div>
                <div
                  className="chat-show-wrap text-secondary flex-column justify-content-between h-100"
                  style={{
                    fontSize: 14,
                    display: "flex",
                  }}
                >
                  <div
                    className="chat-message-show"
                    id="messages"
                    style={{ height: "60vh", overflowY: "auto" }}
                  >
                    {messages}
                  </div>
                  <div
                    className="chat-message-send d-flex justify-content-between align-items-center"
                    style={{
                      marginTop: 20,
                    }}
                  >
                    <div
                      className="chat-message-send-input"
                      style={{
                        width: "85%",
                      }}
                    >
                      <input
                        type="text"
                        name=""
                        className="chat-message-send-input-field w-100"
                        id="msgBox"
                        placeholder="Send a message to everyone"
                        style={{
                          border: "none",
                          borderBottom: "1px solid teal",
                          background: "transparent",
                        }}
                      />
                    </div>
                    <div
                      className="chat-message-send-action display-center"
                      id="btnsend"
                      style={{
                        color: "teal",
                        cursor: "pointer",
                      }}
                    >
                      <span className="material-icons">send</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="g-top-left bg-light text-secondary w-25 d-flex align-items-center justify-content-between pl-2 pr-2">
            <div
              id="participants"
              className="top-left-participant-wrap pt-2 cursor-pointer"
            >
              <div className="top-left-participant-icon">
                <span className="material-icons">people</span>
              </div>
              <div className="top-left-participant-count participant-count">
                1
              </div>
            </div>
            <div id="chat" className="top-left-chat-wrap pt-2 cursor-pointer">
              <span className="material-icons">message</span>
            </div>
            <div className="top-left-time-wrap"></div>
          </div>
        </div>
        <div className="g-bottom bg-light m-0 d-flex justify-content-between align-items-center">
          <div className="bottom-left d-flex" style={{ height: "10vh" }}>
            <div
              className="g-details border border-success mb-2"
              style={
                showMeetingDetails
                  ? { display: "flex", flexDirection: "column" }
                  : { display: "none" }
              }
            >
              <div
                className="border-bottom"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-around",
                }}
              >
                <div className="g-details-heading d-flex justify-content-between align-items-center pb-1">
                  <div className="g-details-heading-detail d-flex align-items-center cursor-pointer active">
                    <span className="material-icons">error</span>
                    <span style={{ marginTop: -5 }}>Details</span>
                  </div>
                </div>
                <div className="g-details-heading-attachment d-flex justify-content-between align-items-center ">
                  <div className="g-details-heading-detail d-flex align-items-center cursor-pointer">
                    <span className="material-icons">attachment</span>
                    <span style={{ marginTop: -5 }}>Attachment</span>
                  </div>
                </div>
              </div>
              <div className="g-details-heading-show-wrap">
                <div
                  className="g-details-heading-show"
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <div style={{ fontWeight: 600, color: "gray" }}>
                    Joining Info
                  </div>
                  <div
                    className="meeting_url"
                    style={{ padding: "5px 0" }}
                    data-toggle="tooltip"
                    data-placement="top"
                  ></div>
                  <div
                    id="copy_meet_details"
                    style={{ cursor: "pointer", display: "flex" }}
                  >
                    <span className="material-icons" style={{ fontSize: 14 }}>
                      content_copy
                    </span>
                    <span className="copy_info font-weight-bold ml-2 d-flex">
                      {" "}
                      Copy Joining Info{" "}
                      <span
                        className="link-conf font-weight-bold ml-2 pl-1 pr-1"
                        style={{
                          display: "none",
                          background: "aquamarine",
                          borderRadius: 5,
                        }}
                      >
                        {" "}
                        Link Copied
                      </span>
                    </span>
                  </div>
                </div>
                <div
                  className="g-details-heading-show-attachment"
                  style={{
                    display: "none",
                    position: "relative",
                    flexDirection: "column",
                  }}
                >
                  <div className="show-attach-file">{attachedAreaDiv}</div>
                  <div
                    className="upload-attach-file"
                    style={{ marginBlock: 20 }}
                  >
                    <form
                      encType="multipart/form-data"
                      ref={formRef}
                      id="uploadForm"
                      style={{ justifyContent: "space-between" }}
                      className="display-center"
                    >
                      <div className="custom-file" style={{ flexBasis: "79%" }}>
                        <input
                          type="file"
                          className="custom-file-input"
                          id="customFile"
                          name="imagefile"
                        />
                        <label
                          htmlFor="customFile"
                          className="custom-file-label"
                        >
                          Choose File
                        </label>
                      </div>
                      <div className="share-button-wrap">
                        <button
                          className="btn btn-primary btn-sm share-attach"
                          style={{ flexBasis: "19%", padding: "6px 20px" }}
                        >
                          {" "}
                          Share
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="display-center cursor-pointer meeting-details button"
              onClick={() => {
                setShowMeetingDetails(!showMeetingDetails);
              }}
            >
              Meeting Details{" "}
              <span className="material-icons">keyboard_arrow_down</span>
            </div>
          </div>
          <div
            className="bottom-middle d-flex justify-content-between align-items-center"
            style={{ height: "10vh" }}
          >
            <div
              className="mic-toggle-wrap action-icon-style display-center mr-2 cursor-pointer"
              id="micMuteUnmute"
            >
              <span className="material-icons" style={{ width: "100%" }}>
                mic_off
              </span>
            </div>
            <div className="end-call-wrap action-icon-style display-center mr-2 cursor-pointer">
              <span className="material-icons text-danger">call</span>
            </div>
            <div
              className="video-toggle-wrap action-icon-style display-center cursor-pointer"
              id="videoCamOnOff"
            >
              <span className="material-icons" style={{ width: "100%" }}>
                videocam_off
              </span>
            </div>
          </div>
          <div
            className="bottom-right d-flex justify-content-center align-items-center mr-3"
            style={{ height: "10vh" }}
          >
            <div
              id="btnScreenShareOnOff"
              className="present-now-wrap d-flex justify-content-center flex-column align-items-center mr-5 cursor-pointer"
            >
              <span className="material-icons">present_to_all</span>
              <div>Present Now</div>
            </div>

            <div
              className="option-wrap cursor-pointer display-center"
              style={{
                height: "10vh",
                position: "relative",
              }}
            >
              <div className="option-icon">
                <span className="material-icons">more_vert</span>
              </div>
            </div>
          </div>
        </div>
        <div
          className="top-box-show"
          style={showLeaveDialog ? { display: "flex" } : { display: "none" }}
        >
          <div className="top-box align-vertical-middle profile-dialog-show">
            <h4
              className="mt-3"
              style={{ textAlign: "center", color: "white" }}
            >
              Leave Meeting
            </h4>{" "}
            <div className="call-leave-cancel-action d-flex justify-content-center align-items-center w-100">
              <button
                className="call-leave-action btn btn-danger mr-5"
                onClick={() => {
                  navigate("/");
                }}
              >
                Leave
              </button>{" "}
              <button
                className="call-cancel-action btn btn-secondary"
                onClick={() => {
                  setShowLeaveDialog(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default MeetingPage;
