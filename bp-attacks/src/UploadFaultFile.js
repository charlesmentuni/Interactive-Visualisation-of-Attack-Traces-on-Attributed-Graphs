import {useState} from 'react';
import {Box, Button, Card, CardContent, Collapse, Typography} from '@mui/material';
import {ChevronLeftRounded, ChevronRightRounded} from '@mui/icons-material';
import { GraphCreation } from './GraphCreation';

export default function UploadFaultFile() {

    const [json, setJson] = useState(null);

    const uploadFile = (event) => {

        if (!event.target.files[0]){return;}
        if (event.target.files[0].type !== "application/json"){return;}
        var reader = new FileReader()
        reader.onload = () => {
            let jsonData = JSON.parse(reader.result);
            setJson(jsonData);
        }
        reader.readAsText(event.target.files[0]);
        console.log(event.target.files[0])
        
    }

    return (
        <Card>
            <input type='file' onChange={uploadFile}></input>
            <GraphCreation json={json}/>
        </Card>
);
}