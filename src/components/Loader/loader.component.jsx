import "./loader.styles.scss";

function Loader() {
  return (
    <div
      style={{
        position: "fixed",
        display: "flex",
        top: 0,
        left: 0,
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0002",
      }}
    >
      <div className="lds-dual-ring"></div>
    </div>
  );
}

export default Loader;
