import { createClient } from "@/lib/supabase/client";

interface BroadcastOptions {
  unitId: string;
  event: string; // 'ping', 'run_ctrader', 'run_tradelocker'
  payload?: any;
  timeoutMs?: number;
  expectedReplyEvent?: string; // 'pong' or 'trade_result', auto-inferred if omitted
}

/**
 * Sends a real-time broadcast to a specific unit and waits for the response securely.
 */
export const broadcastToUnit = async ({
  unitId,
  event,
  payload = {},
  timeoutMs = 5000,
  expectedReplyEvent,
}: BroadcastOptions): Promise<any> => {
  const supabase = createClient();
  const channelName = `unit_${unitId}`;
  
  // Use native cryptographic random UUID for mapping asynchronous responses
  const transaction_id = crypto.randomUUID();
  
  // Predict expected reply event based on the outbound event if not explicitly provided
  const listenEvent = expectedReplyEvent || (event === "ping" ? "pong" : "trade_result");

  return new Promise((resolve, reject) => {
    // Reference the exact channel for this unit
    const channel = supabase.channel(channelName);

    const cleanup = () => {
      clearTimeout(timeoutId);
      // Remove channel to prevent memory leaks in the browser
      supabase.removeChannel(channel);
    };

    // Fail gracefully if the listener python script is offline or lags out
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout: No response from unit ${unitId} within ${timeoutMs / 1000}s on event '${event}'. The machine might be offline.`));
    }, timeoutMs);

    // Set up the listener for the reply BEFORE subscribing
    channel.on(
      "broadcast",
      { event: listenEvent },
      (responsePayload) => {
        const data = responsePayload.payload || {};
        // The python app replies with either 'transaction_id' (trades) or 'reply_to' (pings)
        if (
          data.transaction_id === transaction_id || 
          data.reply_to === transaction_id
        ) {
          cleanup();
          resolve(data); // Returns the response payload containing {"guid", "result", etc.}
        }
      }
    );

    // Subscribe to the channel and send the payload once fully connected
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: event,
          payload: {
            ...payload,
            transaction_id, // Important: Inject transaction ID so machine knows who to reply to
          },
        }).catch((err) => {
          cleanup();
          reject(new Error(`Failed to send broadcast over WebSocket: ${err.message}`));
        });
      } else if (status === "CHANNEL_ERROR") {
        cleanup();
        reject(new Error("Supabase Realtime channel error. Could not connect to WebSocket."));
      } else if (status === "CLOSED") {
           // Closed manually, do nothing
      }
    });
  });
};
