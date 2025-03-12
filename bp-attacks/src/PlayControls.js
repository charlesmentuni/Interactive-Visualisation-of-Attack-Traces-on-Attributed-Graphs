import { Button, ButtonGroup, Card, CardContent, Select , Box, MenuItem, InputLabel, FormControl} from '@mui/material';
import { PlayArrow, SkipNext, SkipPrevious, PauseSharp, RestartAlt, Refresh, FastRewind, FastForward } from '@mui/icons-material';
import {useContext, useEffect, useState} from 'react';
import SelectFault from './SelectFault';
import {FaultContext} from './Sketch'
import FaultDescription from './FaultDescription';



export default function PlayControls({onPlay, onChange, playing, onNext, onPrev}) {

    const {fault, setFault, fault_dict} = useContext(FaultContext);

    const [prevDisabled, setPrevDisabled] = useState(false);
    const [nextDisabled, setNextDisabled] = useState(false);



    useEffect(() => {

        if (playing){
            setPrevDisabled(true);
            setNextDisabled(true);
        }
        else{
            
            setPrevDisabled(false);
            setNextDisabled(false);
        }

    }, [playing]);
    return (
        <>
        <FaultDescription />

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
    disabled={prevDisabled}
    onClick={onPrev}
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
        onPlay();
        setNextDisabled(!nextDisabled);
        setPrevDisabled(!prevDisabled);
    }}
>
    {playing ? <PauseSharp/> : <PlayArrow/>}
</Button>

<Button 
    variant="contained"  
    sx={{
    
        
        minWidth: '3vh',
        minHeight: '3vh',
        backgroundColor: 'rgb(64, 64, 64)',
        color: '#fefefe'
    }}
    disabled={nextDisabled}
    onClick={onNext}
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
    }}>
    <Refresh/>
</Button>
<Button
    variant="contained"  
    sx={{
    
        
        minWidth: '3vh',
        minHeight: '3vh',
        backgroundColor: 'rgb(64, 64, 64)',
        color: '#fefefe'
    }}>
    <FastRewind/>
</Button>
<Button
    variant="contained"  
    sx={{
    
        
        minWidth: '3vh',
        minHeight: '3vh',
        backgroundColor: 'rgb(64, 64, 64)',
        color: '#fefefe'
    }}>
    <FastForward/>
</Button>
    </div>
    </>);
}
