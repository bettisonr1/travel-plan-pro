import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tripService from '../services/tripService';
import InteractiveTripCalendar from './InteractiveTripCalendar';
import Card from './Card';
import Button from './Button';
import TripModal from './TripModal';
import ManageUsersModal from './ManageUsersModal';
import AvatarGroup from './AvatarGroup';
import PlanMode from './PlanMode';

const MyTrips = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageUsersModalOpen, setIsManageUsersModalOpen] = useState(false);
  const [showPlanMode, setShowPlanMode] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

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

  // Filter and sort trips
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const upcomingTrips = trips
    .filter(trip => new Date(trip.endDate) >= now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  const pastTrips = trips
    .filter(trip => new Date(trip.endDate) < now)
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate)); // Most recent past trip first

  const displayedTrips = activeTab === 'upcoming' ? upcomingTrips : pastTrips;

  if (loading && trips.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center">
        <Button onClick={() => setIsModalOpen(true)} variant="primary">
          New Trip
        </Button>
      </div>

      {trips.length > 0 && <InteractiveTripCalendar trips={trips} />}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'upcoming'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'past'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Past
          </button>
        </nav>
      </div>

      {displayedTrips.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {activeTab === 'upcoming' 
              ? "No upcoming trips. Start planning your next adventure!" 
              : "No past trips found."}
          </p>
          {activeTab === 'upcoming' && (
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className="mt-4"
            >
              Create Your First Trip
            </Button>
          )}
        </Card>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {displayedTrips.map((trip) => (
              <li key={trip._id}>
                <div 
                  className="block hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out"
                  onClick={() => navigate(`/trips/${trip._id}`)}
                >
                  <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center truncate">
                      <div className="flex-shrink-0 mr-4 w-16 h-16 flex items-center justify-center">
                        {trip.thumbnailUrl ? (
                            <img 
                              src={`http://localhost:5001${trip.thumbnailUrl}`} 
                              alt={trip.destination} 
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        )}
                      </div>
                      <div className="truncate">
                        <p className="text-lg font-medium truncate" style={{ color: trip.color || '#2563EB' }}>{trip.destination}</p>
                        <p className="text-sm text-gray-500">
                           {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                       <div className="mr-4">
                           <AvatarGroup 
                             users={trip.users} 
                             onClick={() => {
                               setSelectedTrip(trip); 
                               setIsManageUsersModalOpen(true);
                             }}
                           />
                       </div>
                       <div>
                           <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                               <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                           </svg>
                       </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
      
      {showPlanMode && <PlanMode onClose={() => setShowPlanMode(false)} />}
    </div>
  );
};

export default MyTrips;
