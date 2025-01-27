import {Point, Path, onMouseDown, Tool, Size, TextItem, PointText, Group} from 'paper';
import paper from 'paper';
import ReadBP from './ReadBP.js';
import json from './wf102.json';
import { useEffect, useState } from 'react';

export default function Sketch() {
   
    // Contains dictionary of node information that has just been clicked on
    const [nodeCard, setNodeCard] = useState({visibility: 'hidden'});

   window.onload = function() {

        paper.setup('paper-canvas');

       

        createRect();
        
        var tool = new Tool();
        
        tool.onMouseDrag = function(event){
            var delta = event.downPoint.subtract(event.point)
            paper.view.scrollBy(delta)
      }

        tool.onKeyDown = function(event){
            if (event.key === 'w'){
                paper.view.zoom *= 1.2;
            }

            if (event.key === 's'){
                paper.view.zoom *= 0.8;
                
            }
        }

   }



   const createRect = () => {

        const start = 100;
        const width = 150;
        const height = 100;
        const gap = 100;

        const rectOg = new Path.Rectangle(new Point(100,100), new Size(width, height));
        rectOg.strokeColor = 'black';
        rectOg.visible = false;

        var rect = rectOg.clone();
        rect.visible = true;

        var label = new PointText();
        label.content = json.nodes[0].uuid;
        label.scale(0.4);
        label.position = new Point(100+width/2,100+height/2);

        var group = new Group(rect, label);

        var node_dict = {};
        json.nodes.forEach((node, index) => {
                node_dict[node.uuid] = {};
                Object.keys(node).forEach((key) => {
                    if (key !== 'uuid'){
                        node_dict[node.uuid][key] = node[key];
                    }
                });
        })


        json.nodes.forEach((node, index) => {

            node_dict[node.uuid].group = group;

                group.onMouseDown = function(event){
                    toggleInfoCard(node);
                };
                group.children[0].fillColor = 'grey';
                group.children[1].content = node.uuid;
                group.position.x = (index%5)*(width+gap)+start;
                group.position.y = (Math.floor(index/5))*(height+gap)+start;
                group = group.clone();

        })
        
        createEdges(node_dict);
   }
   const createEdges = (node_dict) => {
        var colours = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'black'];
        // create edges
        console.log(node_dict['ef4ffe53-bafd-4041-91cf-34f1bb135ca4']);
        json.edges.forEach((edge) => {
            console.log(edge);
            var new_edge = new Path();
            new_edge.add(node_dict[edge.sourceRef].group.children[0].position);
            new_edge.add(node_dict[edge.targetRef].group.children[0].position);
            new_edge.strokeColor = colours[Math.floor(Math.random()*10)];
            new_edge.strokeWidth = 10;
        });
    

   }
    const toggleInfoCard = (node) => {
        setNodeCard({uuid: node.uuid, visibility: 'visible'});
    }

    
   
   
   function draw(event) {
       // animation loop
   }

   return (<div  style={{position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        padding: "10px 20px",
                        fontSize: "16px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        visibility: nodeCard.visibility
                        }}>
        <p> {nodeCard && nodeCard.uuid}</p>
   </div>);
}