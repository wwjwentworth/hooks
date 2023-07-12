type Timer = ReturnType<typeof setTimeout>;
type CachedKey = string | number;

export interface CachedData<TData = any, TParams = any> {
  data: TData;
  params: TParams;
  time: number;
}
interface RecordData extends CachedData {
  timer: Timer | undefined;
}

const cache = new Map<CachedKey, RecordData>();

const setCache = (key: CachedKey, cacheTime: number, cachedData: CachedData) => {
  const currentCache = cache.get(key);
  if (currentCache?.timer) {
    clearTimeout(currentCache.timer);
  }

  let timer: Timer | undefined = undefined;

  // cacheTime为缓存数据回收时间，如果cacheTime为-1，则表示缓存永不过期
  if (cacheTime > -1) {
    // 如果到了缓存时间，清除缓存
    timer = setTimeout(() => {
      cache.delete(key);
    }, cacheTime);
  }

  // 设置缓存
  cache.set(key, {
    ...cachedData,
    timer,
  });
};

const getCache = (key: CachedKey) => {
  return cache.get(key);
};

const clearCache = (key?: string | string[]) => {
  // Map.delete 删除指定健对应的值，如果key存在，返回true，否则返回false
  // Map.clear 清空整个Map
  if (key) {
    // 批量清除缓存
    const cacheKeys = Array.isArray(key) ? key : [key];
    cacheKeys.forEach((cacheKey) => cache.delete(cacheKey));
  } else {
    // 清空Map
    cache.clear();
  }
};

export { getCache, setCache, clearCache };
