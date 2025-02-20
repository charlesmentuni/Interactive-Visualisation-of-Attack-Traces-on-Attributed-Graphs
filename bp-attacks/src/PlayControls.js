import { Button, ButtonGroup, Card, CardContent, Select } from '@mui/material';
import { PlayArrow, SkipNext, SkipPrevious, PauseSharp } from '@mui/icons-material';
import {useEffect, useState} from 'react';
import SelectFault from './SelectFault';



export default function PlayControls({onPlay}) {

    
   
    const [playing, setPlaying] = useState(false);
    const [prevDisabled, setPrevDisabled] = useState(false);
    const [nextDisabled, setNextDisabled] = useState(false);
    const [fault1, setFault1] = useState("No Fault Selected");

    const getFault = (fault) => {
        setFault1(fault);
    }
    useEffect(() => {
        console.log(fault1);
    }, [fault1]);
    return (
        <>
        <SelectFault onSelection={(fault) => {getFault(fault)}}/>

        <Card sx=
            {{position: 'absolute', 
            bottom: '4%', 
            right: '0', 
            margin: '2%', 
            width: '10%', 
            backgroundColor: 'rgb(64, 64, 64)', 
            color: '#fefefe'}}>
            <CardContent>
                {fault1}
            </CardContent>

        </Card>
        <ButtonGroup variant="contained"  
            color=""
            sx={{position:'absolute', 
                bottom: '0', 
                right: '0', 
                margin: '2%', 
                width: '10%',
                height: '5%',
                backgroundColor: 'rgb(64, 64, 64)',
                color : '#fefefe'}} >
            <Button disabled={prevDisabled}><SkipPrevious/></Button>
            <Button onClick={() => {
                onPlay(fault1);
                setPlaying(!playing);
                setNextDisabled(!nextDisabled);
                setPrevDisabled(!prevDisabled);
                }}> 
                {playing ? <PauseSharp/> : <PlayArrow/>}</Button>
            <Button disabled={nextDisabled}><SkipNext/></Button>
        </ButtonGroup> 
    </>);
}
