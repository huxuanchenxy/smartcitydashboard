// 查找所有隐藏的控制字符
const fs = require('fs');
const path = require('path');

const testData = fs.readFileSync(path.join(__dirname, 'testresponse.json'), 'utf-8');

console.log('原始数据长度:', testData.length);

// 检查所有可能的控制字符
let hiddenChars = [];
for (let i = 0; i < testData.length; i++) {
  const char = testData[i];
  const code = char.charCodeAt(0);
  
  // 检查各种控制字符
  if (
    // ASCII控制字符 (0-31, 127)
    (code >= 0x00 && code <= 0x1F) || 
    code === 0x7F ||
    // Unicode控制字符
    (code >= 0x80 && code <= 0x9F) ||
    // 零宽字符
    code === 0x200B || code === 0x200C || code === 0x200D || code === 0x200E || code === 0x200F ||
    // BOM
    code === 0xFEFF
  ) {
    hiddenChars.push({ position: i, code: code, hex: `0x${code.toString(16)}`, char: char });
  }
}

console.log(`找到 ${hiddenChars.length} 个隐藏字符:`);
console.log(hiddenChars.slice(0, 20));

// 检查字符串中是否有未转义的换行
console.log('\n=== 检查字符串中的换行符 ===');
let inString = false;
let escaped = false;
for (let i = 0; i < testData.length; i++) {
  const char = testData[i];
  const code = char.charCodeAt(0);
  
  if (escaped) {
    escaped = false;
    continue;
  }
  if (char === '\\') {
    escaped = true;
    continue;
  }
  if (char === '"') {
    inString = !inString;
    continue;
  }
  if (inString && (code === 10 || code === 13)) {
    console.log(`在位置 ${i} 发现字符串内的换行符 (code: ${code})`);
  }
}
