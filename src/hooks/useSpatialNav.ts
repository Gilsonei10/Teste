import { useEffect, useCallback } from 'react';
import { useIptv } from '../context/IptvContext';

interface SpatialNavOptions {
  onBack?: () => void;
  onEnter?: () => void;
  enabled?: boolean;
}

export function useSpatialNav({ onBack, onEnter, enabled = true }: SpatialNavOptions = {}) {
  const { setActiveSection, setIsConnectModalOpen, setIsSettingsModalOpen } = useIptv();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Smart TV Key code compatibility (Samsung Tizen, LG webOS, Android TV, Roku)
      const keyCode = e.keyCode || e.which;
      const keyName = e.key;

      // 1. Text input exemption (allow typing without spatial navigation stealing focus)
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isInput) {
        if (keyName === 'Escape' || keyCode === 27 || keyCode === 10009 || keyCode === 461) {
          target.blur();
          if (onBack) onBack();
        }
        return;
      }

      // 2. Color Keys on Smart TV Remotes
      // RED: Open Connect Modal (403 / 'ColorF0Red')
      if (keyCode === 403 || keyName === 'ColorF0Red') {
        e.preventDefault();
        setIsConnectModalOpen(true);
        return;
      }
      // GREEN: Switch to Live TV (404 / 'ColorF1Green')
      if (keyCode === 404 || keyName === 'ColorF1Green') {
        e.preventDefault();
        setActiveSection('live');
        return;
      }
      // YELLOW: Switch to Movies (405 / 'ColorF2Yellow')
      if (keyCode === 405 || keyName === 'ColorF2Yellow') {
        e.preventDefault();
        setActiveSection('movies');
        return;
      }
      // BLUE: Switch to Series (406 / 'ColorF3Blue')
      if (keyCode === 406 || keyName === 'ColorF3Blue') {
        e.preventDefault();
        setActiveSection('series');
        return;
      }

      // 3. BACK / RETURN / EXIT Key (Esc, Backspace, Tizen 10009, webOS 461, Android 4)
      const isBackKey =
        keyName === 'Escape' ||
        keyName === 'Backspace' ||
        keyName === 'BrowserBack' ||
        keyName === 'Back' ||
        keyName === 'GoBack' ||
        keyName === 'XF86Back' ||
        keyCode === 27 ||
        keyCode === 8 ||
        keyCode === 10009 ||
        keyCode === 461 ||
        keyCode === 4;

      if (isBackKey) {
        if (onBack) {
          e.preventDefault();
          onBack();
        }
        return;
      }

      // 4. ENTER / OK / SELECT Key (Enter, Space, Tizen 13, webOS 13)
      const isEnterKey = keyName === 'Enter' || keyName === 'Select' || keyCode === 13;
      if (isEnterKey) {
        if (target && target !== document.body && typeof target.click === 'function') {
          // Default browser action executes the focused button/link
          return;
        }
        if (onEnter && target === document.body) {
          e.preventDefault();
          onEnter();
          return;
        }
      }

      // 5. DIRECTIONAL ARROW D-PAD NAVIGATION (Up, Down, Left, Right)
      const isUp = keyName === 'ArrowUp' || keyName === 'Up' || keyCode === 38;
      const isDown = keyName === 'ArrowDown' || keyName === 'Down' || keyCode === 40;
      const isLeft = keyName === 'ArrowLeft' || keyName === 'Left' || keyCode === 37;
      const isRight = keyName === 'ArrowRight' || keyName === 'Right' || keyCode === 39;

      if (isUp || isDown || isLeft || isRight) {
        // Find visible active modal container (if any) to confine navigation inside the dialog
        const activeModal = document.querySelector<HTMLElement>('[role="dialog"], .fixed.inset-0:not(.pointer-events-none)');
        const searchScope = activeModal || document;

        const focusables = Array.from(
          searchScope.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [tabindex="0"], a[href], input:not([disabled]), [data-nav="true"]'
          )
        ).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
        });

        if (focusables.length === 0) return;

        const currentIdx = focusables.indexOf(document.activeElement as HTMLElement);
        if (currentIdx === -1) {
          focusables[0]?.focus();
          focusables[0]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          e.preventDefault();
          return;
        }

        // Spatial 2D Distance Calculation
        const currentRect = focusables[currentIdx].getBoundingClientRect();
        let bestEl: HTMLElement | null = null;
        let minDistance = Infinity;

        focusables.forEach((el, idx) => {
          if (idx === currentIdx) return;
          const r = el.getBoundingClientRect();

          let isCandidate = false;
          let dist = 0;

          if (isRight && r.left >= currentRect.left + 5) {
            isCandidate = true;
            dist = Math.hypot(r.left - currentRect.right, r.top - currentRect.top);
          } else if (isLeft && r.right <= currentRect.right - 5) {
            isCandidate = true;
            dist = Math.hypot(currentRect.left - r.right, r.top - currentRect.top);
          } else if (isDown && r.top >= currentRect.top + 5) {
            isCandidate = true;
            dist = Math.hypot(r.left - currentRect.left, r.top - currentRect.bottom);
          } else if (isUp && r.bottom <= currentRect.bottom - 5) {
            isCandidate = true;
            dist = Math.hypot(r.left - currentRect.left, currentRect.top - r.bottom);
          }

          if (isCandidate && dist < minDistance) {
            minDistance = dist;
            bestEl = el;
          }
        });

        if (bestEl) {
          (bestEl as HTMLElement).focus();
          (bestEl as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          e.preventDefault();
        }
      }
    },
    [enabled, onBack, onEnter, setActiveSection, setIsConnectModalOpen, setIsSettingsModalOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
