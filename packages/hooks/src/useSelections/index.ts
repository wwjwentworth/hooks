import { useMemo, useState } from 'react';
import useMemoizedFn from '../useMemoizedFn';

export default function useSelections<T>(items: T[], defaultSelected: T[] = []) {
  const [selected, setSelected] = useState<T[]>(defaultSelected);

  // 学习：使用set
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const isSelected = (item: T) => selectedSet.has(item);

  const select = (item: T) => {
    selectedSet.add(item);
    return setSelected(Array.from(selectedSet));
  };

  const unSelect = (item: T) => {
    selectedSet.delete(item);
    return setSelected(Array.from(selectedSet));
  };

  const toggle = (item: T) => {
    if (isSelected(item)) {
      unSelect(item);
    } else {
      select(item);
    }
  };

  const selectAll = () => {
    items.forEach((o) => {
      selectedSet.add(o);
    });
    setSelected(Array.from(selectedSet));
  };

  const unSelectAll = () => {
    items.forEach((o) => {
      selectedSet.delete(o);
    });
    setSelected(Array.from(selectedSet));
  };

  const noneSelected = useMemo(() => items.every((o) => !selectedSet.has(o)), [items, selectedSet]);

  const allSelected = useMemo(
    () => items.every((o) => selectedSet.has(o)) && !noneSelected,
    [items, selectedSet, noneSelected],
  );

  const partiallySelected = useMemo(
    () => !noneSelected && !allSelected,
    [noneSelected, allSelected],
  );

  const toggleAll = () => (allSelected ? unSelectAll() : selectAll());

  return {
    selected, // 当前选中的
    noneSelected, // 是否一个都没有选择
    allSelected, // 是否全选
    partiallySelected, // 是否部分选择
    setSelected, // 设置当前选中的元素
    isSelected, // 是否被选择
    select: useMemoizedFn(select), // 选择单个元素
    unSelect: useMemoizedFn(unSelect), // 取消选择单个元素
    toggle: useMemoizedFn(toggle), // 反选单个元素
    selectAll: useMemoizedFn(selectAll), // 全选
    unSelectAll: useMemoizedFn(unSelectAll), // 取消全选
    toggleAll: useMemoizedFn(toggleAll), // 反选全部元素
  } as const;
}
