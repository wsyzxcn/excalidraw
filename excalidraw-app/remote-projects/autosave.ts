type AutoSaveOptions<T> = {
  intervalMs: number;
  save: (value: T) => Promise<void>;
  getSignature: (value: T) => string;
};

export const createRemoteAutoSaveController = <T>({
  intervalMs,
  save,
  getSignature,
}: AutoSaveOptions<T>) => {
  let lastSavedSignature: string | null = null;
  let pendingValue: T | null = null;
  let pendingSignature: string | null = null;
  let lastSaveTimestamp = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = () => {
    if (inFlight || pendingValue === null || pendingSignature === null) {
      return;
    }

    const elapsed = Date.now() - lastSaveTimestamp;
    const delay =
      lastSaveTimestamp === 0 ? 0 : Math.max(intervalMs - elapsed, 0);

    clearTimer();
    timer = setTimeout(() => {
      void flush().catch(() => {});
    }, delay);
  };

  const flush = async () => {
    if (inFlight || pendingValue === null || pendingSignature === null) {
      return false;
    }

    const valueToSave = pendingValue;
    const signatureToSave = pendingSignature;

    inFlight = true;
    clearTimer();
    lastSaveTimestamp = Date.now();

    try {
      await save(valueToSave);
      if (pendingSignature === signatureToSave) {
        pendingValue = null;
        pendingSignature = null;
      }
      lastSavedSignature = signatureToSave;
      return true;
    } finally {
      inFlight = false;
      if (pendingValue !== null && pendingSignature !== null) {
        schedule();
      }
    }
  };

  return {
    queue(value: T) {
      const signature = getSignature(value);
      if (lastSavedSignature === null) {
        lastSavedSignature = signature;
        return false;
      }

      if (signature === lastSavedSignature || signature === pendingSignature) {
        return false;
      }

      pendingValue = value;
      pendingSignature = signature;
      schedule();
      return true;
    },
    async flushNow(value?: T) {
      if (value !== undefined) {
        const signature = getSignature(value);
        if (lastSavedSignature === null) {
          lastSavedSignature = signature;
          return false;
        }
        if (signature === lastSavedSignature) {
          return false;
        }
        pendingValue = value;
        pendingSignature = signature;
      }

      return flush();
    },
    dispose() {
      clearTimer();
      pendingValue = null;
      pendingSignature = null;
    },
  };
};
