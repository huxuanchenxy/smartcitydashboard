// 检查JSON中的控制字符
const fs = require('fs');
const path = require('path');

const testData = fs.readFileSync(path.join(__dirname, 'testresponse.json'), 'utf-8');

// 按行分割
const lines = testData.split('\n');

// 检查第938行附近
const targetLine = 938;
for (let i = targetLine - 2; i <= targetLine + 2; i++) {
  if (lines[i]) {
    console.log(`\n第 ${i+1} 行:`);
    console.log(`内容: "${lines[i]}"`);
    console.log('字符编码:');
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      const code = char.charCodeAt(0);
      // 显示控制字符
      if (code < 32 || code === 127) {
        console.log(`  位置 ${j}: '${char}' (ASCII: ${code}, 十六进制: 0x${code.toString(16)})`);
      }
    }
  }
}

// 检查第32782个字符附近
console.log(`\n\n=== 检查第32782个字符附近 ===`);
const position = 32782;
for (let i = position - 10; i <= position + 10; i++) {
  const char = testData[i];
  const code = char?.charCodeAt(0) || 0;
  let displayChar = char;
  if (code < 32 || code === 127) {
    displayChar = `[控制字符: 0x${code.toString(16)}]`;
  }
  console.log(`位置 ${i}: '${displayChar}' (ASCII: ${code})`);
}