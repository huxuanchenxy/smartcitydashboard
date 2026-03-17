/**
 * PGM文件解析工具
 */

export interface PgmImage {
  width: number;
  height: number;
  maxValue: number;
  data: Uint8ClampedArray;
  format: 'P2' | 'P5';
}

/**
 * 解析PGM文件
 */
export async function parsePgmFile(file: File | Blob): Promise<PgmImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          // P2格式（ASCII）
          resolve(parseP2(result));
        } else if (result instanceof ArrayBuffer) {
          // P5格式（二进制）
          resolve(parseP5(result));
        } else {
          reject(new Error('Unsupported file format'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // 检查文件头以确定格式
    const headerReader = new FileReader();
    headerReader.onload = (e) => {
      const header = e.target?.result as string;
      if (header.startsWith('P2')) {
        reader.readAsText(file);
      } else if (header.startsWith('P5')) {
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('Not a valid PGM file'));
      }
    };
    headerReader.readAsText(file, 'utf-8');
  });
}

/**
 * 解析P2格式（ASCII）
 */
function parseP2(content: string): PgmImage {
  const lines = content.split('\n').filter(line => !line.startsWith('#') && line.trim() !== '');
  let index = 0;
  
  const format = lines[index++].trim() as 'P2';
  const [width, height] = lines[index++].trim().split(/\s+/).map(Number);
  const maxValue = Number(lines[index++].trim());
  
  const data = new Uint8ClampedArray(width * height * 4); // RGBA
  let dataIndex = 0;
  
  for (let i = index; i < lines.length && dataIndex < width * height * 4; i++) {
    const values = lines[i].trim().split(/\s+/);
    for (const value of values) {
      const gray = Number(value);
      data[dataIndex++] = gray;
      data[dataIndex++] = gray;
      data[dataIndex++] = gray;
      data[dataIndex++] = 255; // alpha
    }
  }
  
  return {
    width,
    height,
    maxValue,
    data,
    format
  };
}

/**
 * 解析P5格式（二进制）
 */
function parseP5(buffer: ArrayBuffer): PgmImage {
  const view = new DataView(buffer);
  let offset = 0;
  
  // 读取格式
  const formatBytes = new Uint8Array(buffer, offset, 2);
  const format = String.fromCharCode(formatBytes[0], formatBytes[1]) as 'P5';
  offset += 2;
  
  // 跳过空格和注释
  while (offset < buffer.byteLength) {
    const byte = view.getUint8(offset);
    if (byte === 35) { // # 注释
      while (offset < buffer.byteLength && view.getUint8(offset) !== 10) offset++;
    } else if (byte > 32) { // 非空白字符
      break;
    } else {
      offset++;
    }
  }
  
  // 读取宽度和高度
  let width = 0, height = 0;
  while (offset < buffer.byteLength && view.getUint8(offset) > 32) {
    width = width * 10 + (view.getUint8(offset) - 48);
    offset++;
  }
  while (offset < buffer.byteLength && view.getUint8(offset) <= 32) offset++;
  while (offset < buffer.byteLength && view.getUint8(offset) > 32) {
    height = height * 10 + (view.getUint8(offset) - 48);
    offset++;
  }
  
  // 读取最大灰度值
  let maxValue = 0;
  while (offset < buffer.byteLength && view.getUint8(offset) <= 32) offset++;
  while (offset < buffer.byteLength && view.getUint8(offset) > 32) {
    maxValue = maxValue * 10 + (view.getUint8(offset) - 48);
    offset++;
  }
  while (offset < buffer.byteLength && view.getUint8(offset) <= 32) offset++;
  
  // 读取像素数据
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const gray = view.getUint8(offset + i);
    const dataIndex = i * 4;
    data[dataIndex] = gray;
    data[dataIndex + 1] = gray;
    data[dataIndex + 2] = gray;
    data[dataIndex + 3] = 255;
  }
  
  return {
    width,
    height,
    maxValue,
    data,
    format
  };
}

/**
 * 编码PGM文件
 */
export function encodePgmImage(image: PgmImage): Blob {
  if (image.format === 'P2') {
    return encodeP2(image);
  } else {
    return encodeP5(image);
  }
}

/**
 * 编码P2格式（ASCII）
 */
function encodeP2(image: PgmImage): Blob {
  let content = `P2\n${image.width} ${image.height}\n${image.maxValue}\n`;
  
  for (let i = 0; i < image.height; i++) {
    for (let j = 0; j < image.width; j++) {
      const index = (i * image.width + j) * 4;
      const gray = image.data[index];
      content += `${gray} `;
    }
    content += '\n';
  }
  
  return new Blob([content], { type: 'image/x-portable-graymap' });
}

/**
 * 编码P5格式（二进制）
 */
function encodeP5(image: PgmImage): Blob {
  const header = `P5\n${image.width} ${image.height}\n${image.maxValue}\n`;
  const headerBytes = new TextEncoder().encode(header);
  const pixelData = new Uint8Array(image.width * image.height);
  
  for (let i = 0; i < image.width * image.height; i++) {
    pixelData[i] = image.data[i * 4];
  }
  
  const totalLength = headerBytes.length + pixelData.length;
  const result = new Uint8Array(totalLength);
  result.set(headerBytes, 0);
  result.set(pixelData, headerBytes.length);
  
  return new Blob([result], { type: 'image/x-portable-graymap' });
}

/**
 * 从Canvas创建PGM图像
 */
export function createPgmFromCanvas(canvas: HTMLCanvasElement, maxValue: number = 255): PgmImage {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Cannot get canvas context');
  }
  
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = new Uint8ClampedArray(width * height * 4);
  
  for (let i = 0; i < width * height; i++) {
    const index = i * 4;
    const r = imageData.data[index];
    const g = imageData.data[index + 1];
    const b = imageData.data[index + 2];
    const gray = Math.round((r + g + b) / 3);
    data[index] = gray;
    data[index + 1] = gray;
    data[index + 2] = gray;
    data[index + 3] = 255;
  }
  
  return {
    width,
    height,
    maxValue,
    data,
    format: 'P5'
  };
}

/**
 * 将PGM图像绘制到Canvas
 */
export function drawPgmToCanvas(image: PgmImage, canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Cannot get canvas context');
  }
  
  canvas.width = image.width;
  canvas.height = image.height;
  
  const imageData = ctx.createImageData(image.width, image.height);
  imageData.data.set(image.data);
  ctx.putImageData(imageData, 0, 0);
}