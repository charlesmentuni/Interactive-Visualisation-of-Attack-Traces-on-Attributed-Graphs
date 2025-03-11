import {createContext, useContext, useState, useEffect} from 'react';
import Sketch from './Sketch';
import json from './wf102.json';

const GraphContext = createContext();
export default GraphContext;

export function GraphCreation() {
    const [node_dict, setNode_dict] = useState({});
    const [edge_dict, setEdge_dict] = useState({});
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

    useEffect(() => {
        createND();
    }, [])

    useEffect(() => {
        getIONodes();
    }, [io_dict, node_dict]);

    return (
        <GraphContext.Provider value={{node_dict, setNode_dict, edge_dict, setEdge_dict}}>
            <Sketch />
        </GraphContext.Provider>
    )
};