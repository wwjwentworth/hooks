/* eslint-disable max-len */
import { useState, useMemo, useCallback } from 'react';

function useSet<K>(initialValue?: Iterable<K>) {
  const initialSet = useMemo<Set<K>>(
    () => (initialValue === undefined ? new Set() : new Set(initialValue)) as Set<K>,
    [],
  );
  const [set, setSet] = useState(initialSet);

  const stableActions = useMemo(
    () => ({
      add: (key: K) => setSet((prevSet) => new Set([...Array.from(prevSet), key])),
      remove: (key: K) =>
        setSet((prevSet) => new Set(Array.from(prevSet).filter((i) => i !== key))),
      reset: () => setSet(initialSet),
    }),
    [setSet, initialSet],
  );

  const utils = {
    has: useCallback((key: K) => set.has(key), [set]),
    ...stableActions,
  };

  return [set, utils] as const;
}

export default useSet;
