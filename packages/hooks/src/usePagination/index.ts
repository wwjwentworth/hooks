import { useMemo } from 'react';
import useMemoizedFn from '../useMemoizedFn';
import useRequest from '../useRequest';

import type { Data, PaginationOptions, Params, Service, PaginationResult } from './types';

const usePagination = <TData extends Data, TParams extends Params>(
  service: Service<TData, TParams>,
  options: PaginationOptions<TData, TParams> = {},
) => {
  const { defaultPageSize = 10, ...rest } = options;

  const result = useRequest(service, {
    defaultParams: [{ current: 1, pageSize: defaultPageSize }],
    // 依赖变化更新，如果有的话
    refreshDepsAction: () => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      changeCurrent(1);
    },
    ...rest,
  });

  // 默认参数
  const { current = 1, pageSize = defaultPageSize } = result.params[0] || {};

  // 接口返回的数据总条数
  const total = result.data?.total || 0;
  // 计算分页
  const totalPage = useMemo(() => Math.ceil(total / pageSize), [pageSize, total]);

  // current pageSize
  const onChange = (c: number, p: number) => {
    // 当前分页最小为1
    let toCurrent = c <= 0 ? 1 : c;
    // 分页大小最小为1
    const toPageSize = p <= 0 ? 1 : p;
    // 重新计算分页
    const tempTotalPage = Math.ceil(total / toPageSize);
    if (toCurrent > tempTotalPage) {
      toCurrent = Math.max(1, tempTotalPage);
    }

    const [oldPaginationParams = {}, ...restParams] = result.params || [];

    result.run(
      {
        ...oldPaginationParams,
        current: toCurrent,
        pageSize: toPageSize,
      },
      ...restParams,
    );
  };

  const changeCurrent = (c: number) => {
    onChange(c, pageSize);
  };

  const changePageSize = (p: number) => {
    onChange(current, p);
  };

  return {
    ...result,
    pagination: {
      current,
      pageSize,
      total,
      totalPage,
      onChange: useMemoizedFn(onChange),
      changeCurrent: useMemoizedFn(changeCurrent),
      changePageSize: useMemoizedFn(changePageSize),
    },
  } as PaginationResult<TData, TParams>;
};

export default usePagination;
