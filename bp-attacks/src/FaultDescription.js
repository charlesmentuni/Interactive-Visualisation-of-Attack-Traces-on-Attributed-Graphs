import { Card, CardContent } from "@mui/material";
import { useContext } from "react";
import { FaultContext } from "./Sketch";


export default function FaultDescription() {

    const {fault, setFault, fault_dict} = useContext(FaultContext);
    return (
        <>
        <Card sx={{
            position: 'absolute', 
            margin: '2%',
            bottom:0,
            height: '20%',
            width: '64%', 
            backgroundColor: 'rgb(64,64,64)', 
            color: '#fefefe',
            overflow: 'auto',
            padding:0,
        }}>
            <CardContent sx={{color: 'white', fontFamily: 'monospace', padding:0, paddingLeft:'2ch'}}>
            {fault_dict[fault] ? Object.keys(fault_dict[fault]).map((key) => {
                    return <p>{key}: {fault_dict[fault][key].toString()}</p>
                }) : null}
            </CardContent>

        </Card>
            

        </>
    )
}