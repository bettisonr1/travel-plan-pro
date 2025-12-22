import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isWithinInterval,
  parseISO
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MonthCalendar = ({ month, trips }) => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  // Helper to check if a day is part of a trip
  const getDayStyle = (date) => {
    let style = "";
    let isTripDay = false;
    let isStart = false;
    let isEnd = false;
    let tripTitle = "";

    // Find if this day belongs to any trip
    const activeTrip = trips.find(trip => {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      // Reset hours to compare dates only
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      const current = new Date(date);
      current.setHours(0,0,0,0);
      
      return isWithinInterval(current, { start, end });
    });

    if (activeTrip) {
      isTripDay = true;
      const start = new Date(activeTrip.startDate);
      const end = new Date(activeTrip.endDate);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      const current = new Date(date);
      current.setHours(0,0,0,0);

      if (isSameDay(current, start)) isStart = true;
      if (isSameDay(current, end)) isEnd = true;
      tripTitle = activeTrip.destination;
    }

    const baseClasses = "relative w-full h-10 flex items-center justify-center text-sm z-10";
    const textClasses = !isSameMonth(date, monthStart) 
      ? "text-gray-300" 
      : isTripDay 
        ? "text-white font-medium" 
        : "text-gray-700";

    return {
      classes: `${baseClasses} ${textClasses}`,
      bgStyle: isTripDay ? (
        <div 
          className={`absolute top-1 bottom-1 bg-blue-500 opacity-80 z-[-1]
            ${isStart ? 'left-1 rounded-l-full' : 'left-0'} 
            ${isEnd ? 'right-1 rounded-r-full' : 'right-0'}
            ${!isStart && !isEnd ? 'left-0 right-0' : ''}
          `} 
          title={tripTitle}
        />
      ) : null
    };
  };

  return (
    <div className="flex-1 min-w-[300px] p-4 bg-white rounded-lg border border-gray-100 shadow-sm mx-2">
      <div className="text-center font-bold text-gray-800 mb-4">
        {format(month, 'MMMM yyyy')}
      </div>
      
      <div className="grid grid-cols-7 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {calendarDays.map((day, i) => {
          const { classes, bgStyle } = getDayStyle(day);
          return (
            <div key={day.toString()} className={classes}>
              {bgStyle}
              <span>{format(day, dateFormat)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TripCalendar = ({ trips }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthsToDisplay = [
    currentDate,
    addMonths(currentDate, 1),
    addMonths(currentDate, 2)
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-8 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          Trip Calendar
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="relative">
        <motion.div 
          className="flex justify-between -mx-2 overflow-x-auto pb-2 scrollbar-hide"
          initial={false}
          animate={{ x: 0 }}
        >
          <AnimatePresence mode='popLayout'>
            {monthsToDisplay.map((month) => (
              <motion.div
                layout
                key={month.toString()}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="flex-1"
              >
                <MonthCalendar month={month} trips={trips} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
      
      <div className="mt-4 flex gap-4 text-sm text-gray-500 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full opacity-80"></div>
          <span>Planned Trip</span>
        </div>
      </div>
    </div>
  );
};

export default TripCalendar;
