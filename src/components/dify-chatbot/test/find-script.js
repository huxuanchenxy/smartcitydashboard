const fs = require('fs');
const path = require('path');

const testFilePath = path.join(__dirname, 'testresponse.json');
const content = fs.readFileSync(testFilePath, 'utf-8');

// 查找包含 "script" 的行
const lines = content.split(/\r?\n/);
console.log('查找包含 "script" 的行:');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('"script"')) {
    console.log(`行 ${i}: ${lines[i]}`);
  }
}
