import { useRef, useState, useCallback } from 'react';

const isUndefined = (val: any) => typeof val === 'undefined';

interface IData<T> {
  present?: T;
  past: T[];
  future: T[];
}

const dumpIndex = <T>(step: number, arr: T[]) => {
  let index = step > 0
    ? step - 1 // move forward
    : arr.length + step; // move backward
  if (index >= arr.length - 1) {
    index = arr.length - 1;
  }
  if (index < 0) {
    index = 0;
  }
  return index;
}

const split = <T>(step: number, targetArr: T[]) => {
  const index = dumpIndex(step, targetArr)
  return {
    _current: targetArr[index],
    _before: targetArr.slice(0, index),
    _after: targetArr.slice(index + 1)
  }
}

export default function useHistoryTravel<T>(initialValue?: T) {
  const [history, setHistory] = useState<IData<T | undefined>>({
    present: initialValue,
    past: [],
    future: []
  });

  const isInitedRef = useRef(!isUndefined(initialValue));

  const { present, past, future } = history;
  const updateValue = useCallback((val: T) => {
    const isInited = isInitedRef.current;
    isInitedRef.current = true;

    return setHistory({
      present: val,
      future: [],
      past: isInited ? [...past, present] : []
    });
  }, [history, setHistory])

  const _forward = useCallback((step: number = 1) => {
    if (future.length === 0) {
      return;
    }
    const { _before, _current, _after } = split(step, future)
    setHistory({
      past: [...past, present, ..._before],
      present: _current,
      future: _after
    });
  }, [history, setHistory])

  const _backward = useCallback((step: number = -1) => {
    if (past.length === 0) {
      return;
    }

    const { _before, _current, _after } = split(step, past);
    setHistory({
      past: _before,
      present: _current,
      future: [..._after, present, ...future]
    });
  }, [history, setHistory])

  const go = useCallback((step: number) => {
    if (step === 0) {
      return;
    }
    if (step > 0) {
      return _forward(step)
    }
    _backward(step);
  }, [_backward, _forward])

  return {
    value: present,
    setValue: updateValue,
    backLength: past.length,
    forwardLength: future.length,
    go,
    back: useCallback(() => {
      go(-1)
    }, [go]),
    forward: useCallback(() => {
      go(1)
    }, [go])
  }
}
