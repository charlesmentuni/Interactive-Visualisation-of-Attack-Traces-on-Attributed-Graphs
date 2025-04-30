import {useContext, useEffect, useRef, useState} from 'react';
import {Box, Button, Card, CardContent, Collapse, TextField, Typography} from '@mui/material';
import {ChevronLeftRounded, ChevronRightRounded, Download, FastForward, FastRewind, ImportExport, NextPlan, PlayArrow, Refresh, Search, SkipNext, SwapHoriz, SwapHorizRounded, UploadFileRounded} from '@mui/icons-material';
import paper from 'paper';
import GraphContext from '../initialisation/GraphCreation';
import Fuse from 'fuse.js';


export default function LeftSideBar({nodeZoom, displaySubProcess, animateZoomToNode}) {

    const [searchOpen, setSearchOpen] = useState(false);
    const [textInput, setTextInput] = useState("");
    const {node_dict, subProcessNodes, jsonFile, setJson, setJsonFile, setNew_view} = useContext(GraphContext);
    const [prevGraph, setPrevGraph] = useState(null);
    const isGraphSwitched = useRef(null);
    const [fileUploaded, setFileUploaded] = useState(false);

    
    const downloadAsSVG = () =>{
        // Exports the current graph as SVG 
        var fileName = "Resulting_Graph.svg";
        
        
        var url = "data:image/svg+xml;utf8," + encodeURIComponent(paper.project.exportSVG({bounds:'content',asString:true}));
        
        var link = document.createElement("a");
        link.download = fileName;
        link.href = url;
        link.click();
         
    }

    const searchNode = (query) =>{
        // perfroms a fuzzy search on the node_dict and subProcessNodes
        // if the node is not found, return
        var foundNode = null;
        const options = {includeScore: true,
        keys: [{name: 'name', weight: 1}, {name: 'type', weight:0.5}, {name: 'documentation', weight:0.4}]}

        const fuse = new Fuse(Object.values(node_dict), options);
        var result = fuse.search(query, {limit:1});


        Object.values(subProcessNodes.current).forEach((subProcessNode) => {
            var temp_fuse = new Fuse(Object.values(subProcessNode.children), options);
            var temp_result = temp_fuse.search(query, {limit:1}); 

            if (!temp_result[0]){return;}
            
            if (!result[0] || result[0].score > temp_result[0].score){
                result =temp_result;
                result[0].parent = subProcessNode;
            }
        });

        if (result[0]){
            if (result[0].parent && !result[0].parent.opened){
                displaySubProcess(result[0].parent);
            }
            foundNode = result[0].item
        }
       
        nodeZoom.current =  foundNode;
        if(!paper.view.onFrame){paper.view.onFrame = (event) => {animateZoomToNode(event)}}

    }

    const handleKeyDown = (event) => {
        if (event.key === "Enter"){
            searchNode(textInput);}
    }

    const uploadNewFile = () => {
        //setPrevGraph({"json": json, "view":paper.view});
        // When button is clicked, allow user to upload new file
        // Use file input to select file
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.onchange = (event) => {
            if (!event.target.files[0]){return;}
            if (event.target.files[0].type !== "application/json"){return;}
            var reader = new FileReader()
            reader.onload = () => {
                let jsonData = JSON.parse(reader.result);
                let OGjsonData = JSON.parse(reader.result);

                setPrevGraph({"json": jsonFile, "view" : paper.view, "subProcessNodes": subProcessNodes.current});
                setJson(jsonData);
                setJsonFile(OGjsonData);
                setNew_view(null);

                paper.projects.forEach((project) => {
                    project.remove();
                });
                setFileUploaded(true);

            }
            reader.readAsText(event.target.files[0]);
        }
        fileInput.click();
        
    }
    const switchGraphs = () => {
        // When button is clicked, switch between the two graphs
        setJson(prevGraph.json);
        setJsonFile(prevGraph.json);
        setPrevGraph({"json": jsonFile, "view" : paper.view});
        setNew_view(prevGraph.view);

        paper.projects.forEach((project) => {
            project.remove();
        });
    }
  

    return (
        <>
        <div style={{flexDirection: 'column', display: 'flex', position: 'absolute', top: '0', left: '0', margin: '2vh', maxWidth: '8vh', height: '40%', justifyContent:'space-between'}}>
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
            }} onClick={()=>{uploadNewFile();}}
        >
            <UploadFileRounded/>
        </Button>

        <Button disabled={!fileUploaded}
            variant="contained"  
            sx={{
                height: '8vh',
                width: '8vh',
                backgroundColor: 'rgb(64, 64, 64)',
                color: '#fefefe'
            }} onClick={()=>{switchGraphs();}}
        >
            <SwapHoriz style={{height:'100%', width:'100%'}}/>
        </Button>
        
       
        
        
        
      
        </div>

    
    </>
    );
}