import React, { useState, useEffect } from 'react';
import tripService from '../services/tripService';
import Card from './Card';
import Button from './Button';
import TripModal from './TripModal';
import ManageUsersModal from './ManageUsersModal';
import AvatarGroup from './AvatarGroup';

const MyTrips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageUsersModalOpen, setIsManageUsersModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await tripService.getAll();
      setTrips(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch trips');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleCreateTrip = async (tripData) => {
    try {
      await tripService.create(tripData);
      setIsModalOpen(false);
      fetchTrips();
    } catch (err) {
      console.error('Failed to create trip', err);
      alert('Failed to create trip. Please try again.');
    }
  };

  const handleAddUser = async (tripId, userId) => {
    try {
      const updatedTripResponse = await tripService.addUser(tripId, userId);
      // Update local state to reflect changes immediately
      setTrips(trips.map(t => t._id === tripId ? updatedTripResponse.data : t));
      if (selectedTrip && selectedTrip._id === tripId) {
          setSelectedTrip(updatedTripResponse.data);
      }
    } catch (err) {
      console.error('Failed to add user to trip', err);
      alert('Failed to add user. Please try again.');
    }
  };

  const handleRemoveUser = async (tripId, userId) => {
      if (!window.confirm('Are you sure you want to remove this user?')) return;
      try {
        const updatedTripResponse = await tripService.removeUser(tripId, userId);
        setTrips(trips.map(t => t._id === tripId ? updatedTripResponse.data : t));
        if (selectedTrip && selectedTrip._id === tripId) {
            setSelectedTrip(updatedTripResponse.data);
        }
      } catch (err) {
        console.error('Failed to remove user from trip', err);
        alert('Failed to remove user. Please try again.');
      }
  };

  if (loading && trips.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">My Trips</h2>
        <Button onClick={() => setIsModalOpen(true)} variant="primary">
          New Trip
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {trips.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500 text-lg">No trips found. Start planning your first adventure!</p>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="outline"
            className="mt-4"
          >
            Create Your First Trip
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <Card
              key={trip._id}
              title={trip.destination}
              footer={
                <div className="flex justify-between items-center w-full">
                  <div className="text-sm text-gray-500">
                    Created on {new Date(trip.createdAt).toLocaleDateString()}
                  </div>
                  <AvatarGroup 
                    users={trip.users} 
                    onClick={() => {
                      setSelectedTrip(trip);
                      setIsManageUsersModalOpen(true);
                    }}
                  />
                </div>
              }
            >
              <div className="space-y-2">
                <div className="flex items-center text-gray-600">
                  <span className="font-semibold mr-2">Dates:</span>
                  {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                </div>
                {trip.description && (
                  <p className="text-gray-600 italic">
                    "{trip.description}"
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <TripModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTrip}
      />

      <ManageUsersModal
        isOpen={isManageUsersModalOpen}
        onClose={() => setIsManageUsersModalOpen(false)}
        trip={selectedTrip}
        onAddUser={handleAddUser}
        onRemoveUser={handleRemoveUser}
      />
    </div>
  );
};

export default MyTrips;
