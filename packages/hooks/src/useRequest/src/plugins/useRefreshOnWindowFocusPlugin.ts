import { useEffect, useRef } from 'react';
import useUnmount from '../../../useUnmount';
import type { Plugin } from '../types';
import limit from '../utils/limit';
import subscribeFocus from '../utils/subscribeFocus';

const useRefreshOnWindowFocusPlugin: Plugin<any, any[]> = (
  fetchInstance,
  { refreshOnWindowFocus, focusTimespan = 5000 },
) => {
  const unsubscribeRef = useRef<() => void>();

  const stopSubscribe = () => {
    unsubscribeRef.current?.();
  };

  useEffect(() => {
    // 只有在refreshOnWindowFocus设置为true的时候才会生效
    if (refreshOnWindowFocus) {
      // limit 节流功能 focusTimespan 时间间隔内不再请求
      const limitRefresh = limit(fetchInstance.refresh.bind(fetchInstance), focusTimespan);
      // 将limitRefresh存放在事件订阅列表中
      unsubscribeRef.current = subscribeFocus(() => {
        limitRefresh();
      });
    }
    // 组件卸载的时候停止订阅，也就是取消时间执行
    return () => {
      stopSubscribe();
    };
  }, [refreshOnWindowFocus, focusTimespan]);

  useUnmount(() => {
    stopSubscribe();
  });

  return {};
};

export default useRefreshOnWindowFocusPlugin;
