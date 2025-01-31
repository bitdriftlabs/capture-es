import colorParse from 'color-parse';

type CaptureElement = {
	type: 'input' | 'label' | 'button' | 'image' | 'transparent' | 'view';
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

const importantMap = {
	label: new Set<string>(),
	image: new Set<string>(),
	button: new Set<string>(),
	input: new Set<string>(),
	transparent: new Set<string>(),
};

const viewMap = new Map<string, number>();

const getTypeFromElement = (element: HTMLElement): CaptureElement['type'] | null => {
	const rect = element.getBoundingClientRect();
	const key = `${rect.x},${rect.y},${rect.width},${rect.height}`;
	const styles = window.getComputedStyle(element);
	if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') {
		return null;
	}

	if (
		(element.matches('[role="heading"],[role="label"],[role="paragraph"]'),
			['span', 'p'].includes(element.tagName.toLocaleLowerCase()))
	) {
		importantMap.label.add(key);
		return 'label';
	}

	if (element.matches('[role="image"]') || ['img', 'svg', 'picture'].includes(element.tagName.toLocaleLowerCase())) {
		importantMap.image.add(key);
		return 'image';
	}

	if (element.matches('[role="button"]') || element.tagName.toLocaleLowerCase() === 'button') {
		importantMap.button.add(key);
		return 'button';
	}

	if (element.tagName.toLocaleLowerCase() === 'input' && element.getAttribute('type') !== 'text') {
		importantMap.input.add(key);
		return 'input';
	}

	// TODO: Be smarter
	const bg = window.getComputedStyle(element).backgroundColor;
	const a = colorParse(bg).alpha;

	if ((a && a >= 0 && a < 1)) {
		importantMap.transparent.add(key);
		return 'transparent';
	}

	// Add view count
	viewMap.set(key, (viewMap.get(key) || 0) + 1);

	return 'view';
};

export const captureScreen = () => {
	// Clear maps.
	viewMap.clear();
	Object.values(importantMap).forEach((set) => set.clear());

	const elements: CaptureElement[] = [];
	const traverse = (element: HTMLElement, zIndex: number = 0): CaptureElement[] => {
		const rect = element.getBoundingClientRect();
		const type = getTypeFromElement(element);

		// Skip element if we can't determine the type.
		if (type) {
			elements.push({
				type,
				x: rect.x,
				y: rect.y,
				width: rect.width,
				height: rect.height,
			});
		}

		// Early return to skip traversing svg elements
		if (element.tagName.toLocaleLowerCase() === 'svg') { return elements; }

		const orderedChildren = Array.from(element.children).sort(
			(a, b) => (parseInt(window.getComputedStyle(a).zIndex, 10) || 0) - (parseInt(window.getComputedStyle(b).zIndex, 10) || 0),
		);

		for (const child of orderedChildren) {
			traverse(child as HTMLElement);
		}

		return elements;
	};

	traverse(window.document.body);

	const removedCount: Record<string, number> = {};
	const filteredElements = elements
		.filter((el) => {
			if (el.type !== 'view') { return true; }

			// Should filter out 'view' elements which are wrappers
			return !Object.keys(importantMap).some((key) =>
				importantMap[key as keyof typeof importantMap].has(`${el.x},${el.y},${el.width},${el.height}`),
			);
		})
		.filter((el) => {
			if (el.type !== 'view') { return true; }

			// Should filter out duplicate 'view' elements

			const key = `${el.x},${el.y},${el.width},${el.height}`;
			if (viewMap.has(key) && viewMap.get(key)! > 1 && (removedCount[key] ?? 0) < viewMap.get(key)! - 1) {
				removedCount[key] = (removedCount[key] || 0) + 1;
				return false;
			}

			return true;
		});

	filteredElements.unshift({
		type: 'view',
		x: 0,
		y: 0,
		width: window.innerWidth,
		height: window.innerHeight,
	});

	const screen = filteredElements.map(
		(el) =>
			[ReplayViewType[el.type], el.x, el.y, el.width, el.height] satisfies [
				number,
				number,
				number,
				number,
				number,
			],
	);

	const ipcRenderer = typeof window === 'undefined' ? null : (window as any).vscode.ipcRenderer;
	ipcRenderer?.send('vscode:bitdrift:replay', screen);
};
