export const constructArrayBuffer = (data: [number, number, number, number, number][]): ArrayBuffer => {
    const totalSize = data.length * 9; // 5 numbers per tuple

    const buffer = new ArrayBuffer(totalSize);
    const dataView = new DataView(buffer);

    let offset = 0;

    for (const [type, x, y, width, height] of data) {
        const typeWithMask = type | 0b11110000;
        dataView.setInt8(offset, typeWithMask);
        offset += 1;
        dataView.setInt16(offset, x, false);
        offset += 2;
        dataView.setInt16(offset, y, false);
        offset += 2;
        dataView.setInt16(offset, width, false);
        offset += 2;
        dataView.setInt16(offset, height, false);
        offset += 2;
    }

    return buffer;
};
