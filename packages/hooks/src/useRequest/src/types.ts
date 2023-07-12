import type { DependencyList } from 'react';
import type Fetch from './Fetch';
import type { CachedData } from './utils/cache';

export type Service<TData, TParams extends any[]> = (...args: TParams) => Promise<TData>;
export type Subscribe = () => void;

// for Fetch
export interface FetchState<TData, TParams extends any[]> {
  loading: boolean;
  params?: TParams;
  data?: TData;
  error?: Error;
}

export interface PluginReturn<TData, TParams extends any[]> {
  onBefore?: (params: TParams) =>
    | ({
        stopNow?: boolean;
        returnNow?: boolean;
      } & Partial<FetchState<TData, TParams>>)
    | void;

  onRequest?: (
    service: Service<TData, TParams>,
    params: TParams,
  ) => {
    servicePromise?: Promise<TData>;
  };

  onSuccess?: (data: TData, params: TParams) => void;
  onError?: (e: Error, params: TParams) => void;
  onFinally?: (params: TParams, data?: TData, e?: Error) => void;
  onCancel?: () => void;
  onMutate?: (data: TData) => void;
}

// for useRequestImplement
export interface Options<TData, TParams extends any[]> {
  manual?: boolean; // 是否手动触发，默认自动触发

  // 请求之前触发
  onBefore?: (params: TParams) => void;
  // 请求被成功执行后的回调函数
  onSuccess?: (data: TData, params: TParams) => void;
  // 请求失败后的回调函数
  onError?: (e: Error, params: TParams) => void;
  // 请求完成触发（成功、失败都算完成）
  onFinally?: (params: TParams, data?: TData, e?: Error) => void;

  // 首次默认执行时，传递给 service 的参数
  defaultParams?: TParams;

  // 重新发起请求的依赖列表
  refreshDeps?: DependencyList;
  refreshDepsAction?: () => void;

  // 设置 loading 变成 true 的延迟时间
  loadingDelay?: number;

  // 轮询模式
  pollingInterval?: number; // 轮询间隔，单位为毫秒。如果值大于 0，则启动轮询模式。

  pollingWhenHidden?: boolean; // 在页面隐藏时，是否继续轮询。如果设置为 false，在页面隐藏时会暂时停止轮询，页面重新显示时继续上次轮询
  pollingErrorRetryCount?: number; // 轮询错误重试次数。如果设置为 -1，则无限次

  // 屏幕聚焦重新请求
  refreshOnWindowFocus?: boolean; // 在屏幕重新获取焦点或重新显示时，重新发起请求
  focusTimespan?: number; // 重新请求间隔，单位为毫秒

  // 防抖
  debounceWait?: number;
  debounceLeading?: boolean;
  debounceTrailing?: boolean;
  debounceMaxWait?: number;

  // 节流
  throttleWait?: number;
  throttleLeading?: boolean;
  throttleTrailing?: boolean;

  // 数据缓存
  cacheKey?: string;
  cacheTime?: number;
  staleTime?: number;
  setCache?: (data: CachedData<TData, TParams>) => void;
  getCache?: (params: TParams) => CachedData<TData, TParams> | undefined;

  // 错误重试
  retryCount?: number; // 错误重试次数。如果设置为 -1，则无限次重试。
  retryInterval?: number; //重试时间间隔，单位为毫秒。

  // 开始自动请求的条件
  ready?: boolean;
}

export type Plugin<TData, TParams extends any[]> = {
  (fetchInstance: Fetch<TData, TParams>, options: Options<TData, TParams>): PluginReturn<
    TData,
    TParams
  >;
  onInit?: (options: Options<TData, TParams>) => Partial<FetchState<TData, TParams>>;
};

export interface Result<TData, TParams extends any[]> {
  loading: boolean;
  data?: TData;
  error?: Error;
  params: TParams | [];
  cancel: Fetch<TData, TParams>['cancel'];
  refresh: Fetch<TData, TParams>['refresh'];
  refreshAsync: Fetch<TData, TParams>['refreshAsync'];
  run: Fetch<TData, TParams>['run'];
  runAsync: Fetch<TData, TParams>['runAsync'];
  mutate: Fetch<TData, TParams>['mutate'];
}

export type Timeout = ReturnType<typeof setTimeout>;
