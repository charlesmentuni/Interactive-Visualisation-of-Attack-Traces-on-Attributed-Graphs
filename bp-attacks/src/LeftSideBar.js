import {useState} from 'react';
import {Box, Button, Card, CardContent, Collapse, Typography} from '@mui/material';
import {ChevronLeftRounded, ChevronRightRounded} from '@mui/icons-material';

export default function LeftSideBar() {

    const [openLeft, setOpenLeft] = useState(false);

    return (
        <Box sx={{ position: "absolute", left: 0, top: 0, maxHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "flex-start", paddingTop:2}}>
        <Button 
            onClick={() => {setOpenLeft(!openLeft)}} 
            variant="contained" 
            color='primary'
            sx={{ 
            mb: 1, 
            borderTopLeftRadius: 0, 
            borderBottomLeftRadius: 0, 
            borderTopRightRadius: 8, 
            borderBottomRightRadius: 8,
            backgroundColor:'rgb(64, 64, 64)'
            }}
        >
            {openLeft ? <ChevronLeftRounded/> : <ChevronRightRounded/>}
        </Button>
        <Collapse in={openLeft} orientation="horizontal">
            <Card sx={{ width: 240, 
                boxShadow: 3, 
                borderTopLeftRadius: 0, 
                borderBottomLeftRadius: 0, 
                borderTopRightRadius: 8, 
                borderBottomRightRadius: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.75)' }}>
            <CardContent sx={{color: 'white'}}>
                <Typography variant="h6">Import Attributed Graph</Typography>
                <Typography variant="body2">Speed: 1x</Typography>
                <Typography variant="body2">Style</Typography>
                <Typography variant="body2">Unlock All</Typography>
            </CardContent>
            </Card>
        </Collapse>
    </Box>

);
}