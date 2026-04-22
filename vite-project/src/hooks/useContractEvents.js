import { useCallback, useDeferredValue, useEffect, useMemo, useState, startTransition } from 'react';
import { scValToNative } from '@stellar/stellar-sdk';
import { CONTRACT_ID, EVENT_POLL_INTERVAL } from '../utils/constants.js';
import { formatHash, normalizeContractValue } from '../utils/errors.js';
import walletService from '../services/walletService.js';
import monitoringService from '../services/monitoringService.js';

const decodeValue = (value) => {
  try {
    return normalizeContractValue(scValToNative(value));
  } catch (error) {
    return String(value);
  }
};

const eventLabelFromTopic = (topic = []) => {
  const firstTopic = topic[0];
  const decoded = decodeValue(firstTopic);

  if (typeof decoded === 'string' && decoded.trim()) {
    return decoded;
  }

  return 'contract-event';
};

const normalizeEvent = (event) => ({
  id: event.id,
  label: eventLabelFromTopic(event.topic),
  ledger: event.ledger,
  contractId: event.contractId?.toString?.() || CONTRACT_ID,
  txHash: event.txHash,
  txHashShort: formatHash(event.txHash),
  createdAt: event.ledgerClosedAt,
  topic: event.topic.map((item) => decodeValue(item)),
  payload: decodeValue(event.value),
});

const mergeEvents = (currentEvents, incomingEvents, limit) => {
  const byId = new Map(currentEvents.map((event) => [event.id, event]));
  incomingEvents.forEach((event) => {
    byId.set(event.id, event);
  });

  return [...byId.values()]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, limit);
};

export const useContractEvents = ({ enabled = true, limit = 10 } = {}) => {
  const [events, setEvents] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const server = walletService.getServer();
      const response = await server.getEvents({
        cursor: cursor || undefined,
        limit,
        filters: [
          {
            type: 'contract',
            contractIds: [CONTRACT_ID],
          },
        ],
      });

      const incoming = response.events.map(normalizeEvent);
      const nextCursor = response.events.at(-1)?.pagingToken || cursor;

      startTransition(() => {
        setEvents((current) => mergeEvents(current, incoming, limit));
        setCursor(nextCursor);
      });
    } catch (caughtError) {
      const normalized = monitoringService.captureException(caughtError, {
        hook: 'useContractEvents',
      });
      setError(normalized.message);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, enabled, limit]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    refresh();
    const intervalId = window.setInterval(refresh, EVENT_POLL_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, refresh]);

  const deferredEvents = useDeferredValue(events);

  return useMemo(
    () => ({
      events: deferredEvents,
      isLoading,
      error,
      refresh,
    }),
    [deferredEvents, error, isLoading, refresh]
  );
};
