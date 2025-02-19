import { Button, ButtonGroup } from '@mui/material';
import { PlayArrow, SkipNext, SkipPrevious, PauseSharp } from '@mui/icons-material';
import {useState} from 'react';

export default function PlayControls({onPlay}) {

    const runFault = (fault) =>{
        // Should take in fault in the form given by json file
        
    }
    const [playing, setPlaying] = useState(false);
    const [prevDisabled, setPrevDisabled] = useState(false);
    const [nextDisabled, setNextDisabled] = useState(false);

    return (<ButtonGroup variant="contained" aria-label="Basic button group" 
        sx={{position:'absolute', 
            bottom: '0', 
            right: '0', 
            margin: '2%', 
            width: '10%',
            backgroundColor: 'rgb(64, 64, 64)'}} >
        <Button disabled={prevDisabled}><SkipPrevious/></Button>
        <Button onClick={() => {
            onPlay();
            setPlaying(!playing);
            setNextDisabled(!nextDisabled);
            setPrevDisabled(!prevDisabled);
            }}> 
            {playing ? <PauseSharp/> : <PlayArrow/>}</Button>
        <Button disabled={nextDisabled}><SkipNext/></Button>
    </ButtonGroup>);
}
