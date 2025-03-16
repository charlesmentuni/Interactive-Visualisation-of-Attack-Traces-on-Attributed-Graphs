import { Button, ButtonGroup, Card, CardContent, Select , Box, MenuItem, InputLabel, FormControl} from '@mui/material';
import { PlayArrow, SkipNext, SkipPrevious, PauseSharp, RestartAlt, Refresh, FastRewind, FastForward } from '@mui/icons-material';
import {useContext, useEffect, useState, useRef} from 'react';
import {FaultContext} from './Sketch'
import FaultDescription from './FaultDescription';
import paper from 'paper';
import { gateway_types, event_types } from './blmodel';


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

    const resetFault = () => {
        paper.project = paper.projects[0];

        playbackSpeed.current = 0;
        stageRef.current = 0;
        paper.project.layers[4].removeChildren();
        paper.project.layers[3].removeChildren();
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

        
        
        // This is for highlighting the path.
        paper.view.onFrame = (event) => {

            if (playing.current){
                
                var stage = stageRef.current;
                var faultPath = faultPathRef.current;

                let speeds = [1, 1.2, 1.5, 2];
                if (elapsedTime.current >= 1/speeds[playbackSpeed.current%4]){
                    elapsedTime.current = 0;
                    nextFault();
                }
            
            elapsedTime.current += event.delta;
           }
        };
    }

    const prevFault = function() {
        paper.project = paper.projects[0];

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
            playbackSpeed.current = 0;
            return;
        }
        const nodeLayer = paper.project.layers[4];
        const edgeLayer = paper.project.layers[3];

        

       

        if (faultPath[stage].group){
            var fp = faultPath[stage].group.clone();
            nodeLayer.addChild(fp);

            addMouseNodeInteraction(fp, faultPath[stage], fp.position);
            
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
