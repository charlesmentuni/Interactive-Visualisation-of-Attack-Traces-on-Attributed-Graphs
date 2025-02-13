import logo from './logo.svg';
import './App.css';
import Sketch from './Sketch copy';
import paper from 'paper';
import ShowCodeBlock from './CodeBlock';
function App() {
  paper.install(window);
  return (
    
    <div>
        <canvas id='paper-canvas' resize style={{'width' : '100vw', 'height':'100vh'}}/>
        <Sketch/>
    </div>
  );
}

export default App;
