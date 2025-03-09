import React from 'react';
import {Card, CardContent} from '@mui/material';


export default function NodeLabel({node}) {
    return (
        <Card sx={node &&{
    position: 'absolute', 
    top: node.position.y*100+'%', 
    left: node.position.x*100+'%', 
    margin: '2%', 
    width: '16%', 
    backgroundColor: '#000000', 
    color: '#fefefe'
    }}>
        <CardContent>
            {node ? node.name : "No Node Selected"}
        </CardContent>
    </Card>
    )
}