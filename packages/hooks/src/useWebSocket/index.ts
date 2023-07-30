import { useEffect, useRef, useState } from 'react';
import useLatest from '../useLatest';
import useMemoizedFn from '../useMemoizedFn';
import useUnmount from '../useUnmount';

// websocket 链接的状态
export enum ReadyState {
  Connecting = 0, // 链接中
  Open = 1, // 已经链接并且可以通讯
  Closing = 2, // 关闭中
  Closed = 3, // 已经关闭
}

export interface Options {
  reconnectLimit?: number; // 重试次数
  reconnectInterval?: number; // 重试时间间隔
  manual?: boolean; // 是否手动触发
  // websocket成功链接之后的回调
  onOpen?: (event: WebSocketEventMap['open'], instance: WebSocket) => void;
  // websocket关闭之后的回调
  onClose?: (event: WebSocketEventMap['close'], instance: WebSocket) => void;
  // webSocket 收到消息回调
  onMessage?: (message: WebSocketEventMap['message'], instance: WebSocket) => void;
  // webSocket  错误回调
  onError?: (event: WebSocketEventMap['error'], instance: WebSocket) => void;
  // 子协议
  protocols?: string | string[];
}

// 返回结果
export interface Result {
  // 最新消息
  latestMessage?: WebSocketEventMap['message'];
  // 发送消息函数
  sendMessage?: WebSocket['send'];
  // 断开链接
  disconnect?: () => void;
  // 手动连接 webSocket，如果当前已有连接，则关闭后重新连接
  connect?: () => void;
  // websocket链接状态
  readyState: ReadyState;
  // webSocket 实例
  webSocketIns?: WebSocket;
}

export default function useWebSocket(socketUrl: string, options: Options = {}): Result {
  const {
    // 重试次数默认为3
    reconnectLimit = 3,
    // 重试时间间隔默认为3s
    reconnectInterval = 3 * 1000,
    // 默认自动链接
    manual = false,
    onOpen,
    onClose,
    onMessage,
    onError,
    protocols,
  } = options;

  const onOpenRef = useLatest(onOpen);
  const onCloseRef = useLatest(onClose);
  const onMessageRef = useLatest(onMessage);
  const onErrorRef = useLatest(onError);

  const reconnectTimesRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const websocketRef = useRef<WebSocket>();

  const unmountedRef = useRef(false);

  const [latestMessage, setLatestMessage] = useState<WebSocketEventMap['message']>();
  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.Closed);

  // 错误重试
  const reconnect = () => {
    // 没有超过错误重试链接次数或者没有链接成功
    if (
      reconnectTimesRef.current < reconnectLimit &&
      websocketRef.current?.readyState !== ReadyState.Open
    ) {
      // 清空之前的错误重试定时器
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      reconnectTimerRef.current = setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        connectWs();
        reconnectTimesRef.current++;
      }, reconnectInterval);
    }
  };

  // 创建链接
  const connectWs = () => {
    // 如果有重试的逻辑，则清除掉其定时器
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    // 先关闭之前的
    if (websocketRef.current) {
      websocketRef.current.close();
    }

    // 创建websocket链接
    const ws = new WebSocket(socketUrl, protocols);
    // 修改状态为链接中
    setReadyState(ReadyState.Connecting);

    // websocket错误回调
    ws.onerror = (event) => {
      // 页面没有被卸载
      if (unmountedRef.current) {
        return;
      }

      reconnect();
      // 触发错误回调函数
      onErrorRef.current?.(event, ws);
      // 修改状态为ws的当前状态或者为关闭
      setReadyState(ws.readyState || ReadyState.Closed);
    };
    // ws成功的回调
    ws.onopen = (event) => {
      // 页面没有被卸载
      if (unmountedRef.current) {
        return;
      }
      // 触发成功的回调
      onOpenRef.current?.(event, ws);
      // 错误重试的次数重置为0
      reconnectTimesRef.current = 0;
      setReadyState(ws.readyState || ReadyState.Open);
    };
    // 发送消息
    ws.onmessage = (message: WebSocketEventMap['message']) => {
      // 页面没有被卸载
      if (unmountedRef.current) {
        return;
      }
      onMessageRef.current?.(message, ws);
      // 修改最新消息
      setLatestMessage(message);
    };
    ws.onclose = (event) => {
      if (unmountedRef.current) {
        return;
      }
      // 错误重试
      reconnect();
      onCloseRef.current?.(event, ws);
      // 修改当前状态
      setReadyState(ws.readyState || ReadyState.Closed);
    };

    websocketRef.current = ws;
  };

  // 发送消息
  const sendMessage: WebSocket['send'] = (message) => {
    if (readyState === ReadyState.Open) {
      websocketRef.current?.send(message);
    } else {
      throw new Error('WebSocket disconnected');
    }
  };

  const connect = () => {
    reconnectTimesRef.current = 0;
    connectWs();
  };

  const disconnect = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    reconnectTimesRef.current = reconnectLimit;
    websocketRef.current?.close();
  };

  useEffect(() => {
    if (!manual) {
      connect();
    }
  }, [socketUrl, manual]);

  useUnmount(() => {
    unmountedRef.current = true;
    disconnect();
  });

  return {
    latestMessage,
    sendMessage: useMemoizedFn(sendMessage),
    connect: useMemoizedFn(connect),
    disconnect: useMemoizedFn(disconnect),
    readyState,
    webSocketIns: websocketRef.current,
  };
}
