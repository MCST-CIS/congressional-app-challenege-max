
'use client';

import Header from '@/components/layout/header';
import DashboardClient from '@/components/dashboard/dashboard-client';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { CheckCircle } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col">
        {status === 'loading' && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Loading your session...</p>
          </div>
        )}
        {status === 'unauthenticated' && (
          <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
            <div className="max-w-4xl mx-auto">
              <section className="grid md:grid-cols-2 gap-8 items-center">
                <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Stop Procrastinating.
                    <br />
                    <span className="text-primary">Start Achieving.</span>
                  </h1>
                  <p className="max-w-md text-lg text-muted-foreground">
                    Our AI-powered scheduler analyzes your homework, syncs with your Google Calendar, and builds a smart study plan to help you conquer your workload.
                  </p>
                  <Button size="lg" onClick={() => signIn('google')}>
                    Sign in with Google to Get Started
                  </Button>
                </div>
                <div className="relative h-64 md:h-96 w-full rounded-xl overflow-hidden shadow-2xl">
                    <Image
                        src="https://picsum.photos/seed/planner/800/600"
                        alt="A student's organized desk with a planner"
                        fill
                        data-ai-hint="organized desk"
                        className="object-cover"
                    />
                </div>
              </section>
              <section className="mt-20">
                <h2 className="text-3xl font-bold tracking-tight mb-8">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center space-y-2">
                    <CheckCircle className="h-10 w-10 text-accent" />
                    <h3 className="font-semibold text-lg">Sync Your Life</h3>
                    <p className="text-muted-foreground text-sm">Connect your Google Calendar and Classroom to see all your commitments and assignments in one place.</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <CheckCircle className="h-10 w-10 text-accent" />
                    <h3 className="font-semibold text-lg">Add Your Tasks</h3>
                    <p className="text-muted-foreground text-sm">Input your homework details. Our AI analyzes the work and estimates the time needed.</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <CheckCircle className="h-10 w-10 text-accent" />
                    <h3 className="font-semibold text-lg">Get Your Plan</h3>
                    <p className="text-muted-foreground text-sm">Receive an optimized schedule with study blocks that fit perfectly into your free time.</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
        {status === 'authenticated' && (
          <div className="p-4 md:p-6">
            <DashboardClient />
          </div>
        )}
      </main>
    </div>
  );
}
