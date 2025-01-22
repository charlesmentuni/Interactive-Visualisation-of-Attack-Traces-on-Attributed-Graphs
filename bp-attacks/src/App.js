import logo from './logo.svg';
import './App.css';
import Sketch from './Sketch1';
import paper from 'paper';

function App() {
  paper.install(window);
  return (
    
    <div>
        <canvas id='paper-canvas' resize width='800' height='600'/>
        <Sketch/>
    </div>
  );
}

export default App;
