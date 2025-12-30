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
  isWithinInterval
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';

const MonthCalendar = ({ month, trips }) => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  // Helper to check if a day is part of a trip
  const getDayStyle = (date) => {
    let isTripDay = false;
    let isStart = false;
    let isEnd = false;
    let tripTitle = "";

    // Find if this day belongs to any trip
    const activeTrip = trips.find(trip => {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
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

    const baseClasses = "relative w-full h-8 flex items-center justify-center text-xs z-10";
    const textClasses = !isSameMonth(date, monthStart) 
      ? "text-gray-300" 
      : isTripDay 
        ? "text-white font-medium" 
        : "text-gray-700";

    return {
      classes: `${baseClasses} ${textClasses}`,
      bgStyle: isTripDay ? (
        <div 
          className={`absolute top-0.5 bottom-0.5 opacity-90 z-[-1] shadow-sm
            ${isStart ? 'left-0.5 rounded-l-md' : 'left-0'} 
            ${isEnd ? 'right-0.5 rounded-r-md' : 'right-0'}
            ${!isStart && !isEnd ? 'left-0 right-0' : ''}
          `} 
          style={{ backgroundColor: activeTrip.color || '#3B82F6' }}
          title={tripTitle}
        />
      ) : null
    };
  };

  return (
    <div className="flex-1 min-w-[250px] p-3 bg-white rounded-xl border border-gray-100 shadow-sm mx-2">
      <div className="text-center font-bold text-gray-800 mb-3 text-sm">
        {format(month, 'MMMM yyyy')}
      </div>
      
      <div className="grid grid-cols-7 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {calendarDays.map((day) => {
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

const InteractiveTripCalendar = ({ trips }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  
  const nextMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(addMonths(currentDate, 1));
  };
  const prevMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(subMonths(currentDate, 1));
  };

  const monthsToDisplay = [
    currentDate,
    addMonths(currentDate, 1),
    addMonths(currentDate, 2)
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
      <div 
        className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-500" />
          Calendar
        </h3>
        <div className="flex items-center gap-4">
            {isOpen && (
                <div className="flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={prevMonth}
                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={nextMonth}
                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
            )}
            {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="px-6 pb-6"
            >
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
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="flex-1"
                      >
                        <MonthCalendar month={month} trips={trips} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
              
              <div className="mt-4 flex gap-4 text-xs text-gray-500 justify-center font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-md opacity-90 shadow-sm"></div>
                  <span>Planned Trip</span>
                </div>
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InteractiveTripCalendar;
