import logo from './logo.svg';
import './App.css';
import Sketch from './Sketch';
import paper from 'paper';
import ShowCodeBlock from './CodeBlock';
import { GraphCreation } from './GraphCreation';
import UploadFaultFile from './UploadFaultFile';




function App() {
  paper.install(window);
  return (
    
    <div>
        
        <UploadFaultFile />
    </div>
  );
}

export default App;
