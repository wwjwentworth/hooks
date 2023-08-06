import { useRef } from 'react';
import type { useEffect, useLayoutEffect } from 'react';

type EffectHookType = typeof useEffect | typeof useLayoutEffect;

// 功能等同于useEffect，但是会忽略首次执行，只在依赖更新的时候执行
export const createUpdateEffect: (hook: EffectHookType) => EffectHookType =
  (hook) => (effect, deps) => {
    // 声明一个isMounted的标志 来判断组件是否已经被挂载
    const isMounted = useRef(false);

    // 组件卸载 将isMounted的值置为false
    hook(() => {
      return () => {
        isMounted.current = false;
      };
    }, []);

    hook(() => {
      // 首次执行完时候，设置为 true，从而下次依赖更新的时候可以执行逻辑
      if (!isMounted.current) {
        isMounted.current = true;
      } else {
        return effect();
      }
    }, deps);
  };
