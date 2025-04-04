import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, MoreVertical, ChevronDown, Menu, X, Building2, User, LogOut } from 'lucide-react';
import { useWorkflows, initWorkflowsListener } from '../../hooks/useWorkflows';
import { useAuth } from '../../hooks/useAuth';
import { Workflow } from '../../types/workflow';
import React from 'react';

export default function WorkflowList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { workflows, loading, error, fetchWorkflows, deleteWorkflow } = useWorkflows();
  const { user, logout } = useAuth();
  const [expandedWorkflowId, setExpandedWorkflowId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Load workflows when component mounts
  useEffect(() => {
    console.log("Setting up workflows data");
    
    // Start by fetching data immediately
    fetchWorkflows().catch(err => {
      console.error("Error fetching initial workflows:", err);
    });
    
    // Then set up the real-time listener
    const unsubscribe = initWorkflowsListener();
    
    // Clean up listener on unmount
    return () => {
      unsubscribe();
    };
  }, [fetchWorkflows]);

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination values
  const totalPages = Math.ceil(filteredWorkflows.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentWorkflows = filteredWorkflows.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteWorkflow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      deleteWorkflow(id);
    }
  };

  // Toggle expanded workflow
  const toggleExpandWorkflow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedWorkflowId(prev => prev === id ? null : id);
  };

  // Pagination controls
  const goToPage = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if there are 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate middle pages
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if at edges
      if (currentPage <= 2) {
        endPage = 4;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 3;
      }
      
      // Add ellipsis before middle pages if needed
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis after middle pages if needed
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Helper function to determine status tag for a workflow
  const StatusTag = ({ workflow }: { workflow: Workflow }) => {
    // Get the latest execution status if available
    const getLatestStatus = () => {
      if (!workflow.executions || workflow.executions.length === 0) {
        return workflow.status || 'pending';
      }
      
      // Sort executions by timestamp in descending order and get the latest one
      const sortedExecutions = [...workflow.executions].sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      return sortedExecutions[0].status || 'pending';
    };
    
    const latestStatus = getLatestStatus();
  
    const statusColors = {
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-blue-100 text-blue-800',
    };
  
    return (
      <div className="relative">
        <div
          className={`px-2.5 py-0.5 rounded-full text-xs ${statusColors[latestStatus as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}
        >
          {latestStatus.charAt(0).toUpperCase() + latestStatus.slice(1)}
        </div>
      </div>
    );
  };

  // ExecutionStatus component for execution history items
  const ExecutionStatus = ({ status }: { status: string }) => {
    const statusClass = status === 'Passed' || status === 'success' ? 
      'bg-green-100 text-green-800 border border-green-200' : 
      'bg-red-100 text-red-800 border border-red-200';
    
    return (
      <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
        {status === 'success' ? 'Passed' : status}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading workflows...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-yellow-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-red-600 text-xl font-bold mb-4">Error Loading Workflows</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => fetchWorkflows()}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-yellow-50">
      {/* Sidebar - hidden by default */}
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out z-20`}>
        <div className="h-16 flex items-center px-4 border-b">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-red-500" />
            <span className="ml-2 text-xl font-bold">HighBridge</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="ml-auto p-2 text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="pt-5">
          <a
            href="/workflows"
            className="bg-red-50 border-l-4 border-red-500 text-red-700 block pl-4 pr-4 py-2 text-base font-medium"
          >
            Workflows
          </a>
        </nav>
        <div className={`absolute bottom-0 w-full border-t border-gray-200`}>
          <div className="p-4">
            <div className="flex items-center">
              <User className="h-10 w-10 rounded-full bg-gray-200 p-1" />
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800 truncate">{user?.email}</div>
                <div className="text-sm font-medium text-gray-500">User</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <a
                href="#"
                onClick={handleLogout}
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded flex items-center"
              >
                <LogOut size={16} className="mr-2" /> Sign out
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 flex ${sidebarOpen ? 'opacity-25' : ''} flex-col`}>
        {/* Top bar */}
        <div className="h-16 flex items-center px-4">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-4 text-xl font-bold">Workflow Builder</h1>
        </div>

        {/* Main content area */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            {/* Search Bar */}
            <div className="relative w-2/3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search By Workflow Name/ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Create Button */}
            <button
              onClick={() => navigate('/workflows/new')}
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
            >
              + Create New Process
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-yellow-500">
                  <th className="text-left p-4 font-medium">Workflow Name</th>
                  <th className="text-left p-4 font-medium">ID</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Last Edited On</th>
                  <th className="text-left p-4 font-medium">Description</th>
                  <th className="text-center p-4"></th>
                  <th className="text-center p-4"></th>
                  <th className="text-center p-4"></th>
                  <th className="text-center p-4"></th>
                </tr>
              </thead>
              <tbody>
                {currentWorkflows.length > 0 ? (
                  currentWorkflows.map((workflow) => (
                    <React.Fragment key={workflow.id}>
                      <tr 
                        className={`hover:bg-gray-50 cursor-pointer ${expandedWorkflowId === workflow.id ? 'bg-gray-50' : ''}`}
                        onClick={(e) => toggleExpandWorkflow(workflow.id, e)}
                      >
                        <td className="p-4 font-medium">{workflow.name || 'Unnamed Workflow'}</td>
                        <td className="p-4 text-gray-500">#{workflow.id}</td>
                        <td className="p-4">
                          <StatusTag workflow={workflow} />
                        </td>
                        <td className="p-4 text-gray-500">
                          {workflow.lastEditedBy} | {new Date(workflow.lastEditedOn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST - {new Date(workflow.lastEditedOn).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' })}
                        </td>
                        <td className="p-4 text-gray-500 truncate max-w-xs">{workflow.description || 'No description'}</td>
                        <td className="p-2 text-center">
                          <button className="text-yellow-500">
                            <Star size={18} />
                          </button>
                        </td>
                        <td className="p-1 text-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/workflows/${workflow.id}/execute`);
                            }}
                            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            Execute
                          </button>
                        </td>
                        <td className="p-1 text-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/workflows/${workflow.id}/edit`);
                            }}
                            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            Edit
                          </button>
                        </td>
                        <td className="p-1 text-center">
                          <button 
                            onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            Delete
                          </button>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                            <button className="text-gray-500">
                              <MoreVertical size={18} />
                            </button>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <ChevronDown 
                              className={`transition-transform duration-300 ${expandedWorkflowId === workflow.id ? 'rotate-180' : ''}`} 
                              size={18} 
                            />
                          </button>
                        </td>
                      </tr>
                      {expandedWorkflowId === workflow.id && (
                        <tr className="border-t border-gray-100">
                          <td colSpan={11} className="p-0">
                            <div className="bg-gray-50 overflow-hidden transition-all duration-300">
                              <div className="p-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4">Execution History</h3>
                                {workflow.executions?.length ? (
                                  <div className="space-y-3">
                                    {workflow.executions.map((execution, index) => (
                                      <div 
                                        key={execution.id || index} 
                                        className="flex items-center py-2"
                                      >
                                        <div className="relative flex items-center">
                                          <div className="h-3 w-3 rounded-full bg-red-500 mr-4"></div>
                                          {index !== (workflow.executions ?? []).length - 1 && (
                                            <div className="absolute h-6 w-0.5 bg-gray-300 top-3 left-1.5"></div>
                                          )}
                                        </div>
                                        <div className="text-gray-700">
                                          {execution.timestamp ? 
                                            new Date(execution.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' }) + ' - ' + 
                                            new Date(execution.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST' : 
                                            '28/05 - 22:43 IST'}
                                        </div>
                                        <div className="ml-6">
                                          <ExecutionStatus status={execution.status || (index % 2 === 0 ? 'Passed' : 'Failed')} />
                                        </div>
                                        <button 
                                          className="ml-6 text-gray-500"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                          </svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-sm">No executions yet</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-gray-500">
                      {searchTerm ? (
                        <p>No workflows found matching your search criteria.</p>
                      ) : (
                        <div>
                          <p className="mb-4">You don't have any workflows yet.</p>
                          <button
                            onClick={() => navigate('/workflows/new')}
                            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                          >
                            Create your first workflow
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {filteredWorkflows.length > 0 && (
              <div className="mt-6 flex justify-between items-center px-4 mb-2">
                <div className="text-sm text-gray-500">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredWorkflows.length)} of {filteredWorkflows.length} workflows
                </div>
                <nav className="flex items-center">
                  <button 
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <span className="sr-only">Previous</span>
                    &lt;
                  </button>
                  
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="mx-1">...</span>
                    ) : (
                      <button
                        key={`page-${page}`}
                        onClick={() => typeof page === 'number' && goToPage(page)}
                        className={`mx-1 px-3 py-1 rounded-md ${currentPage === page ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                  
                  <button 
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <span className="sr-only">Next</span>
                    &gt;
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Overlay to close sidebar when clicking outside */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-opacity-30 z-10"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}