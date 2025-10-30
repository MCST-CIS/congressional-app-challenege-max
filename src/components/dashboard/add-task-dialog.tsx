
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Assignment, GoogleCourse } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useState } from 'react';

const assignmentTypes = ['Homework', 'Project', 'Essay', 'Quiz', 'Test', 'Reading'] as const;

type AddTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTask: (task: Omit<Assignment, 'id' | 'progress' | 'subTasks' | 'source'>) => void;
  isScheduling: boolean;
  courses: GoogleCourse[];
};

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  course: z.string({required_error: "Please select a course."}),
  courseOther: z.string().optional(),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  description: z.string().min(10, 'Description must be at least 10 characters to help the AI.'),
  type: z.string({required_error: "Please select an assignment type."}),
  typeOther: z.string().optional(),
  estimatedTime: z.coerce.number().min(5, "Estimated time must be at least 5 minutes."),
}).refine(data => data.course !== 'Other' || (data.course === 'Other' && data.courseOther && data.courseOther.length > 0), {
    message: 'Please specify the course name.',
    path: ['courseOther'],
}).refine(data => data.type !== 'Other' || (data.type === 'Other' && data.typeOther && data.typeOther.length > 0), {
    message: 'Please specify the assignment type.',
    path: ['typeOther'],
});


type FormValues = z.infer<typeof formSchema>;

export default function AddTaskDialog({ open, onOpenChange, onAddTask, isScheduling, courses }: AddTaskDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      course: '',
      description: '',
    },
  });

  const watchCourse = form.watch('course');
  const watchType = form.watch('type');

  const onSubmit = (values: FormValues) => {
    const finalValues = {
        ...values,
        course: values.course === 'Other' ? values.courseOther! : values.course,
        type: values.type === 'Other' ? values.typeOther! : values.type as any,
    };

    const { courseOther, typeOther, ...taskData } = finalValues;

    onAddTask({
      ...taskData,
      dueDate: taskData.dueDate.toISOString(),
    });

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Homework</DialogTitle>
          <DialogDescription>
            Fill in the details of your homework. The AI will schedule it for you.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Chapter 5 Reading" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="course"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.name}>{course.name}</SelectItem>
                        ))}
                        <SelectItem value="Other">Other...</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignment Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assignmentTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                          <SelectItem value="Other">Other...</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
             
              {watchCourse === 'Other' && (
                  <FormField
                  control={form.control}
                  name="courseOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Course Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Advanced Pottery" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            
            {watchType === 'Other' && (
                <FormField
                control={form.control}
                name="typeOther"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Assignment Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Diorama" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
             <div className="grid grid-cols-2 gap-4 items-end">
                <FormField
                    control={form.control}
                    name="estimatedTime"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Est. Time (minutes)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 60" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0,0,0,0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide details for the AI to create a smart schedule..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                   <FormDescription>This helps the AI break down your task.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isScheduling}>
                {isScheduling ? 'Scheduling with AI...' : 'Add and Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
