import {Point, Path, onMouseDown, Tool, Size, TextItem, PointText, Group, Raster, Layer} from 'paper';
import paper from 'paper';
import ReadBP from './CodeBlock.js';
//import json from './wf102.json';
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
import labelPointer from "./symbols/labelPointer.png"

import { gatewaySVG,  inputOutputBindingSVG,  userTaskSVG, arrowHeadSVG, startEvent, endEvent, intermediateCatchEvent, catchEvent, throwEvent, scriptTaskSVG, serviceTaskSVG, sendTaskSVG, labelHeadSVG} from './SVGAssets.js';
import { event_types, gateway_types, io_binding_edge_types } from './blmodel.js';

import CodeBlock from './CodeBlock.js';
import RightSideBar from './RightSideBar.js';
import LeftSideBar from './LeftSideBar.js';
import PlayControls from './PlayControls.js';
import NodeLabel from './NodeLabel.js';

export const FaultContext = createContext();

export default function Sketch() {
    
   
    const {node_dict, setNode_dict, edge_dict, setEdge_dict, graph_layout, fault_dict, json, subProcessNodes, subProcessChildren} = useContext(GraphContext);

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
    const edge_dict_ref = useRef("");
    const time_passed_zoom = useRef(0);
    const [fault, setFault] = useState("");
    const zoomed_node_current = useRef(null);
    const initial_pos = useRef(null);

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
            // RECENTER
            if (event.key === 'r'){
                paper.view.zoom = 1;
                paper.view.setCenter(graph_layout.nodes()[0].position().x*spacing, graph_layout.nodes()[0].position().y*spacing);
                
            }
        }


    console.timeEnd('timeGraph');
    performance.mark('afterInit');
    console.log("timeGraph",performance.measure('finalMeasure', 'beforeInit', 'afterInit').duration);

       
   }, [graph_layout])

   const animateZoomToNode = (event) =>{

        if (!zoomed_node_current.current){return;}
        if (time_passed_zoom.current === 0){initial_pos.current = paper.view.center; }
        var zoomDuration = 1;
        time_passed_zoom.current += event.delta;
    
        if (time_passed_zoom.current > zoomDuration){time_passed_zoom.current = 0; paper.view.center = zoomed_node_current.current.group.position; zoomed_node_current.current =null; return;}
        var percent_done = time_passed_zoom.current/zoomDuration;

        var newCenter = new Point();
        newCenter.x =  initial_pos.current.x + (zoomed_node_current.current.group.position.x-initial_pos.current.x)*Math.sin(percent_done*(Math.PI/2));
        newCenter.y = initial_pos.current.y + (zoomed_node_current.current.group.position.y-initial_pos.current.y)*Math.sin(percent_done*(Math.PI/2));
        paper.view.setCenter(newCenter);

        paper.view.draw();
   }

   const closeSubProcesses = (subProcessNode) =>{
        subProcessNode.group.children[3].source = openIcon;
        subProcessNode.opened = false;
    

        // Functionality for open button
        subProcessNode.group.children[3].onMouseUp = function(event){
            if (!mouseDrag.current){
                displaySubProcesses(subProcessNode);
            }
        };

        shiftNodes(subProcessNode, -1);

        subProcessNode.group.children[0].bounds.width = 150;
        subProcessNode.group.children[0].bounds.height = 100;
        subProcessNode.group.children[0].fillColor = "#b2bec3";


        paper.project.layers[0].removeChildren();
        paper.project.layers[0].activate();
        setEdge_dict(createEdges(node_dict));

        const numChars = 20;
        var label = subProcessNode.name;
        if (label.length > numChars){
            label = label.slice(0, numChars-3) + "...";
        }
        else{
            label = " ".repeat(Math.floor((numChars - label.length)/2)) + label;
        }

        subProcessNode.group.children[1].content = label;
        
        

        Object.keys(subProcessNode.children).forEach((key)=>{
            subProcessNode.children[key].group.visible = false;
        })

        Object.keys(subProcessNode.edges).forEach((key)=>{
            subProcessNode.edges[key].arrowHead.remove();
            subProcessNode.edges[key].edge.remove();

        })
        



   }

   const displaySubProcesses = (node) => {
        
        node.opened = true;

        node.group.children[3].source = closeIcon;
    

        var maxXNode = null;
        var maxYNode = null;

        node.layout.nodes().forEach((node)=>{
            if (!maxXNode || node.position().x >= maxXNode.position().x){maxXNode = node;}
            if (!maxYNode || node.position().y >= maxYNode.position().y){maxYNode = node;}
        })

        paper.project.layers[1].activate();
        node.children = displayGraphLayout(node.layout, node.children, {x:node.group.position.x/spacing, y:  node.group.position.y/spacing});


        node.edges = createEdges(node.children);
        
        /* var subnodes = new Group();
        Object.keys(node.children).forEach((subnode)=>{
            node.children[subnode].group.addTo(subnodes);
        }); 
        subnodes.addTo(node.group); */
        
        node.group.children[0].bounds.width = node.children[maxXNode.id()].group.children[0].bounds.rightCenter.x - node.group.children[0].bounds.leftCenter.x;

        //node.group.children[0].bounds.height = node.children[maxYNode.id()].group.children[0].bounds.bottomCenter.y - node.group.children[0].bounds.topCenter.y;
        
        node.group.children[1].content = ""
        node.group.children[0].fillColor = "#dfe6e9";
        shiftNodes(node);

        node.group.children[3].onMouseUp = function(event){
            if (mouseDrag.current) {return;}
            closeSubProcesses(node); 
        };

        
    }

    const shiftNodes = (subProcessNode, direction=1) => {

        
        Object.keys(node_dict).forEach((key)=>{
            var node = node_dict[key];

            if (subProcessNode.id === node.id){return;}
            if(node.opened){
                Object.keys(node.children).forEach((key)=>{
                    var subnode = node.children[key];
                    if (subProcessNode.group.children[0].contains(subnode.group.position) || Math.round(subnode.group.bounds.leftCenter.x) > Math.round(subProcessNode.group.bounds.rightCenter.x)){
                        subnode.group.position.x += direction*subProcessNode.group.children[0].bounds.width;
                    }
                    else if (Math.round(subnode.group.position.y) < Math.round(subProcessNode.group.position.y)){
                        subnode.group.position.y += direction*subProcessNode.group.children[0].bounds.height;
                    }
                });
            }
            if (subProcessNode.group.children[0].contains(node.group.position)){console.log("yassss");}
            if (node.name === "node 36"){console.log(node.group.bounds.leftCenter); console.log(subProcessNode.group.children[0].position);}
            if (subProcessNode.group.children[0].contains(node.group.bounds.leftCenter) || Math.round(node.group.bounds.leftCenter.x) > Math.round(subProcessNode.group.bounds.rightCenter.x)){
                node.group.position.x += direction*Math.round(subProcessNode.group.children[0].bounds.width);
            }
            else if (Math.round(node.group.position.y) < Math.round(subProcessNode.group.position.y)){
                node.group.position.y += direction*Math.round(subProcessNode.group.children[0].bounds.height);
            }
            
        });

       
        paper.project.layers[1].activate();
        Object.keys(subProcessNodes.current).forEach((key)=>{
            var node = node_dict[key];

            if (node_dict[key].opened){
                Object.keys(node_dict[key].edges).forEach((key1)=>{node_dict[key].edges[key1].edge.remove(); node_dict[key].edges[key1].arrowHead.remove(); })
                node_dict[key].edges = createEdges(node_dict[key].children);
            }
        })

        paper.project.layers[0].removeChildren();
        paper.project.layers[0].activate();
        setEdge_dict(createEdges(node_dict));
        
    } 
    
    const displayGraphLayout = (new_graph_layout, temp_node_dict, padding={x:0,y:0}) => {

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

        var openSubProcess = openIOBindings.clone();
        openSubProcess.position = new Point(20, height - 20);


        var task = new Group(rect, label, openIOBindings, openSubProcess);
        task.position = new Point(200,200);
        task.visible = false;

        new_graph_layout.nodes().forEach((node) => { 
            var type = task.clone();
            
            // variable used to snap the nodes to the grid
            var tolerance = 10;
            // This is used to wrap the text inside the node 
            var label = temp_node_dict[node.id()].name ? temp_node_dict[node.id()].name : temp_node_dict[node.id()].type;


            // This snaps the nodes into place, so that the layout is more elegant.
            let x = Math.round((node.position().x+padding.x)/tolerance)*tolerance;
            let y = Math.round((node.position().y+padding.y)/tolerance)*tolerance;


            var numChars = 15;
            if (temp_node_dict[node.id()].type === "subProcess"){numChars=20;}
            if (label){
                
                if (label.length > numChars){
                    label = label.slice(0, numChars-3) + "..";
                }
                else{
                    label = " ".repeat(Math.floor((numChars - label.length)/2)) + label;
                }

                type.children[1].content = label;
            }

            var isSVG = false;
            if (temp_node_dict[node.id()].type === 'startEvent'){
                type = paper.project.importSVG(startEvent);
                type.scale(0.5);
                label ="";
                isSVG=true;
            }
            if (temp_node_dict[node.id()].type === 'endEvent'){
                type = paper.project.importSVG(endEvent);
                type.scale(0.5);
                label="";
                isSVG=true;
            }
            
            if (temp_node_dict[node.id()].type === 'intermediateThrowEvent'){
                type = paper.project.importSVG(throwEvent);
                type.scale(0.5);
                label="";
                isSVG=true;
            }

            if (temp_node_dict[node.id()].type === 'intermediateCatchEvent'){
                type = paper.project.importSVG(catchEvent);
                type.scale(0.5);
                label="";
                isSVG=true;
            }

            if (temp_node_dict[node.id()].type === 'userTask'){
                type = paper.project.importSVG(userTaskSVG);
                type.scale(0.4);
                isSVG=true;

            }

            if (temp_node_dict[node.id()].type === 'scriptTask'){
                type = paper.project.importSVG(scriptTaskSVG);
                type.scale(0.5);
                isSVG=true;
            }

            if (temp_node_dict[node.id()].type === 'serviceTask'){
                type = paper.project.importSVG(serviceTaskSVG);
                type.scale(0.4);
                isSVG=true;
            }
            
            if (temp_node_dict[node.id()].type === 'sendTask'){
                type = paper.project.importSVG(sendTaskSVG);
                type.scale(0.4);
                isSVG=true;
            }

            if (gateway_types.includes(temp_node_dict[node.id()].type)){
                type = paper.project.importSVG(gatewaySVG);
                type.scale(0.6);
                label="";
                isSVG=true;
                
            }
            if (isSVG){
                var openIOBindings = new Raster('openIcon');
                openIOBindings.scale(0.3);
                openIOBindings.bounds.bottomRight = new Point(type.bounds.bottomRight.x, type.bounds.bottomRight.y);
                openIOBindings.visible = false;
                
                var labelComponent = new PointText();
                labelComponent.content = label;
                labelComponent.scale(1);
                labelComponent.bounds.bottomLeft = new Point(type.bounds.bottomLeft.x, type.bounds.bottomLeft.y+20);
                labelComponent.fontFamily = 'Roboto Mono';
                labelComponent.visible = true;
            
                type = new Group(type, labelComponent, openIOBindings);
            }
            // Checks if there are io bindings and allows it to be opened
            if (temp_node_dict[node.id()].inputOutputBinding){
            
                type.children[2].visible = true;
                type.children[2].onMouseUp = function(event){
                    if (!mouseDrag.current){
                        displayIOBindings(temp_node_dict[node.id()]);}
                };
            }

            if (temp_node_dict[node.id()].type === "subProcess"){
               type.children[3].visible = true;
               type.children[3].onMouseUp = (event) => {
                    if (!mouseDrag.current){
                        displaySubProcesses(temp_node_dict[node.id()]);
                    }
               }
            }

            temp_node_dict[node.id()].group = type;
            
            addMouseNodeInteraction(type, temp_node_dict[node.id()], node.position())

            

            x = x*spacing;
            y = Math.round(y*spacing);
        

            type.position = new Point(x,y);

            type.visible = true;
            
        });
        return temp_node_dict;
    }

    const drawGraph = () => {

        setNode_dict(displayGraphLayout(graph_layout, node_dict));


        paper.view.setCenter(graph_layout.nodes()[0].position().x*spacing, graph_layout.nodes()[0].position().y*spacing);
        
        
        // The new active layer will be the edge layer
        paper.project.activeLayer.insertAbove(new Layer());
            
        paper.view.draw(); 
        
        var temp_edge_dict = createEdges(node_dict);
        setEdge_dict(temp_edge_dict);
        edge_dict_ref.current = temp_edge_dict;

        paper.view.pause();


    }

    const createEdge = (source, target) => {

            var arrowHead  = paper.project.importSVG(arrowHeadSVG);
            arrowHead.scale(0.1);
             
            var sourcePoint = Math.round(source.group.position);
            var targetPoint = Math.round(target.group.position);
            var arrowHeadDirection = 0;
            
           

            const sourcePosition = {x : Math.round(source.group.position.x), y: Math.round(source.group.position.y)};
            const targetPosition = {x : Math.round(target.group.position.x), y: Math.round(target.group.position.y)};



            if (sourcePosition.x > targetPosition.x){
                
                sourcePoint = source.group.bounds.leftCenter;
                targetPoint = target.group.bounds.rightCenter;
                arrowHead.bounds.leftCenter = targetPoint;
                arrowHeadDirection = 270;
            }

            if (sourcePosition.x < targetPosition.x ){
                sourcePoint = source.group.bounds.rightCenter;
                targetPoint = target.group.bounds.leftCenter;

                arrowHead.bounds.rightCenter = targetPoint;
                arrowHeadDirection = 90;

            }

            if (sourcePosition.y < targetPosition.y){
                targetPoint = target.group.bounds.topCenter;
                arrowHead.bounds.bottomCenter = targetPoint;
                arrowHeadDirection = 180;


            }
            
            if (sourcePosition.y > targetPosition.y){
                
                targetPoint = target.group.bounds.bottomCenter;
                arrowHead.bounds.topCenter = targetPoint;
                arrowHeadDirection = 0;


            }

            arrowHead.rotate(arrowHeadDirection);

           
            var new_edge = new Path();

            new_edge.add(sourcePoint);

            targetPoint.x = Math.round(targetPoint.x);
            targetPoint.y = Math.round(targetPoint.y);
            sourcePoint.x = Math.round(sourcePoint.x);
            sourcePoint.y = Math.round(sourcePoint.y);
            // This checks whether to add an elbow corner or if it's just a straight line
            if (sourcePoint.x !== targetPoint.x && sourcePoint.y !== targetPoint.y){
                var point = new Point(target.group.position.x, source.group.position.y );
                new_edge.add(point);
            }
                
        
            new_edge.add(targetPoint);
            
            

            new_edge.strokeColor = '#0984e3';
            
            new_edge.strokeWidth = 4;
            return {"edge" : new_edge, "arrowHead" : arrowHead, "source":source, "target":target};
    };

    const createEdges = (node_dict) => {
        // create edges
        paper.project.activeLayer.name = "edgeLayer";
        var temp_edge_dict = {};
        json.edges.forEach((edge) => {

            if (io_binding_edge_types.includes(edge.type) || edge.type === "faultFlow" || edge.type === "processFlow" || !node_dict[edge.sourceRef] || !node_dict[edge.targetRef]){
                return;
            }

            temp_edge_dict[edge.id] = createEdge(node_dict[edge.sourceRef], node_dict[edge.targetRef]);

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

                var labelHead = new Raster(labelPointer);
                labelHead.scale(0.2);
                labelHead.bounds.bottomCenter.x = type.bounds.topCenter.x;
                labelHead.bounds.bottomCenter.y = type.bounds.topCenter.y-1;


                var annotationRect = new Path.Rectangle(new Point(type.bounds.topLeft.x , type.bounds.topLeft.y-labelHead.size.height*0.2), type.bounds.size);
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
                paper.project.layers[2].addChild(labelHead);

                document.getElementById('paper-canvas').style.cursor = "pointer";
                
            };
            type.onMouseLeave = function(event) {
                paper.project.layers[2].removeChildren();
                document.getElementById('paper-canvas').style.cursor = "default";
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
            ioImage.onMouseEnter = function(event){document.getElementById('paper-canvas').style.cursor = 'pointer'};
            ioImage.onMouseLeave = function(event){document.getElementById('paper-canvas').style.cursor = 'default'};

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
       // paper.view.draw(); 
    });
    

   return (
        <> 
        <LeftSideBar nodeZoom={zoomed_node_current} displaySubProcess={(node) =>{displaySubProcesses(node)}} animateZoomToNode={(event) =>{animateZoomToNode(event)}}/>
        <RightSideBar nodeCard={nodeCard} />
        

        <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet"/>
        <img id='event-img' src={eventSymbol} style={{display:"none"}} />
        <img id='gateway-img' src={gateway} style={{display:"none"}} />
        <img id='gatewayFault' src={gatewayFault} style={{display:"none"}} />
        <img id='inputOutput' src={inputOutputFault} style={{display:"none"}} />
        <img id='inputOutputFault' src={inputOutputFault} style={{display:"none"}} />
        <img id='openIcon' src={openIcon}  style={{display:"none"}} />
        <img id='closeIcon' src={closeIcon} style={{display:"none"}} />
        <img id='labelHead' src={labelPointer} style={{display:"none"}} />

         <FaultContext.Provider value={{fault_dict, node_dict, edge_dict, addMouseNodeInteraction, closeSubProcesses, subProcessNodes, displaySubProcesses, setNodeCard, animateZoomToNode, zoomed_node_current}}>
            <PlayControls onPlay={onPlay} playing={isPlaying}/>
        </FaultContext.Provider> 
        
        </>
   );
}