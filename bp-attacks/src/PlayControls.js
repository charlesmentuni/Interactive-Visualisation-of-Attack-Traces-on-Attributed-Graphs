import { Button, ButtonGroup, Card, CardContent, Select , Box, MenuItem, InputLabel, FormControl} from '@mui/material';
import { PlayArrow, SkipNext, SkipPrevious, PauseSharp, RestartAlt, Refresh, FastRewind, FastForward } from '@mui/icons-material';
import {useContext, useEffect, useState, useRef} from 'react';
import {FaultContext} from './Sketch'
import FaultDescription from './FaultDescription';
import paper from 'paper';
import { gateway_types, event_types } from './blmodel';
import {Group} from 'paper';
import { Color, Point } from 'paper/dist/paper-core';


export default function PlayControls({onPlay, onChange, onNext, onPrev}) {

    const { fault_dict, node_dict, edge_dict, addMouseNodeInteraction} = useContext(FaultContext);

    const [prevDisabled, setPrevDisabled] = useState(false);
    const [nextDisabled, setNextDisabled] = useState(false);
    const [fault, setFault] = useState(null);
    const stageRef = useRef(0);
    const faultPathRef = useRef([]);
    const elapsedTime = useRef(0);
    const playing = useRef(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const playbackSpeed = useRef(0);
    const skip = useRef(false);

    const resetFault = () => {
        runFault();
    };

    const runFault =  function() {
        paper.project = paper.projects[0];

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

        faultSetup();
        // This is for highlighting the path.
        paper.view.onFrame = (event) => {

            if (playing.current){
                
                var stage = stageRef.current;
                var faultPath = faultPathRef.current;
                
                let speeds = [1, 1.2, 1.5, 2];
                if (elapsedTime.current >= 1/speeds[playbackSpeed.current%4]){
                    animateFault();
                    // ANIMATION FINISHED
                    console.log(stage);

                    
                    // Check if the last node or edge has been reached
                    const nodeLayer = paper.project.layers[4];
                    const edgeLayer = paper.project.layers[3];


                    if (nodeLayer.children.length + edgeLayer.children.length === faultPathRef.current.length) {
                        playing.current = false;
                        setIsPlaying(false);
                        playbackSpeed.current = 0;
                        return;
                    }
                    stageRef.current += 1;
                    console.log(stage);

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
        
        console.log(stageRef.current);
        if (stageRef.current === 0){
            runFault();
            return;}
        

        var stage = stageRef.current;

        const nodeLayer = paper.project.layers[4];
        const edgeLayer = paper.project.layers[3];

    
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
        
        const nodeLayer = paper.project.layers[4];
        const edgeLayer = paper.project.layers[3];
        if (faultPath.length === nodeLayer.children.length + edgeLayer.children.length){return;}

        // THIS WORKS BUT IS A LITTLE BAD
        if (faultPath[stage].group){
            var fp = faultPath[stage].group.clone();
            nodeLayer.addChild(fp);
            
            addMouseNodeInteraction(fp, faultPath[stage], fp.position);
            
            var i = 0;
            if (gateway_types.includes(faultPath[stage].type) || event_types.includes(faultPath[stage].type)){
                i = 1;
            } 

            fp.children[i].fillColor = '#d63031'; 

            fp.children[i].opacity = 0;

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


        let speeds = [1, 1.2, 1.5, 2];
        
        var percent_done = skip.current ? 1 : elapsedTime.current/(1/speeds[playbackSpeed.current%4]);
        if (percent_done >= 1){
            percent_done = 1;
        }
        
        if (faultPathRef.current[stageRef.current].group){
            
            var i = 0;
            if (gateway_types.includes(faultPathRef.current[stageRef.current].type) || event_types.includes(faultPathRef.current[stageRef.current].type)){
                i=1;
            }

            let nodeLayer = paper.project.layers[4];
            let faultNode = nodeLayer.lastChild.children[i];
            
            faultNode.opacity = percent_done;

        }

        if (faultPathRef.current[stageRef.current].edge){
            

            let edgeLayer = paper.project.layers[3];
            let faultEdge = edgeLayer.lastChild.children[0];
            let edge = faultPathRef.current[stageRef.current].edge;
            
            faultEdge.segments[1].point.x = faultEdge.segments[0].point.x + (edge.segments[1].point.x-faultEdge.segments[0].point.x) * percent_done;
            
            if (percent_done === 1){
                faultEdge.segments[1].point = edge.segments[1].point;
                edgeLayer.lastChild.children[1].visible = true;
            }
            

        }

       


    }

    useEffect(()=>{if (fault){ runFault()}}, [fault]);

    return (
        <>
        <FaultDescription fault={fault} />

        <Card sx={{
    position: 'absolute', 
    bottom: '7%', 
    right: '0', 
    margin: '2%', 
    width: '30%', 
    height:'13%',
    backgroundColor: 'rgb(64, 64, 64)', 
    color: '#fefefe'
}}> 
    <CardContent>
        <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label" style={{color:'#fefefe'}}>Fault</InputLabel>
            <Select
                color="greySelect"
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
<div style={{flexDirection: 'row', display: 'flex', position: 'absolute', bottom: '0', right: '0', margin: '2%', width: '30%', height: '6%', justifyContent:'space-between'}}>
<Button 
    variant="contained"  
    sx={{
        minWidth: '3vh',
        minHeight: '3vh',
        backgroundColor: 'rgb(64, 64, 64)',
        color: '#fefefe'
    }}
    disabled={isPlaying}
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
    disabled={isPlaying}
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
    }} onClick={resetFault}>
    <Refresh/>
</Button>

<Button
    variant="contained"  
    sx={{
    
        
        minWidth: '3vh',
        minHeight: '3vh',
        backgroundColor: 'rgb(64, 64, 64)',
        color: '#fefefe'
    }} disabled={!isPlaying} onClick={() => {if (playbackSpeed.current > 0){playbackSpeed.current -= 1}}}>
    <FastRewind/>
</Button>

<Button
    variant="contained"  
    sx={{
        minWidth: '3vh',
        minHeight: '3vh',
        backgroundColor: 'rgb(64, 64, 64)',
        color: '#fefefe'
    }} disabled={!isPlaying} onClick={() => {playbackSpeed.current += 1}}>
    
    <FastForward/>
</Button>
    </div>
    </>);
}
