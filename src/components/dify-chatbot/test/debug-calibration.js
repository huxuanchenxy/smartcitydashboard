// 调试脚本：详细检查JSON校准过程
const fs = require('fs');
const path = require('path');

const testData = fs.readFileSync(path.join(__dirname, 'testresponse.json'), 'utf-8');

console.log('原始数据长度:', testData.length);

// 检查是否有未被处理的控制字符
let controlChars = [];
for (let i = 0; i < testData.length; i++) {
  const code = testData[i].charCodeAt(0);
  if (code < 32 || code === 127) {
    controlChars.push({ position: i, code: code, char: testData[i] });
  }
}

console.log('找到的控制字符数量:', controlChars.length);
if (controlChars.length > 0) {
  console.log('前10个控制字符:', controlChars.slice(0, 10));
}

// 测试第一步清理
let cleaned = testData
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '[REMOVED]')
  .replace(/\r\n/g, '\n')
  .replace(/\r/g, '[CR]');

console.log('\n清理后的长度:', cleaned.length);

// 检查位置32782附近
const position = 32782;
const start = Math.max(0, position - 20);
const end = Math.min(cleaned.length, position + 20);
console.log(`\n位置${position}附近的内容:`);
console.log(cleaned.substring(start, end));

// 尝试第一次解析
let cleaned2 = testData
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  .replace(/\r\n/g, '\n')
  .replace(/\r/g, '');

try {
  JSON.parse(cleaned2);
  console.log('\n✅ 第一次解析成功！');
} catch (e) {
  console.log('\n❌ 第一次解析失败:', e.message);
  
  // 找到失败位置附近的内容
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const failPos = parseInt(match[1]);
    console.log(`失败位置: ${failPos}`);
    const startPos = Math.max(0, failPos - 50);
    const endPos = Math.min(cleaned2.length, failPos + 50);
    console.log(`失败位置附近内容:`);
    console.log(cleaned2.substring(startPos, endPos));
    
    // 检查具体字符
    console.log('\n失败位置附近的字符详情:');
    for (let i = startPos; i < endPos; i++) {
      const char = cleaned2[i];
      const code = char.charCodeAt(0);
      let display = char;
      if (code === 10) display = '\\n';
      if (code === 9) display = '\\t';
      if (code < 32 || code === 127) display = `[0x${code.toString(16)}]`;
      console.log(`${i}: '${display}' (${code})`);
    }
  }
}