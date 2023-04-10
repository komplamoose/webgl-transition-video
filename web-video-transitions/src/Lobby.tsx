import { Link } from "react-router-dom";

const Lobby = () => {
  return (
    <div
      style={{
        display: "flex",
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
    </div>
  );
};

export default Lobby;
