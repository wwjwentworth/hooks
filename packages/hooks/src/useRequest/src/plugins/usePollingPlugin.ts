import { useRef } from 'react';
import useUpdateEffect from '../../../useUpdateEffect';
import type { Plugin, Timeout } from '../types';
import isDocumentVisible from '../utils/isDocumentVisible';
import subscribeReVisible from '../utils/subscribeReVisible';

const usePollingPlugin: Plugin<any, any[]> = (
  fetchInstance,
  { pollingInterval, pollingWhenHidden = true, pollingErrorRetryCount = -1 },
) => {
  const timerRef = useRef<Timeout>();
  const unsubscribeRef = useRef<() => void>();
  const countRef = useRef<number>(0);

  const stopPolling = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    unsubscribeRef.current?.();
  };

  useUpdateEffect(() => {
    if (!pollingInterval) {
      stopPolling();
    }
  }, [pollingInterval]);

  if (!pollingInterval) {
    return {};
  }

  return {
    onBefore: () => {
      stopPolling();
    },
    onError: () => {
      countRef.current += 1;
    },
    onSuccess: () => {
      countRef.current = 0;
    },
    onFinally: () => {
      if (
        // 轮询错误重试次数，设置为-1，表示轮询无数次
        pollingErrorRetryCount === -1 ||
        // 如果当前已经轮询的次数 < 设置的轮询次数，继续轮询
        (pollingErrorRetryCount !== -1 && countRef.current <= pollingErrorRetryCount)
      ) {
        // pollingWhenHidden = false 在页面隐藏时会暂时停止轮询
        if (!pollingWhenHidden && !isDocumentVisible()) {
          unsubscribeRef.current = subscribeReVisible(() => {
            fetchInstance.refresh();
          });
          return;
        }

        // 通过setTimeout进行轮询
        timerRef.current = setTimeout(() => {
          fetchInstance.refresh();
        }, pollingInterval);
      } else {
        // 重置当前已轮询次数
        countRef.current = 0;
      }
    },
    // 取消轮询
    onCancel: () => {
      stopPolling();
    },
  };
};

export default usePollingPlugin;
