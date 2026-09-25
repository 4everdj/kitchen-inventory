'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

export function RealtimeSync() {
  const userId = useStore((state) => state.userId);
  const activeHouseholdId = useStore(
    (state) => state.activeHouseholdId
  );
  const subscribeToRealtime = useStore(
    (state) => state.subscribeToRealtime
  );

  useEffect(() => {
    if (!userId || !activeHouseholdId) {
      return;
    }

    const unsubscribe = subscribeToRealtime();

    return unsubscribe;
  }, [
    userId,
    activeHouseholdId,
    subscribeToRealtime,
  ]);

  return null;
}