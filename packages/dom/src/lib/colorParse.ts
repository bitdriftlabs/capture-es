type ParsedColor = {
  space: 'rgb' | 'hsl' | 'hex';
  values: number[];
  alpha: number;
};

export function colorParse(input: string | number): ParsedColor {
  if (typeof input === 'number') {
    return {
      space: 'rgb',
      values: [(input >> 16) & 255, (input >> 8) & 255, input & 255],
      alpha: 1,
    };
  }

  const str = input.toLowerCase().trim();

  if (str === 'transparent') {
    return { space: 'rgb', values: [0, 0, 0], alpha: 0 };
  }

  const hexMatch = str.match(/^#([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    let hex = hexMatch[1] as string;
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const rgb = [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
    const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { space: 'hex', values: rgb, alpha };
  }

  const rgbMatch = str.match(/^rgb\(([^)]+)\)$/);
  if (rgbMatch !== undefined && rgbMatch !== null) {
    // @ts-ignore
    const values = rgbMatch[1].split(/,\s*/).map(Number);
    return { space: 'rgb', values: values.slice(0, 3), alpha: values[3] ?? 1 };
  }

  const hslMatch = str.match(/^hsl\(([^)]+)\)$/);
  if (hslMatch) {
    // @ts-ignore
    const values = hslMatch?.[1].split(/,\s*/).map(Number) ?? [];
    return { space: 'hsl', values: values.slice(0, 3), alpha: values[3] ?? 1 };
  }

  return { space: 'rgb', values: [0, 0, 0], alpha: 1 };
}
