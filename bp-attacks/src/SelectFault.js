import {Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem} from '@mui/material';
import {useEffect, useState} from 'react';
import json from './wf102.json';

export default function SelectFault({onSelection}) {
    const [fault, setFault] = useState("No Fault Selected");
    const [fault_dict, setFault_dict] = useState({});
    useEffect(() => {
        // Get all faults from json file
        var fault_dict_temp = {}
        json.nodes.forEach((node) => {
            if (node.type === "blFault"){
                fault_dict_temp[node.uuid] = node;            
            }
        });
        setFault_dict(fault_dict_temp);
    }
    , []);
    
    useEffect(() => {
        console.log(fault);
        handleSelection();
    }, [fault]);

    const handleSelection = () => {
        onSelection(fault);
    }

    return (<>
        <Card sx={{position: 'absolute', bottom: '50%', right: '30%', width: '40%', backgroundColor: 'rgb(0,0,0,0.75)', color: '#fefefe'}}>
            <CardContent>
                <Typography variant="h6">Select Fault</Typography>
                <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Fault</InputLabel>
                <Select
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

    </>);

}