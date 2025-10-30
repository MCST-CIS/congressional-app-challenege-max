
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Assignment } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';

const assignmentTypes = ['Homework', 'Project', 'Essay', 'Quiz', 'Test', 'Reading'] as const;

const formSchema = z.object({
  type: z.string({ required_error: "Please select an assignment type." }),
  typeOther: z.string().optional(),
  estimatedTime: z.coerce.number().min(5, "Estimated time must be at least 5 minutes."),
}).refine(data => data.type !== 'Other' || (data.type === 'Other' && data.typeOther && data.typeOther.length > 0), {
    message: 'Please specify the assignment type.',
    path: ['typeOther'],
});


type FormValues = z.infer<typeof formSchema>;

type TriageQueueProps = {
  assignments: Assignment[];
  onUpdateAssignment: (assignment: Assignment) => void;
  isScheduling: boolean;
};

function TriageForm({ assignment, onUpdateAssignment, isScheduling }: { assignment: Assignment, onUpdateAssignment: (assignment: Assignment) => void, isScheduling: boolean }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: assignment.type,
      estimatedTime: assignment.estimatedTime,
    },
  });

  const watchType = form.watch('type');

  const onSubmit = (values: FormValues) => {
    const finalType = values.type === 'Other' ? values.typeOther! : values.type;
    const updatedAssignment: Assignment = {
      ...assignment,
      type: finalType as any,
      estimatedTime: values.estimatedTime,
    };
    onUpdateAssignment(updatedAssignment);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 bg-muted/50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
        
        <Button type="submit" disabled={isScheduling} className="w-full">
          {isScheduling ? 'Scheduling...' : `Update & Schedule`}
        </Button>
      </form>
    </Form>
  );
}

export default function TriageQueue({ assignments, onUpdateAssignment, isScheduling }: TriageQueueProps) {
  if (assignments.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-amber-600'>Needs Your Input</CardTitle>
        <CardDescription>These items need more details before they can be scheduled.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {assignments.map(assignment => (
            <AccordionItem value={assignment.id} key={assignment.id}>
              <AccordionTrigger>
                <div className="flex flex-col text-left">
                  <span className="font-semibold">{assignment.title}</span>
                  <span className="text-sm text-muted-foreground">{assignment.course} - Due {format(parseISO(assignment.dueDate), 'MMM d')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className='text-sm text-muted-foreground p-4 pt-0'>{assignment.description}</p>
                <TriageForm assignment={assignment} onUpdateAssignment={onUpdateAssignment} isScheduling={isScheduling} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

    