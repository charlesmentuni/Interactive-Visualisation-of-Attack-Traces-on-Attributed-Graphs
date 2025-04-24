import { Button, ButtonGroup, Card, CardContent, Select , Box, MenuItem, InputLabel, FormControl} from '@mui/material';
import { PlayArrow, SkipNext, SkipPrevious, PauseSharp, RestartAlt, Refresh, FastRewind, FastForward, FollowTheSigns } from '@mui/icons-material';
import {useContext, useEffect, useState, useRef} from 'react';
import {FaultContext} from './Sketch'
import FaultDescription from './FaultDescription';
import paper from 'paper';
import { gateway_types, event_types } from './blmodel';
import {Group} from 'paper';
import { Color, Point } from 'paper/dist/paper-core';
import { catchEventFaultSVG, scriptTaskFaultSVG, serviceTaskFaultSVG, userTaskFaultSVG, intermediateCatchEventFault, intermediateThrowEventFault, exclusiveGatewayFault } from './SVGAssets';


export default function FaultControls({subProcessOpened, setSubProcessOpened}) {

    const { fault_dict, node_dict, edge_dict, addMouseNodeInteraction, closeSubProcesses, subProcessNodes, displaySubProcesses, animateZoomToNode, zoomed_node_current} = useContext(FaultContext);

    const [prevDisabled, setPrevDisabled] = useState(false);
    const [nextDisabled, setNextDisabled] = useState(false);
    const [fault, setFault] = useState(null);
    const stageRef = useRef(0);
    const faultPathRef = useRef([]);
    const elapsedTime = useRef(0);
    const playing = useRef(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [edgeDictChanged, setEdgeDictChanged] = useState(false);
    const [edgeDictChangedSetup, setEdgeDictChangedSetup] = useState(false);
    const playbackSpeed = useRef(0);
    const skip = useRef(false);
    const subProcessParent = useRef(null);
    const followFault = useRef(false);
    const [disabledSpeed, setDisabledSpeed] = useState(false);


    const setAnimateSnapshot = (dict) => {
        

        for (let i = 0; i<dict.stage; i++ ){
            nextFault();
        }
            elapsedTime.current =dict.elapsed;
            playbackSpeed.current = dict.speed;
            followFault.current = dict.follow;
            subProcessParent.current = dict.subParent;
            

        animateFault();
    }
    const getAnimateSnapshot = () =>{
        return {stage: stageRef.current, faultPath: faultPathRef.current, elapsed: elapsedTime.current, speed: playbackSpeed.current, follow: followFault.current, subParent : subProcessParent.current};
    }

    useEffect(()=>{
        

        setSubProcessOpened(null);

        // When subprocess is opened
        if (!subProcessOpened || !fault || (subProcessParent.current && subProcessParent.current.id === subProcessOpened.id)){return;}
        var snapshot = getAnimateSnapshot();
        resetFault();
        setAnimateSnapshot(snapshot);


    }, [subProcessOpened])

    const resetFault = () => {
        runFault();
    };

    const runFault =  function() {
        paper.project = paper.projects[0];

        stageRef.current = 0;
        faultPathRef.current = [];
        elapsedTime.current =0;
        playbackSpeed.current = 0;
        followFault.current =false;
        subProcessParent.current =null;
        setDisabledSpeed(false);
        
        var temp_node_dict = {...node_dict};
        Object.keys(subProcessNodes.current).forEach((key)=>{
            if (subProcessNodes.current[key].id === fault_dict[fault].processRef){
                subProcessParent.current = node_dict[key];
                if (!node_dict[key].opened){
                    displaySubProcesses(node_dict[key]);
                    setEdgeDictChanged(true);
                    return;
                }
                temp_node_dict = {...subProcessNodes.current[key].children};
            }
        });
        // Loops through the execution path and changes the color of the nodes and edges
        fault_dict[fault].execution_path.forEach((node) => {
            if (temp_node_dict[node]){
                faultPathRef.current.push(temp_node_dict[node]);
                // Checks if sub process and if open
                if (temp_node_dict[node].type === "subProcess" && temp_node_dict[node].opened){
                    closeSubProcesses(temp_node_dict[node]);
                    setEdgeDictChanged(true);
                    return;
                }
            }
            if (edge_dict[node]){
                faultPathRef.current.push(edge_dict[node]);
            }
        });

        
        const nodeLayer = paper.project.layers[  3  ];
        const edgeLayer = paper.project.layers[  2  ];

        nodeLayer.removeChildren();
        edgeLayer.removeChildren();

        faultSetup();
        // This is for highlighting the path.
        paper.view.onFrame = (event) => {
            animateZoomToNode(event);
            
           
            if (subProcessParent.current && !subProcessParent.current.opened){
                nodeLayer.visible = false;
                edgeLayer.visible =false;
            }
            else{
                nodeLayer.visible =true;
                edgeLayer.visible =true;
            }
            if (playing.current){
                
                var stage = stageRef.current;
                var faultPath = faultPathRef.current;
                
                let speeds = [1, 2, 3, 5];
                if (elapsedTime.current >= 1/speeds[playbackSpeed.current%4]){
                    animateFault();
                    // ANIMATION FINISHED

                    
                    // Check if the last node or edge has been reached
                    const nodeLayer = paper.project.layers[  3  ];
                    const edgeLayer = paper.project.layers[  2  ];


                    if (nodeLayer.children.length + edgeLayer.children.length === faultPathRef.current.length) {
                        playing.current = false;
                        setIsPlaying(false);
                        playbackSpeed.current = 0;
                        return;
                    }

                    stageRef.current += 1;

                    elapsedTime.current = 0;
                    faultSetup();
                }
                else {
                    animateFault();
                }
            
            elapsedTime.current += event.delta;
           }
        };
    }

    const prevFault = function() {
        paper.project = paper.projects[0];

        var faultPath = faultPathRef.current;
        
        if (stageRef.current === 0){
            runFault();
            return;}
        

        var stage = stageRef.current;

        const nodeLayer = paper.project.layers[  3  ];
        const edgeLayer = paper.project.layers[  2  ];

    
        // This assumes that is starts with a node
        if (stage % 2 === 1){
            edgeLayer.lastChild.remove();
        }
        if (stage % 2 === 0){
            nodeLayer.lastChild.remove();
        }
        stageRef.current = nodeLayer.children.length + edgeLayer.children.length - 1;
        elapsedTime.current = 1;
    } 

    const nextFault = function() {
        if (stageRef.current === faultPathRef.current.length){
            return;
        }
        skip.current = true;
        animateFault();
        skip.current = false;
        if (stageRef.current === faultPathRef.current.length-1){
            return;
        }
        stageRef.current += 1;
        elapsedTime.current = 0;
        faultSetup();


    }

    const faultSetup = function() {

        var faultPath = faultPathRef.current;
        var stage = stageRef.current;

        if (!faultPath[stage]){return;}
        const nodeLayer = paper.project.layers[  3  ];
        const edgeLayer = paper.project.layers[  2  ];
        if (faultPath.length === nodeLayer.children.length + edgeLayer.children.length){return;}

        // THIS WORKS BUT IS A LITTLE BAD
        if (faultPath[stage].group){
            if(faultPath[stage].opened){
                closeSubProcesses(faultPath[stage]);
                setEdgeDictChangedSetup(true);
                return;
            }

            var fp = faultPath[stage].group.clone();
            var i = 0;
            

            fp.children[i].fillColor = '#d63031'; 

            fp.children[i].opacity = 0;

            if (faultPath[stage].type === 'scriptTask'){
                var importedSVG = paper.project.importSVG(scriptTaskFaultSVG);
                importedSVG.scale(0.5);
                importedSVG.position = fp.children[0].position;
                importedSVG.position.y -=10;
                importedSVG.opacity = 0;
                fp.children[0].replaceWith(importedSVG);
            }

            if (faultPath[stage].type === 'intermediateCatchEvent'){
                var importedSVG = paper.project.importSVG(intermediateCatchEventFault);
                importedSVG.scale(0.4);
                importedSVG.position = fp.children[0].position;
                importedSVG.opacity = 0;
                fp.children[0].replaceWith(importedSVG);
            }
            if (faultPath[stage].type === 'intermediateThrowEvent'){
                var importedSVG = paper.project.importSVG(intermediateThrowEventFault);
                importedSVG.scale(0.4);
                importedSVG.position = fp.children[0].position;
                importedSVG.opacity = 0;
                fp.children[0].replaceWith(importedSVG);
            }
            if (faultPath[stage].type === 'exclusiveGateway'){
                var importedSVG = paper.project.importSVG(exclusiveGatewayFault);
                importedSVG.position = fp.children[0].position;
                importedSVG.opacity = 0;
                fp.children[0].replaceWith(importedSVG);
            }
            if (faultPath[stage].type === 'serviceTask'){
                var importedSVG = paper.project.importSVG(serviceTaskFaultSVG);
                importedSVG.scale(0.4);
                importedSVG.position = fp.children[0].position;
                importedSVG.position.y -=10;
                importedSVG.opacity = 0;
                fp.children[0].replaceWith(importedSVG);
            }
            if (faultPath[stage].type === 'userTask'){
                var importedSVG = paper.project.importSVG(userTaskFaultSVG);
                importedSVG.scale(0.4);
                importedSVG.position = fp.children[0].position;
                importedSVG.position.y -=10;
                importedSVG.opacity = 0;
                fp.children[0].replaceWith(importedSVG);
            }

            addMouseNodeInteraction(fp, faultPath[stage], fp.position);
            
            
            nodeLayer.addChild(fp);
            

        }
        // Checks if it is an edge as a group only exists for the nodes
        if (faultPath[stage].edge){ 

            var fp = faultPath[stage].edge.clone();
            fp.segments.forEach((segment) => {
                segment.point = fp.segments[0].point;
            });
            var arrowHead = faultPath[stage].arrowHead.clone();
            edgeLayer.addChild(new Group([fp, arrowHead]));

            arrowHead.fillColor = '#d63031';
            arrowHead.scale(1.5);
            arrowHead.visible = false;

            fp.strokeColor ='#d63031';
            fp.strokeWidth = 10;
        }
    }
    
    const animateFault = function() {
        // First check if it is an edge or a node
        
        if (!faultPathRef.current[stageRef.current]){return;}


        let speeds = [1, 2, 3, 5];
        if (playbackSpeed.current>3){playbackSpeed.current = 3; setDisabledSpeed(true);}
        console.log(playbackSpeed.current);
        var percent_done = skip.current ? 1 : elapsedTime.current/(1/speeds[playbackSpeed.current]);
        if (percent_done >= 1){
            percent_done = 1;
        }
        
        if (faultPathRef.current[stageRef.current].group){
            
           
            if (followFault.current){
                zoomed_node_current.current = faultPathRef.current[stageRef.current];
            }
            let nodeLayer = paper.project.layers[  3  ];
            let faultNode = nodeLayer.lastChild.children[0];
            
            faultNode.opacity = percent_done;

        }

        if (faultPathRef.current[stageRef.current].edge){
            

            let edgeLayer = paper.project.layers[  2  ];
            let faultEdge = edgeLayer.lastChild.children[0];
            let edge = faultPathRef.current[stageRef.current].edge;
        

            if (faultEdge.segments.length === 2){
                // is it horizontal or vertical
                faultEdge.segments[1].point.y = faultEdge.segments[0].point.y + (edge.segments[1].point.y-faultEdge.segments[0].point.y) * percent_done;
                faultEdge.segments[1].point.x = faultEdge.segments[0].point.x + (edge.segments[1].point.x-faultEdge.segments[0].point.x) * percent_done;
            }
            if (faultEdge.segments.length === 3){
                var yDistance = Math.abs(edge.segments[2].point.y - faultEdge.segments[0].point.y);
                var xDistance = Math.abs(edge.segments[1].point.x - faultEdge.segments[0].point.x);
                var split = xDistance/(xDistance + yDistance);

                if (percent_done < split){
                    faultEdge.segments[1].point.x = faultEdge.segments[0].point.x + (edge.segments[1].point.x-faultEdge.segments[0].point.x) * percent_done * (1/split);
                }
                else {
                    faultEdge.segments[1].point.x = edge.segments[1].point.x;
                    faultEdge.segments[2].point.x = edge.segments[1].point.x;
                    faultEdge.segments[2].point.y = faultEdge.segments[1].point.y + (edge.segments[2].point.y-edge.segments[1].point.y) * (percent_done-split) * (1/(1-split));}
            }
            
            if (percent_done === 1){
                faultEdge.segments[1].point = edge.segments[1].point;
                edgeLayer.lastChild.children[1].visible = true;
            }
            

        }

       


    }
    useEffect(() => {
        if (fault) {
            runFault();
        }
    }, [fault]);

    useEffect(() => {
        if (edgeDictChanged) {
            runFault();
            setEdgeDictChanged(false);
        }
    }, [edge_dict, edgeDictChanged]);

    useEffect(() => {
        if (edgeDictChangedSetup) {

            faultSetup();
            setEdgeDictChanged(false);
        }
    }, [edge_dict, edgeDictChangedSetup]);

    useEffect(()=>{if (fault){ runFault()}}, [fault]);

    return (
        <>
        <FaultDescription fault={fault} />

        <Card sx={{
    position: 'fixed', 
    bottom: '7%', 
    right: '0', 
    margin: '2%', 
    width: '30%', 
    height:'13%',
    backgroundColor: 'rgb(64, 64, 64)', 
    color: '#fefefe'
}}> 
    <CardContent>
        <FormControl fullWidth variant='outlined'  >
            <InputLabel id="demo-simple-select-label" style={{color:'#fefefe'}}>Fault</InputLabel>
            <Select

                style={{color:"#fefefe",
                    backgroundColor:"rgb(64,64,64)"}}
                
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={fault}
                label="Fault"
                onChange={(e) => {setFault(e.target.value); }}
            >
                
                {Object.keys(fault_dict).map((key) => {
                    return <MenuItem value={key}>{fault_dict[key].uuid}</MenuItem>
                })}
            </Select>
        </FormControl>
    </CardContent>
</Card>
<div style={{flexDirection: 'row', display: 'flex', position: 'fixed', bottom: '0', right: '0', margin: '2%', width: '30%', height: '6%', justifyContent:'space-between'}}>
<Button 
    variant="contained"  
    sx={{
        minWidth: '3vh',
        minHeight: '3vh',
        backgroundColor: 'rgb(64, 64, 64)',
        color: '#fefefe'
    }}
    disabled={isPlaying || !fault}
    onClick={prevFault}
>
    <SkipPrevious/>
</Button>

<Button 
    variant="contained"  
    sx={{
        
        minWidth: '3vh',
        minHeight: '3vh',
        backgroundColor: 'rgb(64, 64, 64)',
        color: '#fefefe'
    }}
    onClick={() => {
        playing.current = !playing.current;
        setIsPlaying(!isPlaying);
        setNextDisabled(!nextDisabled);
        setPrevDisabled(!prevDisabled);
    }}
    disabled={!fault}
>
    {playing.current ? <PauseSharp/> : <PlayArrow/>}
</Button>

<Button 
    variant="contained"  
    sx={{
    
        
        minWidth: '3vh',
        minHeight: '3vh',
        backgroundColor: 'rgb(64, 64, 64)',
        color: '#fefefe'
    }}
    disabled={isPlaying || !fault}
    onClick={nextFault}
>
    <SkipNext/>
</Button>

<Button
    variant="contained"  
    sx={{
        minWidth: '3vh',
        minHeight: '3vh',
        backgroundColor: 'rgb(64, 64, 64)',
        color: '#fefefe'
    }} onClick={resetFault} disabled={!fault}>
    <Refresh/>
</Button>

<Button
    variant="contained"  
    sx={{
    
        
        minWidth: '3vh',
        minHeight: '3vh',
        backgroundColor: 'rgb(64, 64, 64)',
        color: '#fefefe'
    }} disabled={!isPlaying} onClick={() => {followFault.current =!followFault.current; }}>
    <FollowTheSigns/>
</Button>

<Button
    variant="contained"  
    sx={{
        minWidth: '3vh',
        minHeight: '3vh',
        backgroundColor: 'rgb(64, 64, 64)',
        color: '#fefefe'
    }} disabled={!isPlaying || disabledSpeed } onClick={() => {playbackSpeed.current += 1}}>
    
    <FastForward/>
</Button>
    </div>
    </>);
}
