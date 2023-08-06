import { useRef, useCallback } from 'react';

// 用于给一个异步函数增加静态锁，防止并发发生
function useLockFn<P extends any[] = any[], V extends any = any>(fn: (...args: P) => Promise<V>) {
  // 当前是否在处于锁中
  const lockRef = useRef(false);

  return useCallback(
    async (...args: P) => {
      // 如果在锁中，停止执行
      if (lockRef.current) return;
      lockRef.current = true;
      try {
        const ret = await fn(...args);
        // 执行完成之后 再解锁
        lockRef.current = false;
        return ret;
      } catch (e) {
        // 失败了也解锁，同时抛出异常
        lockRef.current = false;
        throw e;
      }
    },
    [fn],
  );
}

export default useLockFn;
