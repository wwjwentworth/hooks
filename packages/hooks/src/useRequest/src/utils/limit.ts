export default function limit(fn: any, timespan: number) {
  // 用闭包做了个简易版的节流
  let pending = false;
  return (...args: any[]) => {
    if (pending) return;
    pending = true;
    fn(...args);
    setTimeout(() => {
      pending = false;
    }, timespan);
  };
}
