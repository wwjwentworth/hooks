/* eslint-disable @typescript-eslint/no-parameter-properties */
import { isFunction } from '../../utils';
import type { MutableRefObject } from 'react';
import type { FetchState, Options, PluginReturn, Service, Subscribe } from './types';

export default class Fetch<TData, TParams extends any[]> {
  // 所有插件的运行结果都会赋值给pluginImpls
  pluginImpls: PluginReturn<TData, TParams>[];

  count: number = 0; // 执行次数

  state: FetchState<TData, TParams> = {
    loading: false,
    params: undefined,
    data: undefined,
    error: undefined,
  };

  constructor(
    // 请求实例
    public serviceRef: MutableRefObject<Service<TData, TParams>>,
    // 请求配置
    public options: Options<TData, TParams>,
    // 订阅 更新函数，通知useRequestImplement组件重新渲染
    public subscribe: Subscribe,
    // 初始值
    public initState: Partial<FetchState<TData, TParams>> = {},
  ) {
    this.state = {
      ...this.state,
      // 如果不是手动执行，那么loading就是false
      loading: !options.manual,
      ...initState,
    };
  }

  // 更新状体
  setState(s: Partial<FetchState<TData, TParams>> = {}) {
    this.state = {
      ...this.state,
      ...s,
    };
    this.subscribe();
  }

  // 执行插件中的某个事件
  runPluginHandler(event: keyof PluginReturn<TData, TParams>, ...rest: any[]) {
    // @ts-ignore
    const r = this.pluginImpls.map((i) => i[event]?.(...rest)).filter(Boolean);
    return Object.assign({}, ...r);
  }

  // 如果options.manual 设置了为true，则需要手动触发run或者runAsync函数来触发请求
  // runAsync是一个返回Promise的异步函数，如果使用了runAsync，那么就自己手动捕获异常
  async runAsync(...params: TParams): Promise<TData> {
    // 执行次数+1
    this.count += 1;
    // 当前执行的次数，主要是为了cancel请求
    const currentCount = this.count;

    // 首先会执行每一个插件的onBefore函数
    // stopNow 是否停止请求
    // returnNow 如果使用了缓存配置 returnNow 会是true

    const {
      stopNow = false,
      returnNow = false,
      ...state
    } = this.runPluginHandler('onBefore', params);

    // 停止请求 useAutoPlugin 在ready为false的时候 会返回 true
    if (stopNow) {
      return new Promise(() => {});
    }

    // 开始请求，将loading设置为true
    this.setState({
      loading: true,
      params,
      ...state,
    });

    // useCachePlugin的onBefore会返回true，返回一个Promise，resolve的值为上一次请求的结果
    if (returnNow) {
      return Promise.resolve(state.data);
    }

    // 执行自定义的onBefore函数
    this.options.onBefore?.(params);

    // 进行请求 onRequest，这个阶段只有useCachePlugin插件执行了onRequest方法
    // 执行之后返回servicePromise 也有可能是缓存的结果
    try {
      // 传入请求实例 和 请求参数
      let { servicePromise } = this.runPluginHandler('onRequest', this.serviceRef.current, params);

      // 因为第一次请求的时候servicePromise不存在，所以需要执行this.serviceRef
      if (!servicePromise) {
        servicePromise = this.serviceRef.current(...params);
      }

      // 执行请求之后的结果
      const res = await servicePromise;

      // 当请求被取消后，返回一个空的Promise
      if (currentCount !== this.count) {
        return new Promise(() => {});
      }

      // 请求结束，修改data和loading
      this.setState({
        data: res,
        error: undefined,
        loading: false,
      });

      // 执行自定义的onSuccess方法
      this.options.onSuccess?.(res, params);
      // 执行插件的onSuccess方法
      this.runPluginHandler('onSuccess', res, params);

      // 执行自定义的onFinally方法
      this.options.onFinally?.(params, res, undefined);

      // 如果请求没有被取消，执行插件的onFinally方法
      if (currentCount === this.count) {
        this.runPluginHandler('onFinally', params, res, undefined);
      }

      return res;
    } catch (error) {
      // 异常不活
      // 请求被取消
      if (currentCount !== this.count) {
        return new Promise(() => {});
      }

      this.setState({
        error,
        loading: false,
      });

      // 执行自定义的onError方法
      this.options.onError?.(error, params);
      // 执行插件的onError方法
      this.runPluginHandler('onError', error, params);

      this.options.onFinally?.(params, undefined, error);

      if (currentCount === this.count) {
        this.runPluginHandler('onFinally', params, undefined, error);
      }

      throw error;
    }
  }

  run(...params: TParams) {
    this.runAsync(...params).catch((error) => {
      if (!this.options.onError) {
        console.error(error);
      }
    });
  }

  // 取消请求
  cancel() {
    this.count += 1;
    this.setState({
      loading: false,
    });

    // 内部执行onCancel钩子函数
    this.runPluginHandler('onCancel');
  }

  // 使用上一次的params，重新调用run方法
  refresh() {
    // @ts-ignore
    this.run(...(this.state.params || []));
  }

  // 使用上一次的params，重新调用runAsync方法
  refreshAsync() {
    // @ts-ignore
    return this.runAsync(...(this.state.params || []));
  }

  // 修改data，参数可以是一个函数，也可以是一个值
  mutate(data?: TData | ((oldData?: TData) => TData | undefined)) {
    let targetData: TData | undefined;
    if (isFunction(data)) {
      // @ts-ignore
      targetData = data(this.state.data);
    } else {
      targetData = data;
    }

    // 内部执行onMutate生命周期函数
    this.runPluginHandler('onMutate', targetData);

    this.setState({
      data: targetData,
    });
  }
}
