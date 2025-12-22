import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import Button from './Button';

const AddUserModal = ({ isOpen, onClose, onAddUser, tripId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        setLoading(true);
        try {
          const response = await authService.getAllUsers();
          setUsers(response.data);
        } catch (error) {
          console.error('Failed to fetch users', error);
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedUserId) {
      onAddUser(tripId, selectedUserId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add User to Trip</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a user...</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.firstname} {user.lastname} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading || !selectedUserId}>
              Add User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
