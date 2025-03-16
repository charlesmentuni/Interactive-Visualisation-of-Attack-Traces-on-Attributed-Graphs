import {Point, Path, onMouseDown, Tool, Size, TextItem, PointText, Group, Raster, Layer} from 'paper';
import paper from 'paper';
import ReadBP from './CodeBlock.js';
import json from './wf102.json';
import { useEffect, useState, useRef, useContext, createContext } from 'react';
import { Collapse, Card, CardHeader, IconButton, CardContent, Button, ButtonGroup , Box, Typography } from '@mui/material';
import {KeyboardArrowDown, KeyboardArrowUp, PlayArrow, SkipNext, SkipPrevious, ChevronRightRounded, ChevronLeftRounded} from '@mui/icons-material';

import GraphContext from './GraphCreation.js';


import gateway from "./symbols/gateway.png";
import inputOutput from "./symbols/inputOutput.png";
import inputOutputFault from "./symbols/inputOutputFault.png";
import gatewayFault from "./symbols/gatewayFault.png";
import eventFault from "./symbols/eventFault.png";
import eventSymbol from "./symbols/event.png";
import openIcon from "./symbols/openIcon.png";
import closeIcon from "./symbols/closeIcon.png";

import { gatewaySVG,  inputOutputBindingSVG,  userTaskSVG, arrowHeadSVG, startEvent, endEvent, intermediateCatchEvent, catchEvent, throwEvent, scriptTaskSVG, serviceTaskSVG, sendTaskSVG} from './SVGAssets.js';
import { event_types, gateway_types, io_binding_edge_types } from './blmodel.js';

import CodeBlock from './CodeBlock.js';
import RightSideBar from './RightSideBar.js';
import LeftSideBar from './LeftSideBar.js';
import PlayControls from './PlayControls.js';
import NodeLabel from './NodeLabel.js';

export const FaultContext = createContext();

