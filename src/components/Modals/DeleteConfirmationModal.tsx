import React from 'react';
import { X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName = 'Process_Name'
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 backdrop-blur-xs z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <div className="absolute top-4 right-4">
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 pt-10 text-center">
            <h2 className="text-xl font-medium mb-4">
              "Are You Sure You Want To Delete '{itemName}'?"
            </h2>
            <p className="text-red-500 mb-8">You Cannot Undo This Step</p>
            
            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                No
              </button>
              <button
                onClick={onConfirm}
                className="px-6 py-2 bg-white text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteConfirmationModal;