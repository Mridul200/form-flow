import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/stats";

export function ChatPanel({ requestId, selfId }: { requestId: string; selfId: string }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data: messages } = useQuery({
    queryKey: ["messages", requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${requestId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `request_id=eq.${requestId}` },
        () => qc.invalidateQueries({ queryKey: ["messages", requestId] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [requestId, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    await supabase.from("messages").insert({ request_id: requestId, sender_id: selfId, text: body });
    qc.invalidateQueries({ queryKey: ["messages", requestId] });
  }

  return (
    <div className="surface-card flex h-[28rem] flex-col">
      <div className="border-b border-border px-4 py-3 text-sm font-semibold">Secure chat</div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages?.length ? (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                m.sender_id === selfId
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              <p className="mt-1 text-[10px] opacity-70">{formatDateTime(m.created_at)}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No messages yet — say hello.</p>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          aria-label="Message"
        />
        <Button type="submit" size="icon" aria-label="Send">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}

export function VideoCallPanel({ room }: { room: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold">Video call</span>
        <Button size="sm" variant={open ? "outline" : "default"} onClick={() => setOpen(!open)}>
          <Video className="mr-1 size-4" />
          {open ? "Leave room" : "Start call"}
        </Button>
      </div>
      {open ? (
        <iframe
          title="Video call"
          allow="camera; microphone; fullscreen; display-capture"
          src={`https://meet.jit.si/${room}#config.prejoinPageEnabled=false`}
          className="h-[28rem] w-full border-0"
        />
      ) : (
        <p className="p-6 text-sm text-muted-foreground">
          Opens a private room for this doctor–patient pair. No scheduling needed.
        </p>
      )}
    </div>
  );
}
