'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, PlusCircle } from 'lucide-react';
import type { CalendarEvent } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Button } from '../ui/button';
import AddEventDialog from './add-event-dialog';

type EventListProps = {
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id' | 'source'>) => void;
  isScheduling: boolean;
};

export default function EventList({ events, onAddEvent, isScheduling }: EventListProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  
  // Filter for upcoming events directly before rendering.
  const upcomingEvents = events
    .filter(e => new Date(e.endTime) > new Date())
    .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Calendar Events</CardTitle>
            <CardDescription>Your upcoming commitments.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)} disabled={isScheduling}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-6">
                  <p>No upcoming events.</p>
              </div>
          ) : (
              <div className="space-y-3">
              {upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                      <div className="p-2 bg-background rounded-md">
                          <Calendar className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                          <p className="font-semibold text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(event.startTime), 'MMM d, h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                          </p>
                      </div>
                  </div>
              ))}
              </div>
          )}
        </CardContent>
      </Card>
      <AddEventDialog 
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onAddEvent={onAddEvent}
      />
    </>
  );
}
