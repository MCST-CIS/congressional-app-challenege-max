'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { CalendarEvent, ScheduledTask } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format, getHours, getMinutes, isToday, isSameDay, addDays, subDays } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type ScheduleViewProps = {
  events: CalendarEvent[];
  scheduledTasks: ScheduledTask[];
  onToggleTask: (taskId: string) => void;
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
};

const hours = Array.from({ length: 24 }, (_, i) => i); // 0 to 23 for a full day

export default function ScheduleView({
  events,
  scheduledTasks,
  onToggleTask,
  selectedDate,
  onSelectedDateChange
}: ScheduleViewProps) {
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollEffectHasRun = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && containerRef.current && isToday(selectedDate) && !scrollEffectHasRun.current) {
      const now = new Date();
      const currentHour = getHours(now);
      const currentMinute = getMinutes(now);
      
      const hourHeightInPixels = 4 * 16;
      
      const containerHeight = containerRef.current.clientHeight;
      const scrollTop = 
        (currentHour * hourHeightInPixels) + 
        ((currentMinute / 60) * hourHeightInPixels) - 
        (containerHeight / 2) + 
        (hourHeightInPixels / 2);

      setTimeout(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = scrollTop;
            scrollEffectHasRun.current = true; 
        }
      }, 100);
    }
    // Reset scroll effect flag if the date changes to today again
    if (!isToday(selectedDate)) {
        scrollEffectHasRun.current = false;
    }
  }, [isClient, selectedDate]);


  const getPositionAndHeight = (startTimeStr: string, endTimeStr: string) => {
    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);
    const startHour = getHours(startTime) + getMinutes(startTime) / 60;
    const endHour = getHours(endTime) + getMinutes(endTime) / 60;
    
    const top = startHour * 4; // 4rem per hour
    const height = (endHour - startHour) * 4;

    return { top: `${top}rem`, height: `${height}rem` };
  };

  const dayEvents = events.filter(e => isSameDay(new Date(e.startTime), selectedDate));
  const dayTasks = scheduledTasks.filter(t => isSameDay(new Date(t.startTime), selectedDate));

  return (
    <TooltipProvider>
      <Card className="h-full flex flex-col">
        <CardHeader>
           <div className="flex items-center justify-between">
             <div>
                <CardTitle>Daily Schedule</CardTitle>
                <CardDescription>{format(selectedDate, 'eeee, MMMM d')}</CardDescription>
             </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => onSelectedDateChange(subDays(selectedDate, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => onSelectedDateChange(new Date())} disabled={isToday(selectedDate)}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={() => onSelectedDateChange(addDays(selectedDate, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
           </div>
        </CardHeader>
        <CardContent ref={containerRef} className="flex-1 overflow-y-auto">
          <div className="relative h-[96rem] pt-3">
            {hours.map(hour => (
              <div key={hour} className="relative h-16 border-t">
                <span className="absolute -top-2.5 left-2 bg-background px-1 text-xs text-muted-foreground">
                  {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour % 12} PM`}
                </span>
              </div>
            ))}
            
            {isClient && dayEvents.map(event => {
                const { top, height } = getPositionAndHeight(event.startTime, event.endTime);
                return (
                    <Tooltip key={event.id}>
                        <TooltipTrigger asChild>
                            <div
                                className="absolute left-12 right-0 rounded-lg bg-secondary p-2 shadow-sm"
                                style={{ top, height }}
                            >
                                <p className="text-xs font-semibold text-secondary-foreground truncate">{event.title}</p>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{event.title}</p>
                            <p className="text-muted-foreground">{format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}</p>
                        </TooltipContent>
                    </Tooltip>
                );
            })}

            {isClient && dayTasks.map(task => {
                const { top, height } = getPositionAndHeight(task.startTime, task.endTime);
                const isCompleted = task.status === 'completed';
                return (
                    <Tooltip key={task.id}>
                        <TooltipTrigger asChild>
                            <div
                                className={cn(
                                    "absolute left-12 right-0 rounded-lg p-2 transition-colors flex items-start gap-2",
                                    isCompleted ? 'bg-green-100 dark:bg-green-900/50' : 'bg-primary/50'
                                )}
                                style={{ top, height }}
                            >
                                <Checkbox 
                                    id={`task-${task.id}`}
                                    checked={isCompleted}
                                    onCheckedChange={() => onToggleTask(task.id)}
                                    className="mt-1"
                                />
                                <div className="flex-1 overflow-hidden">
                                    <label htmlFor={`task-${task.id}`} className={cn("text-xs font-semibold text-primary-foreground cursor-pointer truncate", isCompleted && 'line-through text-muted-foreground')}>
                                        {task.title}
                                    </label>
                                    <p className={cn("text-xs text-primary-foreground/80", isCompleted && 'text-muted-foreground/80')}>
                                        Work Block
                                    </p>
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{task.title}</p>
                            <p className="text-muted-foreground">{format(new Date(task.startTime), 'h:mm a')} - {format(new Date(task.endTime), 'h:mm a')}</p>
                        </TooltipContent>
                    </Tooltip>
                );
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
