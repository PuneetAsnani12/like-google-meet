import "./App.css";
import Home from "./components/home/home.component";
import MeetingPage from "./components/meetingPage/meetingPage.component";
import { Route, Routes } from "react-router-dom";
import { useDispatch } from "react-redux";
import io from "socket.io-client";
import { checkUserSession } from "./redux/user/users.actions";
import { useEffect } from "react";

// react-router@6 implementation
// {/* <Route path="/" element={<Navigate replace to="/home" />} /> */}

const socket = io;
function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(checkUserSession());
  }, [checkUserSession]);
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:meetid" element={<MeetingPage socket={socket} />} />
      </Routes>
    </>
  );
}

export default App;
