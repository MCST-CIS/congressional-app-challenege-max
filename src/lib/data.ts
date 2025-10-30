import { Assignment, CalendarEvent } from '@/lib/types';
import { addDays, addHours, formatISO, startOfHour } from 'date-fns';

const now = new Date();

export const getInitialAssignments = (): Assignment[] => [];

export const getInitialEvents = (): CalendarEvent[] => {
    return []
};
