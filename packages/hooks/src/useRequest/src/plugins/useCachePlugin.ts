import { useRef } from 'react';
import useCreation from '../../../useCreation';
import useUnmount from '../../../useUnmount';
import type { Plugin } from '../types';
import * as cache from '../utils/cache';
import type { CachedData } from '../utils/cache';
import * as cachePromise from '../utils/cachePromise';
import * as cacheSubscribe from '../utils/cacheSubscribe';

const useCachePlugin: Plugin<any, any[]> = (
  fetchInstance,
  {
    cacheKey,
    cacheTime = 5 * 60 * 1000,
    staleTime = 0,
    // 自定义的设置缓存的方法
    setCache: customSetCache,
    // 自定义的获取缓存的方法
    getCache: customGetCache,
  },
) => {
  // 取消订阅
  const unSubscribeRef = useRef<() => void>();

  // 返回Promise实例， 单例模式
  const currentPromiseRef = useRef<Promise<any>>();

  const _setCache = (key: string, cachedData: CachedData) => {
    if (customSetCache) {
      customSetCache(cachedData);
    } else {
      cache.setCache(key, cacheTime, cachedData);
    }
    cacheSubscribe.trigger(key, cachedData.data);
  };

  const _getCache = (key: string, params: any[] = []) => {
    if (customGetCache) {
      return customGetCache(params);
    }
    return cache.getCache(key);
  };

  useCreation(() => {
    // 如果没有设置cacheKey，跳过该流程
    if (!cacheKey) {
      return;
    }

    // 初始化的时候获取缓存的数据
    const cacheData = _getCache(cacheKey);
    // 判断cacheData和cacheData.data是否存在
    if (cacheData && Object.hasOwnProperty.call(cacheData, 'data')) {
      // 直接使用缓存中 data 和 params 进行替代，先将结果返回。
      fetchInstance.state.data = cacheData.data;
      fetchInstance.state.params = cacheData.params;
      // staleTime 缓存数据保持新鲜时间，在该时间间隔内，认为数据是新鲜的，不会重新发起请求
      // 如果staleTime为-1，则表示数据永远新鲜
      if (staleTime === -1 || new Date().getTime() - cacheData.time <= staleTime) {
        // 不会重新发起请求
        fetchInstance.state.loading = false;
      }
    }

    // 根据 cacheKey 订阅缓存
    unSubscribeRef.current = cacheSubscribe.subscribe(cacheKey, (data) => {
      fetchInstance.setState({ data });
    });
  }, []);

  useUnmount(() => {
    unSubscribeRef.current?.();
  });

  // 如果cacheKey不存在，返回一个空对象
  if (!cacheKey) {
    return {};
  }

  return {
    onBefore: (params) => {
      const cacheData = _getCache(cacheKey, params);

      if (!cacheData || !Object.hasOwnProperty.call(cacheData, 'data')) {
        return {};
      }

      // If the data is fresh, stop request
      if (staleTime === -1 || new Date().getTime() - cacheData.time <= staleTime) {
        return {
          loading: false,
          data: cacheData?.data,
          returnNow: true,
        };
      } else {
        // If the data is stale, return data, and request continue
        return {
          data: cacheData?.data,
        };
      }
    },
    onRequest: (service, args) => {
      // 获取缓存servicePromise 第一次执行请求的时候是不存在的
      let servicePromise = cachePromise.getCachePromise(cacheKey);

      // 如果缓存的servicePromise存在，且不是自己触发的，直接使用它
      if (servicePromise && servicePromise !== currentPromiseRef.current) {
        return { servicePromise };
      }

      // 将请求结果（一般是一个Promise）赋值给servicePromise
      servicePromise = service(...args);
      currentPromiseRef.current = servicePromise;
      // 缓存servicePromise
      cachePromise.setCachePromise(cacheKey, servicePromise);
      return { servicePromise };
    },
    onSuccess: (data, params) => {
      if (cacheKey) {
        // cancel subscribe, avoid trgger self
        unSubscribeRef.current?.();
        _setCache(cacheKey, {
          data,
          params,
          time: new Date().getTime(),
        });
        // resubscribe
        unSubscribeRef.current = cacheSubscribe.subscribe(cacheKey, (d) => {
          fetchInstance.setState({ data: d });
        });
      }
    },
    onMutate: (data) => {
      if (cacheKey) {
        // cancel subscribe, avoid trgger self
        unSubscribeRef.current?.();
        _setCache(cacheKey, {
          data,
          params: fetchInstance.state.params,
          time: new Date().getTime(),
        });
        // resubscribe
        unSubscribeRef.current = cacheSubscribe.subscribe(cacheKey, (d) => {
          fetchInstance.setState({ data: d });
        });
      }
    },
  };
};

export default useCachePlugin;
