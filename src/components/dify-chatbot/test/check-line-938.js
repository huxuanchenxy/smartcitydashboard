// 检查第938行附近的内容
const fs = require('fs');
const path = require('path');

const testData = fs.readFileSync(path.join(__dirname, 'testresponse.json'), 'utf-8');

// 先移除\r并按行分割
const lines = testData.replace(/\r/g, '').split('\n');

console.log(`总共有 ${lines.length} 行`);
console.log(`第938行内容:`);
console.log(lines[937]); // 数组索引从0开始

// 检查第938行前后5行
console.log('\n=== 第933-943行内容 ===');
for (let i = 932; i <= 942; i++) {
  if (lines[i]) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

// 检查第938行的每个字符
console.log('\n=== 第938行字符详情 ===');
const line938 = lines[937];
for (let i = 0; i < line938.length; i++) {
  const char = line938[i];
  const code = char.charCodeAt(0);
  let display = char;
  if (code === 10) display = '\\n';
  if (code === 9) display = '\\t';
  if (code === 32) display = '·'; // 显示空格
  if (code < 32 || code === 127) {
    display = `[0x${code.toString(16)}]`;
  }
  console.log(`${i}: '${display}' (${code})`);
}

// 检查位置32782附近
let pos = 0;
for (let i = 0; i < lines.length; i++) {
  if (pos + lines[i].length + 1 > 32782) {
    console.log(`\n位置32782在第${i + 1}行附近`);
    console.log(`该行内容: ${lines[i]}`);
    const offset = 32782 - pos;
    console.log(`在该行的偏移: ${offset}`);
    console.log(`该位置字符: '${lines[i][offset]}' (${lines[i].charCodeAt(offset)})`);
    break;
  }
  pos += lines[i].length + 1; // +1 for newline
}