import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BobbyMessage {
  id: string;
  thread_id: string;
  sender: "user" | "bobby" | "adam";
  content: string;
  status: string;
  action_taken: Record<string, unknown> | null;
  created_at: string;
}

interface BobbyThread {
  id: string;
  property_id: string;
  client_user_id: string;
  last_message_at: string;
}

export function useBobbyThread(propertyId: string | undefined) {
  const { user } = useAuth();
  const [thread, setThread] = useState<BobbyThread | null>(null);
  const [messages, setMessages] = useState<BobbyMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!propertyId || !user?.id || propertyId.startsWith("mock-")) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const init = async () => {
      const { data: existing } = await supabase
        .from("bobby_threads")
        .select("*")
        .eq("property_id", propertyId)
        .limit(1)
        .single();

      if (cancelled) return;

      let threadRow = existing;
      if (!threadRow) {
        const { data: created } = await supabase
          .from("bobby_threads")
          .insert({ property_id: propertyId, client_user_id: user.id })
          .select()
          .single();
        threadRow = created;
      }

      if (!threadRow || cancelled) {
        setIsLoading(false);
        return;
      }

      setThread(threadRow as BobbyThread);

      const { data: msgs } = await supabase
        .from("bobby_messages")
        .select("*")
        .eq("thread_id", threadRow.id)
        .order("created_at", { ascending: true });

      if (!cancelled) {
        setMessages((msgs || []) as BobbyMessage[]);
        setIsLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [propertyId, user?.id]);

  useEffect(() => {
    if (!thread?.id) return;

    const channel = supabase
      .channel(`bobby-${thread.id}`)
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "bobby_messages", filter: `thread_id=eq.${thread.id}` },
        (payload: { new: BobbyMessage }) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [thread?.id]);

  const sendMessage = useCallback(async (content: string) => {
    if (!thread?.id) return;

    await supabase.from("bobby_messages").insert({
      thread_id: thread.id,
      sender: "user",
      content,
    });

    await supabase
      .from("bobby_threads")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", thread.id);

    // Build conversation history for the agent
    const history = messages.slice(-10).map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.content,
    }));

    // Trigger agent response and persist reply
    try {
      const { data } = await supabase.functions.invoke("hbc-agent", {
        body: {
          message: content,
          history,
          context: {
            currentEntityType: "property",
            currentEntityId: thread.property_id,
            propertyId: thread.property_id,
          },
        },
      });

      if (data?.reply) {
        await supabase.from("bobby_messages").insert({
          thread_id: thread.id,
          sender: "bobby",
          content: data.reply,
        });
      }
    } catch {
      await supabase.from("bobby_messages").insert({
        thread_id: thread.id,
        sender: "bobby",
        content: "I had trouble processing that. Please try again.",
        status: "sent",
      });
    }
  }, [thread, messages]);

  return { thread, messages, isLoading, sendMessage };
}
