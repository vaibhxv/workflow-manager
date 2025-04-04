import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeProps,
  Handle,
  Position,
} from 'react-flow-renderer';
import { ArrowLeft, Save, Trash2, Plus, Database } from 'lucide-react';
import { useWorkflows } from '../../hooks/useWorkflows';
import { useAuth } from '../../hooks/useAuth'; // Import useAuth
import { FlowNode, Workflow } from '../../types/workflow';

// Custom node components remain unchanged
const TaskNode = ({ data }: NodeProps) => (
  <div className="p-4 border-2 border-blue-500 rounded-md bg-blue-50 w-48">
    <div className="font-bold mb-2">{data.label}</div>
    <div className="text-xs">{data.description}</div>
    <Handle type="target" position={Position.Top} />
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const APINode = ({ data }: NodeProps) => (
  <div className="p-4 border-2 border-green-500 rounded-md bg-green-50 w-48">
    <div className="flex items-center font-bold mb-2">
      <Database size={16} className="mr-1" />
      {data.label}
    </div>
    <div className="text-xs mb-2">{data.endpoint}</div>
    <div className="text-xs">{data.description}</div>
    <Handle type="target" position={Position.Top} />
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const DecisionNode = ({ data }: NodeProps) => (
  <div className="p-4 border-2 border-yellow-500 rounded-md bg-yellow-50 w-48">
    <div className="font-bold mb-2">{data.label}</div>
    <div className="text-xs">{data.condition}</div>
    <Handle type="target" position={Position.Top} />
    <Handle type="source" position={Position.Right} id="true" />
    <Handle type="source" position={Position.Bottom} id="false" />
  </div>
);

// Node types mapping
const nodeTypes = {
  task: TaskNode,
  api: APINode,
  decision: DecisionNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'task',
    position: { x: 250, y: 100 },
    data: { label: 'Start', description: 'Start of workflow' },
  },
];

export default function WorkflowEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user
  const { addWorkflow, updateWorkflow, getWorkflow } = useWorkflows();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [name, setName] = useState('New Workflow');
  const [description, setDescription] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nextNodeId, setNextNodeId] = useState(2);
  const [apiEndpoints] = useState([
    'https://fake-json-api.mock.beeceptor.com/users',
    'https://fake-json-api.mock.beeceptor.com/companies',
    'https://dummy-json.mock.beeceptor.com/todos',
    'https://dummy-json.mock.beeceptor.com/posts',
    'https://dummy-json.mock.beeceptor.com/continents',
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load workflow data if editing an existing workflow
  useEffect(() => {
    if (id) {
      const workflow = getWorkflow(id);
      if (workflow) {
        setName(workflow.name);
        setDescription(workflow.description || '');
        setNodes(workflow.nodes || initialNodes);
        setEdges(workflow.edges || []);
        
        // Find the highest node ID and set nextNodeId accordingly
        const highestId = workflow.nodes?.reduce((max, node) => {
          const nodeId = parseInt(node.id);
          return nodeId > max ? nodeId : max;
        }, 0);
        
        setNextNodeId(highestId ? highestId + 1 : 2);
      } else {
        console.error(`Workflow with ID ${id} not found`);
        setError('Workflow not found');
      }
    }
  }, [id, getWorkflow]);
  
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, []);
  
  const onNodesChange = useCallback((changes: any) => {
    setNodes((nds) => {
      const newNodes = [...nds];
      changes.forEach((change: any) => {
        if (change.type === 'position' && change.dragging) {
          const index = newNodes.findIndex((node) => node.id === change.id);
          if (index !== -1) {
            newNodes[index] = {
              ...newNodes[index],
              position: {
                x: change.position.x,
                y: change.position.y,
              },
            };
          }
        }
      });
      return newNodes;
    });
  }, []);
  
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);
  
