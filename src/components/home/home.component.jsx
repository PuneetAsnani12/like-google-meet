// import logo from './logo.svg';
import logo from "../../assets/images/meet-logo.svg";
import signInImage from "../../assets/images/google-meet-people.jpg";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  useEffect(() => {
    document.title = "Create or Join Meeting";
    // document.body.style.paddingTop = "3.5rem";
  }, []);
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
      <nav className="navbar-expand-lg">
        <a href={window.location.origin} className="navbar-brand text-dark">
          <img src={logo} alt="logo" className="logo" />
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ maxHeight: 40, marginTop: 11 }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item">
              <a href="#" className="nav-link">
                Overview
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link">
                How it works
              </a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link">
                Plans {`&`} Pricing{" "}
              </a>
            </li>
          </ul>
          <ul className="navbar-nav mr-0">
            <li className="nav-item sign-in">
              <a href="#" className="nav-link">
                Sign in
              </a>
            </li>
            <li className="nav-item">
              <button
                className="btn button-blue-outline"
                onClick={_handleJoinMeeting}
              >
                Join a meeting
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={_handleStartMeeting}
                className="btn btn-lg text-light button-blue-filled"
                style={{ padding: "15px 20px" }}
              >
                Start a meeting
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <main>
        <div className="jumbotron h-100 d-flex">
          <div className="container container-1" style={{ flexBasis: "50%" }}>
            <h1 style={{ fontSize: 44 }}>
              {" "}
              Premium video meetings. Now free for everyone.
            </h1>
            <p style={{ fontSize: 18,color:"#777" ,marginTop:25 }}>
              {" "}
              We re-engineered the service we built for secure business
              meetings, Google Meet, to make it free and available for all.
            </p>
            <ul className="display-center justify-content-start" style={{marginTop:60}}>
              <li style={{ padding: 0 }}>
                <button
                  onClick={_handleStartMeeting}
                  className="btn text-light button-blue-filled display-center"
                  style={{ padding: "10px 15px" }}
                >
                  <span className="material-icons mr-2">video_call</span>
                  New meeting
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
                style={{ padding: "10px 15px" }}
              >
                Join
              </li>
            </ul>
          </div>
          <div
            className="container container-2"
            style={{
              display: "flex",
              justifyContent: "center",
              flexBasis: "50%",
            }}
          >
            <img src={signInImage} alt="sign-in" className="signin-image" />
          </div>
        </div>
      </main>
      <footer className="container">
        <h6>
          {" "}
          Learn more about{" "}
          <span className="learn-more" style={{color:"rgb(26, 115, 232)",cursor:"pointer"}}>Google Meet</span>.
        </h6>
      </footer>
    </>
  );
};

export default Home;
