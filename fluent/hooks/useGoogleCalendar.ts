// hooks/useGoogleCalendar.ts
import { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { GApiAuh2Client, GapiClient, GapiGoogleAuth } from '../types/global'; // Define these types
import { OAuth2Client } from 'google-auth-library'; // For backend verification (optional but recommended)

// Define your Google API types (create a file like types/global.d.ts)
declare global {
  interface Window {
    gapi: any;
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

  // Initialize Google API client (gapi)
  const initGapiClient = useCallback(async (token: string) => {
    try {
      await new Promise<void>((resolve, reject) => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY, // Not strictly needed for authenticated calls but good practice
              clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
              discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
              scope: 'https://www.googleapis.com/auth/calendar.events',
            });
            resolve();
          } catch (error) {
            console.error("Error initializing gapi client:", error);
            reject(error);
          }
        });
      });

      window.gapi.client.setToken({ access_token: token });
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Failed to initialize gapi client:", error);
      setIsAuthenticated(false);
      setAccessToken(null);
    }
  }, []);

  // Google Login Hook
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Login Success:', tokenResponse);
      const accessToken = tokenResponse.access_token;
      setAccessToken(accessToken);
      localStorage.setItem('google_access_token', accessToken);
      await initGapiClient(accessToken);
    },
    onError: (errorResponse) => {
      console.error('Login Failed:', errorResponse);
      setIsAuthenticated(false);
      setAccessToken(null);
    },
    scope: 'https://www.googleapis.com/auth/calendar.events', // Request read/write access
  });

  // Logout function
  const logout = () => {
    googleLogout();
    setIsAuthenticated(false);
    setAccessToken(null);
    localStorage.removeItem('google_access_token');
    // Clear gapi token if it was set
    if (window.gapi && window.gapi.client) {
      window.gapi.client.setToken('');
    }
    console.log('Logged out from Google Calendar.');
  };

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('google_access_token');
    if (storedToken) {
      // Potentially verify the token here to ensure it's still valid
      // For simplicity, we'll just try to initialize gapi with it
      initGapiClient(storedToken);
    }
  }, [initGapiClient]);

  // Function to get events for a date range
  const getEventsForDateRange = useCallback(async (startDate: Date, endDate: Date) => {
    if (!isAuthenticated || !window.gapi || !window.gapi.client || !window.gapi.client.calendar) {
      console.warn("Google API client not authenticated or initialized.");
      return [];
    }

    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary', // Use 'primary' for the user's primary calendar
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return response.result.items;
    } catch (error) {
      console.error("Error fetching Google Calendar events:", error);
      return [];
    }
  }, [isAuthenticated]);

  // Function to create an event
  const createGoogleCalendarEvent = useCallback(async (event: GoogleCalendarEvent) => {
    if (!isAuthenticated || !window.gapi || !window.gapi.client || !window.gapi.client.calendar) {
      console.warn("Google API client not authenticated or initialized.");
      throw new Error("Google Calendar not connected.");
    }

    try {
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
      console.log('Event created:', response.result);
      return response.result; // Return the created event, which will have an `id`
    } catch (error) {
      console.error("Error creating Google Calendar event:", error);
      throw error;
    }
  }, [isAuthenticated]);

  // Function to update an event
  const updateGoogleCalendarEvent = useCallback(async (eventId: string, updatedEvent: GoogleCalendarEvent) => {
    if (!isAuthenticated || !window.gapi || !window.gapi.client || !window.gapi.client.calendar) {
      console.warn("Google API client not authenticated or initialized.");
      throw new Error("Google Calendar not connected.");
    }

    try {
      const response = await window.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: updatedEvent,
      });
      console.log('Event updated:', response.result);
      return response.result;
    } catch (error) {
      console.error("Error updating Google Calendar event:", error);
      throw error;
    }
  }, [isAuthenticated]);

  // Function to delete an event
  const deleteGoogleCalendarEvent = useCallback(async (eventId: string) => {
    if (!isAuthenticated || !window.gapi || !window.gapi.client || !window.gapi.client.calendar) {
      console.warn("Google API client not authenticated or initialized.");
      throw new Error("Google Calendar not connected.");
    }

    try {
      await window.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
      console.log('Event deleted successfully:', eventId);
      return true;
    } catch (error) {
      console.error("Error deleting Google Calendar event:", error);
      throw error;
    }
  }, [isAuthenticated]);

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