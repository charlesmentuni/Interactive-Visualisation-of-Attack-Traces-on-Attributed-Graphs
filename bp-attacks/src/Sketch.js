import {Point, Path, onMouseDown, Tool, Size, TextItem, PointText, Group, Raster, Layer} from 'paper';
import paper from 'paper';
import ReadBP from './CodeBlock.js';
import json from './wf102.json';
import { useEffect, useState, useRef } from 'react';
import { Collapse, Card, CardHeader, IconButton, CardContent, Button, ButtonGroup , Box, Typography } from '@mui/material';
import {KeyboardArrowDown, KeyboardArrowUp, PlayArrow, SkipNext, SkipPrevious, ChevronRightRounded, ChevronLeftRounded} from '@mui/icons-material';
import cytoscape from "cytoscape";
import klay from "cytoscape-klay";

import gatewaySVG from "./symbols/exclusive_gateway.svg";
import gateway from "./symbols/gateway.png";
import inputOutput from "./symbols/inputOutput.png";
import inputOutputFault from "./symbols/inputOutputFault.png";
import gatewayFault from "./symbols/gatewayFault.png";
import eventFault from "./symbols/eventFault.png";
import eventSymbol from "./symbols/event.png";
import openIcon from "./symbols/openIcon.png";
import closeIcon from "./symbols/closeIcon.png";


import CodeBlock from './CodeBlock.js';
import RightSideBar from './RightSideBar.js';
import LeftSideBar from './LeftSideBar.js';
import PlayControls from './PlayControls.js';
import NodeLabel from './NodeLabel.js';

