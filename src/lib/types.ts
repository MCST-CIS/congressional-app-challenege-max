

export type Assignment = {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  progress: number;
  description: string;
  subTasks: ScheduledTask[];
  source: 'manual' | 'google_classroom';
  type?: 'Homework' | 'Project' | 'Essay' | 'Quiz' | 'Test' | 'Reading';
  estimatedTime?: number; // in minutes
  courseId?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  source: 'manual' | 'google_calendar';
  description?: string;
};

export type ScheduledTask = {
  id: string;
  assignmentId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'completed';
};

export type GoogleCourse = {
    id: string;
    name: string;
}

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
    user?: any;
    error?: string;
  }
}

    
