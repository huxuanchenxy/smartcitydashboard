// 测试：修复字符串内的控制字符
const fs = require('fs');
const path = require('path');

const testData = fs.readFileSync(path.join(__dirname, 'testresponse.json'), 'utf-8');

// 移除 UTF-8 BOM
let cleaned = testData;
if (cleaned.charCodeAt(0) === 0xFEFF) {
  cleaned = cleaned.substring(1);
} else if (cleaned.substring(0, 3) === '\xEF\xBB\xBF') {
  cleaned = cleaned.substring(3);
}

// 移除 markdown 标记
cleaned = cleaned.replace(/^\s*```(json)?\s*/i, '');
cleaned = cleaned.replace(/\s*```\s*$/, '');

// 移除真正的控制字符（保留\n和\r）
cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

// 关键修复：将字符串内的\r和\n转义
function escapeControlCharsInStrings(str) {
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString) {
      // 在字符串内部，需要转义控制字符
      if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else {
        result += char;
      }
    } else {
      // 在字符串外部，保持原样
      result += char;
    }
  }

  return result;
}

cleaned = escapeControlCharsInStrings(cleaned);

console.log('处理后的长度:', cleaned.length);

// 尝试解析
try {
  const result = JSON.parse(cleaned);
  console.log('✅ 解析成功！');
  console.log('screen.name:', result.screen?.name);
  console.log('coms 数量:', result.coms?.length);
} catch (e) {
  console.log('❌ 解析失败:', e.message);
  
  // 找到失败位置
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    const start = Math.max(0, pos - 50);
    const end = Math.min(cleaned.length, pos + 50);
    console.log(`\n失败位置 ${pos} 附近:`);
    console.log(cleaned.substring(start, end));
    
    // 显示字符详情
    console.log('\n字符详情:');
    for (let i = start; i < end; i++) {
      const char = cleaned[i];
      const code = char.charCodeAt(0);
      let display = char;
      if (code === 10) display = '\\n';
      if (code === 13) display = '\\r';
      if (code === 32) display = '·';
      if (code < 32 || code === 127) {
        display = `[0x${code.toString(16)}]`;
      }
      console.log(`${i}: '${display}' (${code})`);
    }
  }
}