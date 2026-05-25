const fs = require('fs');
const path = require('path');

const testFilePath = path.join(__dirname, 'testresponse.json');
const originalJson = fs.readFileSync(testFilePath, 'utf-8');

// 找到包含 script 的行
const lines = originalJson.split(/\r?\n/);
for (let i = 174; i <= 178; i++) {
  console.log(`行 ${i}: ${lines[i]}`);
}

console.log('\n--- 模拟处理过程 ---');

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

console.log('\n步骤 3 后，第 176 行:');
const lines3 = cleanedStr.split('\n');
console.log(lines3[175]);

// 4. 修复属性值缺少引号
cleanedStr = cleanedStr.replace(/:(\s*)([a-zA-Z_][a-zA-Z0-9_]*)"/g, ':$1"$2"');

console.log('\n步骤 4 后，第 176 行:');
const lines4 = cleanedStr.split('\n');
console.log(lines4[175]);

// 5. 修复 "key" [ 的情况
cleanedStr = cleanedStr.replace(/(?<!:)"([a-zA-Z_][a-zA-Z0-9_]*)\s+(\[|\{)/g, '"$1":$2');

console.log('\n步骤 5 后，第 176 行:');
const lines5 = cleanedStr.split('\n');
console.log(lines5[175]);
