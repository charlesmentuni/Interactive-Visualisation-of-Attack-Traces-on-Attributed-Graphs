import {Point, Path, onMouseDown, Tool, Size, TextItem, PointText, Group, Raster} from 'paper';
import paper from 'paper';
import ReadBP from './CodeBlock.js';
import json from './wf102.json';
import { useEffect, useState } from 'react';
import { Collapse, Card, CardHeader, IconButton, CardContent, Button, ButtonGroup , Box, Typography } from '@mui/material';
import {KeyboardArrowDown, KeyboardArrowUp, PlayArrow, SkipNext, SkipPrevious, ChevronRightRounded, ChevronLeftRounded} from '@mui/icons-material';
import cytoscape from "cytoscape";



export default function Sketch() {
   
    // Contains dictionary of node information that has just been clicked on
    const [nodeCard, setNodeCard] = useState(null);
    const [open, setOpen] = useState(false);
    const [openLeft, setOpenLeft] = useState(false);
    const [openRight, setOpenRight] = useState(false);
    const spacing = 8;

   window.onload = function() {

        paper.setup('paper-canvas');

       

        createRect();
        
        var tool = new Tool();
        
        tool.onMouseDrag = function(event){
            var delta = event.downPoint.subtract(event.point)
            paper.view.scrollBy(delta)
      }

        tool.onKeyDown = function(event){
            if (event.key === 'w'){
                paper.view.zoom *= 1.2;
            }

            if (event.key === 's'){
                paper.view.zoom *= 0.8;
                
            }
        }

   }



   const createRect = () => {


        const start = 100;
        const width = 150;
        const height = 100;
        const gap = 100;

        const rectOg = new Path.Rectangle(new Point(100,100), new Size(width, height));
        rectOg.strokeColor = 'black';
        rectOg.visible = false;

        var rect = rectOg.clone();
        rect.visible = true;

        var label = new PointText();
        label.content = json.nodes[0].uuid;
        label.scale(0.4);
        label.position = new Point(100+width/2,100+height/2);

        var group = new Group(rect, label);

        // Creates a dictionary of nodes with their uuid as the key
        var node_dict = {};
        json.nodes.forEach((node, index) => {
                node_dict[node.uuid] = {};
                Object.keys(node).forEach((key) => {
                    if (key !== 'uuid'){
                        node_dict[node.uuid][key] = node[key];
                    }
                });

            
        })

        
        /* json.nodes.forEach((node, index) => {

            node_dict[node.uuid].group = group;

                group.onMouseDown = function(event){
                    toggleInfoCard(node);
                };
                group.children[0].fillColor = 'grey';
                group.children[1].content = node.uuid;
                group.position.x = (index%5)*(width+gap)+start;
                group.position.y = (Math.floor(index/5))*(height+gap)+start;
                group = group.clone();

        }); */
        
        var graph = graphLayout();
        graph.nodes().forEach((node) => { 

            node_dict[node.id()].group = group;
            
            group.onMouseDown = function(event){

                toggleInfoCard(node_dict[node.id()]);
                //console.log(node_dict[node.id()]);
            };

            group.children[0].fillColor = 'grey';
            group.children[1].content = node.id();
            if (node_dict[node.id()].type === 'startvent'){
                group.children[0] = new Raster('event-img');
                group.children[0].scale(0.1);

            }
            group.position.x = node.position().x*spacing;
            group.position.y = node.position().y*spacing;
            group = group.clone();
        });

        // Create a raster item using the image tag with id='mona'
        //var raster = new Raster('event-img');
        
        // Move the raster to the center of the view
        
        // Scale the raster by 50%
        

        createEdges(node_dict);
   }
   const createEdges = (node_dict) => {
        // create edges
        json.edges.forEach((edge) => {

            var new_edge = new Path();
            new_edge.add(node_dict[edge.sourceRef].group.children[0].position);
            new_edge.add(node_dict[edge.targetRef].group.children[0].position);
            var end_pos = node_dict[edge.targetRef].group.children[0].position;
            
            end_pos.x += 10;
            end_pos.y += 10;
            
            new_edge.add(end_pos);
            new_edge.strokeColor = 'black';
            new_edge.strokeWidth = 10;
        });
    

   }
   const convertToGraph = () => {
        var graph = {elements: []};
        json.nodes.forEach((node) => {
            graph.elements.push({data: {id: node.uuid}});
        });
        json.edges.forEach((edge) => {
            graph.elements.push({data: {id: edge.uuid, source: edge.sourceRef, target: edge.targetRef}});
        });
        return graph;
   }

    const graphLayout = () => {
        // Sets up graph layout using Cytoscape to output the coordinates of the nodes
        // May potentially be used for the edges as well.
        // The fact that it is so close to BPMN should mean that could layout graph in own way
        const cy = cytoscape(convertToGraph());

        const layout = cy.layout({
            name: "cose", // Use 'breadthfirst', 'grid', 'circle', etc.
            animate: false
        });
            
        layout.run();

        return cy;
    }

    useEffect(() => {
        graphLayout();
    }, []);

    const toggleInfoCard = (node) => {
        setNodeCard(node);
    }

    
   
   
   function draw(event) {
       // animation loop
   }

   return (<> 

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
                    <Typography variant="h6">Menu</Typography>
                    <Typography variant="body2">Item 1</Typography>
                    <Typography variant="body2">Item 2</Typography>
                    <Typography variant="body2">Item 3</Typography>
                </CardContent>
                </Card>
            </Collapse>
        </Box>



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
                backgroundColor:'rgb(64, 64, 64)'
                
                }}
            >
                {openRight ? <ChevronRightRounded/> : <ChevronLeftRounded/>}
            </Button>
            <Collapse in={openRight} orientation="horizontal">
                <Card sx={{ width: '30vw', 
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
                        if (nodeCard[key] === ''){
                            return null;
                        }
                        return <p>{key}: {nodeCard[key].toString()}</p>
                    }) : null}
                </CardContent>
                </Card>
            </Collapse>
        </Box>


        <img id='event-img' src='https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Circle_-_black_simple.svg/1200px-Circle_-_black_simple.svg.png' style={{display:"none"}} />

        {/* <Card sx={{position:'absolute', top: '0', right: '0', margin: '2%', width: '20%', maxHeight:'50%', overflow: 'auto'}}> 
            <CardHeader 
                    title={nodeCard ? nodeCard.uuid : "Unknown Node"}
                    action={ 
                        <IconButton 
                            onClick={() => setOpen(!open)} 
                            aria-label="expand"
                            size="small"
                        > 
                            {open ? <KeyboardArrowUp/> 
                                : <KeyboardArrowDown />}
                        </IconButton> 
                    } 
            />
            <Collapse in={open} >
                <CardContent>
                    {nodeCard ? Object.keys(nodeCard).map((key) => {
                        if (nodeCard[key] === ''){
                            return null;
                        }
                        return <p>{key}: {nodeCard[key].toString()}</p>
                    }) : null}
                </CardContent>
            </Collapse>
        </Card> */}

        <ButtonGroup variant="contained" aria-label="Basic button group" 
            sx={{position:'absolute', 
                bottom: '0', 
                right: '0', 
                margin: '2%', 
                width: '10%',
                backgroundColor: 'rgb(64, 64, 64)'}} >
            <Button><SkipPrevious/></Button>
            <Button> <PlayArrow/> </Button>
            <Button><SkipNext/></Button>
        </ButtonGroup>
        
        </>
   );
}