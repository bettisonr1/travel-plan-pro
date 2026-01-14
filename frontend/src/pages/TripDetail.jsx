import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tripService from '../services/tripService';
import Card from '../components/Card';
import Button from '../components/Button';
import ManageUsersModal from '../components/ManageUsersModal';
import MessageBoard from '../components/MessageBoard';

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

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

  const [researchState, setResearchState] = useState({
    logs: [],
    categories: [],
    findings: [],
    summary: '',
    isResearching: false
  });
  
  // Initialize state with existing trip data if available
  useEffect(() => {
    if (trip) {
      setResearchState(prev => ({
        ...prev,
        // If we have saved research findings, use them
        findings: trip.researchFindings || [],
        summary: trip.researchSummary || '',
        // If we have points of interest, use them as categories initially (or load from research if we tracked that separately)
        categories: trip.pointsOfInterest || []
      }));
    }
  }, [trip]);

  const handleStartResearch = async () => {
    setResearchState(prev => ({ ...prev, isResearching: true, logs: ['Starting research workflow...'], summary: '' }));
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user?.token;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/ai/${trip._id}/deep-research`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to start research');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              
              // Handle different state updates from LangGraph
              // Note: our current graph logic doesn't explicitly return 'categories' in the stream events 
              // like the previous mock did, but we can infer or display what we get.
              
              if (data.researcher && data.researcher.research) {
                 // data.researcher.research is an array of strings in our current impl
                 // We want to process these strings to extract category if possible or just display them
                 
                 const newFindings = data.researcher.research.map(content => {
                     const match = content.match(/^### (.*)\n\n/);
                     const category = match ? match[1] : 'General';
                     return { category, content };
                 });

                 setResearchState(prev => ({
                  ...prev,
                  findings: [...prev.findings, ...newFindings],
                  logs: [...prev.logs, `Research completed for categories: ${newFindings.map(f => f.category).join(', ')}`]
                }));
              }
              
              if (data.summariser && data.summariser.summary) {
                setResearchState(prev => ({
                  ...prev,
                  summary: data.summariser.summary,
                  logs: [...prev.logs, 'Summary generated!']
                }));
              }
              
              if (data.error) {
                 setResearchState(prev => ({ ...prev, logs: [...prev.logs, `Error: ${data.error}`] }));
              }
            } catch (e) {
              console.error('Error parsing stream data', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Research error:', error);
      setResearchState(prev => ({ ...prev, logs: [...prev.logs, `Error: ${error.message}`] }));
    } finally {
      setResearchState(prev => ({ ...prev, isResearching: false }));
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
          <div className="w-full h-64 rounded-xl overflow-hidden shadow-lg relative">
              <img 
                  src={`http://localhost:5001${trip.thumbnailUrl}`} 
                  alt={trip.destination} 
                  className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <h1 className="absolute bottom-6 left-6 text-4xl font-bold text-white drop-shadow-md">
                {trip.destination}
              </h1>
          </div>
      )}

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
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {['Overview', 'Attendees', 'Deep Research', 'To-Do List', 'Message Board'].map((tab) => {
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

        {activeTab === 'deep-research' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Deep Research Agent</h2>
              <Button 
                onClick={handleStartResearch} 
                variant="primary"
                disabled={researchState.isResearching}
              >
                {researchState.isResearching ? 'Researching...' : 'Start Deep Research'}
              </Button>
            </div>

            {/* Progress/Logs Area */}
            {(researchState.logs.length > 0 || researchState.isResearching) && (
              <Card>
                 <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm h-48 overflow-y-auto">
                    {researchState.logs.map((log, i) => (
                      <div key={i}>&gt; {log}</div>
                    ))}
                    {researchState.isResearching && <div className="animate-pulse">&gt; _</div>}
                 </div>
              </Card>
            )}

            {/* Categories */}
            {researchState.findings.length > 0 && (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {researchState.findings.map((finding, i) => (
                   <Card key={i} className="min-w-[300px] max-w-[300px]">
                      <h4 className="font-bold text-lg mb-2">{finding.category}</h4>
                      <div className="text-sm text-gray-700 h-40 overflow-y-auto whitespace-pre-line">
                        {finding.content}
                      </div>
                   </Card>
                ))}
              </div>
            )}

            {/* Summary Result */}
            {researchState.summary && (
              <Card title="Executive Summary">
                <div className="prose max-w-none text-gray-800 whitespace-pre-line">
                  {researchState.summary}
                </div>
              </Card>
            )}

            {/* Detailed Findings - Hidden since we show them in horizontal scroll above, or keep as fallback */}
            {/* 
            {researchState.findings.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Detailed Findings</h3>
                {researchState.findings.map((finding, i) => (
                  <Card key={i}>
                    <div className="whitespace-pre-line text-sm text-gray-700">
                      {finding.content || finding}
                    </div>
                  </Card>
                ))}
              </div>
            )}
            */}
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
