import "./App.css";
import Home from "./components/home/home.component";
import MeetingPage from "./components/meetingPage/meetingPage.component";
import { Route, Routes } from "react-router-dom";
import { useSelector,useDispatch } from "react-redux";
import io from "socket.io-client";
import { checkUserSession } from "./redux/user/users.actions";
import { useEffect } from "react";
import Loader from "./components/Loader/loader.component";
import { useState } from "react";

// react-router@6 implementation
// {/* <Route path="/" element={<Navigate replace to="/home" />} /> */}

const socket = io;
function App() {
  const [loader,setLoader] = useState(true)
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state);
  useEffect(() => {
    dispatch(checkUserSession());
    setLoader(false)
  }, [checkUserSession]);
  return (
    <>
      {user.loading || loader ? <Loader /> : 
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:meetid" element={<MeetingPage socket={socket} />} />
      </Routes>}
    </>
  );
}

export default App;
