'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import withAuth from '@/firebase/auth/with-auth';
import { Loader2, Calendar as CalendarIcon, Wand2, AlertCircle, PlusCircle, Sparkles } from 'lucide-react';
import { getCalendarEvents, createCalendarEvent, findOptimalTime } from '@/ai/flows/calendar-flow';

interface CalendarEvent {
    summary: string;
    start: string;
    end: string;
    link: string;
}

function CalendarPage() {
    const { workAccessToken, personalAccessToken, signInWithGoogle, workProvider, personalProvider } = useUser();
    const { toast } = useToast();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [isFindingTime, setIsFindingTime] = useState(false);
    const [optimalTime, setOptimalTime] = useState<string | null>(null);
    const [error, setError] = useState('');

    const accessToken = workAccessToken || personalAccessToken;
    const connectedAccount = workProvider ? 'Work' : personalProvider ? 'Account' : null;

    const fetchEvents = async () => {
        if (!accessToken) {
            toast({ variant: 'destructive', title: 'Not Connected' });
            return;
        }
        setIsLoadingEvents(true);
        setError('');
        try {
            const result = await getCalendarEvents({ accessToken });
            setEvents(result.events);
        } catch (e: any) {
            setError('Failed to fetch calendar events. Your token may have expired.');
            console.error(e);
        } finally {
            setIsLoadingEvents(false);
        }
    };
    
    useEffect(() => {
        if (accessToken) {
            fetchEvents();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken]);


    const handleCreateEvent = async () => {
        const prompt = (document.getElementById('event-prompt') as HTMLInputElement).value;
        if (!prompt || !accessToken) {
            toast({ variant: 'destructive', title: 'Please provide an event description.' });
            return;
        }
        setIsCreatingEvent(true);
        setError('');
        try {
            const result = await createCalendarEvent({ prompt, accessToken });
            toast({
                title: 'Event Created!',
                description: `"${result.summary}" has been added to your calendar.`,
            });
            fetchEvents(); // Refresh events list
        } catch (e: any) {
            setError('Failed to create event.');
            console.error(e);
        } finally {
            setIsCreatingEvent(false);
        }
    };

    const handleFindTime = async () => {
        const prompt = (document.getElementById('find-time-prompt') as HTMLInputElement).value;
        if (!prompt || !accessToken) {
            toast({ variant: 'destructive', title: 'Please provide a description for the meeting.' });
            return;
        }
        setIsFindingTime(true);
        setOptimalTime(null);
        setError('');
        try {
            const result = await findOptimalTime({ prompt, accessToken });
            setOptimalTime(result.bestTime);
            toast({
                title: 'Found a time!',
                description: `Suggested time: ${new Date(result.bestTime).toLocaleString()}`,
            });
        } catch (e: any) {
            setError('Failed to find an optimal time.');
            console.error(e);
        } finally {
            setIsFindingTime(false);
        }
    }

    const handleConnect = async (accountType: 'work' | 'personal') => {
      toast({ title: 'Connecting to Google...', description: 'Please follow the prompts.'});
      try {
        await signInWithGoogle(accountType);
        toast({ title: 'Successfully connected!', description: 'You can now use the Calendar features.'});
      } catch(e: any) {
        toast({ variant: 'destructive', title: 'Connection Failed', description: e.message });
      }
    }
    
    return (
        <div className="relative min-h-screen w-full pt-16">
          <div className="bg-aurora"></div>
          <div className="relative container mx-auto py-12 px-4 md:px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold font-headline">Calendar Assistant</h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                Manage your schedule with natural language.
              </p>
            </div>
    
            {!connectedAccount ? (
                <Card className="max-w-xl mx-auto text-center p-8">
                    <CardHeader>
                        <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <CardTitle>Connect your Google Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-6 text-muted-foreground">You need to authorize Ryzor to access your Google Calendar.</p>
                        <div className="flex gap-4 justify-center">
                            <Button onClick={() => handleConnect('work')}>Connect Work Account</Button>
                            <Button onClick={() => handleConnect('personal')}>Connect Personal Account</Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Events</CardTitle>
                     <p className="text-sm text-muted-foreground">Connected Account: {connectedAccount}</p>
                  </CardHeader>
                  <CardContent>
                    {error && (
                      <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm flex items-center gap-3 mb-4">
                        <AlertCircle className="h-5 w-5"/>
                        {error}
                      </div>
                    )}
                    <ScrollArea className="h-96">
                      {isLoadingEvents ? (
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : events.length > 0 ? (
                        <ul className="space-y-4">
                          {events.map((event, i) => (
                            <li key={i} className="p-3 bg-background/50 rounded-lg border">
                              <a href={event.link} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{event.summary}</a>
                              <p className="text-sm text-muted-foreground">
                                {new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleTimeString()}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-center text-muted-foreground pt-16">No upcoming events found.</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
    
                <div className="space-y-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>Create New Event</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Input id="event-prompt" placeholder="e.g., 'Meeting with John tomorrow at 2pm for 1 hour'" />
                          <Button onClick={handleCreateEvent} disabled={isCreatingEvent}>
                            {isCreatingEvent ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Describe an event and the AI will add it to your calendar.</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Find Best Time for a Meeting</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Input id="find-time-prompt" placeholder="e.g., '30 minute coffee chat with Sarah next week'" />
                          <Button onClick={handleFindTime} disabled={isFindingTime}>
                            {isFindingTime ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">The AI will look at your calendar and suggest an open slot.</p>
                        {optimalTime && (
                            <div className="mt-4 p-3 bg-primary/10 rounded-lg text-sm">
                                <p className="font-semibold">Suggested Time:</p>
                                <p>{new Date(optimalTime).toLocaleString()}</p>
                            </div>
                        )}
                      </CardContent>
                    </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      );
}

export default withAuth(CalendarPage);
