import canUseDom from '../../../utils/canUseDom';

export default function isDocumentVisible(): boolean {
  // DOM是否可用
  if (canUseDom()) {
    // document.visibilityState 只读属性，document的可见状态
    // hidden 此时页面对用户不可见，即当前文档处于背景标签页或者窗口最小化状态，或者操作系统处于“锁屏状态”
    return document.visibilityState !== 'hidden';
  }
  return true;
}
