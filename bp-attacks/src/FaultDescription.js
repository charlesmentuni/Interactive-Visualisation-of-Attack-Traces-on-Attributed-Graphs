import { Card, CardContent, Divider, List, ListItem, ListItemText, Typography } from "@mui/material";
import { useContext } from "react";
import { FaultContext } from "./Sketch";


export default function FaultDescription({fault}) {

    const {  fault_dict, node_dict, setNodeCard, zoomed_node_current} = useContext(FaultContext);
    return (
        <>
        <Card
            sx={{
                position: "fixed",
                opacity: 0.75,
                margin: "2%",
                bottom: 0,
                height: "20%",
                width: "32%",
                backgroundColor: "black",
                color: "#fefefe",
                overflow: "auto",
                display: "flex",
                borderBottomRightRadius:0,
                borderTopRightRadius:0,
            }}
            >
            <CardContent
            paddingBottom={0}
                sx={{
                color: "white",
                fontFamily: "monospace",
                padding: 1,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: fault_dict[fault] ? "flex-start" : "center",
                alignItems: fault_dict[fault] ? "flex-start" : "center",
                overflowY: fault_dict[fault] ? "auto" : "hidden",
                paddingTop: fault_dict[fault] ? "1rem": "0", 
                paddingBottom: '0 !important',
                }}
            >
                {fault_dict[fault] ? (
                    <>
                <Typography variant="h4" sx={{color: (fault_dict[fault].severity === 'low') ? 'yellow' :
                    (fault_dict[fault].severity === 'high') ? 'red': 'yellow'
                }}>{fault_dict[fault].severity.toUpperCase() + " Severity Fault"}</Typography>
                <Typography>{"Type: " + fault_dict[fault].fault_type}</Typography>
                <Typography>{"Category: "+ fault_dict[fault].fault_category}</Typography>
                <br/>
                {fault_dict[fault].description && (<Typography>{"Description: " + fault_dict[fault].description}</Typography>)}
                <br/>
                {fault_dict[fault].fault_examples && (<Typography>{"Example: " + fault_dict[fault].fault_examples}</Typography>)}

                {/* {Object.keys(fault_dict[fault]).map((key) => (
                    <Typography
                    key={key}
                    variant="p"
                    sx={{
                        fontFamily: "monospace",
                        paddingLeft: "2ch",
                        marginBottom: "0.5rem", 
                    }}
                    >
                    {key}: {fault_dict[fault][key].toString()}
                    </Typography>
                ))}*/}</>
                ) : (
                <Typography variant="h3" sx={{ textAlign: "center" }}>
                    No fault selected
                </Typography>
                )}
            </CardContent>
        </Card>

        <Card
            sx={{
                position: "fixed",
                opacity: 0.75,
                margin: "2%",
                bottom: 0,
                left:'32%',
                height: "20%",
                width: "32%",
                backgroundColor: "black",
                color: "#fefefe",
                overflow: "auto",
                display: "flex",
                borderBottomLeftRadius:0,
                borderTopLeftRadius:0,
            }}
            >
            <CardContent
            paddingBottom={0}
                sx={{
                color: "white",
                fontFamily: "monospace",
                padding: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: fault_dict[fault] ? "flex-start" : "center",
                alignItems: fault_dict[fault] ? "flex-start" : "center",
                overflow: fault_dict[fault] ? "auto" : "hidden",
                paddingTop: fault_dict[fault] ? "1rem": "0", 
                paddingBottom: '0 !important',
                }}
            >
                {fault_dict[fault] ? (
                    <>
                    <Typography variant="h4" sx={{alignSelf:'center'}}>
                            Execution Path
                        </Typography>
                <List sx={{minWidth:'100%'}}>
                {fault_dict[fault]["execution_path"].map((e, index)=>{
                    if (node_dict[e]){
                    return(
                        <>
                        
                        <ListItem
                            sx={{
                                transition: "background-color 0.3s",
                                "&:hover": { backgroundColor: "#636e72" },
                                
                            }} onClick={()=>{setNodeCard(node_dict[e]); zoomed_node_current.current = node_dict[e]}}>
                                
                        <ListItemText primary={((index/2)+1).toString() + ". " + node_dict[e].name} />
                        </ListItem>
                        {index < fault_dict[fault].execution_path.length - 1 && <Divider />}


                         </>
                   
                    
                )}
                })}
                </List>
                </>
                ) : (
                <Typography variant="h3" sx={{ textAlign: "center" }}>
                    No fault selected
                </Typography>
                )}
            </CardContent>
        </Card>

            

        </>
    )
}