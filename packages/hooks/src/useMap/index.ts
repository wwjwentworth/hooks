import { useState } from 'react';
import useMemoizedFn from '../useMemoizedFn';

function useMap<K, T>(initialValue?: Iterable<readonly [K, T]>) {
  const getInitValue = () => {
    return initialValue === undefined ? new Map() : new Map(initialValue);
  };

  // 通过Map构造函数创建map，如果有默认的值的话，传入默认值
  const [map, setMap] = useState<Map<K, T>>(() => getInitValue());

  const set = (key: K, entry: T) => {
    setMap((prev) => {
      // 调用map的set方法
      const temp = new Map(prev);
      temp.set(key, entry);
      return temp;
    });
  };

  const setAll = (newMap: Iterable<readonly [K, T]>) => {
    setMap(new Map(newMap));
  };

  const remove = (key: K) => {
    setMap((prev) => {
      const temp = new Map(prev);
      // 调用map的delete方法
      temp.delete(key);
      return temp;
    });
  };

  const reset = () => setMap(getInitValue());

  const get = (key: K) => map.get(key);

  return [
    map,
    {
      set: useMemoizedFn(set),
      setAll: useMemoizedFn(setAll),
      remove: useMemoizedFn(remove),
      reset: useMemoizedFn(reset),
      get: useMemoizedFn(get),
    },
  ] as const;
}

export default useMap;
