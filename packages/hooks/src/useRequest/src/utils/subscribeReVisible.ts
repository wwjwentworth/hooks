import canUseDom from '../../../utils/canUseDom';
import isDocumentVisible from './isDocumentVisible';

const listeners: any[] = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return function unsubscribe() {
    const index = listeners.indexOf(listener);
    listeners.splice(index, 1);
  };
}

if (canUseDom()) {
  const revalidate = () => {
    if (!isDocumentVisible()) return;
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  };
  // 当页面可见之后，执行监听函数
  window.addEventListener('visibilitychange', revalidate, false);
}

export default subscribe;
