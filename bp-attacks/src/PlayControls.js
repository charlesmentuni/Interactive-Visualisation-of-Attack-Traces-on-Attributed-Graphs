import { Button, ButtonGroup } from '@mui/material';
import { PlayArrow, SkipNext, SkipPrevious, PauseSharp } from '@mui/icons-material';
import {useState} from 'react';

export default function PlayControls({onPlay}) {

    const runFault = (fault) =>{
        // Should take in fault in the form given by json file
        
    }
    const [playing, setPlaying] = useState(false);

    return (<ButtonGroup variant="contained" aria-label="Basic button group" 
        sx={{position:'absolute', 
            bottom: '0', 
            right: '0', 
            margin: '2%', 
            width: '10%',
            backgroundColor: 'rgb(64, 64, 64)'}} >
        <Button><SkipPrevious/></Button>
        <Button onClick={() => {
            onPlay();
            setPlaying(!playing);
            }}> 
            {playing ? <PauseSharp/> : <PlayArrow/>}</Button>
        <Button><SkipNext/></Button>
    </ButtonGroup>);
}
