import { Button, ButtonGroup } from '@mui/material';
import { PlayArrow, SkipNext, SkipPrevious } from '@mui/icons-material';


export default function PlayControls() {

    const runFault = (fault) =>{
        // Should take in fault in the form given by json file
        
    }


    return (<ButtonGroup variant="contained" aria-label="Basic button group" 
        sx={{position:'absolute', 
            bottom: '0', 
            right: '0', 
            margin: '2%', 
            width: '10%',
            backgroundColor: 'rgb(64, 64, 64)'}} >
        <Button><SkipPrevious/></Button>
        <Button> <PlayArrow/> </Button>
        <Button><SkipNext/></Button>
    </ButtonGroup>);
}