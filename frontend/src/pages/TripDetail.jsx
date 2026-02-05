import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import tripService from '../services/tripService';
import Card from '../components/Card';
import CollapsibleCard from '../components/CollapsibleCard';
import Button from '../components/Button';
import ManageUsersModal from '../components/ManageUsersModal';
import TripChat from '../components/TripChat';

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await tripService.getById(id);
        if (response.success) {
          setTrip(response.data);
        } else {
          setError('Failed to load trip details');
        }
      } catch (err) {
        setError('Failed to load trip details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTrip();
    }
  }, [id]);

  const handleAddUser = async (tripId, userId) => {
    try {
      const response = await tripService.addUser(tripId, userId);
      if (response.success) {
        setTrip(response.data);
      }
    } catch (error) {
      console.error('Failed to add user', error);
    }
  };

  const handleRemoveUser = async (tripId, userId) => {
    try {
      const response = await tripService.removeUser(tripId, userId);
      if (response.success) {
        setTrip(response.data);
      }
    } catch (error) {
      console.error('Failed to remove user', error);
    }
  };

  const handleMessagePosted = async (text) => {
    try {
      const response = await tripService.addMessage(trip._id, text);
      if (response.success) {
        setTrip(response.data);
      }
    } catch (error) {
      console.error('Failed to post message', error);
    }
  };

  const handleMessageLiked = async (messageId) => {
    try {
      const response = await tripService.toggleLikeMessage(trip._id, messageId);
      if (response.success) {
        setTrip(response.data);
      }
    } catch (error) {
      console.error('Failed to like message', error);
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!trip) return;
    
    setGeneratingImage(true);
    try {
      // 1. Generate the image
      const imageResponse = await tripService.generateImage({
        destination: trip.destination,
        description: trip.description
      });

      if (imageResponse.success && imageResponse.imageUrl) {
        // 2. Update the trip with the new thumbnail URL
        const updateResponse = await tripService.update(trip._id, {
          thumbnailUrl: imageResponse.imageUrl
        });

        if (updateResponse.success) {
          setTrip(updateResponse.data);
        }
      }
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      // Optional: Add toast or error message state here
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    setGeneratingImage(true);
    try {
        const response = await tripService.uploadImage(trip._id, file);
        if (response.success) {
            setTrip(response.data);
        }
    } catch (error) {
        console.error('Failed to upload image', error);
        alert('Failed to upload image');
    } finally {
        setGeneratingImage(false);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!trip) return <div className="text-center py-10">Trip not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-start">
        <Button onClick={() => navigate('/')} variant="secondary">
          Back to Trips
        </Button>
      </div>

      {trip.thumbnailUrl && (
          <div className="w-full h-64 rounded-xl overflow-hidden shadow-lg relative group">
              <img 
                  src={trip.thumbnailUrl.startsWith('http') ? trip.thumbnailUrl : `http://localhost:5001${trip.thumbnailUrl}`} 
                  alt={trip.destination} 
                  className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <h1 className="absolute bottom-6 left-6 text-4xl font-bold text-white drop-shadow-md">
                {trip.destination}
              </h1>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="absolute top-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Change Image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
          </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/*"
      />

      {/* Header Section (Title + Generate Button) - Only shown if no thumbnail */ }
      {!trip.thumbnailUrl && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold" style={{ color: trip.color || '#111827' }}>{trip.destination}</h1>
            <Button 
              onClick={handleGenerateThumbnail} 
              variant="secondary"
              disabled={generatingImage}
            >
              {generatingImage ? 'Generating...' : 'Generate Thumbnail'}
            </Button>
            <Button 
              onClick={() => fileInputRef.current.click()}
              variant="secondary"
              disabled={generatingImage}
            >
              Upload Image
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {['Overview', 'Attendees', 'AI Assistant', 'To-Do List', 'Message Board'].map((tab) => {
            const tabKey = tab.toLowerCase().replace(/\s+/g, '-');
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tabKey)}
                className={`${
                  activeTab === tabKey
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && (
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Dates</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-gray-900">{trip.description || 'No description provided.'}</p>
              </div>
              {trip.pointsOfInterest && trip.pointsOfInterest.length > 0 && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {trip.pointsOfInterest.map((category) => (
                      <span key={category} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'attendees' && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Trip Attendees</h3>
              <Button onClick={() => setIsManageUsersOpen(true)} variant="primary">
                Manage Attendees
              </Button>
            </div>
            <div className="space-y-4">
              {trip.users && trip.users.map(user => (
                <div key={user._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: user.avatarColor || '#3B82F6' }}
                  >
                    {user.firstname?.[0]}{user.lastname?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.firstname} {user.lastname}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              ))}
              {(!trip.users || trip.users.length === 0) && (
                <p className="text-gray-500 italic">No attendees yet.</p>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'ai-assistant' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TripChat 
                tripId={trip._id} 
                currentUser={JSON.parse(localStorage.getItem('user'))} 
                onTripUpdate={setTrip} 
                initialMessages={trip.messages}
              />
            </div>
            <div className="lg:col-span-1 space-y-4 h-[600px] overflow-y-auto pr-2">
               <div className="sticky top-0 bg-gray-50 pb-2 z-10 mb-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-700">Research Findings</h3>
                  {trip.isResearching && (
                      <span className="text-xs text-blue-600 animate-pulse">● Researching...</span>
                  )}
               </div>
               
               {trip.researchSummary && (
                 <Card title="Executive Summary">
                   <div className="prose prose-sm max-w-none text-gray-800">
                     <ReactMarkdown>{trip.researchSummary}</ReactMarkdown>
                   </div>
                 </Card>
               )}

               {trip.researchFindings && trip.researchFindings.length > 0 ? (
                 trip.researchFindings.map((finding, i) => (
                    <CollapsibleCard key={i} title={finding.category} className="w-full">
                       <div className="text-sm text-gray-700 markdown-content">
                         <ReactMarkdown>{finding.content}</ReactMarkdown>
                       </div>
                    </CollapsibleCard>
                 ))
               ) : (
                 <Card>
                   <p className="text-sm text-gray-500 italic text-center py-4">
                     No research findings yet.<br/>
                     Ask the AI Assistant to "research museums" or "find hotels" to populate this section.
                   </p>
                 </Card>
               )}
            </div>
          </div>
        )}

        {activeTab === 'to-do-list' && (
          <Card>
            <div className="text-center py-10 text-gray-500">
              <p>TODO list of activities to complete before the trip.</p>
              <p className="text-sm mt-2">(Feature coming soon)</p>
            </div>
          </Card>
        )}

        {activeTab === 'message-board' && (
          <MessageBoard 
            tripId={trip._id}
            messages={trip.messages}
            onMessagePosted={handleMessagePosted}
            onMessageLiked={handleMessageLiked}
          />
        )}
      </div>

      <ManageUsersModal
        isOpen={isManageUsersOpen}
        onClose={() => setIsManageUsersOpen(false)}
        trip={trip}
        onAddUser={handleAddUser}
        onRemoveUser={handleRemoveUser}
      />
    </div>
  );
};

export default TripDetail;
