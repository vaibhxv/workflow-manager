export interface Workflow {
    id: string;
    name: string;
    description: string;
    lastEditedBy: string;
    lastEditedOn: string;
    status: 'success' | 'failed' | 'Draft';
    nodes: FlowNode[];
    edges: Edge[];
    userId: string;
    executions?: Execution[];
  }
  
  export interface FlowNode {
    id: string;
    type: 'start' | 'end' | 'api' | 'email' | 'task';
    position: { x: number; y: number };
    data: {
      label: string;
      [key: string]: any;
    };
  }
  
  export interface Edge {
    id: string;
    source: string;
    target: string;
  }

  export interface Execution {
    id: string;
    timestamp: string;
    status: 'success' | 'failed';
    logs: ExecutionLog[];
  }
  
  export interface ExecutionLog {
    id: string;
    status: string;
    message: string;
    timestamp: string;
  }