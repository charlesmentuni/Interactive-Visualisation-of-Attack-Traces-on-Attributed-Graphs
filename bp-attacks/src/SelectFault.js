import {Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem} from '@mui/material';
import {useEffect, useState, useContext} from 'react';
import json from './wf102.json';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import { FaultContext } from './Sketch';
import { lime, purple } from '@mui/material/colors'; 

const theme = createTheme({
    palette: {
      
      primary: {
      main: "#BDBDBD",
      light: "#F5F5F5",
      dark: "#424242",
      border: "#BDBDBD",
      hover: "#9E9E9E",
      disabled: "#E0E0E0",},
      text: '#FEFEFE'
    },
  });

export default function SelectFault() {
    const {fault, setFault, fault_dict} = useContext(FaultContext);

   

    return (<>
        <ThemeProvider theme={theme}>
        <Card sx={{position: 'absolute', bottom: '1%', right: '20%', width: '40%', backgroundColor: 'rgb(64,64,64)', color: '#fefefe'}}>
            <CardContent>
                <Typography variant="h6">Select Fault</Typography>
                <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Fault</InputLabel>
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
        </ThemeProvider>

    </>);

}