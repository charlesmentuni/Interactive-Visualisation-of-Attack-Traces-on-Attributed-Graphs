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

import { gatewaySVG,  inputOutputBindingSVG,  userTaskSVG, arrowHeadSVG, startEvent, endEvent, intermediateCatchEvent, catchEvent, throwEvent, scriptTaskSVG, serviceTaskSVG, sendTaskSVG, labelHeadSVG, eventBasedGateway, inclusiveGateway, parallelGateway, messageStartEvent, messageEndEvent, timerStartEvent, timerEndEvent, businessRulesTask, receiveTask, complexGateway, manualTask, callTask, intermediateThrowEvent} from './SVGAssets.js';
import { event_types, gateway_types, io_binding_edge_types } from './blmodel.js';

import CodeBlock from './CodeBlock.js';
import RightSideBar from './RightSideBar.js';
import LeftSideBar from './LeftSideBar.js';
import FaultControls from './FaultControls.js';
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

    const zoomed_node_current = useRef(null);
    const initial_pos = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedNodeLabel, setSelectedNodeLabel] = useState(null);
    const [shiftFaults, setShiftFaults] = useState(null);

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

                paper.project.layers[7].children[0].bounds.height *= 1/0.95;
                paper.project.layers[7].children[0].bounds.width *= 1/0.95;
                placeSmallBox();
                
            } else {
                newZoom = paper.view.zoom * 1.05;
                paper.project.layers[7].children[0].bounds.height *= 1/1.05;
                paper.project.layers[7].children[0].bounds.width *= 1/1.05;
                
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
            placeBigBox();
            placeSmallBox();

            
            event.preventDefault();
            paper.view.draw();			
        };

        const canvas = document.getElementById('paper-canvas');
        canvas.addEventListener('mousewheel', handleMouseWheel);

        
    }, []);
	

   useEffect(function() {
        if (!graph_layout){return;}
        if (paper.project){return;}
        
        paper.setup('paper-canvas');
        paper.view.viewSize = new Size(window.innerWidth, window.innerHeight);

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

        paper.project.addLayer(new Layer());
        paper.project.layers[7].name = "littleBoxInTheCorner"
        drawNavigationBox();

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
            placeBigBox();
            placeSmallBox();                    
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

                paper.project.layers[7].children[0].bounds.height *= 1/1.2;
                paper.project.layers[7].children[0].bounds.width *= 1/1.2;

                placeBigBox();
                placeSmallBox();
            }

            if (event.key === 's'){
                paper.view.zoom *= 0.8;
                paper.project.layers[5].children[0].bounds.height *= 1/0.8;
                paper.project.layers[5].children[0].bounds.width *= 1/0.8;
                paper.project.layers[5].children[0].position = paper.view.center;

                paper.project.layers[7].children[0].bounds.height *= 1/0.8;
                paper.project.layers[7].children[0].bounds.width *= 1/0.8;

                placeBigBox();
                placeSmallBox();
            }
            // RECENTER
            /* if (event.key === 'r'){
                paper.view.zoom = 1;
                paper.view.setCenter(graph_layout.nodes()[0].position().x*spacing, graph_layout.nodes()[0].position().y*spacing);

                //let new_pos = paper.view.center.subtract(paper.view.bounds.topLeft)
                //paper.project.layers[7].children[0].position = paper.view.bounds.topLeft.add(new Point(new_pos.multiply(0.3).x, new_pos.multiply(0.2).y));  
                placeBigBox();
                placeSmallBox();                     
            
                
            } */
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

        placeBigBox();
        placeSmallBox();

        paper.view.draw();
   }

   const drawNavigationBox = () => {
        paper.project.layers[7].activate();
        const width = 100;
        const height = 100;
    
        var bigBox = new Path.Rectangle(paper.view.center, new Size(width, height));
        bigBox.strokeColor = 'black';
        bigBox.strokeWidth = 2;
        bigBox.fillColor = 'white';
        var raster = bigBox.rasterize();
        bigBox.remove();

        var smallBox = new Path.Rectangle(paper.view.center, new Size(10, 10));
        smallBox.strokeWidth =0;
        smallBox.fillColor = 'black';



        placeBigBox();
        placeSmallBox();                              



   }

   const placeBigBox = () =>{
        let new_pos = paper.view.center.subtract(paper.view.bounds.topLeft)
        paper.project.layers[7].children[0].position = paper.view.bounds.topLeft.add(new Point(new_pos.multiply(0.2).x, new_pos.multiply(0.2).y));                       

   }

   const placeSmallBox = () => {
        var distanceToView = paper.view.center.subtract(paper.project.layers[0].bounds.topLeft);
        var dimensions = Math.max(paper.project.layers[0].bounds.height, paper.project.layers[0].bounds.width);
        var bigBoxSize = paper.project.layers[7].children[0].bounds.width;

        // Get size of small box relative to big navigation box
        var viewToBounds = paper.view.bounds.width/dimensions;
        paper.project.layers[7].children[1].bounds.width = viewToBounds*paper.project.layers[7].children[0].bounds.width;
        paper.project.layers[7].children[1].bounds.height = viewToBounds*paper.project.layers[7].children[0].bounds.height;
        // Checks if the small box is too big for the big box to fit, so that it is not oversized. 
        if (paper.project.layers[7].children[1].bounds.height > bigBoxSize*0.8){paper.project.layers[7].children[1].bounds.height=bigBoxSize*0.8; paper.project.layers[7].children[1].bounds.width=bigBoxSize*0.8;}


        var newPos = paper.project.layers[7].children[0].bounds.leftCenter.add(distanceToView.divide(dimensions).multiply(bigBoxSize));
        paper.project.layers[7].children[1].position = newPos;

        var bigBox =  paper.project.layers[7].children[0];
        var smallBox = paper.project.layers[7].children[1];
        if (bigBox.bounds.leftCenter.x > smallBox.bounds.leftCenter.x){

            if (!((bigBox.bounds.leftCenter.x-smallBox.bounds.leftCenter.x) >= smallBox.bounds.width)){
                smallBox.bounds.width -=  bigBox.bounds.leftCenter.x-smallBox.bounds.leftCenter.x;
            }
            else {smallBox.bounds.width =1;}

            smallBox.bounds.leftCenter.x = bigBox.bounds.leftCenter.x;

        }
        if (bigBox.bounds.rightCenter.x < smallBox.bounds.rightCenter.x){

            if (!((smallBox.bounds.rightCenter.x- bigBox.bounds.rightCenter.x) >= smallBox.bounds.width)){
                smallBox.bounds.width -=  smallBox.bounds.rightCenter.x-bigBox.bounds.rightCenter.x;
            }
            else {smallBox.bounds.width =1;}

            smallBox.bounds.rightCenter.x = bigBox.bounds.rightCenter.x;

        }
        if (bigBox.bounds.topCenter.y > smallBox.bounds.topCenter.y){

            if (!((bigBox.bounds.topCenter.y-smallBox.bounds.topCenter.y) >= smallBox.bounds.height)){
                smallBox.bounds.height -=  bigBox.bounds.topCenter.y-smallBox.bounds.topCenter.y;
            }
            else {smallBox.bounds.height =1;}

            smallBox.bounds.topCenter.y = bigBox.bounds.topCenter.y;

        }
        if (bigBox.bounds.bottomCenter.y < smallBox.bounds.bottomCenter.y){

            if (!((smallBox.bounds.bottomCenter.y- bigBox.bounds.bottomCenter.y) >= smallBox.bounds.height)){
                smallBox.bounds.height -=  smallBox.bounds.bottomCenter.y-bigBox.bounds.bottomCenter.y;
            }
            else {smallBox.bounds.height =1;}

            smallBox.bounds.bottomCenter.y = bigBox.bounds.bottomCenter.y;

        }

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
        var temp_pos = subProcessNode.group.position.y
        subProcessNode.group.children[0].bounds.width = 150;
        subProcessNode.group.children[0].bounds.height = 100;
        subProcessNode.group.children[0].fillColor = "#b2bec3";
        subProcessNode.group.position.y = temp_pos;

        paper.project.layers[ 1 ].removeChildren();
        paper.project.layers[ 1 ].activate();
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

        paper.project.layers[ 0 ].activate();

        node.children = displayGraphLayout(node.layout, node.children); //, {x:(node.group.bounds.leftCenter.x)/spacing, y:  (node.group.bounds.topCenter.y)/spacing});

        node.edges = createEdges(node.children);
        

        var maxXNode = null;
        var maxYNode = null;

        var minYNode = null;
        var minXNode =null;

        Object.keys(node.children).forEach((key)=>{
            let node1 = node.children[key]
            if (!maxXNode || node1.group.bounds.rightCenter.x >= maxXNode.group.bounds.rightCenter.x){maxXNode = node1;}
            if (!maxYNode || node1.group.bounds.bottomCenter.y >= maxYNode.group.bounds.bottomCenter.y){maxYNode = node1;}
            if (!minYNode || node1.group.bounds.topCenter.y <= minYNode.group.bounds.topCenter.y){minYNode = node1;}
            if (!minXNode || node1.group.bounds.leftCenter.x <= minXNode.group.bounds.leftCenter.x){minXNode = node1;}
        });

        
        var temp_pos = node.group.position;

        var padding = {x:50, y:20};
        node.group.children[0].bounds.width = maxXNode.group.children[0].bounds.rightCenter.x - minXNode.group.children[0].bounds.leftCenter.x + padding.x;
        node.group.children[0].bounds.height = maxYNode.group.bounds.bottomCenter.y - minYNode.group.bounds.topCenter.y + padding.y;

        node.group.position.y = temp_pos.y


        var minX = minXNode.group.bounds.leftCenter.x;
        var minY = minYNode.group.bounds.topCenter.y;
        Object.keys(node.children).forEach((key)=>{
            let node1 = node.children[key]
            node1.group.bounds.leftCenter.x += padding.x/1.2 + node.group.bounds.leftCenter.x - minX ;
            node1.group.bounds.topCenter.y += padding.y/2 + node.group.bounds.topCenter.y - minY;
        }); 

        node.group.children[1].content = ""
        node.group.children[0].fillColor = "#dfe6e9";
        shiftNodes(node);

        node.group.children[3].onMouseUp = function(event){
            if (mouseDrag.current) {return;}
            closeSubProcesses(node); 
        };

        placeSmallBox();
    }

    const boundsCheck = (subProcessNode, node, direction) => {
        if (subProcessNode.group.children[0].contains(node.group.bounds.leftCenter) || Math.round(node.group.bounds.leftCenter.x) > Math.round(subProcessNode.group.bounds.rightCenter.x)){
            node.group.position.x += direction*subProcessNode.group.children[0].bounds.width;
        }
        else if (subProcessNode.group.children[0].contains(node.group.topCenter) || Math.round(node.group.position.y) > Math.round(subProcessNode.group.position.y)){
            node.group.position.y += Math.round(direction*subProcessNode.group.children[0].bounds.height/2);
        }
        else if (subProcessNode.group.children[0].contains(node.group.bottomCenter) || Math.round(node.group.position.y) < Math.round(subProcessNode.group.position.y)){
            node.group.position.y -= Math.round(direction*subProcessNode.group.children[0].bounds.height/2);
        }
    }

    const shiftNodes = (subProcessNode, direction=1) => {

        
        Object.keys(node_dict).forEach((key)=>{
            var node = node_dict[key];

            if (subProcessNode.id === node.id){return;}
            if(node.opened){
                Object.keys(node.children).forEach((key)=>{
                    var subnode = node.children[key];
                    boundsCheck(subProcessNode, subnode, direction);
                });
            }

            boundsCheck(subProcessNode, node, direction);
            
        });
        setShiftFaults(subProcessNode);
       
        paper.project.layers[ 0 ].activate();
        Object.keys(subProcessNodes.current).forEach((key)=>{
            var node = node_dict[key];

            if (node_dict[key].opened){
                Object.keys(node_dict[key].edges).forEach((key1)=>{node_dict[key].edges[key1].edge.remove(); node_dict[key].edges[key1].arrowHead.remove(); })
                node_dict[key].edges = createEdges(node_dict[key].children);
            }
        })

        paper.project.layers[ 1 ].removeChildren();
        paper.project.layers[ 1 ].activate();
        setEdge_dict(createEdges(node_dict));
        
    } 
    
    const displayGraphLayout = (new_graph_layout, temp_node_dict, padding={x:0, y:0}) => {

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
            if (temp_node_dict[node.id()].type === 'messageStartEvent'){
                type = paper.project.importSVG(messageStartEvent);
                type.scale(0.5);
                label ="";
                isSVG=true;
            }
            if (temp_node_dict[node.id()].type === 'messageEndEvent'){
                type = paper.project.importSVG(messageEndEvent);
                type.scale(0.5);
                label ="";
                isSVG=true;
            }
            if (temp_node_dict[node.id()].type === 'timerStartEvent'){
                type = paper.project.importSVG(timerStartEvent);
                type.scale(0.5);
                label ="";
                isSVG=true;
            }
            if (temp_node_dict[node.id()].type === 'timerEndEvent'){
                type = paper.project.importSVG(timerEndEvent);
                type.scale(0.5);
                label ="";
                isSVG=true;
            }

            if (temp_node_dict[node.id()].type === 'intermediateThrowEvent'){
                type = paper.project.importSVG(intermediateThrowEvent);
                type.scale(0.4);
                label="";
                isSVG=true;
            }

            if (temp_node_dict[node.id()].type === 'intermediateCatchEvent'){
                type = paper.project.importSVG(intermediateCatchEvent);
                type.scale(0.4);
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

            if (temp_node_dict[node.id()].type === 'businessRuleTask'){
                type = paper.project.importSVG(businessRulesTask);
                type.scale(0.4);
                isSVG=true;
            }

            if (temp_node_dict[node.id()].type === 'receiveTask'){
                type = paper.project.importSVG(receiveTask);
                type.scale(0.4);
                isSVG=true;
            }
            if (temp_node_dict[node.id()].type === 'manualTask'){
                type = paper.project.importSVG(manualTask);
                type.scale(0.4);
                isSVG=true;
            }
            if (temp_node_dict[node.id()].type === 'callActivity'){
                type = paper.project.importSVG(callTask);
                type.scale(0.4);
                isSVG=true;
            }

            if (temp_node_dict[node.id()].type === 'eventBasedGateway'){
                type = paper.project.importSVG(eventBasedGateway);
                type.scale(0.9);
                label="";
                isSVG=true;
            }
            if (temp_node_dict[node.id()].type === 'exclusiveGateway'){
                type = paper.project.importSVG(gatewaySVG);
                type.scale(0.9);
                label="";
                isSVG=true;
            }
            if (temp_node_dict[node.id()].type === 'inclusiveGateway'){
                type = paper.project.importSVG(inclusiveGateway);
                type.scale(0.9);
                label="";
                isSVG=true;
            }
            if (temp_node_dict[node.id()].type === 'parallelGateway'){
                type = paper.project.importSVG(parallelGateway);
                type.scale(0.9);
                label="";
                isSVG=true;
            }
            if (temp_node_dict[node.id()].type === 'complexGateway'){
                type = paper.project.importSVG(complexGateway);
                type.scale(0.9);
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


            x = Math.round(x*spacing);
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
        paper.project.activeLayer.insertBelow(new Layer());
            
        paper.view.draw(); 
        
        var temp_edge_dict = createEdges(node_dict);
        setEdge_dict(temp_edge_dict);
        edge_dict_ref.current = temp_edge_dict;

        paper.view.pause();


    }

    const createEdge = (source, target, expression) => {

            var arrowHead  = paper.project.importSVG(arrowHeadSVG);
            arrowHead.scale(0.1);
             
            var sourcePoint = Math.round(source.group.position);
            var targetPoint = Math.round(target.group.position);
            var arrowHeadDirection = 0;
            
            var edgeLabelText = new PointText();
            edgeLabelText.content = expression ? expression : "";
            //edgeLabelText.fontFamily = "Roboto Mono";

            var edgeLabelBackground = new Path.Rectangle(edgeLabelText.bounds);
            edgeLabelBackground.fillColor = 'white';
           
            var edgeLabel = new Group(edgeLabelBackground, edgeLabelText);

            const sourcePosition = {x : Math.round(source.group.position.x), y: Math.round(source.group.position.y)};
            const targetPosition = {x : Math.round(target.group.position.x), y: Math.round(target.group.position.y)};



            if (sourcePosition.x > targetPosition.x){
                
                sourcePoint = source.group.bounds.leftCenter;
                targetPoint = target.group.bounds.rightCenter;
                arrowHead.bounds.leftCenter = targetPoint;
                edgeLabel.bounds.leftCenter = new Point(targetPoint.x+10, targetPoint.y-15);
                arrowHeadDirection = 270;
            }

            if (sourcePosition.x < targetPosition.x ){
                sourcePoint = source.group.bounds.rightCenter;
                targetPoint = target.group.bounds.leftCenter;
                edgeLabel.bounds.rightCenter = new Point(targetPoint.x-10, targetPoint.y-15);
                arrowHead.bounds.rightCenter = targetPoint;
                arrowHeadDirection = 90;

            }

            if (sourcePosition.y < targetPosition.y){
                targetPoint = target.group.bounds.topCenter;
                edgeLabel.bounds.bottomCenter = targetPoint;
                arrowHead.bounds.bottomCenter = targetPoint;

                edgeLabel.bounds.bottomCenter = new Point(targetPoint.x, arrowHead.bounds.topCenter.y-5);

                arrowHeadDirection = 180;


            }
            
            if (sourcePosition.y > targetPosition.y){
                
                targetPoint = target.group.bounds.bottomCenter;
                arrowHead.bounds.topCenter = targetPoint;
                edgeLabel.bounds.topCenter = new Point(targetPoint.x, arrowHead.bounds.bottomCenter.y+5);
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

            edgeLabelBackground.position = edgeLabel.position;

            edgeLabel.bringToFront();


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

            temp_edge_dict[edge.id] = createEdge(node_dict[edge.sourceRef], node_dict[edge.targetRef], edge.expression ? edge.name: null);

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
                    console.log(node.group.position);
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

            paper.project.layers[0].addChild(node.group);

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
            edge.strokeColor = (node.inputOutputBinding[io].InputOutput === "inputParameter") ? '#4cd137' : '#EA2027';
            edge.strokeWidth = 4;

            var midpoint = edge.getPointAt(edge.length/2);
            var arrowHead = paper.project.importSVG(arrowHeadSVG);
            var direction = (node.inputOutputBinding[io].InputOutput === "inputParameter") ? 0 : 180;
            arrowHead.fillColor = (node.inputOutputBinding[io].InputOutput === "inputParameter") ? '#4cd137' : '#EA2027';
            arrowHead.scale(0.2);
            arrowHead.rotate(direction-angle*(180/Math.PI));
            arrowHead.position = midpoint;

            paper.project.layers[6].addChild(edge);
            paper.project.layers[6].addChild(arrowHead);

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
            <FaultControls subProcessOpened={shiftFaults} setSubProcessOpened={setShiftFaults}/>
        </FaultContext.Provider> 
        
        </>
   );
}