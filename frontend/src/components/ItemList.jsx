import React, { useEffect, useState } from 'react';
import itemService from '../services/itemService';
import Button from './Button';
import Card from './Card';
import { Loader2, Trash2, Plus } from 'lucide-react';

const ItemList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemService.getAll();
      setItems(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch items. Is the backend running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemDesc) return;

    try {
      await itemService.create({ name: newItemName, description: newItemDesc });
      setNewItemName('');
      setNewItemDesc('');
      fetchItems();
    } catch (err) {
      setError('Failed to create item');
    }
  };

  const handleDelete = async (id) => {
    try {
      await itemService.delete(id);
      fetchItems();
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card title="Add New Item">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Item name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={newItemDesc}
              onChange={(e) => setNewItemDesc(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Item description"
            />
          </div>
          <Button type="submit" className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </form>
      </Card>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card
            key={item._id}
            title={item.name}
            footer={
              <Button
                variant="danger"
                onClick={() => handleDelete(item._id)}
                className="flex items-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            }
          >
            <p className="text-gray-600">{item.description}</p>
            <p className="text-xs text-gray-400 mt-4">
              Created: {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </Card>
        ))}
      </div>

      {items.length === 0 && !loading && (
        <p className="text-center text-gray-500 py-10">No items found. Add one above!</p>
      )}
    </div>
  );
};

export default ItemList;
