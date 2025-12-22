import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tripService from '../services/tripService';
import Card from '../components/Card';
import Button from '../components/Button';

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!trip) return <div className="text-center py-10">Trip not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{trip.destination}</h1>
        <Button onClick={() => navigate('/')} variant="secondary">
          Back to Trips
        </Button>
      </div>

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
        </div>
      </Card>

      <Card title="AI Trip Report">
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <h4 className="text-blue-800 font-semibold mb-2">Generated Insights</h4>
            <p className="text-blue-600">
              This report is generated based on your destination and preferences. 
              (This is a placeholder for the future AI feature.)
            </p>
          </div>
          
          <div className="prose max-w-none text-gray-700">
            <p>
              <strong>Summary:</strong> A wonderful trip to {trip.destination} awaits! 
              Expect great weather and amazing sights.
            </p>
            <p>
              <strong>Top Recommendations:</strong>
            </p>
            <ul className="list-disc pl-5">
              <li>Visit the main city square</li>
              <li>Try the local cuisine at rated restaurants</li>
              <li>Explore nearby nature trails</li>
            </ul>
            <p className="text-sm text-gray-500 mt-4">
              <em>Sources: Wikipedia, TripAdvisor, Local Guides</em>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TripDetail;
