import { useState } from 'react';
import useMemoizedFn from '../useMemoizedFn';

function useSet<K>(initialValue?: Iterable<K>) {
  // 获取默认值
  const getInitValue = () => {
    return initialValue === undefined ? new Set<K>() : new Set(initialValue);
  };

  // 通过Set构造函数创建set
  const [set, setSet] = useState<Set<K>>(() => getInitValue());

  const add = (key: K) => {
    // 如果set中已经有key了，就不再add
    if (set.has(key)) {
      return;
    }
    setSet((prevSet) => {
      const temp = new Set(prevSet);
      temp.add(key);
      return temp;
    });
  };

  const remove = (key: K) => {
    // 如果set中没有key，就不调用delete方法
    if (!set.has(key)) {
      return;
    }
    setSet((prevSet) => {
      const temp = new Set(prevSet);
      temp.delete(key);
      return temp;
    });
  };

  const reset = () => setSet(getInitValue());

  return [
    set,
    {
      add: useMemoizedFn(add),
      remove: useMemoizedFn(remove),
      reset: useMemoizedFn(reset),
    },
  ] as const;
}

export default useSet;
