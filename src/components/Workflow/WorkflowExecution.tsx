import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Check, X, Loader } from 'lucide-react';
import { useWorkflows } from '../../hooks/useWorkflows';
import { Execution } from '../../types/workflow';

type LogEntry = {
  id: string;
  status: string;
  message: string;
  timestamp: string;
};

export default function WorkflowExecution() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<any>(null);
  const [executing, setExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<LogEntry[]>([]);
  const [executionStatus, setExecutionStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const { getWorkflow, updateWorkflow } = useWorkflows();
  // Use a ref to track the complete log
  const logRef = useRef<LogEntry[]>([]);
  
  useEffect(() => {
    if (id) {
      const workflowData = getWorkflow(id);
      if (workflowData) {
        console.log('Loaded workflow:', workflowData);
        setWorkflow(workflowData);
      } else {
        console.error(`Workflow with ID ${id} not found`);
        navigate('/workflows');
      }
    }
  }, [id, getWorkflow, navigate]);
  
  // Update the ref whenever the log state changes
  useEffect(() => {
    logRef.current = executionLog;
  }, [executionLog]);
  
  const executeWorkflow = async () => {
    if (!workflow || !id) return;
    
    setExecuting(true);
    setExecutionStatus('pending');
    setExecutionLog([]);
    logRef.current = [];
    
    // Log the start event
    addToLog('start', 'success', 'Workflow execution started');
    
    try {
      // Process each node in the workflow
      if (workflow.nodes && workflow.nodes.length > 0) {
        for (const node of workflow.nodes) {
          await executeNode(node);
        }
      }
      
      // Log the completion event
      addToLog('complete', 'success', 'Workflow execution completed successfully');
      setExecutionStatus('success');
      
      // Save execution results to Firestore
      try {
        // Create new execution record
        const newExecution: Execution = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          status: 'success',
          logs: [...logRef.current], // Use the ref to get complete logs
        };
        
        // Update only the executions array in the workflow
        const updatedExecutions = [...(workflow.executions || []), newExecution];
        await updateWorkflow(id, { executions: updatedExecutions });
        
        // Update local state with the new execution
        setWorkflow((prev: any) => ({
          ...prev,
          executions: updatedExecutions
        }));
        
        console.log('Execution saved successfully');
      } catch (error) {
        console.error('Failed to save execution:', error);
      }
    } catch (error: any) {
      // Log the error event
      addToLog('error', 'failed', `Workflow execution failed: ${error.message || error}`);
      setExecutionStatus('failed');
      
      // Save failed execution
      try {
        const newExecution: Execution = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          status: 'failed',
          logs: [...logRef.current], // Use the ref to get complete logs
        };
        
        // Update only the executions array
        const updatedExecutions = [...(workflow.executions || []), newExecution];
        await updateWorkflow(id, { executions: updatedExecutions });
        
        // Update local state
        setWorkflow((prev: any) => ({
          ...prev,
          executions: updatedExecutions
        }));
      } catch (saveError) {
        console.error('Failed to save failed execution:', saveError);
      }
    } finally {
      setExecuting(false);
    }
  };
  
  const executeNode = async (node: any) => {
    if (!node) return;
    
    addToLog(node.id, 'pending', `Executing node: ${node.data.label}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Handle different node types
    try {
      if (node.type === 'api') {
        await executeApiNode(node);
      } else if (node.type === 'decision') {
        await executeDecisionNode(node);
      } else {
        // Regular task node
        addToLog(node.id, 'success', `Task "${node.data.label}" executed successfully`);
      }
    } catch (error: any) {
      addToLog(node.id, 'failed', `Error executing node ${node.data.label}: ${error.message || error}`);
      throw error;
    }
  };
  
  const executeApiNode = async (node: any) => {
    try {
      addToLog(node.id, 'pending', `Making API call to ${node.data.endpoint}`);
      
      const response = await fetch(node.data.endpoint);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      addToLog(node.id, 'success', `API call successful. Received ${Object.keys(data).length} items.`);
    } catch (error: any) {
      addToLog(node.id, 'failed', `API call failed: ${error.message || error}`);
      throw error;
    }
  };
  
  const executeDecisionNode = async (node: any) => {
    try {
      addToLog(node.id, 'pending', `Evaluating condition: ${node.data.condition}`);
      
      // Simulate a decision (randomly true or false)
      const result = Math.random() > 0.5;
      
      addToLog(node.id, 'success', `Condition evaluated to ${result}`);
      
      // In a real system, we would follow the appropriate edge based on the result
    } catch (error: any) {
      addToLog(node.id, 'failed', `Decision evaluation failed: ${error.message || error}`);
      throw error;
    }
  };
  
  const addToLog = (id: string, status: string, message: string) => {
    const newLogEntry = {
      id,
      status,
      message,
      timestamp: new Date().toISOString(),
    };
    
    // Update both the state and the ref
    setExecutionLog(current => [...current, newLogEntry]);
    logRef.current = [...logRef.current, newLogEntry];
  };
  
  if (!workflow) {
    return <div className="p-8">Loading workflow...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
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
            <h1 className="text-xl font-bold">{workflow.name}</h1>
            <p className="text-sm text-gray-500">{workflow.description}</p>
          </div>
        </div>
        <div>
          <button
            onClick={executeWorkflow}
            disabled={executing}
            className={`flex items-center px-4 py-2 rounded-md ${
              executing
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {executing ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" /> Executing...
              </>
            ) : (
              <>
                <Play size={16} className="mr-2" /> Execute Workflow
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="container mx-auto py-8 px-4">
        {/* Execution status */}
        {executionStatus && (
          <div className={`mb-6 p-4 rounded-md flex items-center ${
            executionStatus === 'success'
              ? 'bg-green-100 text-green-800'
              : executionStatus === 'failed'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {executionStatus === 'success' ? (
              <Check size={20} className="mr-2" />
            ) : executionStatus === 'failed' ? (
              <X size={20} className="mr-2" />
            ) : (
              <Loader size={20} className="mr-2 animate-spin" />
            )}
            <div>
              {executionStatus === 'success'
                ? 'Workflow executed successfully'
                : executionStatus === 'failed'
                ? 'Workflow execution failed'
                : 'Workflow executing...'}
            </div>
          </div>
        )}
        
        {/* Workflow visualization placeholder */}
        <div className="mb-6 bg-white p-4 rounded-md shadow">
          <h2 className="text-lg font-bold mb-4">Workflow Structure</h2>
          <div className="border border-dashed border-gray-300 rounded p-4 text-center text-gray-500">
            {workflow.nodes?.length ? (
              <p>This workflow has {workflow.nodes.length} nodes and {workflow.edges?.length || 0} connections.</p>
            ) : (
              <p>This workflow is empty.</p>
            )}
          </div>
        </div>
        
        {/* Execution log */}
        <div className="bg-white p-4 rounded-md shadow">
          <h2 className="text-lg font-bold mb-4">Execution Log</h2>
          {executionLog.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {executionLog.map((log, index) => (
                <div
                  key={index}
                  className={`p-2 mb-2 rounded-md ${
                    log.status === 'success'
                      ? 'bg-green-50'
                      : log.status === 'failed'
                      ? 'bg-red-50'
                      : 'bg-blue-50'
                  }`}
                >
                  <div className="flex items-center">
                    {log.status === 'success' ? (
                      <Check size={16} className="mr-2 text-green-500" />
                    ) : log.status === 'failed' ? (
                      <X size={16} className="mr-2 text-red-500" />
                    ) : (
                      <Loader size={16} className="mr-2 text-blue-500" />
                    )}
                    <div className="flex-1">
                      <p>{log.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No execution logs yet. Click "Execute Workflow" to start.</p>
          )}
        </div>
      </div>
    </div>
  );
}