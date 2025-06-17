// components/VariousRoom/Calendar.tsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useGoogleCalendar, GoogleCalendarEvent } from "../../hooks/useGoogleCalendar";

// Define a type for your local events
interface LocalEvent {
  id: string; // Unique ID for your local event
  title: string;
  description?: string;
  start: Date;
  end: Date;
  googleEventId?: string; // To store the Google Calendar event ID
}

interface CalendarProps {
  currentMonth: Date;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  // New props for managing local events
  localEvents: LocalEvent[];
  addLocalEvent: (event: Omit<LocalEvent, 'id' | 'googleEventId'>) => Promise<LocalEvent>;
  updateLocalEvent: (eventId: string, updatedEvent: Partial<LocalEvent>) => Promise<void>;
  deleteLocalEvent: (eventId: string) => Promise<void>;
}

const Calendar: React.FC<CalendarProps> = ({
  currentMonth,
  goToPreviousMonth,
  goToNextMonth,
  localEvents,
  addLocalEvent,
  updateLocalEvent,
  deleteLocalEvent,
}) => {
  const {
    isAuthenticated,
    login,
    logout,
    getEventsForDateRange,
    createGoogleCalendarEvent,
    updateGoogleCalendarEvent,
    deleteGoogleCalendarEvent,
  } = useGoogleCalendar();

  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDayForEvent, setSelectedDayForEvent] = useState<number | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [editingEvent, setEditingEvent] = useState<LocalEvent | null>(null);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  // Load Google Calendar events for current month
  useEffect(() => {
    const loadGoogleEvents = async () => {
      if (!isAuthenticated) {
        setGoogleEvents([]);
        return;
      }

      try {
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59); // End of the day
        
        const events = await getEventsForDateRange(startOfMonth, endOfMonth);
        setGoogleEvents(events);

        // Optional: Sync Google events to local state if they don't exist locally
        // This is a simplified approach and might need refinement for robust sync
        // events.forEach(gEvent => {
        //   const isLocallyManaged = localEvents.some(lEvent => lEvent.googleEventId === gEvent.id);
        //   if (!isLocallyManaged) {
        //     // Add to local state (consider a proper mapping/deduplication)
        //     // You might want to ask the user if they want to import, or simply add them
        //     console.log("Google event not found locally, consider adding:", gEvent.summary);
        //   }
        // });

      } catch (error) {
        console.error('Error loading Google Calendar events:', error);
        setGoogleEvents([]);
      }
    };

    loadGoogleEvents();
  }, [isAuthenticated, year, month, getEventsForDateRange]);

  // Combine local and Google events for display
  const allEventsForMonth = useMemo(() => {
    const combined = [...localEvents.map(event => ({
      ...event,
      isGoogleEvent: false,
      date: new Date(event.start),
    }))];

    googleEvents.forEach(gEvent => {
      const eventDate = new Date(gEvent.start?.dateTime ?? gEvent.start?.date ?? "");
      // Ensure Google events are within the current month
      if (eventDate.getMonth() === month && eventDate.getFullYear() === year) {
        combined.push({
          id: gEvent.id || `google-${eventDate.getTime()}-${Math.random()}`, // Fallback ID
          title: gEvent.summary || '(No Title)',
          description: gEvent.description,
          start: eventDate,
          end: new Date(gEvent.end?.dateTime ?? gEvent.end?.date ?? ""),
          isGoogleEvent: true,
          googleEventId: gEvent.id,
          date: eventDate, // Add the missing 'date' property
          // Add other properties as needed
        });
      }
    });
    return combined;
  }, [localEvents, googleEvents, month, year]);

  const getEventsForDay = useCallback((day: number) => {
    return allEventsForMonth.filter(event =>
      event.start.getDate() === day &&
      event.start.getMonth() === month &&
      event.start.getFullYear() === year
    );
  }, [allEventsForMonth, month, year]);

  const handleCreateEvent = async () => {
    if (selectedDayForEvent === null || !eventTitle) return;

    const eventDate = new Date(year, month, selectedDayForEvent);
    const startDateTime = new Date(eventDate.toDateString() + ' ' + eventStartTime);
    const endDateTime = new Date(eventDate.toDateString() + ' ' + eventEndTime);

    if (startDateTime >= endDateTime) {
      alert("End time must be after start time.");
      return;
    }

    try {
      const newLocalEvent: Omit<LocalEvent, 'id' | 'googleEventId'> = {
        title: eventTitle,
        description: eventDescription,
        start: startDateTime,
        end: endDateTime,
      };

      // Add to local state first to ensure immediate UI update
      const addedEvent = await addLocalEvent(newLocalEvent);

      // If authenticated, sync to Google Calendar
      if (isAuthenticated) {
        const googleEventResource: GoogleCalendarEvent = {
          summary: addedEvent.title,
          description: addedEvent.description,
          start: {
            dateTime: addedEvent.start.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: addedEvent.end.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        };
        const createdGoogleEvent = await createGoogleCalendarEvent(googleEventResource);
        // Update local event with Google Event ID
        if (createdGoogleEvent && createdGoogleEvent.id) {
          await updateLocalEvent(addedEvent.id, { googleEventId: createdGoogleEvent.id });
          setGoogleEvents(prev => [...prev, createdGoogleEvent]); // Add to Google events state
        }
      }

      setShowEventModal(false);
      setEventTitle('');
      setEventDescription('');
      setEventStartTime('09:00');
      setEventEndTime('10:00');
      setSelectedDayForEvent(null);
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("Error creating event. See console for details.");
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !eventTitle) return;

    const eventDate = new Date(year, month, editingEvent.start.getDate()); // Use original event's day for date
    const startDateTime = new Date(eventDate.toDateString() + ' ' + eventStartTime);
    const endDateTime = new Date(eventDate.toDateString() + ' ' + eventEndTime);

    if (startDateTime >= endDateTime) {
      alert("End time must be after start time.");
      return;
    }

    try {
      const updatedLocalEvent: Partial<LocalEvent> = {
        title: eventTitle,
        description: eventDescription,
        start: startDateTime,
        end: endDateTime,
      };

      await updateLocalEvent(editingEvent.id, updatedLocalEvent);

      if (isAuthenticated && editingEvent.googleEventId) {
        const googleEventResource: GoogleCalendarEvent = {
          summary: eventTitle,
          description: eventDescription,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        };
        await updateGoogleCalendarEvent(editingEvent.googleEventId, googleEventResource);
        // Refresh Google events or update state
        setGoogleEvents(prev => prev.map(e => e.id === editingEvent.googleEventId ? { ...e, ...googleEventResource, id: e.id } : e));
      }

      setShowEventModal(false);
      setEventTitle('');
      setEventDescription('');
      setEventStartTime('09:00');
      setEventEndTime('10:00');
      setEditingEvent(null);
      setSelectedDayForEvent(null);
    } catch (error) {
      console.error("Failed to update event:", error);
      alert("Error updating event. See console for details.");
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;

    try {
      await deleteLocalEvent(editingEvent.id);

      if (isAuthenticated && editingEvent.googleEventId) {
        await deleteGoogleCalendarEvent(editingEvent.googleEventId);
        setGoogleEvents(prev => prev.filter(e => e.id !== editingEvent.googleEventId)); // Remove from Google events state
      }

      setShowEventModal(false);
      setEventTitle('');
      setEventDescription('');
      setEventStartTime('09:00');
      setEventEndTime('10:00');
      setEditingEvent(null);
      setSelectedDayForEvent(null);
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Error deleting event. See console for details.");
    }
  };

  const openCreateEventModal = (day: number) => {
    setSelectedDayForEvent(day);
    setEditingEvent(null); // Clear any editing state
    setEventTitle('');
    setEventDescription('');
    setEventStartTime('09:00');
    setEventEndTime('10:00');
    setShowEventModal(true);
  };

  const openEditEventModal = (event: LocalEvent) => {
    setEditingEvent(event);
    setEventTitle(event.title);
    setEventDescription(event.description || '');
    setEventStartTime(event.start.toTimeString().substring(0, 5));
    setEventEndTime(event.end.toTimeString().substring(0, 5));
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setSelectedDayForEvent(null);
    setEventTitle('');
    setEventDescription('');
    setEventStartTime('09:00');
    setEventEndTime('10:00');
  };

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  const dayNameElements = dayNames.map((day) => (
    <div
      key={`header-${day}`}
      className="text-center w-12 h-10 flex items-center justify-center font-medium text-gray-600"
    >
      {day}
    </div>
  ));

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="w-12 h-12"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const eventsForDay = getEventsForDay(day);
    const hasEvents = eventsForDay.length > 0;
    const hasLocalEvents = eventsForDay.some(e => !e.isGoogleEvent); // Check for purely local events
    const hasGoogleEventsDisplay = eventsForDay.some(e => e.isGoogleEvent); // Check for Google events
    
    // Determine if the day is "selected" (e.g., if there's an active local event creation/selection logic)
    // For this example, we'll make it selectable by clicking
    const isSelected = selectedDayForEvent === day; 

    days.push(
      <div
        key={`day-${day}`}
        className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-200 relative p-1 ${
          isSelected
            ? "bg-blue-500 text-white shadow-md"
            : "hover:bg-blue-100 hover:text-blue-600"
        }`}
        onClick={() => openCreateEventModal(day)} // Open modal to create event on click
      >
        <span className="text-sm font-semibold">{day}</span>
        {hasEvents && (
          <div className="flex flex-wrap justify-center mt-1">
            {hasLocalEvents && (
              <span className="w-2 h-2 bg-blue-500 rounded-full mx-0.5"></span>
            )}
            {hasGoogleEventsDisplay && (
              <span className="w-2 h-2 bg-green-500 rounded-full mx-0.5"></span>
            )}
            {eventsForDay.length > 2 && ( // Indicate more events if many
              <span className="text-xs text-gray-400">+{eventsForDay.length - (hasLocalEvents && hasGoogleEventsDisplay ? 2 : 1)}</span>
            )}
          </div>
        )}

        {/* Display events on hover/click or as a list within the day cell (more complex UI) */}
        {eventsForDay.length > 0 && (
          <div className="absolute top-0 left-0 w-full h-full flex flex-col items-start justify-start opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-lg p-1 text-xs overflow-hidden z-20">
            {eventsForDay.slice(0, 3).map((event) => (
              <div 
                key={event.id} 
                className={`w-full truncate px-1 py-0.5 rounded ${event.isGoogleEvent ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} mb-0.5`}
                onClick={(e) => { e.stopPropagation(); openEditEventModal(event); }} // Stop propagation to not trigger day click
                title={event.title}
              >
                {event.title}
              </div>
            ))}
            {eventsForDay.length > 3 && <div className="px-1 text-gray-500">...</div>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {currentMonth.toLocaleString("ko-KR", { month: "long" })} {year}
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={goToPreviousMonth}
            className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-50 rounded-full hover:bg-blue-100 transition-all"
          >
            &lt;
          </button>
          <button
            onClick={goToNextMonth}
            className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-50 rounded-full hover:bg-blue-100 transition-all"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Google Calendar connection status and login/logout buttons */}
      <div className="flex items-center justify-center mb-4 text-sm">
        {isAuthenticated ? (
          <div className="flex items-center text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span>Google Calendar 연결됨</span>
            <button
              onClick={logout}
              className="ml-4 px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-all"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <button
            onClick={() => login()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all"
          >
            Google Calendar 연결
          </button>
        )}
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">{dayNameElements}</div>
      <div className="grid grid-cols-7 gap-2">{days}</div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center">
          <span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
          <span>내 일정</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
          <span>Google Calendar 일정</span>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-xl font-bold mb-4">
              {editingEvent ? '일정 수정' : '새 일정 추가'}
            </h3>
            <div className="mb-4">
              <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700 mb-1">
                제목
              </label>
              <input
                type="text"
                id="eventTitle"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="일정 제목"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700 mb-1">
                설명 (선택 사항)
              </label>
              <textarea
                id="eventDescription"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="일정 설명"
                rows={3}
              ></textarea>
            </div>
            <div className="mb-4 flex space-x-4">
              <div className="w-1/2">
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                  시작 시간
                </label>
                <input
                  type="time"
                  id="startTime"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
                />
              </div>
              <div className="w-1/2">
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                  종료 시간
                </label>
                <input
                  type="time"
                  id="endTime"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              {editingEvent && (
                <button
                  onClick={handleDeleteEvent}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all"
                >
                  삭제
                </button>
              )}
              <button
                onClick={closeEventModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-all"
              >
                취소
              </button>
              <button
                onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all"
              >
                {editingEvent ? '수정' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;