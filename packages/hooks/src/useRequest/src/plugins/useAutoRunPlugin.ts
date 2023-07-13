import { useRef } from 'react';
import useUpdateEffect from '../../../useUpdateEffect';
import type { Plugin } from '../types';

// support refreshDeps & ready
const useAutoRunPlugin: Plugin<any, any[]> = (
  fetchInstance,
  { manual, ready = true, defaultParams = [], refreshDeps = [], refreshDepsAction },
) => {
  const hasAutoRun = useRef(false);
  hasAutoRun.current = false;

  // useUpdateEffect 等同于useEffect，只不过会忽略首次执行，只在依赖更新的时候执行
  useUpdateEffect(() => {
    // 如果非手动执行 且 ready 设置为true
    if (!manual && ready) {
      // 设置hasAutoRun为true
      hasAutoRun.current = true;
      // 开始执行请求实例的run方法，并传入默认参数
      fetchInstance.run(...defaultParams);
    }
  }, [ready]);

  // 对refreshDeps进行监听
  useUpdateEffect(() => {
    // 如果hasAutoRun的值已经为true了，跳过这个步骤
    if (hasAutoRun.current) {
      return;
    }
    // 非手动执行的情况
    if (!manual) {
      hasAutoRun.current = true;
      // 依赖变化的时候的处理逻辑，假如有传的话，就执行该逻辑，否则请求请求
      if (refreshDepsAction) {
        refreshDepsAction();
      } else {
        fetchInstance.refresh();
      }
    }
  }, [...refreshDeps]);

  // 如果ready设置为了false，请求不会被执行 stopNow 返回 true
  return {
    onBefore: () => {
      if (!ready) {
        return {
          stopNow: true,
        };
      }
    },
  };
};

useAutoRunPlugin.onInit = ({ ready = true, manual }) => {
  return {
    loading: !manual && ready,
  };
};

export default useAutoRunPlugin;
