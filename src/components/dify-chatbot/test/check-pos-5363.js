// 检查位置 5363 附近
const fs = require('fs');
const path = require('path');

const testData = fs.readFileSync(path.join(__dirname, 'testresponse.json'), 'utf-8');

// 简单清理
let cleaned = testData
  .replace(/^\s*```(json)?\s*/i, '')
  .replace(/\s*```\s*$/, '')
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

// 找到位置 5363 附近
const pos = 5363;
const start = Math.max(0, pos - 100);
const end = Math.min(cleaned.length, pos + 100);

console.log(`位置 ${pos} 附近:`);
console.log(cleaned.substring(start, end));

// 按行显示
const lines = cleaned.split('\n');
let currentPos = 0;
for (let i = 0; i < lines.length; i++) {
  if (currentPos + lines[i].length >= pos) {
    console.log(`\n第 ${i + 1} 行 (位置 ${currentPos}-${currentPos + lines[i].length}):`);
    console.log(lines[i]);
    
    // 显示前后几行
    console.log('\n=== 前后文 ===');
    for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 3); j++) {
      const marker = j === i ? '>>>' : `${j + 1}:`;
      console.log(`${marker} ${lines[j]}`);
    }
    break;
  }
  currentPos += lines[i].length + 1; // +1 for newline
}