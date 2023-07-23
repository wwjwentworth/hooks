import { useMemo, useState } from 'react';
import useEventListener from '../useEventListener';
import useMemoizedFn from '../useMemoizedFn';
import useRequest from '../useRequest';
import useUpdateEffect from '../useUpdateEffect';
import { getTargetElement } from '../utils/domTarget';
import { getClientHeight, getScrollHeight, getScrollTop } from '../utils/rect';
import type { Data, InfiniteScrollOptions, Service } from './types';

const useInfiniteScroll = <TData extends Data>(
  service: Service<TData>,
  options: InfiniteScrollOptions<TData> = {},
) => {
  const {
    // 父级容器，如果存在，则在滚动到底部的时候，自动触发loadMore，需要配合isNoMore使用，以便知道什么时候到最后一页了
    target,
    // 是否还有更多的逻辑判断，入参是当前已经聚合后的data
    isNoMore,
    // 下拉自动加载，距离底部的阙值
    threshold = 100,
    // 依赖变化，自动更新
    reloadDeps = [],
    // 是否手动执行，默认为false
    manual,
    // service执行前执行
    onBefore,
    // service执行成功之后
    onSuccess,
    // service执行失败
    onError,
    // service执行完成（成功或者失败）
    onFinally,
  } = options;

  // 最终的数据
  const [finalData, setFinalData] = useState<TData>();
  // 是否正在加载更多
  const [loadingMore, setLoadingMore] = useState(false);

  // 判断是否还有更多数据，finalData改变之后更新
  const noMore = useMemo(() => {
    // 如果isNoMore没有传入，返回false
    // 否则将finalData传入isNoMore，判断isNoMore是否返回true
    if (!isNoMore) return false;
    return isNoMore(finalData);
  }, [finalData]);

  const { loading, run, runAsync, cancel } = useRequest(
    async (lastData?: TData) => {
      const currentData = await service(lastData);
      // 第一次请求lastData还不存在
      if (!lastData) {
        setFinalData(currentData);
      } else {
        // 加载之后聚合finalData
        setFinalData({
          ...currentData,
          // @ts-ignore
          list: [...lastData.list, ...currentData.list],
        });
      }
      return currentData;
    },
    {
      manual,
      onFinally: (_, d, e) => {
        setLoadingMore(false);
        onFinally?.(d, e);
      },
      onBefore: () => onBefore?.(),
      onSuccess: (d) => {
        setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          scrollMethod();
        });
        onSuccess?.(d);
      },
      onError: (e) => onError?.(e),
    },
  );

  const loadMore = () => {
    if (noMore) return;
    setLoadingMore(true);
    run(finalData);
  };

  const loadMoreAsync = () => {
    if (noMore) return Promise.reject();
    setLoadingMore(true);
    return runAsync(finalData);
  };

  const reload = () => run();
  const reloadAsync = () => runAsync();

  const scrollMethod = () => {
    const el = getTargetElement(target);
    if (!el) {
      return;
    }

    const scrollTop = getScrollTop(el);
    const scrollHeight = getScrollHeight(el);
    const clientHeight = getClientHeight(el);

    if (scrollHeight - scrollTop <= clientHeight + threshold) {
      loadMore();
    }
  };

  useEventListener(
    'scroll',
    () => {
      if (loading || loadingMore) {
        return;
      }
      scrollMethod();
    },
    { target },
  );

  useUpdateEffect(() => {
    run();
  }, [...reloadDeps]);

  return {
    data: finalData,
    loading: !loadingMore && loading,
    loadingMore,
    noMore,

    loadMore: useMemoizedFn(loadMore),
    loadMoreAsync: useMemoizedFn(loadMoreAsync),
    reload: useMemoizedFn(reload),
    reloadAsync: useMemoizedFn(reloadAsync),
    mutate: setFinalData,
    cancel,
  };
};

export default useInfiniteScroll;
