import logo from './logo.svg';
import './App.css';
import Sketch from './Sketch';
import paper from 'paper';
import ShowCodeBlock from './sidebars/CodeBlock';
import { GraphCreation } from './initialisation/GraphCreation';
import {UploadFaultFile} from './initialisation/UploadFaultFile';




function App() {
  paper.install(window);
  return (
    
    <div>
        <UploadFaultFile />
    </div>
  );
}

export default App;
