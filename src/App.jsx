import "./App.css";
import Home from "./components/home/home.component";
import MeetingPage from "./components/meetingPage/meetingPage.component";
import { Route, Routes } from "react-router-dom";
import io from "socket.io-client";
const socket = io
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:meetid" element={<MeetingPage socket={socket}/>} />
      </Routes>
    </>
  );
}

export default App;
