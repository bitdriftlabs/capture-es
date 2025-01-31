import colorParse from 'color-parse';

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
    styles.opacity === '0'
  ) {
    return null;
  }

  if (
    (element.matches('[role="heading"],[role="label"],[role="paragraph"]'),
    ['span', 'p'].includes(element.tagName.toLocaleLowerCase()))
  ) {
    return 'label';
  }

  if (
    element.matches('[role="image"]') ||
    ['img', 'svg', 'picture'].includes(element.tagName.toLocaleLowerCase())
  ) {
    return 'image';
  }

  if (
    element.matches('[role="button"]') ||
    element.tagName.toLocaleLowerCase() === 'button'
  ) {
    return 'button';
  }

  if (
    element.tagName.toLocaleLowerCase() === 'input' &&
    element.getAttribute('type') !== 'text'
  ) {
    return 'input';
  }

  if (element.tagName.toLocaleLowerCase() === 'iframe') {
    return 'webview';
  }

  // TODO: Be smarter
  const bg = targetWindow.getComputedStyle(element).backgroundColor;
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
