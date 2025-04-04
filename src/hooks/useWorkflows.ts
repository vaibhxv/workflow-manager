import create from 'zustand';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  getDocs, 
  onSnapshot,
  Timestamp,
  getDoc,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { Workflow } from '../types/workflow';
import { useAuth } from './useAuth';

interface WorkflowState {
  workflows: Workflow[];
  loading: boolean;
  error: string | null;
  addWorkflow: (workflow: Omit<Workflow, 'id'>) => Promise<string>;
  updateWorkflow: (id: string, workflow: Partial<Workflow>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  getWorkflow: (id: string) => Workflow | undefined;
  fetchWorkflows: () => Promise<void>;
}

export const useWorkflows = create<WorkflowState>((set, get) => ({
  workflows: [],
  loading: true,
  error: null,
  
  addWorkflow: async (workflowData) => {
    try {
      const { user } = useAuth.getState();
      if (!user) throw new Error('User must be authenticated to add workflows');
      
      const workflowWithMeta = {
        ...workflowData,
        userId: user.uid,
        createdBy: user.email,
        createdOn: Timestamp.now(),
        lastEditedBy: user.email,
        lastEditedOn: Timestamp.now(),
        executions: []
      };
      
      const docRef = await addDoc(collection(db, 'workflows'), workflowWithMeta);
      
      // Update state with the new workflow including its id
      const newWorkflow = { id: docRef.id, ...workflowWithMeta } as unknown as Workflow;
      set((state) => ({ 
        workflows: [...state.workflows, newWorkflow] 
      }));
      
      return docRef.id;
    } catch (error: any) {
      console.error('Error adding workflow:', error);
      set({ error: error.message || 'Failed to add workflow' });
      throw error;
    }
  },
  
  updateWorkflow: async (id, workflowUpdates) => {
    try {
      const { user } = useAuth.getState();
      if (!user) throw new Error('User must be authenticated to update workflows');
      
      const docRef = doc(db, 'workflows', id);
      const workflowSnapshot = await getDoc(docRef);
      
      if (!workflowSnapshot.exists()) {
        throw new Error('Workflow not found');
      }
      
      const updates = {
        ...workflowUpdates,
        lastEditedBy: user.email,
        lastEditedOn: Timestamp.now() // Keep as Timestamp object
      };
      
      await setDoc(docRef, updates, { merge: true });
      
      // Update state with the modified workflow
      set((state) => ({
        workflows: state.workflows.map(w => 
          w.id === id ? { ...w, ...updates } : w
        ) as Workflow[]
      }));
    } catch (error: any) {
      console.error('Error updating workflow:', error);
      set({ error: error.message || 'Failed to update workflow' });
      throw error;
    }
  },
  
  deleteWorkflow: async (id) => {
    try {
      await deleteDoc(doc(db, 'workflows', id));
      
      // Update state by removing the deleted workflow
      set((state) => ({
        workflows: state.workflows.filter(w => w.id !== id)
      }));
    } catch (error: any) {
      console.error('Error deleting workflow:', error);
      set({ error: error.message || 'Failed to delete workflow' });
      throw error;
    }
  },
  
  getWorkflow: (id) => {
    return get().workflows.find(w => w.id === id);
  },
  
  fetchWorkflows: async () => {
    try {
      set({ loading: true });
      
      const { user } = useAuth.getState();
      if (!user) {
        console.warn('Cannot fetch workflows: User not authenticated');
        set({ workflows: [], loading: false });
        return;
      }
      
      console.log('Fetching workflows for user:', user.uid);
      
      // Create query
      const q = query(collection(db, 'workflows'), where('userId', '==', user.uid));
      
      // Execute query
      const querySnapshot = await getDocs(q);
      
      const workflowsList: Workflow[] = [];
      
      // Process results
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Timestamp objects to Date objects
        const workflow = {
          ...data,
          id: doc.id,
          createdOn: data.createdOn?.toDate?.() || data.createdOn,
          lastEditedOn: data.lastEditedOn?.toDate?.() || data.lastEditedOn,
          executions: Array.isArray(data.executions) ? data.executions.map((execution: any) => ({
            ...execution,
            timestamp: execution.timestamp?.toDate?.() || execution.timestamp
          })) : []
        } as unknown as Workflow;
        
        workflowsList.push(workflow);
      });
      
      console.log('Workflows fetched:', workflowsList.length);
      
      set({ 
        workflows: workflowsList,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Error fetching workflows:', error);
      set({ 
        error: error.message || 'Failed to fetch workflows',
        loading: false
      });
    }
  }
}));

// Setup firestore data listener with proper query
export const initWorkflowsListener = () => {
  const { user } = useAuth.getState();
  
  if (!user) {
    console.warn('Cannot initialize workflows listener: User not authenticated');
    useWorkflows.setState({ workflows: [], loading: false });
    return () => {}; // Return empty function as unsubscribe
  }
  
  console.log('Initializing workflows listener for user:', user.uid);
  
  // Create query following the example pattern
  const q = query(collection(db, 'workflows'), where('userId', '==', user.uid));
  
  // Set up listener on the query
  const unsubscribe = onSnapshot(q, 
    (querySnapshot) => {
      const workflowsList: Workflow[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Timestamp objects to Date objects
        const workflow = {
          ...data,
          id: doc.id,
          createdOn: data.createdOn?.toDate?.() || data.createdOn,
          lastEditedOn: data.lastEditedOn?.toDate?.() || data.lastEditedOn,
          executions: Array.isArray(data.executions) ? data.executions.map((execution: any) => ({
            ...execution,
            timestamp: execution.timestamp?.toDate?.() || execution.timestamp
          })) : []
        } as unknown as Workflow;
        
        workflowsList.push(workflow);
      });
      
      console.log('Workflows fetched:', workflowsList.length);
      
      useWorkflows.setState({ 
        workflows: workflowsList,
        loading: false,
        error: null
      });
    }, 
    (error) => {
      console.error('Error fetching workflows:', error);
      useWorkflows.setState({ 
        error: error.message || 'Failed to fetch workflows',
        loading: false,
        workflows: [] // Clear workflows on error
      });
    }
  );
  
  return unsubscribe;
};