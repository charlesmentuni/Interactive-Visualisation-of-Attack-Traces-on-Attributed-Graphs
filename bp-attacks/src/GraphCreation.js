import {createContext, useContext, useState, useEffect, useRef} from 'react';
import Sketch from './Sketch';
//import json from './wf102.json';
import { data_source_types, io_binding_edge_types } from './blmodel';
import cytoscape from "cytoscape";
import klay from "cytoscape-klay";
import elk from "cytoscape-elk";
import UploadContext from './UploadFaultFile';

const GraphContext = createContext();
export default GraphContext;

export function GraphCreation() {

    const {json, setJson, jsonFile, setJsonFile} = useContext(UploadContext);

    const [node_dict, setNode_dict] = useState(null);
    const [edge_dict, setEdge_dict] = useState({});
    const [data_source_dict, setData_source_dict] = useState({});
    const [graph_layout, setGraph_layout] = useState(null);
    const [fault_dict, setFault_dict] = useState({});
    const [new_view, setNew_view] = useState(null);
    

    const [io_dict, setIo_dict] = useState(null);
    const processName = useRef("WF102-Pick");
    const subProcessChildren = useRef(null);
    const subProcessNodes = useRef(null);
    const subProcessGraphs = useRef({});
    const associated_fault_nodes = useRef([]);
    

    const createND = () => {
        // Creates a dictionary of nodes with their uuid as the key
        var temp_node_dict = {};
        var temp_io_dict = {};
        var temp_data_source_dict = {};
        var temp_subProcessNodes = {};
        var temp_subProcessChildren = {};
        subProcessNodes.current = null;
        subProcessChildren.current = {};


        json.nodes.forEach((node, index) => {
            if (node.type === "blFault"){return;}

            if (node.type === "InputOutputBinding"){
                temp_io_dict[node.uuid] = node;
                return;
            }
            if (node.type === "userForm"){return;}
            if (node.type === "subProcess" || node.type === "adHocSubProcess"){
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

            // A bl fault node is associated with the first node in the execution sequence as the source
            if (edge.type === "faultFlow"){
                associated_fault_nodes.current[edge.sourceRef] = edge.targetRef;
            }

            if (!temp_node_dict[edge.sourceRef]){
                if (!subProcessChildren.current[edge.sourceRef]){return;}
                if (io_dict[edge.targetRef]){
                    if (!subProcessChildren.current[edge.sourceRef].inputOutputBinding){
                        subProcessChildren.current[edge.sourceRef].inputOutputBinding = {};
                    }
                    
                    
                    subProcessChildren.current[edge.sourceRef].inputOutputBinding[edge.targetRef] = {...io_dict[edge.targetRef], "InputOutput": edge.type};
                }
                return;
            }

            // if target ref is in input output dictionary then add to an array the sourceRef record in the node dictionary
            if (io_dict[edge.targetRef]){
                if (!temp_node_dict[edge.sourceRef].inputOutputBinding){
                    temp_node_dict[edge.sourceRef].inputOutputBinding = {};
                }
                temp_node_dict[edge.sourceRef].inputOutputBinding[edge.targetRef] =  {...io_dict[edge.targetRef], "InputOutput": edge.type};
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
                'elk.edgeRouting': 'ORTHOGONAL',
            },
            avoidOverlap:true,
            animate: false
        });

        layout.on("layoutstop", () => {
            setGraph_layout(cy);
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

            
            graph.elements.push({data: {id: edge.uuid, source: edge.sourceRef, target: edge.targetRef}});
        });
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
        jsonFile.edges.forEach((edge) => {
            
            // The subprocess node should contain its children not connect to them 
            if (node_dict[edge.sourceRef] && (node_dict[edge.sourceRef].type === "subProcess" || node_dict[edge.sourceRef].type === "adHocSubProcess")){
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
        performance.mark('subProcessLayout')
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
                performance.mark('graphLayoutEnd')

            });

            layout.run();
            
        });
    }


    useEffect(() => {
        if (!json){return;}
        performance.mark("beforeInit");
        console.time('timeGraph');
        console.log('nodeNum' ,json.nodes.length);
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
        <GraphContext.Provider value={{node_dict, setNode_dict, edge_dict, setEdge_dict, graph_layout, fault_dict, json, setJson, jsonFile,setJsonFile, subProcessNodes, subProcessChildren, setNew_view, new_view, associated_fault_nodes}}>
            <Sketch />
        </GraphContext.Provider>
    )
};