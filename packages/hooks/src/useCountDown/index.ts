import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import useLatest from '../useLatest';

export type TDate = Date | number | string | undefined;

export type Options = {
  targetDate?: TDate; // 目标时间
  interval?: number; // 变化时间间隔 毫秒
  onEnd?: () => void; // 倒计时结束触发
};

export interface FormattedRes {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

// 计算剩余时间
// t: 目标时间
const calcLeft = (t?: TDate) => {
  if (!t) {
    return 0;
  }
  // https://stackoverflow.com/questions/4310953/invalid-date-in-safari
  const left = dayjs(t).valueOf() - new Date().getTime();
  if (left < 0) {
    return 0;
  }
  return left;
};

const parseMs = (milliseconds: number): FormattedRes => {
  return {
    days: Math.floor(milliseconds / 86400000),
    hours: Math.floor(milliseconds / 3600000) % 24,
    minutes: Math.floor(milliseconds / 60000) % 60,
    seconds: Math.floor(milliseconds / 1000) % 60,
    milliseconds: Math.floor(milliseconds) % 1000,
  };
};

const useCountdown = (options?: Options) => {
  const { targetDate, interval = 1000, onEnd } = options || {};

  // 通过目标时间计算剩余时间
  const [timeLeft, setTimeLeft] = useState(() => calcLeft(targetDate));

  // 缓存onEnd函数
  const onEndRef = useLatest(onEnd);

  useEffect(() => {
    // 目标时间不存在，剩余时长为0
    if (!targetDate) {
      // for stop
      setTimeLeft(0);
      return;
    }

    // 立即执行一次
    setTimeLeft(calcLeft(targetDate));

    const timer = setInterval(() => {
      // 学习：通过当前时间与目标时间的间隔计算剩余时间
      const targetLeft = calcLeft(targetDate);
      setTimeLeft(targetLeft);
      if (targetLeft === 0) {
        clearInterval(timer);
        onEndRef.current?.();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [targetDate, interval]);

  const formattedRes = useMemo(() => {
    return parseMs(timeLeft);
  }, [timeLeft]);

  // 返回倒计时间戳（毫秒）格式化后的倒计时
  return [timeLeft, formattedRes] as const;
};

export default useCountdown;
