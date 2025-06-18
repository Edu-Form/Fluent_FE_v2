// hooks/useGoogleCalendar.ts
import { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';

declare global {
  interface Window {
    google: any;
  }
}

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
}

export const useGoogleCalendar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Google Login Hook with updated configuration
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Login Success:', tokenResponse);
      const accessToken = tokenResponse.access_token;
      setAccessToken(accessToken);
      setIsAuthenticated(true);
      localStorage.setItem('google_access_token', accessToken);
    },
    onError: (errorResponse) => {
      console.error('Login Failed:', errorResponse);
      setIsAuthenticated(false);
      setAccessToken(null);
    },
    scope: 'https://www.googleapis.com/auth/calendar.events',
    flow: 'implicit'
  });

  // Logout function
  const logout = () => {
    googleLogout();
    setIsAuthenticated(false);
    setAccessToken(null);
    localStorage.removeItem('google_access_token');
    console.log('Logged out from Google Calendar.');
  };

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('google_access_token');
    if (storedToken) {
      setAccessToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  // Function to get events for a date range
  const getEventsForDateRange = useCallback(async (startDate: Date, endDate: Date) => {
    if (!isAuthenticated || !accessToken) {
      console.warn("Not authenticated");
      return [];
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${startDate.toISOString()}&` +
        `timeMax=${endDate.toISOString()}&` +
        `showDeleted=false&` +
        `singleEvents=true&` +
        `orderBy=startTime&` +
        `maxResults=100`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Error fetching Google Calendar events:", error);
      return [];
    }
  }, [isAuthenticated, accessToken]);

  // Function to create an event
  const createGoogleCalendarEvent = useCallback(async (event: GoogleCalendarEvent) => {
    if (!isAuthenticated || !accessToken) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Event created:', data);
      return data;
    } catch (error) {
      console.error("Error creating Google Calendar event:", error);
      throw error;
    }
  }, [isAuthenticated, accessToken]);

  // Function to update an event
  const updateGoogleCalendarEvent = useCallback(async (eventId: string, updatedEvent: GoogleCalendarEvent) => {
    if (!isAuthenticated || !accessToken) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedEvent),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Event updated:', data);
      return data;
    } catch (error) {
      console.error("Error updating Google Calendar event:", error);
      throw error;
    }
  }, [isAuthenticated, accessToken]);

  // Function to delete an event
  const deleteGoogleCalendarEvent = useCallback(async (eventId: string) => {
    if (!isAuthenticated || !accessToken) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Event deleted successfully:', eventId);
      return true;
    } catch (error) {
      console.error("Error deleting Google Calendar event:", error);
      throw error;
    }
  }, [isAuthenticated, accessToken]);

  return {
    isAuthenticated,
    login,
    logout,
    getEventsForDateRange,
    createGoogleCalendarEvent,
    updateGoogleCalendarEvent,
    deleteGoogleCalendarEvent,
  };
};