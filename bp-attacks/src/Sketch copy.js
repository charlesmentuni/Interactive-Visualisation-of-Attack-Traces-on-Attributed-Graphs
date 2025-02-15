import {Point, Path, onMouseDown, Tool, Size, TextItem, PointText, Group, Raster} from 'paper';
import paper from 'paper';
import ReadBP from './CodeBlock.js';
import json from './wf102.json';
import { useEffect, useState } from 'react';
import { Collapse, Card, CardHeader, IconButton, CardContent, Button, ButtonGroup , Box, Typography } from '@mui/material';
import {KeyboardArrowDown, KeyboardArrowUp, PlayArrow, SkipNext, SkipPrevious, ChevronRightRounded, ChevronLeftRounded} from '@mui/icons-material';
import cytoscape from "cytoscape";
import gateway from "./symbols/gateway.png";
import inputOutput from "./symbols/inputOutput.png";
import CodeBlock from './CodeBlock.js';
import RightSideBar from './RightSideBar.js';
import LeftSideBar from './LeftSideBar.js';
import PlayControls from './PlayControls.js';

export default function Sketch() {
    
    const event_types = [
        "endEvent",
        "messageEndEvent",
        "startEvent",
        "timerStartEvent",
        "messageStartEvent",
        "catchEvent",
        "throwEvent",
        "boundaryEvent",
        "intermediateCatchEvent",
        "intermediateThrowEvent"
    ]

    const gateway_types = [
        "eventBasedGateway",
        "complexGateway",
        "parallelGateway",
        "exclusiveGateway",
        "inclusiveGateway"
    ]
    
    
    

    // Contains dictionary of node information that has just been clicked on
    const [nodeCard, setNodeCard] = useState(null);
    const [open, setOpen] = useState(false);
    const [openLeft, setOpenLeft] = useState(false);
    const [openRight, setOpenRight] = useState(false);
    const spacing = 8;

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

   

        const width = 150;
        const height = 100;

        var rectOg = new Path.Rectangle(new Point(100,100), new Size(width, height));
        rectOg.strokeColor = 'black';
        rectOg.fillColor = 'grey';
        rectOg.visible =false;
        


        var rect = rectOg.clone();
        rect.visible =true;
        
        var label = new PointText();
        label.content = "BAD Node";
        label.scale(0.4);
        label.position = new Point(100+width/2,100+height/2);
        label.visible = true;

        var task = new Group(rect, label);
        task.position = new Point(200,200);
        task.visible = false;
        
        

        // Creates a dictionary of nodes with their uuid as the key
        var node_dict = {};
        json.nodes.forEach((node, index) => {

                node_dict[node.uuid] = {};

                Object.keys(node).forEach((key) => {
                    console.log(key);
                    if (key !== 'uuid'){
                        node_dict[node.uuid][key] = node[key];
                    }

                });

            
        })

        
        var graph = graphLayout();
        console.log(graph.nodes());
        graph.nodes().forEach((node) => { 
            var type = task.clone();
            
            
            type.children[1].content = node_dict[node.id()].name;


            if (event_types.includes(node_dict[node.id()].type )){
                type = new Raster('event-img');
                type.scale(0.1);
            }
            
            if (gateway_types.includes(node_dict[node.id()].type)){
                type = new Raster('gateway-img');
                
            }
            if (node_dict[node.id()].type === "InputOutputBinding"){
                type = new Raster('inputOutput');
            }

            // When pressed on should show node information on the InfoCard
            // Checks whether the mouse is dragged so that traversing won't change the info card.
            var mouseDrag = false;
            type.onMouseDown = function(event){
                mouseDrag = false;
            };

            type.onMouseDrag = function(event){
                mouseDrag = true;
            };

            type.onMouseUp = function(event){
                if (!mouseDrag){
                    toggleInfoCard(node_dict[node.id()]);
                }
            };

            node_dict[node.id()].group = type;
            
            type.position.x = node.position().x*spacing;
            type.position.y = node.position().y*spacing;
            type.visible = true;
           
        });

        createEdges(node_dict);
        paper.view.draw()

   }
   const createEdges = (node_dict) => {
        // create edges
        json.edges.forEach((edge) => {

            var new_edge = new Path();

            new_edge.add(node_dict[edge.sourceRef].group.position);
            var point = new Point(node_dict[edge.targetRef].group.position.x, node_dict[edge.sourceRef].group.position.y );
            new_edge.add(point);
            new_edge.add(node_dict[edge.targetRef].group.position);


            new_edge.strokeColor = 'blue';
            new_edge.strokeWidth = 5;
        });
    

   }
   const convertToGraph = () => {
        var graph = {elements: []};
        
        json.nodes.forEach((node) => {
            graph.elements.push({data: {id: node.uuid}});
        });
        json.edges.forEach((edge) => {
            graph.elements.push({data: {id: edge.uuid, source: edge.sourceRef, target: edge.targetRef}});
        });
        return graph;
   }

    const graphLayout = () => {
        // Sets up graph layout using Cytoscape to output the coordinates of the nodes
        // May potentially be used for the edges as well.
        // The fact that it is so close to BPMN should mean that could layout graph in own way
        const cy = cytoscape(convertToGraph());

        const layout = cy.layout({
            name: "cose", // Use 'breadthfirst', 'grid', 'circle', etc.
            animate: false
        });
            
        layout.run();

        return cy;
    }



    const toggleInfoCard = (node) => {
        setNodeCard(node);
    }

    function runFault(){}
   
   
   function draw(event) {
       // animation loop
   }

   return (
        <> 

        <LeftSideBar openLeft={openLeft} />
        <RightSideBar nodeCard={nodeCard} />

        <img id='event-img' src='https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Circle_-_black_simple.svg/1200px-Circle_-_black_simple.svg.png' style={{display:"none"}} />
        <img id='gateway-img' src={gateway} style={{display:"none"}} />
        <img id='inputOutput' src={inputOutput} style={{display:"none"}} />

    
        <PlayControls/>
        
        </>
   );
}