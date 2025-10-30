
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/header';
import CalendarView from '@/components/calendar/calendar-view';
import { getCalendarEvents } from '@/lib/google-api-client';
import type { CalendarEvent, ScheduledTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Dummy scheduled tasks for now, as they are not persisted
const dummyScheduledTasks: ScheduledTask[] = [];

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      if (status === 'authenticated' && session?.accessToken) {
        setIsLoading(true);
        try {
          // Not passing daysInTheFuture fetches all events
          const calendarData = await getCalendarEvents(session.accessToken);
          setEvents(calendarData);
          // In a real app, you would fetch persisted scheduled tasks here
          setScheduledTasks(dummyScheduledTasks);

        } catch (error) {
          console.error("Error fetching Google Calendar data:", error);
          toast({
            variant: "destructive",
            title: "API Error",
            description: "Failed to fetch data from Google Calendar.",
          });
        } finally {
          setIsLoading(false);
        }
      } else if (status === 'unauthenticated') {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [session, status, toast]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        {status === 'loading' || isLoading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Loading your calendar...</p>

          </div>
        ) : status === 'unauthenticated' ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Please sign in to view your calendar.</p>
          </div>
        ) : (
          <CalendarView events={events} scheduledTasks={scheduledTasks} />
        )}
      </main>
    </div>
  );
}
