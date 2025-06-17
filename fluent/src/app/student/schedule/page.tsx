"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense, useCallback } from "react";
import dynamic from "next/dynamic";
import { v4 as uuidv4 } from 'uuid';
import Calendar from "@/components/VariousRoom/Calendar";

import "react-day-picker/dist/style.css";

const StudentToastUI = dynamic(
  () => import("@/components/ToastUI/student_toastui"),
  {
    ssr: false,
  }
);

interface ClassData {
  _id: string;
  id: string;
  calendarId: string;
  room_name: string;
  date: string | undefined;
  time: number;
  duration: number;
  teacher_name: string;
  student_name: string;
}

interface LocalEvent {
  id: string; // Unique ID for your local event
  title: string;
  description?: string;
  start: Date;
  end: Date;
  googleEventId?: string; // To store the Google Calendar event ID
}

const SchedulePage = () => {
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  const type = searchParams.get("type");

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localEvents, setLocalEvents] = useState<LocalEvent[]>([]);

  const URL = `/api/schedules/${type}/${user}`;

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(prevMonth.getMonth() - 1);
      return newMonth;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(prevMonth.getMonth() + 1);
      return newMonth;
    });
  }, []);

  const handleDateClick = useCallback((day: number) => {
    // This function can now be used to e.g., open a modal to add an event for that day
    console.log(`Clicked on day: ${day}`);
  }, []);

  // Local event management functions
  const addLocalEvent = useCallback(async (event: Omit<LocalEvent, 'id' | 'googleEventId'>): Promise<LocalEvent> => {
    const newEvent: LocalEvent = {
      ...event,
      id: uuidv4(), // Generate a unique ID for the local event
    };
    setLocalEvents(prevEvents => [...prevEvents, newEvent]);
    return newEvent;
  }, []);

  const updateLocalEvent = useCallback(async (eventId: string, updatedEvent: Partial<LocalEvent>) => {
    setLocalEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId ? { ...event, ...updatedEvent } : event
      )
    );
  }, []);

  const deleteLocalEvent = useCallback(async (eventId: string) => {
    setLocalEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
  }, []);

  useEffect(() => {
    if (!user || classes.length > 0) return;

    fetch(URL)
      .then((res) => res.json())
      .then((data) => {
        console.log(URL);
        console.log("data 은? ", data);
        setClasses(data);
      })
      .catch((error) => console.log("값을 불러오지 못 합니다", error));
  }, [user, URL, classes.length]);

  return (
    <div className="flex w-full h-full overflow-hidden p-2">
      <div className="flex-1 flex justify-center items-center max-w-full max-h-full overflow-auto">
        <div className="bg-white w-[95%] max-w-full m-5 p-5 rounded-xl shadow-lg">
          {/* <StudentToastUI data={classes} /> */}
          <Calendar
            currentMonth={currentMonth}
            goToPreviousMonth={goToPreviousMonth}
            goToNextMonth={goToNextMonth}
            localEvents={localEvents}
            addLocalEvent={addLocalEvent}
            updateLocalEvent={updateLocalEvent}
            deleteLocalEvent={deleteLocalEvent}
          />
        </div>
      </div>
    </div>
  );
};

export default function Schedule() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SchedulePage />
    </Suspense>
  );
}
