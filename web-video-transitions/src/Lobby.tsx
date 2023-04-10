import { Link } from "react-router-dom";

const Lobby = () => {
  return (
    <div>
      <Link className="button" to="/">
        Home
      </Link>
      <Link className="button" to="/dissolve">
        Dissolve
      </Link>
      <Link className="button" to="/wave">
        wave
      </Link>
    </div>
  );
};

export default Lobby;
