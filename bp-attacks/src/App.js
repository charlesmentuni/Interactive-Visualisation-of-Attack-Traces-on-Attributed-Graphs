import logo from './logo.svg';
import './App.css';
import Sketch from './Sketch';
import paper from 'paper';
import ShowCodeBlock from './CodeBlock';
import { GraphCreation } from './GraphCreation';


function App() {
  paper.install(window);
  return (
    
    <div>
        <canvas id='paper-canvas' resize style={{'width' : window.innerWidth, 'height':'100vh'}}  />
        <GraphCreation/>
    </div>
  );
}

export default App;
