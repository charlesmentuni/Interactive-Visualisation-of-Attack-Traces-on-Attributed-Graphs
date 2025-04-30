import {useEffect, useState} from 'react';
import {Box, Button, Card, CardContent, Collapse, Typography} from '@mui/material';
import {ArrowDownwardRounded, ArrowForwardIosRounded, ChevronLeftRounded, ChevronRightRounded, Javascript, KeyboardArrowDownRounded, KeyboardArrowRightRounded, SubdirectoryArrowRightRounded} from '@mui/icons-material';
import ShowCodeBlock from './CodeBlock';

export default function RightSideBar({nodeCard}) {

    const [openRight, setOpenRight] = useState(false);

    const [scriptOpened, setScriptOpened] = useState(false);
    const [assignmentsOpened, setAssignmentsOpened] = useState(false);
    const [expressionOpened, setExpressionOpened] = useState(false);
    const [dataSourceOpened, setDataSourceOpened] = useState(false);

    const readableTypes = {
        "eventBasedGateway": "Event-Based Gateway",
        "complexGateway": "Complex Gateway",
        "parallelGateway": "Parallel Gateway",
        "exclusiveGateway": "Exclusive Gateway",
        "inclusiveGateway": "Inclusive Gateway",
        "adHocSubProcess": "Ad Hoc Sub-Process",
        "callActivity": "Call Activity",
        "endEvent": "End Event",
        "messageEndEvent": "Message End Event",
        "startEvent": "Start Event",
        "timerStartEvent": "Timer Start Event",
        "messageStartEvent": "Message Start Event",
        "catchEvent": "Catch Event",
        "throwEvent": "Throw Event",
        "boundaryEvent": "Boundary Event",
        "intermediateCatchEvent": "Intermediate Catch Event",
        "intermediateThrowEvent": "Intermediate Throw Event",
        "task": "Task",
        "sendTask": "Send Task",
        "userTask": "User Task",
        "scriptTask": "Script Task",
        "manualTask": "Manual Task",
        "serviceTask": "Service Task",
        "receiveTask": "Receive Task",
        "businessRuleTask": "Business Rule Task",
        "process": "Process",
        "subProcess": "Sub-Process",
        "InputOutputBinding": "Input Output Binding",
        "userForm": "User Form",
        "database": "Database",
        "document": "Document"


    }
    

    useEffect(()=>{if(!nodeCard){return;}setOpenRight(true);}, [nodeCard])
    return (
    <Box sx={{ position: "fixed", right: 0, top: 0, maxHeight: "50vh",display: "flex", flexDirection: "column", alignItems: "flex-end", paddingTop:2}}>
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
                height: "50vh", 
                overflow:"auto",
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                display: nodeCard ? null : 'flex',
                justifyContent: nodeCard ? null : "center",
                alignItems: nodeCard ? null : "center"
                }}>

            <CardContent sx={{color: 'white', fontFamily: 'monospace'}}>
                
            {nodeCard ? (
                <>
                    <Typography variant="h6">{nodeCard.name}</Typography>
                    <Typography variant="body1">  <SubdirectoryArrowRightRounded sx={{ verticalAlign: 'middle' }}/> {readableTypes[nodeCard.type] + (nodeCard.processRef ? " in " + nodeCard.processRef : "")}</Typography>
                    <br/>
                    <Typography variant='body1'>ID : {nodeCard.id}</Typography>
                    {nodeCard.script ? (<>
                        <Typography>{nodeCard.scriptFormat + " code : "} 
                            {scriptOpened ? <KeyboardArrowDownRounded sx={{ verticalAlign: 'middle' }} onClick={()=>{setScriptOpened(false)}} /> :<KeyboardArrowRightRounded sx={{ verticalAlign: 'middle' }} onClick={()=>{setScriptOpened(true)}} />}
                        </Typography>
                        {scriptOpened ? <ShowCodeBlock lang={nodeCard.scriptFormat} code={nodeCard.script}></ShowCodeBlock>:null}
                    </>): null}
                    {nodeCard.assignments ? <>
                        <Typography>Assignments :  
                            {assignmentsOpened ? <KeyboardArrowDownRounded sx={{ verticalAlign: 'middle' }} onClick={()=>{setAssignmentsOpened(false)}} /> :<KeyboardArrowRightRounded sx={{ verticalAlign: 'middle' }} onClick={()=>{setAssignmentsOpened(true)}} />}
                        </Typography>
                    
                    {assignmentsOpened ? <ShowCodeBlock lang={'javascript'} code={nodeCard.assignments.toString().replaceAll(",", ",\n")}></ShowCodeBlock>: null}
                    </>: null}
                    {nodeCard.expression ? (<>
                        <Typography>Expression : 
                            {expressionOpened ? <KeyboardArrowDownRounded sx={{ verticalAlign: 'middle' }} onClick={()=>{setExpressionOpened(false)}} /> :<KeyboardArrowRightRounded sx={{ verticalAlign: 'middle' }} onClick={()=>{setExpressionOpened(true)}} />}
                        </Typography>
                        {expressionOpened ? <ShowCodeBlock lang="javascript" code={nodeCard.expression}></ShowCodeBlock>:null}
                    </>): null}

                    {nodeCard.data_source ? (<>
                        <Typography>{readableTypes[nodeCard.data_source.type]} Source:
                            {dataSourceOpened ? <KeyboardArrowDownRounded sx={{ verticalAlign: 'middle' }} onClick={()=>{setDataSourceOpened(false)}} /> :<KeyboardArrowRightRounded sx={{ verticalAlign: 'middle' }} onClick={()=>{setDataSourceOpened(true)}} />}
                        </Typography>
                        {dataSourceOpened && <>
                            {nodeCard.data_source.field_name ? <><Typography variant='body3' sx={{display: "inline-block", marginLeft: "40px"}}><b>Field Name:</b>  {nodeCard.data_source.field_name}</Typography></>: null}
                            {nodeCard.data_source.data_type ? <><Typography variant='body3' sx={{display: "inline-block", marginLeft: "40px"}}><b>Data Type:</b>  {nodeCard.data_source.data_type}</Typography></>: null}

                            {nodeCard.data_source.documentation ? <><Typography variant='body3' sx={{display: "inline-block", marginLeft: "40px"}}><b>Documentation:</b>  {nodeCard.data_source.documentation}</Typography></>: null}

                        </>}
                        
                    </>): null}


                    {nodeCard.data_type ? <><br/><Typography variant='body2'>Data Type : {nodeCard.data_type}</Typography></>: null}
                    {nodeCard.documentation ? <><br/><Typography variant='body2'>{nodeCard.documentation}</Typography></>: null}
                    {nodeCard.annotation ? <><br/><Typography variant='body2'>NOTE : {nodeCard.annotation}</Typography></>: null}

                    

                    <br/>

                </>
            ) : (
                <Typography variant='h4' justifySelf={'center'}>No node selected</Typography>
            )}
            </CardContent>
            </Card>
        </Collapse>
    </Box>
);
}