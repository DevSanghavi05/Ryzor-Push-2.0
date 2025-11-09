
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import withAuth from '@/firebase/auth/with-auth';
import { Loader2, Calendar as CalendarIcon, Wand2, AlertCircle, PlusCircle, Sparkles, Plus, Clock, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { getCalendarEvents, createCalendarEvent, findOptimalTime } from '@/ai/flows/calendar-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';

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
    const [currentDate, setCurrentDate] = useState(new Date());

    const accessToken = workAccessToken || personalAccessToken;
    const connectedAccount = workProvider ? 'Work' : personalProvider ? 'Personal' : null;

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
            (document.getElementById('event-prompt') as HTMLInputElement).value = '';
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
             (document.getElementById('find-time-prompt') as HTMLInputElement).value = '';
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
            {!connectedAccount ? (
                <div className="flex h-[70vh] items-center justify-center">
                    <Card className="max-w-xl mx-auto text-center p-8 bg-card/50 backdrop-blur-sm">
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
                </div>
            ) : (
              <div className="h-[80vh] flex border bg-card/80 text-card-foreground backdrop-blur-sm rounded-lg shadow-lg">
                {/* Sidebar */}
                <div className="w-72 border-r p-4 flex flex-col gap-4">
                  <Button size="lg" className="rounded-full h-14 text-lg justify-start pl-6">
                    <Plus className="mr-3 h-6 w-6"/> Create
                  </Button>
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(day) => day && setCurrentDate(day)}
                    className="p-0 [&_td]:w-10 [&_td]:h-10"
                  />
                  <Separator />
                   {optimalTime && (
                        <div className="mt-3 p-3 bg-primary/10 rounded-lg text-sm space-y-1">
                            <p className="font-semibold text-primary flex items-center gap-2"><Sparkles className="h-4 w-4"/> Suggested Time:</p>
                            <p className="text-foreground">{new Date(optimalTime).toLocaleString()}</p>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    <div className="p-3 border-b flex items-center justify-between gap-2">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-medium">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon"><ChevronLeft className="h-5 w-5" /></Button>
                                <Button variant="ghost" size="icon"><ChevronRight className="h-5 w-5" /></Button>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Connected Account: {connectedAccount}</p>
                    </div>

                    <div className="p-4 border-b space-y-4">
                        <div className="flex items-center gap-2">
                            <Input id="event-prompt" placeholder="Use AI to create an event (e.g., 'Team sync tomorrow at 10am')" className="text-sm" />
                            <Button onClick={handleCreateEvent} disabled={isCreatingEvent}>
                              {isCreatingEvent ? <Loader2 className="h-4 w-4 animate-spin" /> : <><PlusCircle className="h-4 w-4 mr-2" /> Add Event</>}
                            </Button>
                        </div>
                         <div className="flex items-center gap-2">
                            <Input id="find-time-prompt" placeholder="Find the best time for... (e.g., 'A 30 min chat next week')" className="text-sm" />
                            <Button onClick={handleFindTime} disabled={isFindingTime}>
                              {isFindingTime ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-2" /> Find Time</>}
                            </Button>
                        </div>
                    </div>


                     {error && (
                      <div className="m-4 bg-destructive/10 text-destructive p-4 rounded-md text-sm flex items-center gap-3">
                        <AlertCircle className="h-5 w-5"/>
                        {error}
                      </div>
                    )}

                    <ScrollArea className="flex-1">
                      <div className="p-4">
                        <h3 className="font-semibold mb-4 text-lg">Upcoming Events</h3>
                        {isLoadingEvents ? (
                          <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : events.length > 0 ? (
                          <ul className="space-y-4">
                            {events.map((event, i) => (
                              <li key={i} className="p-4 bg-secondary/30 rounded-lg border hover:bg-secondary/50 transition-colors">
                                <a href={event.link} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:underline">{event.summary}</a>
                                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(event.start).toLocaleString([], { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-center text-muted-foreground py-16">
                            <CalendarIcon className="mx-auto h-12 w-12 mb-4"/>
                            <p>No upcoming events found in your primary calendar.</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </div>
      );
}

export default withAuth(CalendarPage);

    