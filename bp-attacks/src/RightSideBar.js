import {useEffect, useState} from 'react';
import {Box, Button, Card, CardContent, Collapse, Typography} from '@mui/material';
import {ChevronLeftRounded, ChevronRightRounded} from '@mui/icons-material';
import ShowCodeBlock from './CodeBlock';

export default function RightSideBar({nodeCard}) {

    const [openRight, setOpenRight] = useState(false);

    useEffect(()=>{if(!nodeCard){return;}setOpenRight(true);}, [nodeCard])
    return (
    <Box sx={{ position: "absolute", right: 0, top: 0, maxHeight: "50vh",display: "flex", flexDirection: "column", alignItems: "flex-end", paddingTop:2}}>
        <Button 
            onClick={() => {setOpenRight(!openRight)}} 
            variant="contained" 
            
            sx={{ 
            mb: 1, 
            borderTopLeftRadius: 8, 
            borderBottomLeftRadius: 8, 
            borderTopRightRadius: 0, 
            borderBottomRightRadius: 0,
            backgroundColor:'rgb(64, 64, 64)', 
            }}
        >
            {openRight ? <ChevronRightRounded/> : <ChevronLeftRounded/>}
        </Button>
        <Collapse in={openRight} orientation="horizontal">
            <Card key="RightSideOpen" sx={{ width: '30vw', 
                boxShadow: 3, 
                borderTopLeftRadius: 8, 
                borderBottomLeftRadius: 8, 
                borderTopRightRadius: 0, 
                borderBottomRightRadius: 0,
                maxHeight: "50vh", 
                overflow:"auto",
                backgroundColor: 'rgba(0, 0, 0, 0.75)'}}>

            <CardContent sx={{color: 'white', fontFamily: 'monospace'}}>
                <Typography variant="h6">Selected Node Info</Typography>
                {nodeCard ? Object.keys(nodeCard).map((key) => {
                    if (nodeCard[key] === '' || key === "group"){
                        return null;
                    }
                    if (key === "script"){
                        
                        return (<>
                            <p>{key}:</p>
                            <ShowCodeBlock lang={nodeCard["scriptFormat"]} code={nodeCard[key]}/>
                         </>);
                    }
                    return <p>{key}: {nodeCard[key].toString()}</p>
                }) : null}
            </CardContent>
            </Card>
        </Collapse>
    </Box>
);
}