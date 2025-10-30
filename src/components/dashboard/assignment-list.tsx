
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Clock, Calendar } from 'lucide-react';
import type { Assignment, GoogleCourse } from '@/lib/types';
import AddTaskDialog from './add-task-dialog';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

type AssignmentListProps = {
  assignments: Assignment[];
  onAddTask: (task: Omit<Assignment, 'id' | 'progress' | 'subTasks' | 'source'>) => void;
  isScheduling: boolean;
  courses: GoogleCourse[];
};

export default function AssignmentList({ assignments, onAddTask, isScheduling, courses }: AssignmentListProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Scheduled Homework</CardTitle>
            <CardDescription>Your current assignments being worked on.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Homework
          </Button>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-6">
              <p>No assignments have been scheduled yet.</p>
              <p>Add homework or review items from your queue.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map(assignment => (
                <div key={assignment.id} className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="font-semibold">{assignment.title}</div>
                    <div className="text-sm text-muted-foreground">{assignment.course}</div>
                  </div>
                   <div className="text-xs text-muted-foreground mt-1">{assignment.type} - {assignment.estimatedTime} mins</div>
                  <div className="my-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-medium">{assignment.progress}%</span>
                    </div>
                    <Progress value={assignment.progress} className="h-2" />
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due {format(parseISO(assignment.dueDate), 'MMM d')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(parseISO(assignment.dueDate), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <AddTaskDialog 
        open={isDialogOpen} 
        onOpenChange={setDialogOpen} 
        onAddTask={onAddTask}
        isScheduling={isScheduling}
        courses={courses}
      />
    </>
  );
}
