import React, { useState } from 'react';
import Button from './Button';
import tripService from '../services/tripService';

const CATEGORIES = [
  'Adventure', 'Relaxation', 'Culture', 'Food & Drink', 
  'Nature', 'History', 'Shopping', 'Entertainment'
];

const TripModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    description: '',
    pointsOfInterest: [],
    color: '#3B82F6',
  });
  const [freeformInput, setFreeformInput] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (category) => {
    setFormData((prev) => {
      const current = prev.pointsOfInterest || [];
      if (current.includes(category)) {
        return { ...prev, pointsOfInterest: current.filter((c) => c !== category) };
      } else {
        return { ...prev, pointsOfInterest: [...current, category] };
      }
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const payload = activeTab === 'create' ? { freeformInput } : formData;
      const result = await tripService.suggest(payload);
      if (result.success) {
        setFormData((prev) => ({
          ...prev,
          destination: result.data.destination,
          description: result.data.description,
          startDate: result.data.startDate || prev.startDate,
          endDate: result.data.endDate || prev.endDate,
          pointsOfInterest: result.data.categories,
          color: result.data.color || prev.color,
        }));
        setActiveTab('advanced');
      }
    } catch (error) {
      console.error('Generation failed', error);
      // Could add toast notification here
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ destination: '', startDate: '', endDate: '', description: '', pointsOfInterest: [], color: '#3B82F6' });
    setFreeformInput('');
    setActiveTab('create');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="relative w-full max-w-md mx-auto my-6 z-50">
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-solid border-gray-300 rounded-t">
            <h3 className="text-2xl font-semibold">New Trip</h3>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-black float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
              onClick={onClose}
            >
              <span className="text-gray-500 h-6 w-6 text-2xl block outline-none focus:outline-none">×</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === 'create'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('create')}
            >
              Create
            </button>
            <button
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === 'advanced'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('advanced')}
            >
              Advanced
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="relative p-6 flex-auto max-h-[60vh] overflow-y-auto">
              
              {activeTab === 'create' ? (
                 <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="freeformInput">
                      Tell us about your trip
                    </label>
                    <textarea
                      name="freeformInput"
                      id="freeformInput"
                      rows="5"
                      value={freeformInput}
                      onChange={(e) => setFreeformInput(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="e.g. A weekend in Paris next May focused on art and food..."
                    ></textarea>
                    <p className="text-sm text-gray-500 mt-2">
                        We'll automatically extract the destination, dates, and suggest categories for you.
                    </p>
                 </div>
              ) : (
                <>
                  {/* Common Fields */}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="destination">
                      Destination
                    </label>
                    <input
                      type="text"
                      name="destination"
                      id="destination"
                      required
                      value={formData.destination}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Where are you going?"
                    />
                  </div>
                  <div className="mb-4 flex space-x-4">
                    <div className="w-1/2">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        id="startDate"
                        required
                        value={formData.startDate}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endDate">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        id="endDate"
                        required
                        value={formData.endDate}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                      Describe your trip
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Tell us more about your planning..."
                    ></textarea>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="color">
                        Trip Color
                    </label>
                    <div className="flex items-center space-x-2">
                        <input
                            type="color"
                            name="color"
                            id="color"
                            value={formData.color}
                            onChange={handleChange}
                            className="h-10 w-20 p-1 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-gray-500 text-sm">Select a color for your trip</span>
                    </div>
                  </div>
    
                  <div className="mt-6 border-t pt-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Points of Interest
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map((category) => (
                        <label key={category} className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                            checked={formData.pointsOfInterest.includes(category)}
                            onChange={() => handleCategoryToggle(category)}
                          />
                          <span className="ml-2 text-gray-700">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-solid border-gray-300 rounded-b">
               <div>
                  {activeTab === 'create' && (
                    <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={handleGenerate}
                        disabled={isGenerating || !freeformInput.trim()}
                        className="mr-2 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
                    >
                        {isGenerating ? 'Generating...' : '✨ Generate with AI'}
                    </Button>
                  )}
               </div>
              <div className="flex">
                <Button variant="secondary" onClick={onClose} className="mr-2">
                  Cancel
                </Button>
                {activeTab === 'advanced' && (
                    <Button type="submit" variant="primary">
                      Create Trip
                    </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TripModal;