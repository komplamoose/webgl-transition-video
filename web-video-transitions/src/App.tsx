import "./App.css";
import video1 from "./assets/video1.mp4";
import video2 from "./assets/video2.mp4";
import DissolveV2 from "./transitions/DissolveV2";
import { Route, Routes } from "react-router-dom";
import Lobby from "./Lobby";
import Wave from "./transitions/Wave";
import Pong from "./transitions/Pong";
import WindowSlice from "./transitions/WindowSlice";
import WipeRight from "./transitions/WipeRight";
import WipeLeft from "./transitions/WipeLeft";
import WipeUp from "./transitions/WipeUp";
import WipeDown from "./transitions/WipeDown";
import DirectionalWarp from "./transitions/DirectionalWarp";

function App() {
  return (
    <div className="App">
      <div style={{ display: "flex", justifyContent: "center", gap: "30px" }}>
        <Lobby />
        <div>
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
            <Route
              path="/pong"
              element={
                <Pong
                  width={1280}
                  height={640}
                  startVideoSrc={video1}
                  endVideoSrc={video2}
                />
              }
            />
            <Route
              path="/window-slice"
              element={
                <WindowSlice
                  width={1280}
                  height={640}
                  startVideoSrc={video1}
                  endVideoSrc={video2}
                />
              }
            />
            <Route
              path="/wipe-right"
              element={
                <WipeRight
                  width={1280}
                  height={640}
                  startVideoSrc={video1}
                  endVideoSrc={video2}
                />
              }
            />
            <Route
              path="/wipe-left"
              element={
                <WipeLeft
                  width={1280}
                  height={640}
                  startVideoSrc={video1}
                  endVideoSrc={video2}
                />
              }
            />
            <Route
              path="/wipe-up"
              element={
                <WipeUp
                  width={1280}
                  height={640}
                  startVideoSrc={video1}
                  endVideoSrc={video2}
                />
              }
            />
            <Route
              path="/wipe-down"
              element={
                <WipeDown
                  width={1280}
                  height={640}
                  startVideoSrc={video1}
                  endVideoSrc={video2}
                />
              }
            />
            <Route
              path="/directional-warp"
              element={
                <DirectionalWarp
                  width={1280}
                  height={640}
                  startVideoSrc={video1}
                  endVideoSrc={video2}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
