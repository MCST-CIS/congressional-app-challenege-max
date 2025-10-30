import type { CalendarEvent, GoogleCourse } from '@/lib/types';
import { formatISO, addDays, startOfDay, endOfDay } from 'date-fns';

async function getGoogleApiData(url: string, accessToken: string) {
    if (!accessToken) {
        console.error("No access token provided for Google API call.");
        return null;
    }

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        console.error(`Failed to fetch Google API data from ${url}: ${response.status} ${response.statusText}`);
        const errorBody = await response.text();
        console.error('Error body:', errorBody);
        return null;
    }

    return response.json();
}

export async function createGoogleCalendarEvent(accessToken: string, event: Omit<CalendarEvent, 'id' | 'source'> & { description: string }) {
    if (!accessToken) {
        console.error("No access token provided for Google API call.");
        return null;
    }

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            summary: event.title,
            description: event.description,
            start: {
                dateTime: event.startTime,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
                dateTime: event.endTime,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
        }),
    });

    if (!response.ok) {
        console.error(`Failed to create Google Calendar event: ${response.status} ${response.statusText}`);
        const errorBody = await response.text();
        console.error('Error body:', errorBody);
        return null;
    }

    return response.json();
}


export async function getCalendarEvents(accessToken: string, daysInTheFuture?: number): Promise<CalendarEvent[]> {
    try {
        let url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime`;
        
        if(daysInTheFuture !== undefined) {
            const now = new Date();
            const timeMin = startOfDay(now);
            const timeMax = endOfDay(addDays(timeMin, daysInTheFuture - 1));
            const timeMinParam = `timeMin=${timeMin.toISOString()}`;
            const timeMaxParam = `timeMax=${timeMax.toISOString()}`;
            url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${timeMinParam}&${timeMaxParam}&singleEvents=true&orderBy=startTime`;
        }

        const data = await getGoogleApiData(url, accessToken);

        if (!data || !data.items) {
          return [];
        }

        const googleEvents: CalendarEvent[] = data.items.map((event: any) => ({
            id: event.id,
            title: event.summary,
            startTime: event.start.dateTime || event.start.date,
            endTime: event.end.dateTime || event.end.date,
            source: 'google_calendar',
            description: event.description
        }));
        
        return googleEvents;

    } catch (error) {
        console.error("Error processing calendar events:", error);
        return [];
    }
}

export async function getGoogleClassroomCourses(accessToken: string): Promise<GoogleCourse[]> {
    try {
        const coursesData = await getGoogleApiData('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', accessToken);
        if (!coursesData || !coursesData.courses) {
            return [];
        }
        return coursesData.courses.map((course: any) => ({
            id: course.id,
            name: course.name,
        }));
    } catch(error) {
        console.error("Error fetching classroom courses:", error);
        return [];
    }
}

export async function getGoogleClassroomAssignments(accessToken: string, courses: GoogleCourse[]) {
    try {
        const allAssignments = [];
        for (const course of courses) {
            try {
                const courseWorkData = await getGoogleApiData(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork?courseWorkStates=PUBLISHED`, accessToken);
                if (courseWorkData && courseWorkData.courseWork) {
                    const relevantWork = courseWorkData.courseWork.filter((work: any) => work.workType === 'ASSIGNMENT' && work.maxPoints > 0);
                    
                    for (const work of relevantWork) {
                         const submissionsData = await getGoogleApiData(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork/${work.id}/studentSubmissions?userId=me`, accessToken);

                        if (submissionsData && submissionsData.studentSubmissions) {
                            const submission = submissionsData.studentSubmissions[0];
                            if (submission.state !== 'RETURNED' || (submission.state === 'RETURNED' && !submission.assignedGrade)) {
                                allAssignments.push({
                                    ...work,
                                    courseName: course.name,
                                });
                            }
                        } else {
                            allAssignments.push({
                                ...work,
                                courseName: course.name,
                            });
                        }
                    }
                }
            } catch (courseError) {
                console.error(`Error fetching assignments for course ${course.id}:`, courseError);
            }
        }

        return allAssignments;

    } catch (error) {
        console.error("Error fetching classroom assignments:", error);
        return [];
    }
}

    