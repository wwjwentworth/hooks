import type { DependencyList } from 'react';
import { useEffect } from 'react';
import { isFunction } from '../utils';

function useAsyncEffect(
  effect: () => AsyncGenerator<void, void, void> | Promise<void>,
  deps?: DependencyList,
) {
  // 判断是否是异步可迭代对象
  function isAsyncGenerator(
    val: AsyncGenerator<void, void, void> | Promise<void>,
  ): val is AsyncGenerator<void, void, void> {
    return isFunction(val[Symbol.asyncIterator]);
  }
  useEffect(() => {
    const e = effect();
    let cancelled = false;
    async function execute() {
      // 处理 generate 的情况，如果是generate函数，会通过next的方式全部执行
      if (isAsyncGenerator(e)) {
        while (true) {
          const result = await e.next();
          // 如果结束了或者当前effect已经被清理了，停止执行
          if (result.done || cancelled) {
            break;
          }
        }
      } else {
        await e;
      }
    }
    execute();
    // 组件卸载之后 将cancelled的值改为true
    return () => {
      cancelled = true;
    };
  }, deps);
}

export default useAsyncEffect;
