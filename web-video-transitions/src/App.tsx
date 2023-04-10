import "./App.css";
import Dissolve from "./transitions/Dissolve";
import video1 from "./assets/video1.mp4";
import video2 from "./assets/video2.mp4";
import DissolveV2 from "./transitions/DissolveV2";

function App() {
  return (
    <div className="App">
      <h1>Transition Test</h1>
      <DissolveV2
        width={1280}
        height={640}
        startVideoSrc={video1}
        endVideoSrc={video2}
      />
    </div>
  );
}

export default App;
