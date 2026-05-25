const fs = require('fs');
const path = require('path');

const testFilePath = path.join(__dirname, 'testresponse.json');
const originalJson = fs.readFileSync(testFilePath, 'utf-8');

console.log('文件开头:', JSON.stringify(originalJson.slice(0, 50)));
console.log('文件末尾:', JSON.stringify(originalJson.slice(-50)));

// 测试正则表达式
let testStr = originalJson;

console.log('\n测试 markdown 过滤:');
console.log('原始字符串（开头）:', JSON.stringify(testStr.slice(0, 30)));

// 应用正则
testStr = testStr.replace(/^\s*```(json)?\s*/i, '');
console.log('替换后（开头）:', JSON.stringify(testStr.slice(0, 30)));

testStr = testStr.replace(/\s*```\s*$/, '');
console.log('替换后（末尾）:', JSON.stringify(testStr.slice(-30)));
