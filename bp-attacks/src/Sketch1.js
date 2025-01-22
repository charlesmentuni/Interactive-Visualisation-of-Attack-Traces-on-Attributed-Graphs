import {Point, Path, onMouseDown, Tool, Size} from 'paper';
import paper from 'paper';



export default function Sketch() {
   
   window.onload = function() {
        paper.setup('paper-canvas');

        var myPath = new Path();
        myPath.strokeColor = 'black';

        
        var tool = new Tool();
        tool.onMouseDown = function(event) {
            myPath.add([event.point.x, event.point.y]);
            console.log(event.point.x, event.point.y);
        }

        myPath.closePath();
        

   }
   
   function draw(event) {
       // animation loop
   }

   // Most return null
   return null;
}