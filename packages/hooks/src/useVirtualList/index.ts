import { useEffect, useMemo, useState, useRef } from 'react';
import useEventListener from '../useEventListener';
import useLatest from '../useLatest';
import useMemoizedFn from '../useMemoizedFn';
import useSize from '../useSize';
import { getTargetElement } from '../utils/domTarget';
import type { BasicTarget } from '../utils/domTarget';
import { isNumber } from '../utils';

export interface Options<T> {
  containerTarget: BasicTarget;
  wrapperTarget: BasicTarget;
  // 行高度，静态高度可以直接写入像素值，动态高度可以传入函数计算
  itemHeight: number | ((index: number, data: T) => number);
  // 视区上、下额外展示的 DOM 节点数量
  overscan?: number;
}

// 原理：监听外部容器的scroll事件以及size发生变化的时候，触发计算逻辑算出内部容器的高度和martinTop的值
const useVirtualList = <T = any>(list: T[], options: Options<T>) => {
  const { containerTarget, wrapperTarget, itemHeight, overscan = 5 } = options;

  // 获取行高度并做缓存
  const itemHeightRef = useLatest(itemHeight);

  const size = useSize(containerTarget);

  const scrollTriggerByScrollToFunc = useRef(false);

  const [targetList, setTargetList] = useState<{ index: number; data: T }[]>([]);

  // 可视区域的DOM个数
  const getVisibleCount = (containerHeight: number, fromIndex: number) => {
    if (isNumber(itemHeightRef.current)) {
      return Math.ceil(containerHeight / itemHeightRef.current);
    }

    let sum = 0;
    let endIndex = 0;
    for (let i = fromIndex; i < list.length; i++) {
      const height = itemHeightRef.current(i, list[i]);
      sum += height;
      endIndex = i;
      if (sum >= containerHeight) {
        break;
      }
    }
    return endIndex - fromIndex;
  };

  // 根据外部容器的scrollTop计算出已经滚动过多少个item
  const getOffset = (scrollTop: number) => {
    // itemHeight是静态的，直接计算
    if (isNumber(itemHeightRef.current)) {
      return Math.floor(scrollTop / itemHeightRef.current) + 1;
    }
    let sum = 0;
    let offset = 0;
    // itemHeightRef是动态的
    for (let i = 0; i < list.length; i++) {
      const height = itemHeightRef.current(i, list[i]);
      sum += height;
      if (sum >= scrollTop) {
        offset = i;
        break;
      }
    }
    return offset + 1;
  };

  // 获取上部高度
  const getDistanceTop = (index: number) => {
    if (isNumber(itemHeightRef.current)) {
      const height = index * itemHeightRef.current;
      return height;
    }
    const height = list
      .slice(0, index)
      // @ts-ignore
      .reduce((sum, _, i) => sum + itemHeightRef.current(i, list[i]), 0);
    return height;
  };

  // 获取wrapper总高度
  const totalHeight = useMemo(() => {
    if (isNumber(itemHeightRef.current)) {
      return list.length * itemHeightRef.current;
    }
    // @ts-ignore
    return list.reduce((sum, _, index) => sum + itemHeightRef.current(index, list[index]), 0);
  }, [list]);

  const calculateRange = () => {
    // 外部容器
    const container = getTargetElement(containerTarget);
    // 内部容器
    const wrapper = getTargetElement(wrapperTarget);

    if (container && wrapper) {
      const { scrollTop, clientHeight } = container;

      // 根据外部容器的scrollTop计算出已经滚动过多少个item
      const offset = getOffset(scrollTop);
      // 根据外部容器的高度计算出可视区域的Item个数
      const visibleCount = getVisibleCount(clientHeight, offset);

      // 开始的下标
      const start = Math.max(0, offset - overscan);
      // 结束的下标
      const end = Math.min(list.length, offset + visibleCount + overscan);

      const offsetTop = getDistanceTop(start);

      // @ts-ignore
      wrapper.style.height = totalHeight - offsetTop + 'px';
      // @ts-ignore
      wrapper.style.marginTop = offsetTop + 'px';

      setTargetList(
        list.slice(start, end).map((ele, index) => ({
          data: ele,
          index: index + start,
        })),
      );
    }
  };

  useEffect(() => {
    // 当外部容器的宽高发生改变之后，触发计算逻辑
    if (!size?.width || !size?.height) {
      return;
    }
    calculateRange();
  }, [size?.width, size?.height, list]);

  // 监听外部容器的scroll事件
  useEventListener(
    'scroll',
    (e) => {
      if (scrollTriggerByScrollToFunc.current) {
        scrollTriggerByScrollToFunc.current = false;
        return;
      }
      e.preventDefault();
      calculateRange();
    },
    {
      // 外部容器
      target: containerTarget,
    },
  );

  const scrollTo = (index: number) => {
    const container = getTargetElement(containerTarget);
    if (container) {
      scrollTriggerByScrollToFunc.current = true;
      container.scrollTop = getDistanceTop(index);
      calculateRange();
    }
  };

  return [targetList, useMemoizedFn(scrollTo)] as const;
};

export default useVirtualList;
