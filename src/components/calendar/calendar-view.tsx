'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, eachDayOfInterval, isSameMonth, isSameDay, getDay, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarEvent, ScheduledTask } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type CalendarViewProps = {
  events: CalendarEvent[];
  scheduledTasks: ScheduledTask[];
};

export default function CalendarView({ events, scheduledTasks }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(parseISO(event.startTime), day));
  };

  const getTasksForDay = (day: Date) => {
    return scheduledTasks.filter(task => isSameDay(parseISO(task.startTime), day));
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 border-t border-l">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center text-sm font-semibold border-r border-b bg-muted/50">
                {day}
              </div>
            ))}
            {days.map(day => {
              const dayEvents = getEventsForDay(day);
              const dayTasks = getTasksForDay(day);
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    'relative min-h-[8rem] border-r border-b p-2',
                    !isSameMonth(day, monthStart) && 'bg-muted/30 text-muted-foreground'
                  )}
                >
                  <span className={cn('font-medium', isSameDay(day, new Date()) && 'bg-primary text-primary-foreground rounded-full px-2 py-0.5')}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.map(event => (
                      <Tooltip key={event.id}>
                        <TooltipTrigger asChild>
                          <div className="bg-secondary text-secondary-foreground text-xs rounded-md p-1 truncate cursor-default">
                            {event.title}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{event.title}</p>
                          <p className="text-muted-foreground">{format(parseISO(event.startTime), 'h:mm a')} - {format(parseISO(event.endTime), 'h:mm a')}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {dayTasks.map(task => (
                      <Tooltip key={task.id}>
                        <TooltipTrigger asChild>
                           <div className="bg-primary/50 text-primary-foreground text-xs rounded-md p-1 truncate cursor-default">
                             {task.title}
                           </div>
                        </TooltipTrigger>
                         <TooltipContent>
                           <p>{task.title}</p>
                           <p className="text-muted-foreground">{format(parseISO(task.startTime), 'h:mm a')} - {format(parseISO(task.endTime), 'h:mm a')}</p>
                         </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
