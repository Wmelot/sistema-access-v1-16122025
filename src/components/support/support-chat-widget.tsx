'use client';

import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, X, Send, Bot, User, Minimize2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils'; // Assuming generic utility exists

export function SupportChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
    });
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-white z-50 animate-in fade-in zoom-in duration-300"
                size="icon"
            >
                <MessageSquare className="h-7 w-7" />
                <span className="sr-only">Abrir Suporte IA</span>
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-6 right-6 w-[350px] md:w-[400px] h-[550px] shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 border-primary/20">
            <CardHeader className="bg-primary text-primary-foreground p-4 rounded-t-xl flex flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Bot className="h-6 w-6" />
                    <div>
                        <CardTitle className="text-base">Access IA</CardTitle>
                        <CardDescription className="text-primary-foreground/80 text-xs">
                            Assistente Virtual 24h
                        </CardDescription>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
                    onClick={() => setIsOpen(false)}
                >
                    <X className="h-5 w-5" />
                </Button>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative bg-muted/5">
                <div className="h-full overflow-y-auto p-4" ref={scrollRef}>
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6 opacity-70 mt-20">
                            <Bot className="h-12 w-12 mb-4 text-primary/40" />
                            <p className="text-sm">Olá! Sou a IA do Access Fisio.</p>
                            <p className="text-xs mt-2">Pergunte-me sobre agenda, financeiro ou configurações.</p>
                        </div>
                    )}

                    <div className="space-y-4 pb-4">
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={cn(
                                    "flex w-max max-w-[85%] flex-col gap-2 rounded-lg px-3 py-2 text-sm shadow-sm",
                                    m.role === 'user'
                                        ? "ml-auto bg-primary text-primary-foreground"
                                        : "bg-white border text-foreground"
                                )}
                            >
                                {m.content}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex w-max max-w-[85%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-white border text-muted-foreground">
                                <span className="flex gap-1">
                                    <span className="animate-bounce">.</span>
                                    <span className="animate-bounce delay-100">.</span>
                                    <span className="animate-bounce delay-200">.</span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-3 bg-background border-t shrink-0">
                <form onSubmit={handleSubmit} className="flex w-full gap-2">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Como eu agendo um paciente?"
                        className="flex-1 focus-visible:ring-primary"
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
