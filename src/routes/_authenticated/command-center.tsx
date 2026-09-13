import { createFileRoute } from '@tanstack/react-router';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isToolUIPart, getToolName } from 'ai';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, Square, Sparkles, ScanLine, Users, PhoneCall, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { CommandResults } from '@/components/command-center/CommandResults';
import { supabase } from '@/integrations/supabase/client';
import { errorMessage } from '@/lib/app-errors';
import { useRouteContext } from './route';

export const Route = createFileRoute('/_authenticated/command-center')({
  head: () => ({ meta: [
    { title: 'Command Center | MediCall' },
    { name: 'description', content: 'Coordinate FDA recall checks, patient reviews and confirmed outreach with MediCall’s Gemini command center.' },
    { property: 'og:title', content: 'MediCall Command Center' },
    { property: 'og:description', content: 'An AI-assisted workspace for pharmacy recall response and patient outreach.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }), component: CommandCenter,
});
const transport = new DefaultChatTransport({ api: '/api/command', headers: async () => {
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token ?? ''}` };
} });
const suggestions = [
  { icon: ScanLine, text: 'Check recalls and identify affected patients' },
  { icon: Users, text: 'Prioritize flagged patients by recall severity' },
  { icon: PhoneCall, text: 'Prepare outreach for flagged patients' },
];
function CommandCenter() {
  const { session } = useRouteContext();
  const { messages, sendMessage, status, stop, error, setMessages, clearError } = useChat({ transport });
  const [input, setInput] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const busy = status === 'submitted' || status === 'streaming';
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [messages, status]);
  function send(text: string) { if (!text.trim() || busy) return; clearError(); void sendMessage({ text }); setInput(''); }
  return <AppShell title="Command center" subtitle="MediCall intelligence · Gemini 3.1 Pro Preview" session={session}>
    <div className="flex items-center justify-between border-b pb-4"><div className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-primary" />{busy ? 'Workflow running' : 'Ready'}<span className="ml-3 text-muted-foreground">Pharmacist-led decisions</span></div><Button variant="ghost" size="sm" disabled={busy} onClick={() => { setMessages([]); clearError(); }}><Plus className="h-4 w-4" />New conversation</Button></div>
    <div className="mx-auto flex min-h-[60dvh] max-w-4xl flex-col">
      <div className="flex-1 space-y-6 pb-6" aria-live="polite">
        {!messages.length && <div className="py-12 sm:py-16"><Sparkles className="mb-5 h-9 w-9 text-primary" /><h2 className="font-display text-2xl font-semibold">What needs your attention today?</h2><div className="mt-8 grid gap-3 sm:grid-cols-3">{suggestions.map(s => <Button key={s.text} variant="outline" className="h-auto min-h-28 flex-col items-start justify-start gap-4 whitespace-normal p-4 text-left" onClick={() => send(s.text)}><s.icon className="h-5 w-5 text-primary" /><span>{s.text}</span></Button>)}</div></div>}
        {messages.map(message => <article key={message.id} className={message.role === 'user' ? 'ml-auto max-w-[90%] rounded-lg bg-secondary px-5 py-4' : 'space-y-4 border-b pb-6'}>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{message.role === 'user' ? 'You' : 'MediCall'}</p>
          {message.parts.map((part, i) => {
            if (part.type === 'text') return <div key={i} className="space-y-3 break-words text-sm leading-7 [&_a]:text-primary [&_a]:underline [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc [&_p]:mb-3"><ReactMarkdown>{part.text}</ReactMarkdown></div>;
            if (part.type === 'reasoning') return <details key={i} className="text-xs text-muted-foreground"><summary className="cursor-pointer">Thinking</summary><ReactMarkdown>{part.text}</ReactMarkdown></details>;
            if (isToolUIPart(part)) { const done = part.state === 'output-available'; return <div key={i} className="rounded-md border px-4 py-3"><div className="flex items-center gap-2 text-xs font-medium">{done ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Loader2 className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />}{getToolName(part).replaceAll('_', ' ')} · {done ? 'Complete' : part.state === 'output-error' ? 'Failed' : busy ? 'Working' : 'Stopped'}</div>{part.state === 'output-error' && <p role="alert" className="mt-2 text-sm text-destructive">{errorMessage(new Error(part.errorText))}</p>}{done && <CommandResults output={part.output} />}</div>; }
            return null;
          })}
        </article>)}
        {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Working on your request…</div>}
        {error && <p role="alert" className="rounded-md border border-destructive/30 p-4 text-sm text-destructive">{errorMessage(error)}</p>}
        <div ref={end} />
      </div>
      <form className="sticky bottom-0 border-t bg-background py-4" onSubmit={e => { e.preventDefault(); send(input); }}><div className="flex items-end gap-3 rounded-lg border bg-card p-3 shadow-sm"><textarea aria-label="Command" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask MediCall to check, review, or prepare outreach…" rows={2} className="min-w-0 flex-1 resize-none bg-transparent p-1 text-sm outline-none" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }} />{busy ? <Button type="button" size="icon" variant="outline" aria-label="Stop workflow" onClick={() => stop()}><Square className="h-4 w-4" /></Button> : <Button size="icon" type="submit" disabled={!input.trim()} aria-label="Send command"><ArrowUp className="h-4 w-4" /></Button>}</div><p className="mt-2 text-center text-xs text-muted-foreground">Demo patient data · Clinical review required · Calls need confirmation</p></form>
    </div>
  </AppShell>;
}
