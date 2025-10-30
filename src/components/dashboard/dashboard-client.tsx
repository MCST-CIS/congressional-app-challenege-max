'use client';

import { useState, useTransition, useEffect, useCallback, useMemo } from 'react';
import type { Assignment, CalendarEvent, ScheduledTask, GoogleCourse } from '@/lib/types';
import AssignmentList from '@/components/dashboard/assignment-list';
import EventList from '@/components/dashboard/event-list';
import ScheduleView from '@/components/dashboard/schedule-view';
import { smartTaskScheduler } from '@/ai/flows/smart-task-scheduler';
import { useToast } from '@/hooks/use-toast';
import { format, formatISO, isBefore, max, addDays, startOfDay, endOfDay, isWithinInterval, isSameDay } from 'date-fns';
import { useSession } from 'next-auth/react';
import { getCalendarEvents, getGoogleClassroomAssignments, getGoogleClassroomCourses, createGoogleCalendarEvent } from '@/lib/google-api-client';
import TriageQueue from './triage-queue';

const getAvailableTimeSlots = (forDate: Date, allEvents: CalendarEvent[]): string => {
    const now = new Date();
    const dayStart = startOfDay(forDate);
    const dayEnd = endOfDay(forDate);

    const relevantEvents = allEvents.filter(e => {
        if (!e.startTime || !e.endTime) return false;
        try {
            const eventStart = new Date(e.startTime);
            const eventEnd = new Date(e.endTime);
            return (
                isWithinInterval(eventStart, { start: dayStart, end: dayEnd }) ||
                isWithinInterval(eventEnd, { start: dayStart, end: dayEnd }) ||
                (isBefore(eventStart, dayStart) && isBefore(dayEnd, eventEnd))
            );
        } catch (error) {
            console.error("Error parsing event dates:", e, error);
            return false;
        }
    });

    const busySlots = relevantEvents.map(event => ({
      start: new Date(event.startTime),
      end: new Date(event.endTime),
    }));

    if (isSameDay(forDate, now)) {
        const startOfToday = new Date(forDate);
        startOfToday.setHours(0,0,0,0);
        if (isBefore(startOfToday, now)) {
            busySlots.push({ start: startOfToday, end: now });
        }
    }
    
    busySlots.sort((a, b) => a.start.getTime() - b.start.getTime());

    const mergedBusySlots = busySlots.reduce((acc, current) => {
      if (acc.length === 0) return [current];
      const last = acc[acc.length - 1];
      if (current.start <= last.end) {
        last.end = max([last.end, current.end]);
      } else {
        acc.push(current);
      }
      return acc;
    }, [] as { start: Date; end: Date }[]);

    const freeSlots = [];
    let lastEnd = startOfDay(forDate);
    
    const workDayStart = new Date(forDate);
    workDayStart.setHours(8, 0, 0, 0);
    
    lastEnd = max([lastEnd, workDayStart]);

    if (isSameDay(forDate, now) && isBefore(lastEnd, now)) {
        lastEnd = now;
    }

    for (const busy of mergedBusySlots) {
      const busyStartInDay = max([busy.start, dayStart]);

      if (busyStartInDay > lastEnd) {
        freeSlots.push({ start: lastEnd, end: busyStartInDay });
      }
      lastEnd = max([lastEnd, busy.end]);
    }

    let endOfWorkDay = new Date(forDate);
    endOfWorkDay.setHours(22,0,0,0); 

    if (endOfWorkDay > lastEnd) {
      freeSlots.push({ start: lastEnd, end: endOfWorkDay });
    }
    
    return freeSlots
      .map(slot => `${format(slot.start, 'HH:mm')} - ${format(slot.end, 'HH:mm')}`)
      .join(', ');
};

const getAvailableTimeSlotsForScheduling = (allEvents: CalendarEvent[]): string => {
    const today = new Date();
    const slotsForPeriod: string[] = [];
    
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timeZoneAbbr = new Date().toLocaleTimeString('en-us',{timeZoneName:'short'}).split(' ')[2];
    
    slotsForPeriod.push(`Timezone: ${timeZone} (${timeZoneAbbr})`);

    for (let i = 0; i < 30; i++) {
        const date = addDays(today, i);
        const dayName = format(date, 'EEEE');
        const dateString = format(date, 'yyyy-MM-dd');
        const dailySlots = getAvailableTimeSlots(date, allEvents);
        if(dailySlots) {
            slotsForPeriod.push(`${dayName}, ${dateString}: ${dailySlots}`);
        }
    }
    return slotsForPeriod.join('\n');
};

