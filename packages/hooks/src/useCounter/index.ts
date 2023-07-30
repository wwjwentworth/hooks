import { useState } from 'react';
import useMemoizedFn from '../useMemoizedFn';
import { isNumber } from '../utils';

export interface Options {
  min?: number; // 最小值
  max?: number; // 最大值
}

export interface Actions {
  inc: (delta?: number) => void; // 加 默认加1
  dec: (delta?: number) => void; // 减 默认减1
  set: (value: number | ((c: number) => number)) => void; // 设置为指定的值
  reset: () => void; // 重置为current
}

export type ValueParam = number | ((c: number) => number);

// 不能超出[min, max]范围
function getTargetValue(val: number, options: Options = {}) {
  const { min, max } = options;
  let target = val;
  if (isNumber(max)) {
    target = Math.min(max, target);
  }
  if (isNumber(min)) {
    target = Math.max(min, target);
  }
  return target;
}

function useCounter(initialValue: number = 0, options: Options = {}) {
  const { min, max } = options;

  const [current, setCurrent] = useState(() => {
    return getTargetValue(initialValue, {
      min,
      max,
    });
  });

  const setValue = (value: ValueParam) => {
    setCurrent((c) => {
      const target = isNumber(value) ? value : value(c);
      return getTargetValue(target, {
        max,
        min,
      });
    });
  };

  const inc = (delta: number = 1) => {
    setValue((c) => c + delta);
  };

  const dec = (delta: number = 1) => {
    setValue((c) => c - delta);
  };

  const set = (value: ValueParam) => {
    setValue(value);
  };

  const reset = () => {
    setValue(initialValue);
  };

  return [
    current,
    {
      inc: useMemoizedFn(inc),
      dec: useMemoizedFn(dec),
      set: useMemoizedFn(set),
      reset: useMemoizedFn(reset),
    },
  ] as const;
}

export default useCounter;
