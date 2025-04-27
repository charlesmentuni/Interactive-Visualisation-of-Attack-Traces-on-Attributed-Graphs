import {useState, useEffect, createContext} from 'react';
import {Box, Button, Card, CardContent, Collapse, Typography} from '@mui/material';
import {ChevronLeftRounded, ChevronRightRounded} from '@mui/icons-material';
import { GraphCreation } from './GraphCreation';
import wf102 from './wf102.json';

const UploadContext = createContext();
export default UploadContext;

export function UploadFaultFile() {

    const [json, setJson] = useState(null);
    const [jsonFile, setJsonFile] = useState(null);

     /* useEffect(()=>{
        setJson(wf102);
    });   */
    const uploadFile = (event) => {

        if (!event.target.files[0]){return;}
        if (event.target.files[0].type !== "application/json"){return;}
        var reader = new FileReader()
        reader.onload = () => {
            var jsonData = JSON.parse(reader.result);
            var OGjsonData = JSON.parse(reader.result);  
            setJson(jsonData);
            setJsonFile(OGjsonData);
        }
        reader.readAsText(event.target.files[0]);
        
    }

    return (
        <>
            {json && jsonFile? 
            <>
                <canvas id='paper-canvas' width={window.innerWidth} height={window.innerHeight} style={{'width' : window.innerWidth, 'height':window.innerHeight}}  />
                <UploadContext.Provider value={{json, setJson, jsonFile, setJsonFile}}>
                    <GraphCreation />
                </UploadContext.Provider>
            </> : 
                <Box sx={{position:"absolute", height:'100vh', width:'100vw', backgroundColor:"#1e272e"}}>
                    <Card sx= {{backgroundColor:'#d2dae2', position:"absolute", top:"25vh", left:"25vw" , height:'40vh', width:'40vw', paddingX:"5vw", paddingY:"5vh", display:"flex", flexDirection:"column", justifyContent:"space-between"}}>
                        <Typography variant='h5' textAlign="center">An Interactive Visualisation of Attack Traces on Attribute Graphs</Typography>
                        <Typography variant='p'>This project allows you to upload attribute graphs and run through faults within the workflow. The designs were create to optimise cognitive effectiveness for non-experts. Therefore, faults can be resolved effectively before they are exploited by threat actors.</Typography>
                        <Typography variant='p'>All data uploaded must be in a JSON format.</Typography>
                        <br/>
                        <input type='file' onChange={uploadFile}></input> 
                    </Card>
                </Box>}
            
        </>
);
}