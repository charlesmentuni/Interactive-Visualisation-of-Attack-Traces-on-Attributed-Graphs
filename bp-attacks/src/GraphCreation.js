import {createContext, useContext, useState, useEffect, useRef} from 'react';
import Sketch from './Sketch';
//import json from './wf102.json';
import { data_source_types, io_binding_edge_types } from './blmodel';
import cytoscape from "cytoscape";
import klay from "cytoscape-klay";
import elk from "cytoscape-elk";

const GraphContext = createContext();
export default GraphContext;

export function GraphCreation({json}) {
    const [node_dict, setNode_dict] = useState(null);
    const [edge_dict, setEdge_dict] = useState({});
    const [data_source_dict, setData_source_dict] = useState({});
    const [graph_layout, setGraph_layout] = useState(null);
    const [fault_dict, setFault_dict] = useState({});

    const [io_dict, setIo_dict] = useState(null);
    const processName = useRef("WF102-Pick");
    const subProcessChildren = useRef(null);
    const subProcessNodes = useRef(null);
    const subProcessGraphs = useRef({});

    const createND = () => {
        // Creates a dictionary of nodes with their uuid as the key
        var temp_node_dict = {};
        var temp_io_dict = {};
        var temp_data_source_dict = {};
        var temp_subProcessNodes = {};
        var temp_subProcessChildren = {};

        json.nodes.forEach((node, index) => {
            if (node.type === "blFault"){return;}

            if (node.type === "InputOutputBinding"){
                temp_io_dict[node.uuid] = node;
                return;
            }
            if (node.type === "userForm"){return;}
            if (node.type === "subProcess"){
                // Pop from dictionary
                temp_subProcessNodes[node.uuid] = node;
                temp_subProcessNodes[node.uuid].children = {};
                return;
            }

            if (node.processRef && node.processRef !== processName.current){
                temp_subProcessChildren[node.uuid] = node;
                return;
            }

            if (node.type === "process"){
                processName.current = node.id;
                return;
            }
            

            temp_node_dict[node.uuid] = {};

            Object.keys(node).forEach((key) => {
                if (key !== 'uuid'){
                    temp_node_dict[node.uuid][key] = node[key];
                }

            });
    
            
        });

        setIo_dict(temp_io_dict);
        setNode_dict(temp_node_dict);
        subProcessNodes.current = temp_subProcessNodes;
        subProcessChildren.current = temp_subProcessChildren;

    }

    const getIONodes = () => {
        var temp_node_dict = node_dict;

        json.edges.forEach((edge) => {
            if (!temp_node_dict[edge.sourceRef]){return;}
            // if target ref is in input output dictionary then add to an array the sourceRef record in the node dictionary
            if (io_dict[edge.targetRef]){
                if (!temp_node_dict[edge.sourceRef].inputOutputBinding){
                    temp_node_dict[edge.sourceRef].inputOutputBinding = {};
                }
                temp_node_dict[edge.sourceRef].inputOutputBinding[edge.targetRef] = io_dict[edge.targetRef];
            }
             
        }); 
    }

    const getFaultNodes = () =>{

        var fault_dict_temp = {}
        json.nodes.forEach((node) => {
            if (node.type === "blFault"){
                fault_dict_temp[node.uuid] = node;            
            }
        });
        setFault_dict(fault_dict_temp);
    }

    const graphLayout = (dict) => {
        // Sets up graph layout using Cytoscape to output the coordinates of the nodes
        // May potentially be used for the edges as well.
        // The fact that it is so close to BPMN should mean that could layout graph in own way
        cytoscape.use(elk);  // Move this before initializing Cytoscape

        const cy = cytoscape(convertToGraph(dict));

    

        const layout = cy.layout({
            name: "elk", 
            elk : {
                'algorithm': 'mrtree',
                'elk.direction': 'RIGHT',
            },
            avoidOverlap:true,
            animate: false
        });

        layout.on("layoutstop", () => {
            setGraph_layout(cy);
            console.log(cy);
        });

        layout.run();

        
    }

    const convertToGraph = (dict) => {
        // Turns the json file into something the cytoscape.js can interpret
        var graph = {elements: []};
        var processNode ={};
        dict.nodes.forEach((node) => {
            if (node.type === "InputOutputBinding" || node.type === "blFault" || data_source_types.includes(node.type) || (node.processRef && node.processRef !== processName.current)){return;}

            
            if (node.type === "process"){
                processNode = node;
                return;
            }
            
            graph.elements.push({data: {id: node.uuid}});
 
        });
        dict.edges.forEach((edge) => {
            if (edge.type === "faultFlow" || edge.type === "processFlow" || Object.keys(subProcessChildren.current).includes(edge.sourceRef) || Object.keys(subProcessChildren.current).includes(edge.targetRef)){return;}

            if (io_binding_edge_types.includes(edge.type)){
                return;
            }
            if (!node_dict[edge.sourceRef] || !node_dict[edge.targetRef]){return;}
            if (processNode.uuid === edge.sourceRef || processNode.uuid === edge.targetRef){
                return;
            }

            
            console.log("edge", edge.uuid);
            graph.elements.push({data: {id: edge.uuid, source: edge.sourceRef, target: edge.targetRef}});
        });
        console.log("main", graph);
        return graph;
    }

    const getSubProcessNodes = () => {
        var temp_node_dict = node_dict;
        Object.keys(subProcessNodes.current).forEach((key) => {
            Object.keys(subProcessChildren.current).forEach((key1) => {
                if (subProcessChildren.current[key1].processRef === subProcessNodes.current[key].id){
                    subProcessNodes.current[key].children[key1] = subProcessChildren.current[key1];
                }
            });
            temp_node_dict[key] = subProcessNodes.current[key];
        });
        getSubProcessEdges();
        subProcessLayout(subProcessNodes);
        
    }

    const getSubProcessEdges = () => {
        json.edges.forEach((edge) => {
            
            if (node_dict[edge.sourceRef] && node_dict[edge.sourceRef].type === "subProcess"){
                return;
            }

            Object.keys(subProcessNodes.current).forEach((key) => {
                if (subProcessNodes.current[key].children[edge.sourceRef] && subProcessNodes.current[key].children[edge.targetRef]){

                    if (!subProcessNodes.current[key].edges){
                        subProcessNodes.current[key].edges = [];
                    }
                    subProcessNodes.current[key].edges.push({data: {id: edge.uuid, source: edge.sourceRef, target: edge.targetRef}});
                    return;
                }
            });
        });
    }

    const subProcessLayout = () => {
        var temp_node_dict = node_dict;
        Object.keys(subProcessNodes.current).forEach((key) => {
            var graph = {elements: []};

            Object.keys(subProcessNodes.current[key].children).forEach((key1) => {
                graph.elements.push({data: {id: key1}});
            });
            
            if (subProcessNodes.current[key].edges){
                subProcessNodes.current[key].edges.forEach((edge) => {
        
                    graph.elements.push(edge);
                });
            }
            // Sets up graph layout using Cytoscape to output the coordinates of the nodes
            // May potentially be used for the edges as well.
            // The fact that it is so close to BPMN should mean that could layout graph in own way
            const cy = cytoscape(graph);
            //cytoscape.use(klay);
            cytoscape.use(elk);
            const layout = cy.layout({
                name: "elk", 
                elk : {
                    'algorithm': 'mrtree',
                    'elk.direction': 'RIGHT',
                },
                avoidOverlap:true,
                animate: false
            });

            layout.on("layoutstop", () => {
                var minX = null;
                var minY = null;
                cy.nodes().forEach((node)=>{
                    if (!minX || node.position().x < minX){minX = node.position().x;}
                    if (!minY || node.position().y < minY){minY = node.position().y;}
                })
                cy.nodes().map((node)=>{
                    node.position().x-=minX;
                    node.position().y-=minY;
                })
                temp_node_dict[key].layout = cy;

                
            });

            layout.run();
            
        });
    }


    useEffect(() => {
        if (!json){return;}
        createND();
        
    }, [json])

    useEffect(() => {
        if (!json || !node_dict){return}
        getIONodes();
        getSubProcessNodes();
        graphLayout(json);
        getFaultNodes(); 
       

    }, [ node_dict]);

    

    return (
        <GraphContext.Provider value={{node_dict, setNode_dict, edge_dict, setEdge_dict, graph_layout, fault_dict, json}}>
            <Sketch />
        </GraphContext.Provider>
    )
};