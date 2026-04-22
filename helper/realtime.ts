import { createBrowserClient } from "@supabase/ssr";

interface BroadcastOptions {
  unitId: string;
  event: string; // 'ping', 'run_ctrader', 'run_tradelocker'
  payload?: any;
  timeoutMs?: number;
  expectedReplyEvent?: string; // 'pong' or 'trade_result', auto-inferred if omitted
}

/**
 * Singleton Supabase client for all realtime operations.
 * Using a module-level singleton ensures a single persistent WebSocket connection
 * is reused across all broadcastToUnit calls, eliminating per-call WS handshake overhead
 * that would otherwise consume the timeout budget before the ping is even sent.
 */
let _realtimeClient: ReturnType<typeof createBrowserClient> | null = null;
function getRealtimeClient() {
  if (!_realtimeClient) {
    console.log("[RT] Creating singleton Supabase client");
    _realtimeClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
  }
  return _realtimeClient;
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
  const supabase = getRealtimeClient();
  const channelName = `unit_${unitId}`;
  
  // Use native cryptographic random UUID for mapping asynchronous responses
  const transaction_id = crypto.randomUUID();
  
  // Predict expected reply event based on the outbound event if not explicitly provided
  const listenEvent = expectedReplyEvent || (event === "ping" ? "pong" : "trade_result");

  console.log(`[RT] broadcastToUnit: channel=${channelName}, event=${event}, listenFor=${listenEvent}, tx=${transaction_id.slice(0,8)}...`);

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    // Reference the exact channel for this unit
    const channel = supabase.channel(channelName);

    const cleanup = () => {
      clearTimeout(timeoutId);
      // Remove channel to prevent memory leaks in the browser
      supabase.removeChannel(channel);
    };

    // Fail gracefully if the listener python script is offline or lags out
    let timeoutId: any;
    if (timeoutMs && timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        console.warn(`[RT] ⏰ TIMEOUT after ${timeoutMs}ms for ${channelName} event=${event} tx=${transaction_id.slice(0,8)}`);
        cleanup();
        reject(new Error(`Timeout: No response from unit ${unitId} within ${timeoutMs / 1000}s on event '${event}'. The machine might be offline.`));
      }, timeoutMs);
    }

    // Set up the listener for the reply BEFORE subscribing
    channel.on(
      "broadcast",
      { event: listenEvent },
      (responsePayload) => {
        console.log(`[RT] 📩 Received broadcast event=${listenEvent}:`, JSON.stringify(responsePayload).slice(0, 300));
        const data = responsePayload.payload || {};
        // The python app replies with either 'transaction_id' (trades) or 'reply_to' (pings)
        if (
          data.transaction_id === transaction_id || 
          data.reply_to === transaction_id
        ) {
          console.log(`[RT] ✅ MATCH! tx=${transaction_id.slice(0,8)} elapsed=${Date.now() - startTime}ms`);
          cleanup();
          resolve(data); // Returns the response payload containing {"guid", "result", etc.}
        } else {
          console.log(`[RT] ❌ No match: data.transaction_id=${data.transaction_id}, data.reply_to=${data.reply_to}, expected=${transaction_id.slice(0,8)}`);
        }
      }
    );

    // Subscribe to the channel and send the payload once fully connected
    channel.subscribe((status) => {
      console.log(`[RT] Channel ${channelName} status: ${status} (elapsed=${Date.now() - startTime}ms)`);
      if (status === "SUBSCRIBED") {
        console.log(`[RT] 📤 Sending ${event} on ${channelName} with tx=${transaction_id.slice(0,8)}`);
        channel.send({
          type: "broadcast",
          event: event,
          payload: {
            ...payload,
            transaction_id, // Important: Inject transaction ID so machine knows who to reply to
          },
        }).then(() => {
          console.log(`[RT] 📤 Send confirmed for ${event} tx=${transaction_id.slice(0,8)}`);
        }).catch((err) => {
          console.error(`[RT] 💥 Send failed:`, err);
          cleanup();
          reject(new Error(`Failed to send broadcast over WebSocket: ${err.message}`));
        });
      } else if (status === "CHANNEL_ERROR") {
        console.error(`[RT] 💥 CHANNEL_ERROR on ${channelName}`);
        cleanup();
        reject(new Error("Supabase Realtime channel error. Could not connect to WebSocket."));
      } else if (status === "CLOSED") {
           // Closed manually, do nothing
      }
    });
  });
};
