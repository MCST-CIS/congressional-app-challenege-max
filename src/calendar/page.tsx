
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/header';
import CalendarView from '@/components/calendar/calendar-view';
import { getCalendarEvents } from '@/lib/google-api-client';
import type { CalendarEvent, ScheduledTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

// Dummy scheduled tasks for now, as they are not persisted
const dummyScheduledTasks: ScheduledTask[] = [];

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const { user } = useUser();
  const firestore = useFirestore();
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const eventsCollectionRef = useMemoFirebase(
    () => (user && firestore ? collection(firestore, 'users', user.uid, 'events') : null),
    [user, firestore]
  );
  const { data: firestoreEvents, isLoading: eventsLoading } = useCollection<CalendarEvent>(eventsCollectionRef);

  useEffect(() => {
    async function fetchGoogleData() {
      if (status === 'authenticated' && session?.accessToken) {
        setIsLoading(true);
        try {
          const calendarData = await getCalendarEvents(session.accessToken, false);
          const mappedEvents: CalendarEvent[] = calendarData.map(event => ({
            ...event,
            source: 'google_calendar'
          }));
          setGoogleEvents(mappedEvents);
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

    fetchGoogleData();
  }, [session, status, toast]);

  const allEvents = useMemo(() => {
    const combined = [...(firestoreEvents || []), ...googleEvents];
    const seen = new Set();
    return combined.filter(event => {
      const duplicate = seen.has(event.id);
      seen.add(event.id);
      return !duplicate;
    });
  }, [firestoreEvents, googleEvents]);


  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        {status === 'loading' || isLoading || eventsLoading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Loading your calendar...</p>
          </div>
        ) : status === 'unauthenticated' ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Please sign in to view your calendar.</p>
          </div>
        ) : (
          <CalendarView events={allEvents} scheduledTasks={scheduledTasks} />
        )}
      </main>
    </div>
  );
}
