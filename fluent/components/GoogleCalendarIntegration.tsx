// components/GoogleCalendarIntegration.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';

interface GoogleCalendarIntegrationProps {
  onEventsSync?: (events: any[]) => void;
  selectedDates?: Date[];
  scheduleData?: any[];
}

const GoogleCalendarIntegration: React.FC<GoogleCalendarIntegrationProps> = ({
  onEventsSync,
  selectedDates = [],
  scheduleData = []
}) => {
  const {
    isAuthenticated,
    isLoading,
    events,
    signIn,
    signOut,
    syncSchedulesToGoogleCalendar,
    getEventsForDateRange
  } = useGoogleCalendar();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  // Load calendar events for selected dates
  useEffect(() => {
    const loadCalendarEvents = async () => {
      if (!isAuthenticated || selectedDates.length === 0) return;

      try {
        const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
        const startDate = new Date(sortedDates[0]);
        const endDate = new Date(sortedDates[sortedDates.length - 1]);
        
        // Add one day to end date to include the entire day
        endDate.setDate(endDate.getDate() + 1);

        const events = await getEventsForDateRange(startDate, endDate);
        setCalendarEvents(events);
        
        if (onEventsSync) {
          onEventsSync(events);
        }
      } catch (error) {
        console.error('Error loading calendar events:', error);
      }
    };

    loadCalendarEvents();
  }, [isAuthenticated, selectedDates, getEventsForDateRange, onEventsSync]);

  // Handle Google Calendar sign in
  const handleSignIn = async () => {
    try {
      await signIn();
      setSyncStatus('Google Calendar에 성공적으로 연결되었습니다.');
    } catch (error) {
      setSyncStatus('Google Calendar 연결에 실패했습니다.');
      console.error('Sign in error:', error);
    }
  };

  // Handle Google Calendar sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      setSyncStatus('Google Calendar 연결이 해제되었습니다.');
      setCalendarEvents([]);
    } catch (error) {
      setSyncStatus('로그아웃에 실패했습니다.');
      console.error('Sign out error:', error);
    }
  };

  // Sync schedules to Google Calendar
  const handleSyncToGoogle = async () => {
    if (!isAuthenticated || scheduleData.length === 0) return;

    try {
      setIsSyncing(true);
      setSyncStatus('Google Calendar에 일정을 동기화하는 중...');

      const result = await syncSchedulesToGoogleCalendar(scheduleData);
      
      if (result.failed === 0) {
        setSyncStatus(`${result.success}개의 일정이 Google Calendar에 성공적으로 동기화되었습니다.`);
      } else {
        setSyncStatus(`${result.success}개 성공, ${result.failed}개 실패`);
      }
    } catch (error) {
      setSyncStatus('Google Calendar 동기화에 실패했습니다.');
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Format date for display
  const formatEventDate = (event: any) => {
    const startDate = event.start?.dateTime || event.start?.date;
    if (!startDate) return '';
    
    const date = new Date(startDate);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-blue-600"
          >
            <path
              d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
              fill="currentColor"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-800">Google Calendar</h3>
        </div>

        <div className="flex items-center space-x-2">
          {!isAuthenticated ? (
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '연결 중...' : '연결하기'}
            </button>
          ) : (
            <>
              <button
                onClick={handleSyncToGoogle}
                disabled={isSyncing || scheduleData.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSyncing ? '동기화 중...' : '동기화'}
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                연결 해제
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status message */}
      {syncStatus && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          syncStatus.includes('실패') || syncStatus.includes('해제')
            ? 'bg-red-50 text-red-600 border border-red-200'
            : 'bg-green-50 text-green-600 border border-green-200'
        }`}>
          {syncStatus}
        </div>
      )}

      {/* Connection status */}
      <div className="flex items-center space-x-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${
          isAuthenticated ? 'bg-green-500' : 'bg-gray-400'
        }`}></div>
        <span className="text-sm text-gray-600">
          {isAuthenticated ? 'Google Calendar에 연결됨' : '연결되지 않음'}
        </span>
      </div>

      {/* Calendar events for selected dates */}
      {isAuthenticated && calendarEvents.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            선택된 날짜의 기존 일정
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {calendarEvents.map((event, index) => (
              <div
                key={event.id || index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border"
              >
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {event.summary || '제목 없음'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatEventDate(event)}
                  </div>
                </div>
                {event.location && (
                  <div className="text-xs text-gray-500">
                    📍 {event.location}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help text */}
      {!isAuthenticated && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600">
            Google Calendar와 연결하면 등록한 수업 일정을 자동으로 동기화할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarIntegration;