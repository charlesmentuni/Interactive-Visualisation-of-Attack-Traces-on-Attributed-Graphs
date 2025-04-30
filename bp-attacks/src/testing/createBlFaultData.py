import blmodel as bl
import uuid
import json
import random as rd


class CreateBLModel:
    def addSubProcesses(self, node, nodeNumRange=10):


        start = bl.FlowNode(id=f"Start subprocess : {node.name}", name=f"Start subprocess : {node.name}", uuid=uuid.uuid4(), type=bl.FlowNodeTypeEnum.EVENT_START, processRef=node.id)
        end = bl.FlowNode(id=f"End subprocess : {node.name}", name=f"End subprocess : {node.name}", uuid=uuid.uuid4(), type=bl.FlowNodeTypeEnum.EVENT_END, processRef=node.id)

        initial_edge = bl.FlowEdge(id=f"Edge 0 : {node.name}", type=bl.FlowEdgeTypeEnum.PROCESS_FLOW, sourceRef=node.uuid, targetRef=start.uuid)

        subProcess_nodes = [start, end]
        subProcess_edges = [initial_edge]
        temp_node_types = list(bl.FlowNodeTypeEnum)

        temp_node_types.remove(bl.FlowNodeTypeEnum.PROCESS)
        temp_node_types.remove(bl.FlowNodeTypeEnum.SUBPROCESS)
        temp_node_types.remove(bl.FlowNodeTypeEnum.SUB_PROCESS_ADHOC)
        #temp_node_types.remove(bl.FlowNodeTypeEnum.SUB_PROCESS)



        for i in range(0, nodeNumRange):
            chosen_type = rd.choice(temp_node_types)
            
            subNode = bl.FlowNode(uuid=uuid.uuid4(), id=f'node {i} : {node.name}',name=f'node {i} : {node.name}', type=chosen_type, processRef=node.id)
            subProcess_nodes.insert(i+1,subNode)
            subProcess_edges.append(bl.FlowEdge(id=f"Edge {i+1} : {node.name}", type=bl.FlowEdgeTypeEnum.SEQUENCE_FLOW, sourceRef=subProcess_nodes[i].uuid, targetRef=subProcess_nodes[i+1].uuid))    

        subProcess_edges.append(bl.FlowEdge(id=f"Edge End : {node.name}", type=bl.FlowEdgeTypeEnum.SEQUENCE_FLOW, sourceRef=subProcess_nodes[-2].uuid, targetRef=subProcess_nodes[-1].uuid))

        return subProcess_nodes, subProcess_edges

    def addIOBindings(self, node):
        
        for i in range(rd.randint(1, 11)):
            uuidStr = uuid.uuid4()
            self.io_binding_nodes.append(bl.DataNode(id=str(uuidStr), name=f"IOBinding {i}", uuid=uuidStr))
            self.io_binding_edges.append(bl.FlowEdge(id=f"Edge {i} : {node.name}", type=rd.choice([bl.FlowEdgeTypeEnum.INPUT_PARAMETER, bl.FlowEdgeTypeEnum.OUTPUT_PARAMETER]), sourceRef=node.uuid, targetRef=uuidStr))

    def addCycle(self, node, process_nodes):
        cycle_edges = []
        temp_node_types = self.node_types

        temp_node_types = list(bl.FlowNodeTypeEnum)
        temp_node_types.remove(bl.FlowNodeTypeEnum.PROCESS)
        temp_node_types.remove(bl.FlowNodeTypeEnum.SUBPROCESS)


        # Picks how many nodes will exist in the cycle, 1->4 would be typical
        cycle_nodes = [node, rd.choice(process_nodes)]
        for i in range(0, rd.randint(1, 4)):
            cycle_nodes.insert(i+1,bl.FlowNode( type=rd.choice(temp_node_types), uuid=uuid.uuid4(), id=f"cycle {i} : {node.name}", name=f"cycle {i} : {node.name}"))
            cycle_edges.append(bl.FlowEdge(id=f"Edge {i+1} : {node.name}", type=bl.FlowEdgeTypeEnum.SEQUENCE_FLOW, sourceRef=cycle_nodes[i].uuid, targetRef=cycle_nodes[i+1].uuid))

        cycle_edges.append(bl.FlowEdge(id=f"Edge {i+1} : {node.name}", type=bl.FlowEdgeTypeEnum.SEQUENCE_FLOW, sourceRef=cycle_nodes[i+1].uuid, targetRef=cycle_nodes[-1].uuid))

        return cycle_nodes, cycle_edges

    def addFaults(self):
        fault_nodes =[]
        fault_edges = []
        for i in range(10):
            execution_path = []
            nodeChoice = rd.choice(self.nodes)
            while nodeChoice.type == "InputOutputBinding":
                nodeChoice = rd.choice(self.nodes)
            prevNode = nodeChoice.uuid
            processRef = None
            if nodeChoice.type == bl.FlowNodeTypeEnum.SUBPROCESS:
                processRef = nodeChoice.processRef
            execution_path.append(prevNode)
            while len(execution_path) < 10:
                targetFound =False
                for e in self.edges:
                    if e.sourceRef == prevNode:
                        if not (e.type == bl.FlowEdgeTypeEnum.INPUT_PARAMETER or e.type == bl.FlowEdgeTypeEnum.OUTPUT_PARAMETER or e.targetRef in execution_path):
                            execution_path.append(e.id)
                            execution_path.append(e.targetRef)
                            prevNode = e.targetRef
                            targetFound =True
                            break
                if not targetFound:
                    break
                            
                
            fault_nodes.append(bl.FaultNode(uuid=uuid.uuid4(), fault_type=bl.FaultTypeEnum.TIME_DEADLINE, fault_category=bl.FaultCategoryEnum.TIME, processRef=processRef ,execution_path=[str(x) for x in execution_path]))
            fault_edges.append(bl.FlowEdge(type=bl.FlowEdgeTypeEnum.FAULT_FLOW, id=f"Fault edge {i}", name=f"fault edge {i}", sourceRef=execution_path[0], targetRef=fault_nodes[-1].uuid))

        return fault_nodes, fault_edges

    def __init__(self, nodesNum, subprocesses=False, s=0):

        # Set the random seed for reproducibility
        rd.seed(s)

        process_node = bl.FlowNode(id="WF111-Pick", name='WF111-Pick', uuid=uuid.uuid4(), type=bl.FlowNodeTypeEnum.PROCESS)
        start = bl.FlowNode(id="Start WF111-Pick", name="Start WF111-Pick", uuid=uuid.uuid4(), type=bl.FlowNodeTypeEnum.EVENT_START)

        end = bl.FlowNode(id="End WF111-Pick", name="End WF111-Pick", uuid=uuid.uuid4(), type=bl.FlowNodeTypeEnum.EVENT_END)


        self.nodes = [process_node]

        self.process_nodes = [start,end]
        self.process_edges = []

        subProcess_nodes_all = []
        subProcess_edges_all = []

        cycle_edges_all = []
        cycle_nodes_all =  []

        self.io_binding_nodes = []
        self.io_binding_edges = []

        self.node_types = list(bl.FlowNodeTypeEnum)
        self.node_types.remove(bl.FlowNodeTypeEnum.PROCESS)
        


        if subprocesses:
            self.node_types = [bl.FlowNodeTypeEnum.SUBPROCESS]

        # Randomly select the node types and add IO bindings, cycles and subprocesses as those aren't trivial
        for i in range(0,nodesNum):
            chosen_type = rd.choice(self.node_types)
            node = bl.FlowNode(uuid=uuid.uuid4(), id=f'node {i}',name=f'node {i}', type=chosen_type)
            if rd.randint(0,10) == 0:
                self.addIOBindings(node)

            if rd.randint(0, 20) == 0:
                cycle_nodes,  cycle_edges = self.addCycle(node, self.process_nodes)
                cycle_nodes_all+=cycle_nodes
                cycle_edges_all+=cycle_edges

            self.process_nodes.insert(i+1, node)
            if chosen_type == bl.FlowNodeTypeEnum.SUBPROCESS or chosen_type == bl.FlowNodeTypeEnum.SUB_PROCESS or chosen_type == bl.FlowNodeTypeEnum.SUB_PROCESS_ADHOC:
                subProcess_nodes, subProcess_edges = self.addSubProcesses(node)
                subProcess_edges_all += subProcess_edges
                subProcess_nodes_all+= subProcess_nodes


            self.process_edges.append(bl.FlowEdge(id=f"Edge {i}", type=bl.FlowEdgeTypeEnum.SEQUENCE_FLOW, sourceRef=self.process_nodes[i].uuid, targetRef=self.process_nodes[i+1].uuid))



        self.process_edges.append(bl.FlowEdge(id=f"Edge End", type=bl.FlowEdgeTypeEnum.SEQUENCE_FLOW, sourceRef=self.process_nodes[-2].uuid, targetRef=self.process_nodes[-1].uuid)) 

        self.nodes += self.process_nodes + subProcess_nodes_all + self.io_binding_nodes +cycle_nodes_all

        self.edges = [bl.FlowEdge(id="Edge 1", type=bl.FlowEdgeTypeEnum.PROCESS_FLOW, sourceRef=self.nodes[0].uuid, targetRef=self.nodes[1].uuid)] + self.process_edges + subProcess_edges_all + self.io_binding_edges +cycle_edges_all

        fault_nodes, fault_edges = self.addFaults()

        self.nodes+=fault_nodes
        self.edges+=fault_edges

        model = bl.BLModel(edges=self.edges, nodes=self.nodes)

        with open('bp-attacks/src/wf111.json', 'w', encoding='utf-8') as f:
            json.dump(json.loads(model.json(exclude_none=True)), f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    CreateBLModel(100)