function getScheduledAssignmentTitlesFromEvents(events: CalendarEvent[]): Set<string> {
    const titles = new Set<string>();
    const regex = /Original Assignment: (.*)/;

    for (const event of events) {
        if (event.description) {
            const match = event.description.match(regex);
            if (match && match[1]) {
                titles.add(match[1].trim());
            }
        }
    }
    return titles;
}


export default function DashboardClient() {
  const { data: session, status: sessionStatus } = useSession();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [triageAssignments, setTriageAssignments] = useState<Assignment[]>([]);
  const [scheduledAssignments, setScheduledAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<GoogleCourse[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isGoogleDataLoading, setIsGoogleDataLoading] = useState(true);
  
  const fetchGoogleData = useCallback(async (force = false) => {
    if (sessionStatus === 'authenticated' && session?.accessToken) {
      if (!isGoogleDataLoading && !force) return; // Don't refetch if not loading and not forced

      setIsGoogleDataLoading(true);
      try {
        const token = session?.accessToken;
        if (!token) throw new Error("Access token not found");

        const [calendarData, classroomCourses] = await Promise.all([
          getCalendarEvents(token), 
          getGoogleClassroomCourses(token),
        ]);
        
        setCourses(classroomCourses);
        setEvents(calendarData);

        const scheduledInCalendarTitles = getScheduledAssignmentTitlesFromEvents(calendarData);
        
        const classroomAssignmentsData = await getGoogleClassroomAssignments(token, classroomCourses);

        const mappedAssignments: Assignment[] = classroomAssignmentsData.map((work: any) => ({
          id: work.id,
          title: work.title,
          course: work.courseName || 'Unknown Course',
          courseId: work.courseId,
          dueDate: work.dueDate ? formatISO(new Date(work.dueDate.year, work.dueDate.month - 1, work.dueDate.day)) : formatISO(new Date()),
          progress: 0,
          description: work.description || 'No description provided.',
          subTasks: [],
          source: 'google_classroom'
        }));
        
        const scheduledIds = new Set(scheduledAssignments.map(a => a.id));
        
        // Filter out assignments that are already scheduled or whose titles appear in calendar event descriptions
        const newTriage = mappedAssignments.filter(a => 
            !scheduledIds.has(a.id) && !scheduledInCalendarTitles.has(a.title)
        );
        
        // A simple way to avoid adding duplicates to triage
        setTriageAssignments(prev => {
            const existingTriageIds = new Set(prev.map(a => a.id));
            const trulyNew = newTriage.filter(a => !existingTriageIds.has(a.id));
            return [...prev, ...trulyNew];
        });

      } catch (error) {
        console.error("Error fetching Google API data:", error);
        toast({
          variant: "destructive",
          title: "API Error",
          description: "Failed to fetch data from Google services. Please try again later.",
        });
      } finally {
        setIsGoogleDataLoading(false);
      }
    } else if (sessionStatus === 'unauthenticated') {
      setIsGoogleDataLoading(false);
    }
  }, [session, sessionStatus, toast, scheduledAssignments, isGoogleDataLoading]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchGoogleData(true); // Force fetch on initial authentication
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]);

  const scheduleAssignment = (assignment: Assignment) => {
     startTransition(async () => {
      try {
        const homeworkDescription = `
          Course: ${assignment.course}
          Title: ${assignment.title}
          Type: ${assignment.type}
          Description: ${assignment.description}
        `;
        const availableTime = getAvailableTimeSlotsForScheduling(events);
        
        if (!availableTime) {
          toast({
            variant: "destructive",
            title: "No time available",
            description: "Could not find any free time slots in your schedule for the next 30 days.",
          });
          return;
        }

        toast({
          title: "AI is scheduling...",
          description: "Please wait while we find the best time for your tasks.",
        });

        const result = await smartTaskScheduler({
          homeworkDescription: homeworkDescription,
          availableTimeSlots: availableTime,
          estimatedTime: assignment.estimatedTime!,
        });

        if (!result.schedule || !Array.isArray(result.schedule)) {
          throw new Error("AI returned an invalid schedule format.");
        }

        if (!session?.accessToken) {
          throw new Error("Authentication error: No access token available.");
        }

        const newScheduledTasks: ScheduledTask[] = [];

        for (const item of result.schedule) {
            const eventDescription = `AI-generated study block for:
Original Assignment: ${assignment.title}
Type: ${assignment.type}
Total Estimated Time: ${assignment.estimatedTime} minutes
Class: ${assignment.course}`;

            const createdEvent = await createGoogleCalendarEvent(session.accessToken, {
                title: item.task,
                startTime: item.startTime,
                endTime: item.endTime,
                description: eventDescription,
            });

            if (createdEvent && createdEvent.id) {
                 newScheduledTasks.push({
                    id: createdEvent.id,
                    assignmentId: assignment.id,
                    title: item.task,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    status: 'pending',
                });
            }
        }

        setScheduledTasks(prev => [...prev, ...newScheduledTasks]);
        
        toast({
          title: "Scheduling complete!",
          description: `We've added ${result.schedule.length} task(s) to your Google Calendar.`,
        });

        await fetchGoogleData(true);

      } catch (error) {
        console.error("AI scheduling failed:", error);
        toast({
          variant: "destructive",
          title: "AI Scheduling Error",
          description: error instanceof Error ? error.message : "Something went wrong while trying to schedule your task.",
        });
        setScheduledAssignments(prev => prev.filter(a => a.id !== assignment.id));
        setTriageAssignments(prev => [...prev, assignment]);
      }
    });
  }

  const handleAddManualTask = (newTask: Omit<Assignment, 'id' | 'progress' | 'subTasks' | 'source'>) => {
    const assignmentWithId: Assignment = {
      id: `manual-${Date.now()}`,
      ...newTask,
      progress: 0,
      subTasks: [],
      source: 'manual',
    };

    setScheduledAssignments(prev => [...prev, assignmentWithId]);
    scheduleAssignment(assignmentWithId);
  };
  
  const handleUpdateAndScheduleTriageTask = (updatedAssignment: Assignment) => {
    setTriageAssignments(prev => prev.filter(a => a.id !== updatedAssignment.id));
    setScheduledAssignments(prev => [...prev, updatedAssignment]);
    scheduleAssignment(updatedAssignment);
  }

  const handleAddEvent = async (newEvent: Omit<CalendarEvent, 'id' | 'source'>) => {
    startTransition(async () => {
      if (!session?.accessToken) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Could not add event. Please sign in again.",
        });
        return;
      }
      try {
        await createGoogleCalendarEvent(session.accessToken, {
          ...newEvent,
          description: 'Manually added event.',
        });

        toast({
          title: "Event Added",
          description: `${newEvent.title} has been added to your Google Calendar.`,
        });
        
        await fetchGoogleData(true);

      } catch(error) {
        console.error("Error creating Google Calendar event:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create event in Google Calendar.",
        });
      }
    });
  }

  const handleToggleTaskStatus = (taskId: string) => {
    let updatedAssignmentId: string | null = null;
  
    const newScheduledTasks = scheduledTasks.map(task => {
      if (task.id === taskId) {
        updatedAssignmentId = task.assignmentId;
        return { ...task, status: task.status === 'pending' ? 'completed' : 'pending' };
      }
      return task;
    });
  
    setScheduledTasks(newScheduledTasks);
  
    if (updatedAssignmentId) {
      const assignmentId = updatedAssignmentId;
      setScheduledAssignments(prevAssignments => {
        return prevAssignments.map(assignment => {
          if (assignment.id === assignmentId) {
            const relevantTasks = newScheduledTasks.filter(t => t.assignmentId === assignmentId);
            const completedTasks = relevantTasks.filter(t => t.status === 'completed');
            const newProgress = relevantTasks.length > 0 ? Math.round((completedTasks.length / relevantTasks.length) * 100) : 0;
            return { ...assignment, progress: newProgress };
          }
          return assignment;
        });
      });
    }
  };
  
  const isLoading = sessionStatus === 'loading' || isGoogleDataLoading;

  if (isLoading && events.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <p className="text-muted-foreground text-lg">Loading your schedule...</p>
        </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 lg:gap-8">
      <div className="lg:col-span-3 xl:col-span-2 space-y-6">
        <TriageQueue 
            assignments={triageAssignments} 
            onUpdateAssignment={handleUpdateAndScheduleTriageTask}
            isScheduling={isPending}
        />
        <AssignmentList 
            assignments={scheduledAssignments} 
            courses={courses}
            onAddTask={handleAddManualTask} 
            isScheduling={isPending}
        />
        <EventList events={events} onAddEvent={handleAddEvent} isScheduling={isPending} />
      </div>
      <div className="lg:col-span-4 xl:col-span-5">
        <ScheduleView
          events={events}
          scheduledTasks={scheduledTasks}
          onToggleTask={handleToggleTaskStatus}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
        />
      </div>
    </div>
  );
}

    