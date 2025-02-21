import { Button, ButtonGroup, Card, CardContent, Select , Box} from '@mui/material';
import { PlayArrow, SkipNext, SkipPrevious, PauseSharp } from '@mui/icons-material';
import {useEffect, useState} from 'react';
import SelectFault from './SelectFault';



export default function PlayControls({onPlay, onChange, playing}) {

    const [prevDisabled, setPrevDisabled] = useState(false);
    const [nextDisabled, setNextDisabled] = useState(false);
    const [fault1, setFault1] = useState(null);

    const getFault = (fault) => {
        setFault1(fault);
    }
    useEffect(() => {
        if (fault1){
            onChange(fault1);
        }
        
    }, [fault1]);

    useEffect(() => {
        

        if (playing){
            setPrevDisabled(true);
            setNextDisabled(true);
        }
        else{
            /* // Disable buttons if there is no previous/next stage
            const hasPrevStage = /* logic to determine if there is a previous stage;
            const hasNextStage = /* logic to determine if there is a next stage ;
            setPrevDisabled(!hasPrevStage);
            setNextDisabled(!hasNextStage); */
            setPrevDisabled(false);
            setNextDisabled(false);
        }

    }, [playing]);
    return (
        <>
        <SelectFault onSelection={(fault) => {getFault(fault)}}/>
        

        <Card sx={{
    position: 'absolute', 
    bottom: '6%', 
    right: '0', 
    margin: '2%', 
    width: '16%', 
    backgroundColor: 'rgb(64, 64, 64)', 
    color: '#fefefe'
}}>
    <CardContent>
        {fault1 ? fault1 : "No Fault Selected"}
    </CardContent>
</Card>

<Button 
    variant="contained"  
    sx={{
        position: 'absolute', 
        bottom: '0', 
        right: '12%', 
        margin: '2%', 
        minWidth: '3vh',
        minHeight: '3vh',
        backgroundColor: 'rgb(64, 64, 64)',
        color: '#fefefe'
    }}
    disabled={prevDisabled}
>
    <SkipPrevious/>
</Button>

<Button 
    variant="contained"  
    sx={{
        position: 'absolute', 
        bottom: '0', 
        right: '6%', 
        margin: '2%', 
        minWidth: '3vh',
        minHeight: '3vh',
        backgroundColor: 'rgb(64, 64, 64)',
        color: '#fefefe'
    }}
    onClick={() => {
        onPlay(fault1);
        setNextDisabled(!nextDisabled);
        setPrevDisabled(!prevDisabled);
    }}
>
    {playing ? <PauseSharp/> : <PlayArrow/>}
</Button>

<Button 
    variant="contained"  
    sx={{
        position: 'absolute', 
        bottom: '0', 
        right: '0', 
        margin: '2%', 
        minWidth: '3vh',
        minHeight: '3vh',
        backgroundColor: 'rgb(64, 64, 64)',
        color: '#fefefe'
    }}
    disabled={nextDisabled}
>
    <SkipNext/>
</Button>
    
    </>);
}
