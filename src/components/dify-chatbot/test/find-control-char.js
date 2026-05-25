// 查找导致JSON解析失败的控制字符
const fs = require('fs');
const path = require('path');

const testData = fs.readFileSync(path.join(__dirname, 'testresponse.json'), 'utf-8');

// 先进行初步清理
let cleaned = testData
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  .replace(/\r\n/g, '\n')
  .replace(/\r/g, '');

console.log('清理后长度:', cleaned.length);

// 尝试解析并找到失败位置
try {
  JSON.parse(cleaned);
  console.log('✅ 解析成功！');
} catch (e) {
  console.log('❌ 解析失败:', e.message);
  
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const failPos = parseInt(match[1]);
    console.log(`失败位置: ${failPos}`);
    
    // 检查失败位置附近100个字符
    const start = Math.max(0, failPos - 50);
    const end = Math.min(cleaned.length, failPos + 50);
    console.log(`\n失败位置附近内容（${start}-${end}）:`);
    console.log(cleaned.substring(start, end));
    
    console.log('\n字符详情:');
    for (let i = start; i < end; i++) {
      const char = cleaned[i];
      const code = char.charCodeAt(0);
      let display = char;
      if (code === 10) display = '\\n (换行)';
      if (code === 9) display = '\\t (制表符)';
      if (code < 32 || code === 127) {
        display = `[控制字符: 0x${code.toString(16)}]`;
      }
      console.log(`${i}: '${display}' (ASCII: ${code})`);
    }
    
    // 检查是否有隐藏的Unicode控制字符
    console.log('\n检查Unicode控制字符:');
    for (let i = start; i < end; i++) {
      const char = cleaned[i];
      const code = char.charCodeAt(0);
      // 检查Unicode控制字符范围
      if ((code >= 0x00 && code <= 0x1F) || 
          (code >= 0x7F && code <= 0x9F) ||
          (code >= 0x200B && code <= 0x200F) ||
          (code >= 0xFEFF)) {
        console.log(`位置 ${i}: Unicode控制字符 U+${code.toString(16).toUpperCase()} (${code})`);
      }
    }
  }
}
