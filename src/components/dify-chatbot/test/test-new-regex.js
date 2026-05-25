const fs = require('fs');
const path = require('path');

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
cleanedStr = cleanedStr.replace(/(?:^|[,\r\n\t ])"([a-zA-Z_][a-zA-Z0-9_]*)"\s+(\[|\{)/g, '"$1":$2');

console.log('\n步骤 5 后，第 176 行:');
const lines5 = cleanedStr.split('\n');
console.log(lines5[175]);

console.log('\n步骤 5 后，第 939 行（如果有的话）:');
console.log(lines5[938]);

// 继续处理
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
cleanedStr = cleanedStr.replace(/[\r\n]/g, '');
cleanedStr = cleanedStr.trim();

// 尝试解析
try {
  const result = JSON.parse(cleanedStr);
  console.log('\n✅ 解析成功!');
  console.log('screen.name:', result.screen?.name);
  console.log('coms.length:', result.coms?.length);
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
