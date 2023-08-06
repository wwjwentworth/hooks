import Cookies from 'js-cookie';
import { useState } from 'react';
import useMemoizedFn from '../useMemoizedFn';
import { isFunction, isString } from '../utils';

export type State = string | undefined;

export interface Options extends Cookies.CookieAttributes {
  defaultValue?: State | (() => State);
}

function useCookieState(cookieKey: string, options: Options = {}) {
  const [state, setState] = useState<State>(() => {
    const cookieValue = Cookies.get(cookieKey);
    // 如果cookie里面有值，返回cookie里面的值
    if (isString(cookieValue)) return cookieValue;

    // 否则返回options中的defaultValue
    if (isFunction(options.defaultValue)) {
      return options.defaultValue();
    }

    return options.defaultValue;
  });

  const updateState = useMemoizedFn(
    (
      newValue: State | ((prevState: State) => State),
      newOptions: Cookies.CookieAttributes = {},
    ) => {
      // 合并options和newOptions
      const { defaultValue, ...restOptions } = { ...options, ...newOptions };
      setState((prevState) => {
        const value = isFunction(newValue) ? newValue(prevState) : newValue;
        // 如果值不存在，清除cookie
        if (value === undefined) {
          Cookies.remove(cookieKey);
        } else {
          // 否则调用js-cookie的set方法
          Cookies.set(cookieKey, value, restOptions);
        }
        // 最终返回新值
        return value;
      });
    },
  );

  return [state, updateState] as const;
}

export default useCookieState;
