import { useRef } from 'react';
import useLatest from '../useLatest';
import type { BasicTarget } from '../utils/domTarget';
import { getTargetElement } from '../utils/domTarget';
import isBrowser from '../utils/isBrowser';
import useEffectWithTarget from '../utils/useEffectWithTarget';

type EventType = MouseEvent | TouchEvent;
export interface Options {
  delay?: number;
  moveThreshold?: { x?: number; y?: number };
  onClick?: (event: EventType) => void;
  onLongPressEnd?: (event: EventType) => void;
}

const touchSupported =
  isBrowser &&
  // @ts-ignore
  ('ontouchstart' in window || (window.DocumentTouch && document instanceof DocumentTouch));

function useLongPress(
  onLongPress: (event: EventType) => void,
  target: BasicTarget,
  { delay = 300, moveThreshold, onClick, onLongPressEnd }: Options = {},
) {
  const onLongPressRef = useLatest(onLongPress);
  const onClickRef = useLatest(onClick);
  const onLongPressEndRef = useLatest(onLongPressEnd);

  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const isTriggeredRef = useRef(false);

  const hasMoveThreshold =
    !!((moveThreshold?.x && moveThreshold.x > 0) || (moveThreshold?.y && moveThreshold.y > 0)) &&
    touchSupported;
  const positionRef = useRef({ x: 0, y: 0 });
  const isMovedOutRef = useRef(false);

  useEffectWithTarget(
    () => {
      const targetElement = getTargetElement(target);
      if (!targetElement?.addEventListener) {
        return;
      }

      const onStart = (event: EventType) => {
        if (hasMoveThreshold) {
          isMovedOutRef.current = false;
          positionRef.current.x = (event as TouchEvent).touches[0].clientX;
          positionRef.current.y = (event as TouchEvent).touches[0].clientY;
        }
        timerRef.current = setTimeout(() => {
          if (isMovedOutRef.current) return;
          onLongPressRef.current(event);
          isTriggeredRef.current = true;
        }, delay);
      };

      const onMove = (event: TouchEvent) => {
        if (hasMoveThreshold) {
          const offsetX = Math.abs(event.touches[0].clientX - positionRef.current.x);
          const offsetY = Math.abs(event.touches[0].clientY - positionRef.current.y);
          if (moveThreshold?.x && offsetX > moveThreshold.x) {
            isMovedOutRef.current = true;
          }
          if (moveThreshold?.y && offsetY > moveThreshold.y) {
            isMovedOutRef.current = true;
          }
        }
      };

      const onEnd = (event: EventType, shouldTriggerClick: boolean = false) => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        if (isTriggeredRef.current) {
          onLongPressEndRef.current?.(event);
        }
        if (shouldTriggerClick && !isTriggeredRef.current && onClickRef.current) {
          onClickRef.current(event);
        }
        isTriggeredRef.current = false;
      };

      const onEndWithClick = (event: EventType) => onEnd(event, true);

      if (!touchSupported) {
        targetElement.addEventListener('mousedown', onStart);
        targetElement.addEventListener('mouseup', onEndWithClick);
        targetElement.addEventListener('mouseleave', onEnd);
      } else {
        targetElement.addEventListener('touchmove', onMove);
        targetElement.addEventListener('touchstart', onStart);
        targetElement.addEventListener('touchend', onEndWithClick);
      }

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          isTriggeredRef.current = false;
        }
        if (!touchSupported) {
          targetElement.removeEventListener('mousedown', onStart);
          targetElement.removeEventListener('mouseup', onEndWithClick);
          targetElement.removeEventListener('mouseleave', onEnd);
        } else {
          targetElement.removeEventListener('touchmove', onMove);
          targetElement.removeEventListener('touchstart', onStart);
          targetElement.removeEventListener('touchend', onEndWithClick);
        }
      };
    },
    [],
    target,
  );
}

export default useLongPress;
