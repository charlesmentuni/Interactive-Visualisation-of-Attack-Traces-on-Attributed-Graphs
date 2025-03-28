import {useContext, useState} from 'react';
import {Box, Button, Card, CardContent, Collapse, TextField, Typography} from '@mui/material';
import {ChevronLeftRounded, ChevronRightRounded, Download, FastForward, FastRewind, ImportExport, NextPlan, PlayArrow, Refresh, Search, SkipNext} from '@mui/icons-material';
import paper from 'paper';
import GraphContext from './GraphCreation';

export default function LeftSideBar({nodeZoom, displaySubProcess, animateZoomToNode}) {

    const [searchOpen, setSearchOpen] = useState(false);
    const [textInput, setTextInput] = useState("");
    const {node_dict, subProcessNodes} = useContext(GraphContext);
    const downloadAsSVG = () =>{
        var fileName = "WF102_Attributed_Graph.svg";
        
        
        var url = "data:image/svg+xml;utf8," + encodeURIComponent(paper.project.exportSVG({bounds:'content',asString:true}));
        
        var link = document.createElement("a");
        link.download = fileName;
        link.href = url;
        link.click();
         
    }

    const searchNode = (query) =>{
        var foundNode = null;
        Object.keys(node_dict).forEach((key) => {
            if (node_dict[key].name === query){foundNode = node_dict[key]; return;}
            if (key === query){foundNode = node_dict[key];return;}
            if (node_dict[key].type === "subProcess"){
                Object.keys(node_dict[key].children).forEach((key1)=>{
                    // open subprocess in here
                    if (node_dict[key].children[key1].name === query){
                        foundNode = node_dict[key].children[key1]; 
                        if (!node_dict[key].opened){displaySubProcess(node_dict[key]);}
                        return;}
                    if (key === query){foundNode = node_dict[key].children[key1]; if (!node_dict[key].opened){displaySubProcess(node_dict[key]);}  return;}
                });

            }
        });
        console.log(foundNode);
        nodeZoom.current =  foundNode;
        if(!paper.view.onFrame){paper.view.onFrame = (event) => {animateZoomToNode(event)}}
        //paper.view.play();

    }

    const handleKeyDown = (event) => {
        if (event.key === "Enter"){
            searchNode(textInput);}
    }

    return (
        <>
        <div style={{flexDirection: 'column', display: 'flex', position: 'absolute', top: '0', left: '0', margin: '2vh', maxWidth: '8vh', height: '60%', justifyContent:'space-between'}}>
        <Button 
            variant="contained"  
            sx={{
                height: '8vh',
                width: '8vh',
                backgroundColor: 'rgb(64, 64, 64)',
                color: '#fefefe'
            }} onClick={()=>{downloadAsSVG();}}
        >
            <Download/>
        </Button>
        <div style={{maxHeight:'8vh', width:'48vh', display:'flex', flexDirection:'row'}}>
        

        <Button 
            variant="contained"  
            sx={{
                height: '8vh',
                width: '8vh',
                backgroundColor: 'rgb(64, 64, 64)',
                color: '#fefefe'
            }} onClick={()=>{setSearchOpen(!searchOpen);}}
        >
            <Search/>
        </Button>

        <Collapse in={searchOpen} orientation='horizontal' sx={{position: 'relative',
                height:'100%'
        } }collapsedSize={0}
>
            <TextField sx={{input:{color:'white'}, backgroundColor: 'rgb(64, 64, 64)', color: '#fefefe', width:'40vh', padding:'1vh', fontSize:'4vh'}} onKeyDown={handleKeyDown} onChange={(e) => {setTextInput(e.target.value)}}></TextField>
    </Collapse>
        
        </div>
        
        <Button 
            variant="contained"  
            sx={{
                height: '8vh',
                width: '8vh',
                backgroundColor: 'rgb(64, 64, 64)',
                color: '#fefefe'
            }}
        >
            <SkipNext/>
        </Button>
        
        <Button
            variant="contained"  
            sx={{
                height: '8vh',
                width: '8vh',
                backgroundColor: 'rgb(64, 64, 64)',
                color: '#fefefe'
            }} >
            <Refresh/>
        </Button>
        
        <Button
            variant="contained"  
            sx={{
                height: '8vh',
                width: '8vh',
                backgroundColor: 'rgb(64, 64, 64)',
                color: '#fefefe'
            }} >
            <FastRewind/>
        </Button>
        
        <Button
            variant="contained"  
            sx={{
                height: '8vh',
                width: '8vh',
                backgroundColor: 'rgb(64, 64, 64)',
                color: '#fefefe'
            }} >
            <FastForward/>
        </Button>
        </div>

    
    </>
    );
}