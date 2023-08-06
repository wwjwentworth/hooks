import { useRef } from 'react';

export type ShouldUpdateFunc<T> = (prev: T | undefined, next: T) => boolean;

// 比较两个值是否相等（浅比较）
const defaultShouldUpdate = <T>(a?: T, b?: T) => !Object.is(a, b);

function usePrevious<T>(
  state: T,
  shouldUpdate: ShouldUpdateFunc<T> = defaultShouldUpdate,
): T | undefined {
  // 维护两个状态 prevRef 和 curRef
  const prevRef = useRef<T>();
  const curRef = useRef<T>();

  // 当状态发生改变的时候，通过shouldUpdate比较两个状态的值是否相等
  // 如果不相等的情况下 将curRef.current 赋值给 prevRef.current
  // 并更新curRef的current为当前的state
  if (shouldUpdate(curRef.current, state)) {
    prevRef.current = curRef.current;
    curRef.current = state;
  }

  return prevRef.current;
}

export default usePrevious;
