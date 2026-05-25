const fs = require('fs');
const path = require('path');

// 模拟 DifyApiDialog.vue 中的调用流程
const testFilePath = path.join(__dirname, 'testresponse.json');
const jsonStr = fs.readFileSync(testFilePath, 'utf-8');

console.log('步骤 1: 读取文件成功');
console.log('文件开头:', jsonStr.slice(0, 50));

// 尝试直接解析（模拟 DifyApiDialog.vue 第 580 行）
try {
  const jsonObj = JSON.parse(jsonStr);
  console.log('✅ 直接解析成功!');
} catch (parseError) {
  console.log('❌ 直接解析失败:', parseError.message);
  
  // 调用 calibrateJsonString（模拟第 583 行）
  const { calibrateJsonString } = require('./jsonCalibration');
  
  console.log('\n步骤 2: 调用 calibrateJsonString');
  const jsonObj = calibrateJsonString(jsonStr);
  
  if (jsonObj) {
    console.log('✅ 校准成功!');
    console.log('screen.name:', jsonObj.screen?.name);
    console.log('coms.length:', jsonObj.coms?.length);
  } else {
    console.log('❌ 校准失败，返回 null');
  }
}
