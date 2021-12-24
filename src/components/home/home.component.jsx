// import logo from './logo.svg';
import logo from "../../assets/images/google-meet-icon.png";
import signInImage from "../../assets/images/google-meet-people.jpg";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  useEffect(()=>{
    document.title = "Create or Join Meeting";
    document.body.style.paddingTop = "3.5rem"
  },[])
  let navigate = useNavigate();

  const _handleJoinMeeting = () => {
    document.getElementById("enter_code").focus();
  };
  const _handleJoinMeetingLi = () => {
    let join_value = document.getElementById("enter_code").value;
    navigate(`/${join_value}`);
  };
  const _handleStartMeeting = () => {
    var random_value = Math.floor(Math.random() * 100000000);
    navigate(`/${random_value}`);
  };
  return (
    <>
      <div>
        <nav className="navbar-expand-md fixed-top">
          <img src={logo} alt="logo" className="logo" />
          <a href="http://wwww.google.com" className="navbar-brand text-dark">
            Google Meet
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-toggle="collapse"
            data-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent"> 
            <ul className="navbar-nav mr-auto">
              <li className="nav-item">
                <a href="#" className="nav-link">
                  At a glance
                </a>
              </li>
              <li className="nav-item">
                <a href="#" className="nav-link">
                  How it works
                </a>
              </li>
              <li className="nav-item">
                <a href="#" className="nav-link">
                  Plan and Price
                </a>
              </li>
            </ul>
            <ul className="navbar-nav mr-0">
              <li className="nav-item sign-in display-center">
                <a href="#" className="nav-link">
                  Sign in
                </a>
              </li>
              <li className="nav-item">
                <button
                  className="btn btn-outline-secondary btn-lg text-info font-weight-bold"
                  onClick={_handleJoinMeeting}
                >
                  Join a meeting
                </button>
              </li>
              <li className="nav-item">
                <button
                  onClick={_handleStartMeeting}
                  className="btn btn-lg btn-info text-light font-weight-bold"
                >
                  Start a meeting
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </div>
      <div>
        <main>
          <div className="jumbotron h-100 d-flex">
            <div className="container w-50">
              <h1 style={{ fontSize: "3rem" }}>
                {" "}
                Premium video meeting. Now it is available for free to everyone.
              </h1>
              <p style={{ fontSize: 20 }}>
                {" "}
                We're resdesigning the Google Meet service for secure business
                meetings and making it free for everyone to use.
              </p>
              <ul className="display-center justify-content-start">
                <li style={{ padding: 0 }}>
                  <button
                    onClick={_handleStartMeeting}
                    className="btn btn-lg text-light font-weight-bold display-center"
                    style={{ backgroundColor: "#01796b" }}
                  >
                    <span className="material-icons mr-2">video_call</span>
                    New Meeting
                  </button>
                </li>
                <li className="pl-3">
                  <button
                    className="btn btn-outline-secondary btn-lg text-dark font-weight-bold display-center"
                    style={{ backgroundColor: "#fff" }}
                  >
                    <span className="material-icons mr-2">keyboard</span>
                    <input
                      type="text"
                      placeholder="Enter a code"
                      style={{ border: "none" }}
                      id="enter_code"
                    />
                  </button>
                </li>
                <li
                  onClick={_handleJoinMeetingLi}
                  className="text-dark ml-4 font-weight-bold cursor-pointer"
                >
                  Join
                </li>
              </ul>
            </div>
            <div className="container w-50">
              <img src={signInImage} alt="sign-in" className="signin-image" />
            </div>
          </div>
        </main>
        <footer className="container">
          <h6>
            {" "}
            Learn more about{" "}
            <span className="learn-more text-info">Google Meet</span>.
          </h6>
        </footer>
      </div>
    </>
  );
};

export default Home;
