import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const TripCalendar = ({ trips }) => {
  const events = trips.map(trip => ({
    id: trip._id,
    title: trip.destination,
    start: new Date(trip.startDate),
    end: new Date(trip.endDate),
    resource: trip
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Trip Calendar</h3>
      <div style={{ height: 500 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'agenda']}
          defaultView="month"
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: '#3b82f6', // blue-500
              borderRadius: '4px',
              color: 'white',
              border: 'none',
              display: 'block'
            }
          })}
        />
      </div>
    </div>
  );
};

export default TripCalendar;
