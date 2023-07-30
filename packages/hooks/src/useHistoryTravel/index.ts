import { useRef, useState } from 'react';
import useMemoizedFn from '../useMemoizedFn';
import { isNumber } from '../utils';

interface IData<T> {
  present?: T;
  past: T[];
  future: T[];
}

const dumpIndex = <T>(step: number, arr: T[]) => {
  let index =
    step > 0
      ? step - 1 // move forward
      : arr.length + step; // move backward
  if (index >= arr.length - 1) {
    index = arr.length - 1;
  }
  if (index < 0) {
    index = 0;
  }
  return index;
};

// 将targetArr分成3个状态 之前、现在、未来
const split = <T>(step: number, targetArr: T[]) => {
  const index = dumpIndex(step, targetArr);
  return {
    _current: targetArr[index],
    _before: targetArr.slice(0, index),
    _after: targetArr.slice(index + 1),
  };
};

// initialValue 初始值
export default function useHistoryTravel<T>(initialValue?: T) {
  const [history, setHistory] = useState<IData<T | undefined>>({
    present: initialValue, // 当前的值
    past: [],
    future: [],
  });

  const { present, past, future } = history;

  const initialValueRef = useRef(initialValue);

  // 重置到初始值，或提供一个新的初始值
  const reset = (...params: any[]) => {
    const _initial = params.length > 0 ? params[0] : initialValueRef.current;
    initialValueRef.current = _initial;

    setHistory({
      present: _initial,
      future: [],
      past: [],
    });
  };

  // 更新值， 都是往过去的list中添加
  const updateValue = (val: T) => {
    setHistory({
      present: val,
      future: [],
      past: [...past, present],
    });
  };

  const _forward = (step: number = 1) => {
    // 如果future队列为空，不执行
    if (future.length === 0) {
      return;
    }
    const { _before, _current, _after } = split(step, future);
    setHistory({
      past: [...past, present, ..._before],
      present: _current,
      future: _after,
    });
  };

  const _backward = (step: number = -1) => {
    if (past.length === 0) {
      return;
    }

    const { _before, _current, _after } = split(step, past);
    setHistory({
      past: _before,
      present: _current,
      future: [..._after, present, ...future],
    });
  };

  const go = (step: number) => {
    const stepNum = isNumber(step) ? step : Number(step);
    if (stepNum === 0) {
      return;
    }
    if (stepNum > 0) {
      return _forward(stepNum);
    }
    _backward(stepNum);
  };

  return {
    value: present, // 当前值
    backLength: past.length, // 可回退历史长度
    forwardLength: future.length, // 可前进历史长度
    setValue: useMemoizedFn(updateValue), // 设置value
    go: useMemoizedFn(go), // 前进步数, step < 0 为后退， step > 0 时为前进
    back: useMemoizedFn(() => {
      go(-1);
    }), // 向后回退一步
    forward: useMemoizedFn(() => {
      go(1);
    }), // 向前前进异步
    reset: useMemoizedFn(reset), // 重置到初始值，或提供一个新的初始值
  };
}
