const fs = require('fs');
const path = require('path');

const testFilePath = path.join(__dirname, 'testresponse.json');
const originalJson = fs.readFileSync(testFilePath, 'utf-8');

// 转义字符串内的控制字符
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

// 3. 移除真正的控制字符（保留\n和\r）
cleanedStr = cleanedStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

// 4. 转义字符串内的控制字符
cleanedStr = escapeControlCharsInStrings(cleanedStr);

cleanedStr = cleanedStr.trim();

// 5. 找到有效的 JSON 起始位置
const firstBraceIndex = cleanedStr.indexOf('{');

if (firstBraceIndex !== -1 && firstBraceIndex > 0) {
  cleanedStr = cleanedStr.substring(firstBraceIndex);
}

let fixedStr = cleanedStr;

// 查找所有包含 "type" 的行
const lines = fixedStr.split('\n');
console.log('查找所有包含 "type" 的行:');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('"type"')) {
    console.log(`行 ${i}: ${line.substring(0, 100)}`);
    
    // 检查是否有问题
    if (line.includes(':static"') || line.includes(':com"') || line.includes(':"')) {
      console.log(`  ⚠️ 可能有问题`);
    }
  }
}

// 检查是否还有 :static"
console.log('\n检查是否还有 :static":', fixedStr.includes(':static"'));

// 尝试修复属性值缺少引号
fixedStr = fixedStr.replace(/:(\s*)([a-zA-Z_][a-zA-Z0-9_]*)"/g, ':$1"$2"');

console.log('修复后是否还有 :static":', fixedStr.includes(':static"'));

// 再次检查包含 "type" 的行
const linesAfter = fixedStr.split('\n');
console.log('\n修复后包含 "type" 的行:');
for (let i = 0; i < linesAfter.length; i++) {
  const line = linesAfter[i];
  if (line.includes('"type"')) {
    console.log(`行 ${i}: ${line.substring(0, 100)}`);
  }
}
