import {createContext, useContext, useState, useEffect, use} from 'react';
import Sketch from './Sketch';
import json from './wf102.json';
import { io_binding_edge_types } from './blmodel';
import cytoscape from "cytoscape";
import klay from "cytoscape-klay";

const GraphContext = createContext();
export default GraphContext;

export function GraphCreation() {
    const [node_dict, setNode_dict] = useState({});
    const [edge_dict, setEdge_dict] = useState({});
    const [graph_layout, setGraph_layout] = useState({});

    const [io_dict, setIo_dict] = useState({});


    const createND = () => {
        // Creates a dictionary of nodes with their uuid as the key
        var temp_node_dict = {};
        var temp_io_dict = {};

        json.nodes.forEach((node, index) => {

            if (node.type === "InputOutputBinding"){
                temp_io_dict[node.uuid] = node;
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

       }

    const getIONodes = () => {
        var temp_node_dict = node_dict;

        json.edges.forEach((edge) => {
            // if target ref is in input output dictionary then add to an array the sourceRef record in the node dictionary
            if (io_dict[edge.targetRef]){
                if (!temp_node_dict[edge.sourceRef].inputOutputBinding){
                    temp_node_dict[edge.sourceRef].inputOutputBinding = {};
                }
                temp_node_dict[edge.sourceRef].inputOutputBinding[edge.targetRef] = io_dict[edge.targetRef];
            }
        });
    }

    const graphLayout = () => {
        // Sets up graph layout using Cytoscape to output the coordinates of the nodes
        // May potentially be used for the edges as well.
        // The fact that it is so close to BPMN should mean that could layout graph in own way
        const cy = cytoscape(convertToGraph());
        cytoscape.use(klay);
        const layout = cy.layout({
            name: "klay", // Use 'breadthfirst', 'grid', 'circle', etc.
            animate: false
        });
            
        layout.run();
        
        setGraph_layout(cy);
    }

    const convertToGraph = () => {
        // Turns the json file into something the cytoscape.js can interpret
        var graph = {elements: []};
        
        json.nodes.forEach((node) => {
            if (node.type === "InputOutputBinding"){
                return;
            }
            
            graph.elements.push({data: {id: node.uuid}});
        });
        json.edges.forEach((edge) => {
            if (io_binding_edge_types.includes(edge.type)){
                return;
            }
            graph.elements.push({data: {id: edge.uuid, source: edge.sourceRef, target: edge.targetRef}});
        });
        return graph;
    }

    useEffect(() => {
        createND();
        graphLayout();
    }, [])

    useEffect(() => {
        getIONodes();
    }, [io_dict, node_dict]);

    return (
        <GraphContext.Provider value={{node_dict, setNode_dict, edge_dict, setEdge_dict, graph_layout}}>
            <Sketch />
        </GraphContext.Provider>
    )
};