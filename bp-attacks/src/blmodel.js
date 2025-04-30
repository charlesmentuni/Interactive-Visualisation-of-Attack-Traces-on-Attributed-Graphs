
export const event_types = [
    "endEvent",
    "messageEndEvent",
    "startEvent",
    "timerStartEvent",
    "messageStartEvent",
    "catchEvent",
    "throwEvent",
    "boundaryEvent",
    "intermediateCatchEvent",
    "intermediateThrowEvent"
];

export const gateway_types = [
    "eventBasedGateway",
    "complexGateway",
    "parallelGateway",
    "exclusiveGateway",
    "inclusiveGateway"
] 

export const io_binding_edge_types = [
    "inputParameter",
    "outputParameter",
    "assignment",  
    "dataSource"
    ];

export const data_source_types = ["userForm", 
    "document", 
    "database"];