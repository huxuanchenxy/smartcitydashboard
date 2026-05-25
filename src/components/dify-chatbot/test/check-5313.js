const fs = require('fs');
const path = require('path');

// 读取测试文件
const testFilePath = path.join(__dirname, 'testresponse.json');
const originalJson = fs.readFileSync(testFilePath, 'utf-8');

// 模拟校准过程
let cleanedStr = originalJson;

// 1. 移除 BOM
if (cleanedStr.charCodeAt(0) === 0xFEFF) {
  cleanedStr = cleanedStr.substring(1);
} else if (cleanedStr.substring(0, 3) === '\xEF\xBB\xBF') {
  cleanedStr = cleanedStr.substring(3);
}

// 2. 移除 markdown 标记
cleanedStr = cleanedStr.replace(/^\s*```(json)?\s*/i, '');
cleanedStr = cleanedStr.replace(/\s*```\s*$/, '');

// 3. 移除控制字符
cleanedStr = cleanedStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

// 4. 修复属性值缺少引号
cleanedStr = cleanedStr.replace(/:(\s*)([a-zA-Z_][a-zA-Z0-9_]*)"/g, ':$1"$2"');

// 5. 修复 "key" [ 的情况
cleanedStr = cleanedStr.replace(/(?<!:)"([a-zA-Z_][a-zA-Z0-9_]*)\s+(\[|\{)/g, '"$1":$2');

// 6. 转义字符串内的控制字符
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
      if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }

  return result;
}

cleanedStr = escapeControlCharsInStrings(cleanedStr);

// 7. 移除 \r\n
cleanedStr = cleanedStr.replace(/[\r\n]/g, '');

cleanedStr = cleanedStr.trim();

// 查看位置 5313 附近
const position = 5313;
const start = Math.max(0, position - 100);
const end = Math.min(cleanedStr.length, position + 100);

console.log(`位置 ${position} 附近的字符:`);
console.log('---');
console.log(cleanedStr.substring(start, end));
console.log('---');

// 逐字符显示
console.log('\n逐字符分析 (5300-5330):');
for (let i = 5300; i < 5330 && i < cleanedStr.length; i++) {
  const char = cleanedStr[i];
  const ascii = char.charCodeAt(0);
  console.log(`${i}: '${char}' (${ascii})`);
}

// 尝试解析
try {
  JSON.parse(cleanedStr);
  console.log('\n✅ 解析成功!');
} catch (e) {
  console.log(`\n❌ 解析失败：${e.message}`);

  // 提取错误位置
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const errorPos = parseInt(match[1]);
    const errStart = Math.max(0, errorPos - 50);
    const errEnd = Math.min(cleanedStr.length, errorPos + 50);
    console.log(`\n错误位置 ${errorPos} 附近:`);
    console.log(cleanedStr.substring(errStart, errEnd));
  }
}
