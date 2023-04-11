import { Link } from "react-router-dom";

const Lobby = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignContent: "center",
        justifyContent: "center",
        gap: "30px",
      }}
    >
      <Link className="button" to="/">
        Home
      </Link>
      <Link className="button" to="/dissolve">
        Dissolve
      </Link>
      <Link className="button" to="/wave">
        wave
      </Link>
      <Link className="button" to="/pong">
        Pong
      </Link>
      <Link className="button" to="/window-slice">
        Window Slice
      </Link>
      <Link className="button" to="/wipe-right">
        Wipe Right
      </Link>
      <Link className="button" to="/wipe-left">
        Wipe Left
      </Link>
      <Link className="button" to="/wipe-up">
        Wipe Up
      </Link>
      <Link className="button" to="/wipe-down">
        Wipe Down
      </Link>
      <Link className="button" to="/directional-warp">
        Directional Warp
      </Link>
    </div>
  );
};

export default Lobby;