export default function Sketch() {
    
   const gatewaySVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="121.32mm" height="174.97mm" version="1.1" viewBox="0 0 121.32 174.97" xmlns="http://www.w3.org/2000/svg">
<path d="m0.4 0.4v26.364h31.071v121.44h-31.071v26.364h120.52v-26.364h-31.071v-121.44h31.071v-26.364z" fill="#fdcb6e" stroke="#000" stroke-width=".8"/>
</svg>`;

    const userTaskSVG = `<?xml version="1.0" encoding="UTF-8"?> <svg width="369.39mm" height="496.32mm" version="1.1" viewBox="0 0 205.22 275.73" xmlns="http://www.w3.org/2000/svg"> <g transform="translate(-2.2236 -20.838)"> <path d="m104.98 24.467a73.362 74.344 0 0 0-73.362 74.344 73.362 74.344 0 0 0 24.733 55.59 100.06 191.25 0 0 0-50.2 138.49c204.61 2e-3 198.33 0.0405 197.67 0.0425a100.06 191.25 0 0 0-50.145-138.6 73.362 74.344 0 0 0 24.662-55.517 73.362 74.344 0 0 0-73.362-74.344z" fill="#a29bfe" stroke="#000" stroke-width="7.2576"/> </g> </svg>`;

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
    
    
    const io_binding_edge_types = ["inputParameter",
        "outputParameter",
        "assignment",  
        "dataSource"
        ];
    

    // Contains dictionary of node information that has just been clicked on
    const [nodeCard, setNodeCard] = useState(null);
    const [open, setOpen] = useState(false);
    const [openLeft, setOpenLeft] = useState(false);
    const [openRight, setOpenRight] = useState(false);
    //const [faultPath, setFaultPath] = useState([]);
    const faultPathRef = useRef([]);
    const spacing = 10;
    const stageRef = useRef(0);
    const playing = useRef(false);
    const elapsedTime = useRef(0);
    const nd = useRef({});
    const ed = useRef({});
    const iod = useRef({});
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedNodeLabel, setSelectedNodeLabel] = useState(null);

    const onPlay = () => {
        playing.current = !playing.current;
        setIsPlaying(!isPlaying);
    }

    // This is an attempt to resize the window to fit the canvas, but it doesn't work
    window.onresize = function(event) {
 
        document.getElementById('paper-canvas').style.height = window.innerHeight;
        document.getElementById('paper-canvas').style.height = window.innerHeight;
    }
        

   window.onload = function() {

        paper.setup('paper-canvas');

        const nodeLayer  = paper.project.activeLayer;
        nodeLayer.activate();

        
        createND();
        getIONodes();
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
            var delta = event.downPoint.subtract(event.point)
            paper.view.scrollBy(delta)
            paper.project.layers[5].children[0].position = paper.view.center;
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

        

       
   }

   const createND = () => {
    // Creates a dictionary of nodes with their uuid as the key
    var node_dict = {};
    var io_dict = {};
    json.nodes.forEach((node, index) => {
        if (node.type === "InputOutputBinding"){
            io_dict[node.uuid] = node;
            return;
        }
            node_dict[node.uuid] = {};

            Object.keys(node).forEach((key) => {
                if (key !== 'uuid'){
                    node_dict[node.uuid][key] = node[key];
                }

            });

        
    });
    iod.current = io_dict;
    nd.current = node_dict;
   }

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
        
        

        var node_dict = nd.current;

        
        var graph = graphLayout();
        graph.nodes().forEach((node) => { 
            var type = task.clone();
            
            // This is used to wrap the text inside the node  
            var label = node_dict[node.id()].name ? node_dict[node.id()].name : node_dict[node.id()].type;
            
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

            if (event_types.includes(node_dict[node.id()].type )){
                type = new Raster('event-img');
            }
            
            if (gateway_types.includes(node_dict[node.id()].type)){
                type = paper.project.importSVG(gatewaySVG);
                type.scale(0.6)
                
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
                setSelectedNodeLabel({
                    "name": node_dict[node.id()].name,
                    "position" : {
                        "x": 0.5 + (node.position().x*10 - paper.view.center.x) / paper.view.size.width,
                        "y": 0.5 + (node.position().y*10 - paper.view.center.y) / paper.view.size.height}
                    });
            
            };


            type.onMouseUp = function(event){
                if (!mouseDrag){
                    toggleInfoCard(node_dict[node.id()]);
                }
            };
            
            // Hover over and display the full name
            type.onMouseEnter = function(event){
                
                paper.project.layers[2].removeChildren();

                var annotationRect = new Path.Rectangle(type.bounds.topLeft, type.bounds.size);
                annotationRect.fillColor = 'white';
                annotationRect.strokeColor = 'black';
                annotationRect.strokeCap = 'round';

                
                var label = new PointText();
                label.content = node_dict[node.id()].name;
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

    

            // Checks if there are io bindings and allows it to be opened
            if (node_dict[node.id()].inputOutputBinding){
                type.children[2].visible = true;
                type.children[2].onMouseUp = function(event){
                    if (!mouseDrag){
                        displayIOBindings(node_dict[node.id()]);}
                };
            }

            node_dict[node.id()].group = type;
            
            type.position.x = node.position().x*spacing;
            type.position.y = node.position().y*spacing;

            type.visible = true;
           
        });
        nd.current = node_dict;
        paper.view.setCenter(graph.nodes()[0].position().x*spacing, graph.nodes()[0].position().y*spacing);
        
        
        console.log(paper.project.layers);
        // The new active layer will be the edge layer
        paper.project.activeLayer.insertAbove(new Layer());
        
        // The next two layers will be used for fault edges and nodes
        
        
    
        paper.view.draw(); 
        const edge_dict = createEdges(node_dict);
        ed.current = edge_dict;

        

        paper.view.pause();


   }
   const createEdges = (node_dict) => {
        // create edges
        paper.project.activeLayer.name = "edgeLayer";
        var edge_dict = {};
        json.edges.forEach((edge) => {

            if (io_binding_edge_types.includes(edge.type)){
                return;
            }
            
            var new_edge = new Path();

            new_edge.add(node_dict[edge.sourceRef].group.position);
            var point = new Point(node_dict[edge.targetRef].group.position.x, node_dict[edge.sourceRef].group.position.y );
            new_edge.add(point);
            new_edge.add(node_dict[edge.targetRef].group.position);


            new_edge.strokeColor = '#0984e3';
            new_edge.strokeWidth = 4;
            edge_dict[edge.id] = new_edge;

        });
        return edge_dict;
    

   }
   const convertToGraph = () => {
        // Turns the json file into something the cytoscape.js can interpret
        var graph = {elements: []};
        
        json.nodes.forEach((node) => {
            if (node.type === "InputOutputBinding"){
                return;
            }
            
            graph.elements.push({data: {id: node.uuid}});
        });
        json.edges.forEach((edge) => {
            if (io_binding_edge_types.includes(edge.type)){
                return;
            }
            graph.elements.push({data: {id: edge.uuid, source: edge.sourceRef, target: edge.targetRef}});
        });
        return graph;
   }

    const graphLayout = () => {
        // Sets up graph layout using Cytoscape to output the coordinates of the nodes
        // May potentially be used for the edges as well.
        // The fact that it is so close to BPMN should mean that could layout graph in own way
        const cy = cytoscape(convertToGraph());
        cytoscape.use(klay);
        const layout = cy.layout({
            name: "klay", // Use 'breadthfirst', 'grid', 'circle', etc.
            animate: false
        });
            
        layout.run();
        
        return cy;
    }

    const runFault =  function(fault) {
        const node_dict = nd.current;
        const edge_dict = ed.current;
        stageRef.current = 0;
        faultPathRef.current = [];
        
        // Loops through the execution path and changes the color of the nodes and edges
        node_dict[fault].execution_path.forEach((node) => {
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

        
        
        var faultNode = node_dict[fault].group.clone();
        nodeLayer.addChild(faultNode);
        
        var mouseDrag = false;
        faultNode.onMouseDown = function(event){
            mouseDrag = false;
        };

        faultNode.onMouseDrag = function(event){
            mouseDrag = true;
        };

        faultNode.onMouseUp = function(event){
            if (!mouseDrag){
                toggleInfoCard(node_dict[fault]);
            }
        };
        faultNode.children[0].fillColor = '#00b894';
        
        paper.view.onFrame = (event) => {

            if (playing.current){
                
                var stage = stageRef.current;
                var faultPath = faultPathRef.current;

                if (elapsedTime.current >= 1){
                    elapsedTime.current = 0;
                    if (faultPath[stageRef.current+1]){
                        stageRef.current += 1;
                    }
                    else{
                        playing.current = false;
                        setIsPlaying(false);
                    }

                    // maybe put this in a separate function
                    // because then you can call it from previous and next buttons
                    if (faultPath[stage].group){
                        var fp = faultPath[stage].group.clone();
                        nodeLayer.addChild(fp);

                        var mouseDrag = false;
                        fp.onMouseDown = function(event){
                            mouseDrag = false;
                        };

                        fp.onMouseDrag = function(event){
                            mouseDrag = true;
                        };

                        fp.onMouseUp = function(event){
                            if (!mouseDrag){
                                toggleInfoCard(faultPath[stage]);
                            }
                        };
                        
                        if (faultPath[stage].type === "InputOutputBinding"){
                            fp.source = inputOutputFault;
                            return;
                        } 
                        if (gateway_types.includes(faultPath[stage].type)){
                            fp.children[1].fillColor = '#d63031';
                            return;
                        } 
                        if (event_types.includes(faultPath[stage].type)){
                            fp.source = eventFault;
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
            
            elapsedTime.current += event.delta;
           }
        };
    }

    const toggleInfoCard = (node) => {
        setNodeCard(node);
    }

    const getIONodes = () => {
        json.edges.forEach((edge) => {
            // if target ref is in input output dictionary then add to an array the sourceRef record in the node dictionary
            if (iod.current[edge.targetRef]){
                if (!nd.current[edge.sourceRef].inputOutputBinding){
                    nd.current[edge.sourceRef].inputOutputBinding = {};
                }
                nd.current[edge.sourceRef].inputOutputBinding[edge.targetRef] = iod.current[edge.targetRef];
            }
        });
    }

    const displayIOBindings = (node) => {

        node.group.children[2].source = closeIcon;

        paper.project.layers[5].children[0].visible = true;

        node.group.children[2].onMouseUp = function(event){
            node.group.children[2].source = openIcon;
            paper.project.layers[1].addChild(node.group);
            node.group.children[2].onMouseUp = function(event){
                displayIOBindings(node);
            };
            paper.project.layers[6].removeChildren();
            paper.project.layers[5].children[0].visible = false;
        };

        paper.project.layers[6].addChild(node.group);

        var spacing = 300;
        Object.keys(node.inputOutputBinding).forEach((io, index) => {
            var ioImage = new Raster('inputOutput');
            var angle = index/Object.keys(node.inputOutputBinding).length*Math.PI*2;
            ioImage.position = new Point(node.group.position.x+Math.sin(angle)*spacing, node.group.position.y+Math.cos(angle)*spacing);

            var mouseDrag = false;
            ioImage.onMouseDown = function(event){mouseDrag = false;};
            ioImage.onMouseDrag = function(event){mouseDrag = true;};
            ioImage.onMouseUp = function(event){
                if (!mouseDrag){
                    toggleInfoCard(node.inputOutputBinding[io]);
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
        

    }

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
        paper.view.draw(); 
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
        <img id='exclusiveGateway' src={gatewaySVG} style={{display:"none"}} />
    
        <PlayControls onPlay={onPlay} onChange={(fault) => {runFault(fault)}} playing={isPlaying}/>
        
        </>
   );
}