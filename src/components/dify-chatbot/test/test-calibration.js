// 测试：完整修复流程（包含转义字符串内的控制字符）
const fs = require('fs');
const path = require('path');

const testData = fs.readFileSync(path.join(__dirname, 'testresponse.json'), 'utf-8');

function fixUnclosedStrings(str) {
  const lines = str.split('\n');
  let inString = false;
  let escaped = false;

  for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
      }
    }
  }

  if (inString) {
    return str + '"';
  }
  return str;
}

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

function calibrateJsonString(jsonStr) {
  let cleanedStr = jsonStr;

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
  
  // 4. 先修复属性值缺少引号的问题（必须在转义控制字符之前处理）
  cleanedStr = cleanedStr.replace(/:(\s*)([a-zA-Z_][a-zA-Z0-9_]*)"/g, ':$1"$2"');
  
  // 5. 修复 "key" [ 的情况（必须在转义控制字符之前处理）
  // 使用 (?:^|[,\r\n\t ]) 确保前面是开头、逗号、换行或空白，避免匹配字符串值中的内容
  cleanedStr = cleanedStr.replace(/(?:^|[,\r\n\t ])"([a-zA-Z_][a-zA-Z0-9_]*)"\s+(\[|\{)/g, '"$1":$2');
  
  // 6. 转义字符串内的控制字符
  cleanedStr = escapeControlCharsInStrings(cleanedStr);
  
  // 7. 移除 JSON 结构中的控制字符（\r 和 \n）
  cleanedStr = cleanedStr.replace(/[\r\n]/g, '');
  
  cleanedStr = cleanedStr.trim();

  try {
    return JSON.parse(cleanedStr);
  } catch (e) {
    console.log('第一次解析失败，尝试修复...');
  }

  // 5. 找到有效的 JSON 起始位置
  const firstBraceIndex = cleanedStr.indexOf('{');
  const firstBracketIndex = cleanedStr.indexOf('[');
  
  let startIndex = -1;
  if (firstBraceIndex !== -1 && firstBracketIndex !== -1) {
    startIndex = Math.min(firstBraceIndex, firstBracketIndex);
  } else if (firstBraceIndex !== -1) {
    startIndex = firstBraceIndex;
  } else if (firstBracketIndex !== -1) {
    startIndex = firstBracketIndex;
  }
  
  if (startIndex !== -1 && startIndex > 0) {
    cleanedStr = cleanedStr.substring(startIndex);
  }

  let fixedStr = cleanedStr;

  try {
    // 6. 修复属性值缺少引号的情况：:static" -> :"static"
    fixedStr = fixedStr
      .replace(/:(\s*)([a-zA-Z_][a-zA-Z0-9_]*)"/g, ':$1"$2"');

    // 7. 修复未闭合的字符串
    fixedStr = fixUnclosedStrings(fixedStr);

    // 8. 修复属性名缺少引号
    fixedStr = fixedStr
      .replace(/(['"])?([a-zA-Z_][a-zA-Z0-9_]*)(['"])?\s*:/g, '"$2":');

    // 9. 修复 "key" { 或 "key" [ 的情况（包括中间有多个空格的情况）
    fixedStr = fixedStr
      .replace(/"([^"]+)"\s+\{/g, '"$1":{')
      .replace(/"([^"]+)"\s+\[/g, '"$1":[');
    
    // 再次处理没有空格的情况
    fixedStr = fixedStr
      .replace(/"([^"]+)"\s*\{/g, '"$1":{')
      .replace(/"([^"]+)"\s*\[/g, '"$1":[');

    // 10. 修复缺失逗号
    fixedStr = fixedStr
      .replace(/("[^"\\]*(?:\\.[^"\\]*)*")\s*\n?\s*("[^"]+")\s*:/g, '$1,$2:');
    fixedStr = fixedStr
      .replace(/("[^"\\]*(?:\\.[^"\\]*)*")\s*\n?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1,"$2":');
    fixedStr = fixedStr
      .replace(/(\d+)\s*\n?\s*("[^"]+")\s*:/g, '$1,$2:');
    fixedStr = fixedStr
      .replace(/(\d+)\s*\n?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1,"$2":');
    fixedStr = fixedStr
      .replace(/(true|false)\s*\n?\s*("[^"]+")\s*:/g, '$1,$2:');
    fixedStr = fixedStr
      .replace(/(true|false)\s*\n?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1,"$2":');
    fixedStr = fixedStr
      .replace(/(null)\s*\n?\s*("[^"]+")\s*:/g, '$1,$2:');
    fixedStr = fixedStr
      .replace(/(null)\s*\n?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1,"$2":');
    fixedStr = fixedStr
      .replace(/(})\s*\n?\s*("[^"]+")\s*:/g, '$1,$2:');
    fixedStr = fixedStr
      .replace(/(})\s*\n?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1,"$2":');
    fixedStr = fixedStr
      .replace(/(])\s*\n?\s*("[^"]+")\s*:/g, '$1,$2:');
    fixedStr = fixedStr
      .replace(/(])\s*\n?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1,"$2":');

    // 11. 修复多余逗号
    fixedStr = fixedStr
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/,\s*,/g, ',');

    // 12. 平衡括号
    let openBrace = 0;
    let closeBrace = 0;
    let openBracket = 0;
    let closeBracket = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < fixedStr.length; i++) {
      const char = fixedStr[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') openBrace++;
        if (char === '}') closeBrace++;
        if (char === '[') openBracket++;
        if (char === ']') closeBracket++;
      }
    }

    while (closeBrace < openBrace) {
      fixedStr += '}';
      closeBrace++;
    }
    while (closeBracket < openBracket) {
      fixedStr += ']';
      closeBracket++;
    }

    console.log('修复后的字符串（前 800 字符）:', fixedStr.substring(0, 800));
    
    return JSON.parse(fixedStr);
  } catch (e) {
    console.error('修复失败:', e.message);
    return null;
  }
}

// 测试
console.log('开始测试 JSON 校准...');
const result = calibrateJsonString(testData);

if (result) {
  console.log('✅ JSON 校准成功！');
  console.log('screen.name:', result.screen?.name);
  console.log('coms 数量:', result.coms?.length);
} else {
  console.log('❌ JSON 校准失败');
}