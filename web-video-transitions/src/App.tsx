import './App.css'
import Dissolve from './transitions/Dissolve'
import video1 from './assets/video1.mp4'
import video2 from './assets/video2.mp4'

function App() {

  return (
    <div className="App">
      <h1>Transition Test</h1>
      <Dissolve width={1280} height={640} src1={video1} src2={video2}/>
    </div>
  )
}

export default App
