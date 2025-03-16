import { Card, CardContent, Typography } from "@mui/material";
import { useContext } from "react";
import { FaultContext } from "./Sketch";


export default function FaultDescription({fault}) {

    const {  fault_dict} = useContext(FaultContext);
    return (
        <>
        <Card
            sx={{
                position: "absolute",
                opacity: 0.75,
                margin: "2%",
                bottom: 0,
                height: "20%",
                width: "64%",
                backgroundColor: "black",
                color: "#fefefe",
                overflow: "auto",
                display: "flex",
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
                overflowY: fault_dict[fault] ? "auto" : "hidden",
                paddingTop: fault_dict[fault] ? "1rem": "0", 
                paddingBottom: '0 !important',
                }}
            >
                {fault_dict[fault] ? (
                Object.keys(fault_dict[fault]).map((key) => (
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
                ))
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