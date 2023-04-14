import { Link } from "react-router-dom";

const Lobby2 = () => {
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
      <Link className="button2" to="/dissolve-asset">
        Dissolve Asset
      </Link>
      <Link className="button2" to="/">
        Home
      </Link>
      <Link className="button2" to="/dissolve2">
        Dissolve2
      </Link>
      <Link className="button2" to="/wave2">
        wave2
      </Link>
      <Link className="button2" to="/pong2">
        Pong2
      </Link>
      <Link className="button2" to="/window-slice2">
        Window Slice2
      </Link>
      <Link className="button2" to="/wipe-right2">
        Wipe Right2
      </Link>
      <Link className="button2" to="/wipe-left2">
        Wipe Left2
      </Link>
      <Link className="button2" to="/wipe-up2">
        Wipe Up2
      </Link>
      <Link className="button2" to="/wipe-down2">
        Wipe Down2
      </Link>
      <Link className="button2" to="/directional-warp2">
        Directional Warp2
      </Link>
      <Link className="button2" to="/mosaic2">
        Mosaic2
      </Link>
      <Link className="button2" to="/cube2">
        Cube2
      </Link>
    </div>
  );
};

export default Lobby2;
