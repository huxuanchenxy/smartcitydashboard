// 检查特定位置附近的内容
const fs = require('fs');
const path = require('path');

const testData = fs.readFileSync(path.join(__dirname, 'testresponse.json'), 'utf-8');

// 检查第31880个字符附近
const position = 31880;
const startPos = Math.max(0, position - 100);
const endPos = Math.min(testData.length, position + 100);

console.log(`=== 位置 ${position} 附近的内容 ===`);
console.log(testData.substring(startPos, endPos));
console.log('\n=== 字符详情 ===');

for (let i = startPos; i < endPos; i++) {
  const char = testData[i];
  const code = char.charCodeAt(0);
  let displayChar = char;
  if (code === 10) displayChar = '[\\n]';
  if (code === 13) displayChar = '[\\r]';
  if (code === 32) displayChar = '[空格]';
  console.log(`位置 ${i}: '${displayChar}' (ASCII: ${code})`);
}