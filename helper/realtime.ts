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
 */
let _realtimeClient: ReturnType<typeof createBrowserClient> | null = null;
function getRealtimeClient() {
  if (!_realtimeClient) {
    _realtimeClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
  }
  return _realtimeClient;
}

// Transaction registry to handle responses multiplexed over the same channels
const _pendingTransactions = new Map<string, { 
  resolve: (val: any) => void; 
  reject: (err: any) => void; 
  timeoutId?: any;
  expectedEvent: string; 
}>();
const _activeChannels = new Map<string, any>();

/**
 * Ensures a single channel is joined per unit, avoiding listener leaks 
 * and channel destruction race conditions during React Strict Mode remounts.
 */
function getOrJoinUnitChannel(unitId: string) {
  const channelName = `unit_${unitId}`;
  if (_activeChannels.has(channelName)) {
    return _activeChannels.get(channelName);
  }

  const supabase = getRealtimeClient();
  const channel = supabase.channel(channelName);

  // Set up a single universal listener for this channel
  channel.on(
    "broadcast",
    { event: "*" }, // Listen to all broadcast events
    (responsePayload: { event: string; payload: Record<string, any> }) => {
      const data = responsePayload.payload || {};
      const eventName = responsePayload.event; // The actual broadcast event string (e.g. 'pong', 'trade_result')
      const txId = data.transaction_id || data.reply_to;
      
      if (txId && _pendingTransactions.has(txId)) {
        const tx = _pendingTransactions.get(txId);
        
        const resultStatus = data.result?.status || data.status;
        
        // Ignore intermediate acknowledgment states that the Python machine uses 
        // to signify it has begun a long-running process (like monitoring).
        if (resultStatus === 'monitoring' || resultStatus === 'processing' || resultStatus === 'started') {
            return;
        }

        // Ensure we only resolve if the event name matches what this transaction was waiting for
        if (tx && tx.expectedEvent === eventName) {
          if (tx.timeoutId) clearTimeout(tx.timeoutId);
          tx.resolve(data);
          _pendingTransactions.delete(txId);
        }
      }
    }
  );

  // Fire off the subscription
  channel.subscribe((status: string) => {
    if (status === "CHANNEL_ERROR" || status === "CLOSED") {
      // Evict the dead channel so the next call to getOrJoinUnitChannel
      // creates a fresh connection rather than returning a broken one.
      _activeChannels.delete(channelName);

      if (status === "CHANNEL_ERROR") {
        // Reject all pending transactions that were waiting on this channel
        // so their promises don't hang silently until timeout.
        for (const [txId, tx] of _pendingTransactions.entries()) {
          tx.reject(new Error(`[Realtime] WebSocket channel error. The connection to unit was lost. Please retry.`));
          _pendingTransactions.delete(txId);
        }
      }
    }
  });

  _activeChannels.set(channelName, channel);
  return channel;
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
  const transaction_id = crypto.randomUUID();
  const channel = getOrJoinUnitChannel(unitId);
  const listenEvent = expectedReplyEvent || (event === "ping" ? "pong" : "trade_result");

  return new Promise((resolve, reject) => {
    let timeoutId: any;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      _pendingTransactions.delete(transaction_id);
    };

    if (timeoutMs && timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout: No response from unit ${unitId} within ${timeoutMs / 1000}s on event '${event}'. The machine might be offline.`));
      }, timeoutMs);
    }

    _pendingTransactions.set(transaction_id, {
      resolve: (data) => {
        cleanup();
        resolve(data);
      },
      reject: (err) => {
        cleanup();
        reject(err);
      },
      timeoutId,
      expectedEvent: listenEvent, // Register the exact event to listen for
    });

    const sendPayload = () => {
      channel.send({
        type: "broadcast",
        event: event,
        payload: {
          ...payload,
          transaction_id, // Important: Inject transaction ID so machine knows who to reply to
        },
      }).catch((err: any) => {
        cleanup();
        reject(new Error(`Failed to send broadcast over WebSocket: ${err.message}`));
      });
    };

    // If already joined (or rapidly joining), we can just try sending immediately.
    // Supabase JS channel.send handles buffering internally if it's still connecting,
    // but checking state guarantees it safely goes out.
    if (['joined', 'SUBSCRIBED'].includes(channel.state)) {
      sendPayload();
    } else {
      // It's still connecting, we push a one-off listener or let it queue
      // In newer Supabase JS, channel.send() while "joining" isn't fully queued,
      // so we wait until joined. We poll state or listen.
      
      const checkStateInterval = setInterval(() => {
        if (['joined', 'SUBSCRIBED'].includes(channel.state)) {
          clearInterval(checkStateInterval);
          sendPayload();
        } else if (['closed', 'errored', 'CHANNEL_ERROR'].includes(channel.state)) {
          clearInterval(checkStateInterval);
          cleanup();
          reject(new Error(`Channel failed to connect.`));
        }
      }, 50);

      // Clean up the interval if the transaction times out first
      setTimeout(() => clearInterval(checkStateInterval), timeoutMs || 5000);
    }
  });
};
