// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import colorParse from 'color-parse';
import { matchByRole, matchByTagName } from './utils';

type CaptureElement = {
  type:
    | 'input'
    | 'label'
    | 'button'
    | 'image'
    | 'transparent'
    | 'view'
    | 'webview';
  x: number;
  y: number;
  width: number;
  height: number;
};

enum ReplayViewType {
  label = 0,
  button = 1,
  input = 2,
  image = 3,
  view = 4,
  background = 5,
  switchOn = 6,
  switchOff = 7,
  map = 8,
  chevron = 9,
  transparent = 10,
  keyboard = 11,
  webview = 12,
}

const getTypeFromElement = (
  element: HTMLElement,
  targetWindow: Window,
): CaptureElement['type'] | null => {
  const styles = targetWindow.getComputedStyle(element);
  if (
    styles.display === 'none' ||
    styles.visibility === 'hidden' ||
    styles.opacity === '0' ||
    element.getAttribute('aria-hidden') === 'true'
  ) {
    return null;
  }

  if (
    matchByRole(element, ['heading', 'label', 'paragraph']) ||
    matchByTagName(element, ['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
  ) {
    return 'label';
  }

  if (
    matchByRole(element, ['image']) ||
    matchByTagName(element, ['img', 'svg', 'picture'])
  ) {
    return 'image';
  }

  if (
    matchByRole(element, ['button', 'link']) ||
    matchByTagName(element, ['button', 'a'])
  ) {
    return 'button';
  }

  if (
    matchByTagName(element, ['textarea']) ||
    (matchByTagName(element, ['input']) &&
      element.getAttribute('type') !== 'text')
  ) {
    return 'input';
  }

  if (matchByTagName(element, ['iframe'])) {
    return 'webview';
  }

  // TODO: Be smarter
  const bg = styles.backgroundColor;
  const a = colorParse(bg).alpha;

  if (a && a >= 0 && a < 1) {
    return 'transparent';
  }

  return 'view';
};

const partialKeyFromRect = (rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}) => `${rect.x}~${rect.y}~${rect.width}~${rect.height}`;
const keyFromCaptureElement = ({ type, ...rect }: CaptureElement) =>
  `${type}~${partialKeyFromRect(rect)}`;
const zIndexFromElement = (element: Element) =>
  parseInt(getComputedStyle(element).zIndex, 10) || 0;

export const captureScreen = (targetWindow: Window) => {
  const elementsMap = new Map<string, CaptureElement>();

  const upsertElement = (value: CaptureElement) => {
    const partialKey = partialKeyFromRect(value);
    const key = keyFromCaptureElement(value);
    const existingView = elementsMap.get(`view~${partialKey}`);

    if (existingView) {
      if (value.type !== 'view') {
        elementsMap.delete(`view~${partialKey}`);
        elementsMap.set(key, value);
      }

      // If the element is a view, we should keep the existing view, and skip this one.
    } else {
      elementsMap.set(key, value);
    }
  };

  const traverse = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const type = getTypeFromElement(element, targetWindow);

    // Skip element if we can't determine the type.
    if (type) {
      upsertElement({
        type,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
    }

    // Early return to skip traversing svg elements
    if (element.tagName.toLocaleLowerCase() === 'svg') return;

    const orderedChildren = Array.from(element.children).sort(
      (a, b) => zIndexFromElement(a) - zIndexFromElement(b),
    );

    for (const child of orderedChildren) {
      traverse(child as HTMLElement);
    }
  };

  const p1 = performance.now();
  traverse(document.body);
  const p2 = performance.now();

  const elements = [
    {
      type: 'view' as const,
      x: 0,
      y: 0,
      width: targetWindow.innerWidth,
      height: targetWindow.innerHeight,
    },
    ...elementsMap.values(),
  ];

  const screen = elements.map(
    (el) =>
      [ReplayViewType[el.type], el.x, el.y, el.width, el.height] satisfies [
        number,
        number,
        number,
        number,
        number,
      ],
  );

  return { screen, durationMs: p2 - p1 };
};
