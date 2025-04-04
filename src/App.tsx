import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/Auth/LoginPage';
import WorkflowList from './components/Workflow/WorkflowList';
import WorkflowEditor from './components/Workflow/WorkflowEditor';
import WorkflowExecution from './components/Workflow/WorkflowExecution';
import { useAuth } from './hooks/useAuth';
import { initWorkflowsListener } from './hooks/useWorkflows';

function App() {
  const { isAuthenticated, loading, user } = useAuth();
  const [listenerInitialized, setListenerInitialized] = useState(false);
  
  useEffect(() => {
    // Setup workflow listener when authenticated
    let unsubscribe: (() => void) | undefined;
    
    if (isAuthenticated && user && !listenerInitialized) {
      console.log('Setting up workflows listener for user:', user.uid);
      unsubscribe = initWorkflowsListener();
      setListenerInitialized(true);
    }
    
    // Cleanup listener on unmount or when auth state changes
    return () => {
      if (unsubscribe) {
        console.log('Cleaning up workflows listener');
        unsubscribe();
      }
    };
  }, [isAuthenticated, user, listenerInitialized]);
  
  // Show loading indicator while auth state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/workflows" />} />
        <Route 
          path="/workflows" 
          element={
            isAuthenticated ? (
              <>
                <WorkflowList />
              </>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/workflows/new" 
          element={
            isAuthenticated ? (
              <>
                <WorkflowEditor />
              </>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/workflows/:id/edit" 
          element={
            isAuthenticated ? (
              <>
                <WorkflowEditor />
              </>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/workflows/:id/execute" 
          element={
            isAuthenticated ? (
              <>
                <WorkflowExecution />
              </>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route path="/" element={<Navigate to="/workflows" />} />
      </Routes>
    </Router>
  );
}

export default App;