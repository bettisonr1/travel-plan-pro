import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import Button from './Button';

const ManageUsersModal = ({ isOpen, onClose, trip, onAddUser, onRemoveUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSearchResults([]);
    }
  }, [isOpen]);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setLoading(true);
        try {
          const response = await authService.searchUsers(searchTerm);
          // Filter out users already in the trip
          const currentIds = trip?.users?.map(u => u._id) || [];
          const filtered = response.data.filter(u => !currentIds.includes(u._id));
          setSearchResults(filtered);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, trip]);

  if (!isOpen || !trip) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Manage Trip Users</h2>
        <p className="text-sm text-gray-500 mb-6">Manage users for <strong>{trip.destination}</strong></p>
        
        {/* Current Users */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Current Users ({trip.users?.length || 0})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {trip.users?.map(user => (
              <div key={user._id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: user.avatarColor || '#3B82F6' }}
                  >
                    {user.firstname?.[0]}{user.lastname?.[0]}
                  </div>
                  <div>
                     <span className="font-medium text-sm block">{user.firstname} {user.lastname}</span>
                     <span className="text-xs text-gray-500 block">{user.email}</span>
                  </div>
                </div>
                <button 
                  onClick={() => onRemoveUser(trip._id, user._id)}
                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                  title="Remove user"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
            {(!trip.users || trip.users.length === 0) && (
              <p className="text-sm text-gray-400 italic">No users in this trip yet.</p>
            )}
          </div>
        </div>

        {/* Add User */}
        <div>
           <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Add User</h3>
           <input
             type="text"
             placeholder="Search by name or email..."
             className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:ring-blue-500 focus:border-blue-500 text-sm"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
           
           {loading ? (
             <div className="text-center text-gray-500 py-4">Searching...</div>
           ) : (
             <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
               {searchResults.map(user => (
                 <div key={user._id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                   <div className="flex items-center gap-2">
                     <div 
                        className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: user.avatarColor || '#3B82F6' }}
                      >
                        {user.firstname?.[0]}{user.lastname?.[0]}
                      </div>
                     <div>
                       <span className="font-medium text-sm block">{user.firstname} {user.lastname}</span>
                       <span className="text-xs text-gray-500 block">{user.email}</span>
                     </div>
                   </div>
                   <Button 
                     onClick={() => {
                        onAddUser(trip._id, user._id);
                        // Search results will update via effect because trip.users changes
                     }}
                     variant="outline"
                     className="text-xs py-1 px-3"
                   >
                     Add
                   </Button>
                 </div>
               ))}
               {searchTerm.length >= 2 && searchResults.length === 0 && (
                 <div className="text-center text-gray-500 text-sm py-2">No users found matching "{searchTerm}"</div>
               )}
               {searchTerm.length < 2 && searchResults.length === 0 && (
                 <div className="text-center text-gray-400 text-sm py-2">Type at least 2 characters to search</div>
               )}
             </div>
           )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="secondary">Done</Button>
        </div>
      </div>
    </div>
  );
};

export default ManageUsersModal;