export default function Sketch() {
    
   
    const {node_dict, setNode_dict, edge_dict, setEdge_dict, graph_layout, fault_dict} = useContext(GraphContext);



    // Contains dictionary of node information that has just been clicked on
    const [nodeCard, setNodeCard] = useState(null);
    const [open, setOpen] = useState(false);
    const [openLeft, setOpenLeft] = useState(false);
    const [openRight, setOpenRight] = useState(false);
    const faultPathRef = useRef([]);
    const spacing = 10;
    const stageRef = useRef(0);
    const playing = useRef(false);
    const elapsedTime = useRef(0);
    const mouseDrag = useRef(false);
    const [fault, setFault] = useState("");

    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedNodeLabel, setSelectedNodeLabel] = useState(null);

    const onPlay = () => {
        playing.current = !playing.current;
        setIsPlaying(!isPlaying);
    }      

    useEffect(() => {
        const handleMouseWheel = (event) => {
            var newZoom = paper.view.zoom; 
            var oldZoom = paper.view.zoom;
            
            if (event.deltaY > 0) {			
                newZoom = paper.view.zoom * 0.95;
                paper.project.layers[5].children[0].bounds.height *= 1/0.95;
                paper.project.layers[5].children[0].bounds.width *= 1/0.95;
                
            } else {
                newZoom = paper.view.zoom * 1.05;
                paper.project.layers[5].children[0].bounds.height *= 1/1.05;
                paper.project.layers[5].children[0].bounds.width *= 1/1.05;
                
            }
            
            var beta = oldZoom / newZoom;
            
            var mousePosition = new paper.Point(event.offsetX, event.offsetY);
            
            //viewToProject: gives the coordinates in the Project space from the Screen Coordinates
            var viewPosition = paper.view.viewToProject(mousePosition);
            
            var mpos = viewPosition;
            var ctr = paper.view.center;
            
            var pc = mpos.subtract(ctr);
            var offset = mpos.subtract(pc.multiply(beta)).subtract(ctr);	
            
            paper.view.zoom = newZoom;
            paper.view.center = paper.view.center.add(offset);
            paper.project.layers[5].children[0].position = paper.view.center;

            
            event.preventDefault();
            paper.view.draw();			
        };

        const canvas = document.getElementById('paper-canvas');
        canvas.addEventListener('mousewheel', handleMouseWheel);

        
    }, []);
	

   useEffect(function() {
        if (!graph_layout){return;}
        paper.setup('paper-canvas');

        const nodeLayer  = paper.project.activeLayer;
        nodeLayer.activate();

        drawGraph();
        
        // Add layer for annotations
        paper.project.addLayer(new Layer());
        paper.project.layers[2].name = "annotationLayer";
        

        // Add layers for fault edges and nodes
        paper.project.addLayer(new Layer());
        paper.project.addLayer(new Layer());
        paper.project.layers[3].name = "faultEdgeLayer";
        paper.project.layers[4].name = "faultNodeLayer";

        // Add Layer for input output bindings
        paper.project.addLayer(new Layer());
        paper.project.layers[5].name = "ioBindingCoverLayer";
        var background = new Path.Rectangle(paper.view.bounds.topLeft, paper.view.size);
        background.fillColor = 'black';
        background.opacity = 0.75;
        background.visible = false;

        paper.project.layers[5].addChild(background);

        paper.project.addLayer(new Layer());
        paper.project.layers[6].name = "ioBindingLayer";

        var tool = new Tool();
        
        // These are functions for users to observe the canvas
        // DRAGGING
        tool.onMouseDrag = function(event){
            const sensitivity = 180;
            var delta = event.downPoint.subtract(event.point)

            if (delta.x**2+delta.y**2 > sensitivity){
                mouseDrag.current = true;
            }
            paper.view.scrollBy(delta)
            paper.project.layers[5].children[0].position = paper.view.center;
        }

        tool.onMouseUp = function(event){
            mouseDrag.current = false;
        }
        //ZOOMING IN/OUT
        tool.onKeyDown = function(event){
            if (event.key === 'w'){
                paper.view.zoom *= 1.2;
                paper.project.layers[5].children[0].bounds.height *= 1/1.2;
                paper.project.layers[5].children[0].bounds.width *= 1/1.2;
                paper.project.layers[5].children[0].position = paper.view.center;
            }

            if (event.key === 's'){
                paper.view.zoom *= 0.8;
                paper.project.layers[5].children[0].bounds.height *= 1/0.8;
                paper.project.layers[5].children[0].bounds.width *= 1/0.8;
                paper.project.layers[5].children[0].position = paper.view.center;
            }
        }

        

       
   }, [graph_layout])

    const drawGraph = () => {

        paper.project.activeLayer.name = "nodeLayer";

        const width = 150;
        const height = 100;

        var rectOg = new Path.Rectangle(new Point(0,0), new Size(width, height));
        rectOg.strokeColor = 'black';
        rectOg.fillColor = '#b2bec3';
        rectOg.visible =false;
        

        var rect = rectOg.clone();
        rect.visible =true;
        
        var label = new PointText();
        label.content = "";
        label.scale(1);
        label.position = new Point(0,height/2);
        label.fontFamily = 'Roboto Mono';
        label.visible = true;

        var openIOBindings = new Raster('openIcon');
        openIOBindings.scale(0.3);
        openIOBindings.position = new Point(width-20, height-20);
        openIOBindings.visible = false;

        var task = new Group(rect, label, openIOBindings);
        task.position = new Point(200,200);
        task.visible = false;
        
        console.log(graph_layout.nodes()[0].position().x);

        
        
        graph_layout.nodes().forEach((node) => { 
            var type = task.clone();
            
            // variable used to snap the nodes to the grid
            var tolerance = 10;
            // This is used to wrap the text inside the node  
            var label = node_dict[node.id()].name ? node_dict[node.id()].name : node_dict[node.id()].type;


            // This snaps the nodes into place, so that the layout is more elegant.
            let x = Math.round(node.position().x/tolerance)*tolerance;
            let y = Math.round(node.position().y/tolerance)*tolerance;


            const numChars = 20;
            if (label){
                
                if (label.length > numChars){
                    label = label.slice(0, numChars-3) + "...";
                }
                else{
                    label = " ".repeat(Math.floor((numChars - label.length)/2)) + label;
                }

                type.children[1].content = label;
            }

            
            if (node_dict[node.id()].type === 'startEvent'){
                type = paper.project.importSVG(startEvent);
                type.scale(0.5);
            }
            if (node_dict[node.id()].type === 'endEvent'){
                type = paper.project.importSVG(endEvent);
                type.scale(0.5);
            }
            
            if (node_dict[node.id()].type === 'intermediateThrowEvent'){
                type = paper.project.importSVG(throwEvent);
                type.scale(0.5);
            }

            if (node_dict[node.id()].type === 'intermediateCatchEvent'){
                type = paper.project.importSVG(catchEvent);
                type.scale(0.5);
            }

            if (node_dict[node.id()].type === 'userTask'){
                type = paper.project.importSVG(userTaskSVG);
                type.scale(0.2);

            }

            if (node_dict[node.id()].type === 'scriptTask'){
                type = paper.project.importSVG(scriptTaskSVG);
                type.scale(0.4);
            }

            if (node_dict[node.id()].type === 'serviceTask'){
                type = paper.project.importSVG(serviceTaskSVG);
                type.scale(0.4);
            }
            
            if (node_dict[node.id()].type === 'sendTask'){
                type = paper.project.importSVG(sendTaskSVG);
                type.scale(0.4);
            }

            if (gateway_types.includes(node_dict[node.id()].type)){
                type = paper.project.importSVG(gatewaySVG);
                type.scale(0.6)
                
            }

            // Checks if there are io bindings and allows it to be opened
            if (node_dict[node.id()].inputOutputBinding){
                if (!type.children[2]){
                    console.log(node_dict[node.id()].type);
                    var openIOBindings = new Raster('openIcon');
                    openIOBindings.scale(0.3);
                    openIOBindings.bounds.bottomRight = new Point(type.bounds.bottomRight.x, type.bounds.bottomRight.y);
                    
                    var labelComponent = new PointText();
                    labelComponent.content = "";
                    labelComponent.scale(1);
                    labelComponent.bounds.bottomLeft = new Point(type.bounds.bottomLeft.x, type.bounds.bottomLeft.y+20);
                    labelComponent.fontFamily = 'Roboto Mono';
                    labelComponent.visible = true;
                
                    type = new Group(type, labelComponent ,openIOBindings);
            }

                
                type.children[2].visible = true;
                type.children[2].onMouseUp = function(event){
                    if (!mouseDrag.current){
                        displayIOBindings(node_dict[node.id()]);}
                };
            }

            node_dict[node.id()].group = type;
            
            addMouseNodeInteraction(type, node_dict[node.id()], node.position())

            

            x = x*spacing;
            y = Math.round(y*spacing);
        

            type.position = new Point(x,y);

            type.visible = true;
            
        });


        setNode_dict(node_dict);

        paper.view.setCenter(graph_layout.nodes()[0].position().x*spacing, graph_layout.nodes()[0].position().y*spacing);
        
        
        // The new active layer will be the edge layer
        paper.project.activeLayer.insertAbove(new Layer());
            
        paper.view.draw(); 
        
        setEdge_dict(createEdges(node_dict));

        paper.view.pause();


    }

    const createEdges = (node_dict) => {
        // create edges
        paper.project.activeLayer.name = "edgeLayer";
        var temp_edge_dict = {};
        json.edges.forEach((edge) => {

            if (io_binding_edge_types.includes(edge.type) || edge.type === "faultFlow" || !node_dict[edge.sourceRef] || !node_dict[edge.targetRef]){
                return;
            }

            var arrowHead  = paper.project.importSVG(arrowHeadSVG);
            arrowHead.scale(0.1);

            var sourcePoint = node_dict[edge.sourceRef].group.position;
            var targetPoint = node_dict[edge.targetRef].group.position;
            var arrowHeadDirection = 0;
            
            const sourcePosition = {x : Math.floor(node_dict[edge.sourceRef].group.position.x), y: Math.floor(node_dict[edge.sourceRef].group.position.y)};
            const targetPosition = {x : Math.floor(node_dict[edge.targetRef].group.position.x), y: Math.floor(node_dict[edge.targetRef].group.position.y)};

            if (sourcePosition.x > sourcePosition.x){
                sourcePoint = node_dict[edge.sourceRef].group.bounds.leftCenter;
                targetPoint = node_dict[edge.targetRef].group.bounds.rightCenter;
                arrowHead.bounds.leftCenter = targetPoint;
                arrowHeadDirection = 270;

            }

            if (sourcePosition.x < targetPosition.x ){
                sourcePoint = node_dict[edge.sourceRef].group.bounds.rightCenter;
                targetPoint = node_dict[edge.targetRef].group.bounds.leftCenter;
                arrowHead.bounds.rightCenter = targetPoint;
                arrowHeadDirection = 90;

            }

            if (sourcePosition.y < targetPosition.y){
                targetPoint = node_dict[edge.targetRef].group.bounds.topCenter;
                arrowHead.bounds.bottomCenter = targetPoint;
                arrowHeadDirection = 180;


            }
            
            if (sourcePosition.y > targetPosition.y){
                
                targetPoint = node_dict[edge.targetRef].group.bounds.bottomCenter;
                arrowHead.bounds.topCenter = targetPoint;
                arrowHeadDirection = 0;


            }

            arrowHead.rotate(arrowHeadDirection);

           
            var new_edge = new Path();

            new_edge.add(sourcePoint);

            // This checks whether to add an elbow corner or if it's just a straight line
            if (sourcePoint.x !== targetPoint.x && sourcePoint.y !== targetPoint.y){
                var point = new Point(node_dict[edge.targetRef].group.position.x, node_dict[edge.sourceRef].group.position.y );
                new_edge.add(point);
            }
            
            
            new_edge.add(targetPoint);
            
            

            new_edge.strokeColor = '#0984e3';
            new_edge.strokeWidth = 4;
            temp_edge_dict[edge.id] = new_edge;

        });
        return temp_edge_dict;


    }

    const addMouseNodeInteraction = (type, node, position) => {
        // When pressed on should show node information on the InfoCard
        // Checks whether the mouse is dragged so that traversing won't change the info card.
            
            type.onMouseDown = function(event){
                mouseDrag.current = false;
            };

            type.onMouseDrag = function(event){
                
                setSelectedNodeLabel({
                    "name": node.name,
                    "position" : {
                        "x": 0.5 + (position.x*10 - paper.view.center.x) / paper.view.size.width,
                        "y": 0.5 + (position.y*10 - paper.view.center.y) / paper.view.size.height}
                    });
            
            };

            type.onMouseUp = function(event){
                if (!mouseDrag.current){
                    setNodeCard(node);
                }
            };

            if (node.inputOutputBinding){
                type.children[2].onMouseUp = function(event){
                    if (!mouseDrag.current){
                        displayIOBindings(node);}
                };
            }

             // Hover over and display the full name
             type.onMouseEnter = function(event){
                
                paper.project.layers[2].removeChildren();

                var annotationRect = new Path.Rectangle(type.bounds.topLeft, type.bounds.size);
                annotationRect.fillColor = 'white';
                annotationRect.strokeColor = 'black';
                annotationRect.strokeCap = 'round';

                
                var label = new PointText();
                label.content = node.name;
                label.scale(1);
                label.fontFamily = 'Roboto Mono';

                annotationRect.bounds.width = label.bounds.width + 20;
                annotationRect.bounds.height = label.bounds.height + 20;
                annotationRect.position.y -= annotationRect.bounds.size.height;
                label.position = annotationRect.position;
                var group = new Group(annotationRect, label);
                group.position.x = type.position.x;
                paper.project.layers[2].addChild(group);
                
            };
            type.onMouseLeave = function(event) {
                paper.project.layers[2].removeChildren();
            }
    }

    const runFault =  function() {

        stageRef.current = 0;
        faultPathRef.current = [];
        
        // Loops through the execution path and changes the color of the nodes and edges
        fault_dict[fault].execution_path.forEach((node) => {
            if (node_dict[node]){
                faultPathRef.current.push(node_dict[node]);
            }
            if (edge_dict[node]){
                faultPathRef.current.push(edge_dict[node]);
            }
        });

        
        const nodeLayer = paper.project.layers[4];
        const edgeLayer = paper.project.layers[3];

        nodeLayer.removeChildren();
        edgeLayer.removeChildren();

        
        
        // This is for highlighting the path.
        paper.view.onFrame = (event) => {

            if (playing.current){
                
                var stage = stageRef.current;
                var faultPath = faultPathRef.current;

                if (elapsedTime.current >= 1){
                    elapsedTime.current = 0;
                    nextFault();
                }
            
            elapsedTime.current += event.delta;
           }
        };
    }

    const prevFault = function() {
        
        var faultPath = faultPathRef.current;
        if (faultPath[stageRef.current-1]){
            stageRef.current-=1;
        }

        var stage = stageRef.current;
        const nodeLayer = paper.project.layers[4];
        const edgeLayer = paper.project.layers[3];

        // This assumes that is starts with a node
        if (stage % 2 === 0){
            nodeLayer.removeChildren(Math.floor(stage/2), Math.floor(stage/2)+1)
        }
        if (stage % 2 === 1 ){
            edgeLayer.removeChildren(Math.floor(stage/2), Math.floor(stage/2)+1)
        }



    }

    const nextFault = function() {


        var faultPath = faultPathRef.current;
        var stage = stageRef.current;

        if (faultPath[stageRef.current]){
            stageRef.current+=1;
        }
        else{
            playing.current = false;
            setIsPlaying(false);
            return;
        }
        const nodeLayer = paper.project.layers[4];
        const edgeLayer = paper.project.layers[3];

        

       

        if (faultPath[stage].group){
            var fp = faultPath[stage].group.clone();
            nodeLayer.addChild(fp);

            addMouseNodeInteraction(fp, faultPath[stage], fp.position);
            
            if (faultPath[stage].type === "InputOutputBinding"){
                fp.source = inputOutputFault;
                return;
            } 
            if (gateway_types.includes(faultPath[stage].type)){
                fp.children[1].fillColor = '#d63031';
                return;
            } 
            if (event_types.includes(faultPath[stage].type)){
                fp.children[1].fillColor = '#d63031';
                return;
            }

            fp.children[0].fillColor = '#d63031';
            
        
        }
        // Checks if it is an edge as a group only exists for the nodes
        if (faultPath[stage].visible){ 
            var fp = faultPath[stage].clone();
            edgeLayer.addChild(fp);
            fp.strokeColor ='#d63031';
            fp.strokeWidth = 10;
        }
    }

    const displayIOBindings = (node) => {
        // Switches from open button to close
        node.group.children[2].source = closeIcon;

        // Layer 5 is the overlay, so it will grey out other nodes to increase visibility
        paper.project.layers[5].children[0].visible = true;

        // When the close button is pressed, the IO bindings will be removed and the button will become open
        node.group.children[2].onMouseUp = function(event){
            if (mouseDrag.current) {return;}
            node.group.children[2].source = openIcon;

            paper.project.layers[1].addChild(node.group);

            // Functionality for open button
            node.group.children[2].onMouseUp = function(event){
                if (!mouseDrag.current){
                    displayIOBindings(node);
                }
            };

            paper.project.layers[6].removeChildren();
            paper.project.layers[5].children[0].visible = false;
        };

        

        var spacing = 300;
        Object.keys(node.inputOutputBinding).forEach((io, index) => {
            var ioImage = paper.project.importSVG(inputOutputBindingSVG);
            ioImage.scale(1.5);
            var angle = index/Object.keys(node.inputOutputBinding).length*Math.PI*2;
            ioImage.position = new Point(node.group.position.x+Math.sin(angle)*spacing, node.group.position.y+Math.cos(angle)*spacing);

            var mouseDrag = false;
            ioImage.onMouseDown = function(event){mouseDrag = false;};
            ioImage.onMouseDrag = function(event){mouseDrag = true;};
            ioImage.onMouseUp = function(event){
                if (!mouseDrag){
                    setNodeCard(node.inputOutputBinding[io]);
                }
            };

            var edge = new Path();
            edge.add(node.group.position);
            edge.add(ioImage.position);
            edge.strokeColor = '#0984e3';
            edge.strokeWidth = 4;

            paper.project.layers[6].addChild(edge);
            paper.project.layers[6].addChild(ioImage);

        });
        
        paper.project.layers[6].addChild(node.group);
    }

    useEffect(()=>{if (fault){runFault()}}, [fault]);

    useEffect(() =>{
        if (playing.current && paper.view){
            paper.view.play();
            return;
        }
        if (paper.view){
            paper.view.pause();
        }
        
    }, [isPlaying, paper.view]);
    
    document.fonts.ready.then(function () {
        //paper.view.draw(); 
    });
    
   

   return (
        <> 

        <LeftSideBar openLeft={openLeft} />
        <RightSideBar nodeCard={nodeCard} />
        

        <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet"/>
        <img id='event-img' src={eventSymbol} style={{display:"none"}} />
        <img id='gateway-img' src={gateway} style={{display:"none"}} />
        <img id='gatewayFault' src={gatewayFault} style={{display:"none"}} />
        <img id='inputOutput' src={inputOutputFault} style={{display:"none"}} />
        <img id='inputOutputFault' src={inputOutputFault} style={{display:"none"}} />
        <img id='openIcon' src={openIcon}  style={{display:"none"}} />
        <img id='closeIcon' src={closeIcon} style={{display:"none"}} />
    
         <FaultContext.Provider value={{fault, setFault, fault_dict}}>
            <PlayControls onPlay={onPlay} onNext={nextFault} onPrev={prevFault} playing={isPlaying}/>
        </FaultContext.Provider> 
        
        </>
   );
}