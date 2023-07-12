type Listener = (data: any) => void;
const listeners: Record<string, Listener[]> = {};

// 执行
const trigger = (key: string, data: any) => {
  if (listeners[key]) {
    listeners[key].forEach((item) => item(data));
  }
};

// 订阅
const subscribe = (key: string, listener: Listener) => {
  if (!listeners[key]) {
    listeners[key] = [];
  }
  listeners[key].push(listener);

  // 返回一个取消订阅的方法
  return function unsubscribe() {
    const index = listeners[key].indexOf(listener);
    listeners[key].splice(index, 1);
  };
};

export { trigger, subscribe };