const saveWorkflow = async () => {
  if (!user) {
    setError('You must be logged in to save workflows');
    return;
  }
  
  try {
    setSaving(true);
    setError(null);
    
    // Function to remove undefined values recursively
    const sanitizeData = (obj:any) => {
      const newObj: Record<string, any> = {};
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
          if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            newObj[key] = sanitizeData(obj[key]);
          } else if (Array.isArray(obj[key])) {
            newObj[key] = obj[key].map(item => 
              (item && typeof item === 'object') ? sanitizeData(item) : item
            );
          } else {
            newObj[key] = obj[key];
          }
        }
      });
      return newObj;
    };
    
    // Sanitize nodes and edges to remove undefined values
    const sanitizedNodes = nodes.map(node => sanitizeData(node)) as FlowNode[];
    const sanitizedEdges = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      ...sanitizeData(edge),
    }));
    
    // Only include required fields for the workflow
    const workflowData: Omit<Workflow, "id"> = {
      name,
      description,
      nodes: sanitizedNodes,
      edges: sanitizedEdges,
      status: 'Draft',
      userId: user.uid,
      lastEditedBy: user.uid,
      lastEditedOn: new Date().toISOString(),
    };
    
    if (id) {
      // Update existing workflow
      await updateWorkflow(id, workflowData);
      console.log('Workflow updated successfully');
    } else {
      // Create new workflow
      const newId = await addWorkflow(workflowData);
      console.log('Workflow created successfully with ID:', newId);
    }
    
    navigate('/workflows');
  } catch (err) {
    console.error('Error saving workflow:', err);
    setError(err instanceof Error ? err.message : 'Failed to save workflow');
  } finally {
    setSaving(false);
  }
};
  
  const addNode = (type: string) => {
    const newNode: Node = {
      id: nextNodeId.toString(),
      type,
      position: { x: 250, y: 200 },
      data: { 
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nextNodeId}`,
        description: type === 'api' ? 'API call' : type === 'decision' ? 'Condition check' : 'Task description',
        endpoint: type === 'api' ? apiEndpoints[0] : undefined,
        condition: type === 'decision' ? 'condition === true' : undefined,
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    setNextNodeId((id) => id + 1);
  };
  
  const deleteNode = () => {
    if (selectedNodeId) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
      setEdges((eds) => eds.filter(
        (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId
      ));
      setSelectedNodeId(null);
    }
  };
  
  const updateSelectedNode = (key: string, value: any) => {
    if (selectedNodeId) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                [key]: value,
              },
            };
          }
          return node;
        })
      );
    }
  };
  
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  
  // Display error if workflow not found
  if (id && error === 'Workflow not found') {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Workflow not found. <a href="/workflows" className="underline">Return to workflows</a>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/workflows')}
            className="mr-4 p-2 hover:bg-gray-100 rounded"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xl font-bold border-b border-transparent focus:border-gray-300 focus:outline-none"
              placeholder="Workflow Name"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm text-gray-500 border-b border-transparent focus:border-gray-300 focus:outline-none"
              placeholder="Add workflow description..."
            />
          </div>
        </div>
        <div>
          {error && (
            <div className="text-red-500 mr-4 text-sm">{error}</div>
          )}
          <button
            onClick={saveWorkflow}
            disabled={saving}
            className={`flex items-center ${
              saving
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            } px-4 py-2 rounded-md`}
          >
            <Save size={16} className="mr-2" /> 
            {saving ? 'Saving...' : 'Save Workflow'}
          </button>
        </div>
      </div>
      
      {/* Main content - remainder is the same */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-bold">Add Node</h3>
            <div className="mt-2 space-y-2">
              <button
                onClick={() => addNode('task')}
                className="w-full flex items-center p-2 hover:bg-gray-200 rounded"
              >
                <Plus size={16} className="mr-2" /> Task
              </button>
              <button
                onClick={() => addNode('api')}
                className="w-full flex items-center p-2 hover:bg-gray-200 rounded"
              >
                <Plus size={16} className="mr-2" /> API Call
              </button>
              <button
                onClick={() => addNode('decision')}
                className="w-full flex items-center p-2 hover:bg-gray-200 rounded"
              >
                <Plus size={16} className="mr-2" /> Decision
              </button>
            </div>
          </div>
          
          {/* Node properties */}
          {selectedNode && (
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Node Properties</h3>
                <button
                  onClick={deleteNode}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Label</label>
                  <input
                    type="text"
                    value={selectedNode.data.label}
                    onChange={(e) => updateSelectedNode('label', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                {selectedNode.type === 'task' && (
                  <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea
                      value={selectedNode.data.description}
                      onChange={(e) => updateSelectedNode('description', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                    />
                  </div>
                )}
                
                {selectedNode.type === 'api' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium">API Endpoint</label>
                      <select
                        value={selectedNode.data.endpoint}
                        onChange={(e) => updateSelectedNode('endpoint', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        {apiEndpoints.map((endpoint) => (
                          <option key={endpoint} value={endpoint}>
                            {endpoint}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Description</label>
                      <textarea
                        value={selectedNode.data.description}
                        onChange={(e) => updateSelectedNode('description', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                      />
                    </div>
                  </>
                )}
                
                {selectedNode.type === 'decision' && (
                  <div>
                    <label className="block text-sm font-medium">Condition</label>
                    <textarea
                      value={selectedNode.data.condition}
                      onChange={(e) => updateSelectedNode('condition', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Flow Editor */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <Background color="#aaa" gap={16} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}