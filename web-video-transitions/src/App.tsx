import "./App.css";
import video1 from "./assets/video1.mp4";
import video2 from "./assets/video2.mp4";
import DissolveV2 from "./transitions/DissolveV2";
import { Route, Routes } from "react-router-dom";
import Lobby from "./Lobby";
import Wave from "./transitions/Wave";

function App() {
  return (
    <div className="App">
      <h1>Transition Gallery</h1>
      <button className="button" onClick={() => location.reload()}>
        Reset
      </button>
      <Routes>
        <Route
          path="/dissolve"
          element={
            <DissolveV2
              width={1280}
              height={640}
              startVideoSrc={video1}
              endVideoSrc={video2}
            />
          }
        />
        <Route
          path="/wave"
          element={
            <Wave
              width={1280}
              height={640}
              startVideoSrc={video1}
              endVideoSrc={video2}
            />
          }
        />
      </Routes>
      <Lobby />
    </div>
  );
}

export default App;
