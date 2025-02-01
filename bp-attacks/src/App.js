import logo from './logo.svg';
import './App.css';
import Sketch from './Sketch';
import paper from 'paper';

function App() {
  paper.install(window);
  return (
    
    <div>
        <canvas id='paper-canvas' resize style={{width: '100%', height:'100%'}}/>
        <Sketch/>
    </div>
  );
}

export default App;
