/**
 * JSON校准工具模块
 * 用于修复非法的JSON字符串和验证大屏配置
 */

// 导入组件模板
import comsTemplate from './comstemplate.json';

/**
 * 校准JSON字符串（修复非法JSON）
 * @param {string} jsonStr - 需要校准的JSON字符串
 * @returns {any} 解析后的对象，如果失败返回null
 */
export function calibrateJsonString(jsonStr) {
  let cleanedStr = jsonStr;

  // 移除 UTF-8 BOM 字符（\uFEFF 或 \xEF\xBB\xBF）
  if (cleanedStr.charCodeAt(0) === 0xFEFF) {
    cleanedStr = cleanedStr.substring(1);
  } else if (cleanedStr.substring(0, 3) === '\xEF\xBB\xBF') {
    cleanedStr = cleanedStr.substring(3);
  }

  // 移除 markdown 代码块标记（检查开头和结尾）
  // 检查开头是否有 ```json 或 ```
  if (/^\s*```json\s*/i.test(cleanedStr)) {
    cleanedStr = cleanedStr.replace(/^\s*```json\s*/i, '');
  } else if (/^\s*```\s*/i.test(cleanedStr)) {
    cleanedStr = cleanedStr.replace(/^\s*```\s*/i, '');
  }
  
  // 检查结尾是否有 ```
  if (/\s*```\s*$/i.test(cleanedStr)) {
    cleanedStr = cleanedStr.replace(/\s*```\s*$/i, '');
  }
  
  // 清理控制字符：只移除真正的控制字符，保留\n和\r（这些是数据内容）
  cleanedStr = cleanedStr
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // 先修复属性值缺少引号的问题（必须在转义控制字符之前处理）
  // 否则 :static" 中的 " 会被误认为是字符串开始，导致后面的换行符被错误转义
  cleanedStr = cleanedStr.replace(/:(\s*)([a-zA-Z_][a-zA-Z0-9_]*)"/g, ':$1"$2"');
  
  // 修复属性名缺少前引号的情况（必须在转义控制字符之前处理）
  // 例如：to": "#000" 应该是 "to": "#000"
  // 匹配前面是逗号、换行、制表符或空格的情况
  cleanedStr = cleanedStr.replace(/(?:^|[,\r\n\t ])([a-zA-Z_][a-zA-Z0-9_]*)"\s*:/g, '"$1":');
  
  // 修复 "key" [ 的情况（必须在转义控制字符之前处理）
  // 否则 "fields []" 中的 ]" 会被误认为是字符串结束，导致后面的换行符被错误转义
  // 匹配 "属性名" [ 或 "属性名" { 的情况（属性名后面可能没有闭合引号）
  // 使用负向前瞻和负向后瞻确保不匹配字符串值中的内容
  // (?<!") 确保前面不是引号，避免匹配 "return { 这样的字符串值
  // 但又要确保是属性定义，所以需要检查前面是逗号、换行或开头
  cleanedStr = cleanedStr.replace(/(?:^|[,\r\n\t ])"([a-zA-Z_][a-zA-Z0-9_]*)"\s+(\[|\{)/g, '"$1":$2');
  
  // 转义字符串内的控制字符（JSON 字符串内不允许直接换行）
  cleanedStr = escapeControlCharsInStrings(cleanedStr);
  
  // 移除 JSON 结构中的控制字符（\r 和 \n）
  // 注意：字符串内的已经在上面转义了，这里只处理结构中的
  cleanedStr = cleanedStr.replace(/[\r\n]/g, '');
  
  cleanedStr = cleanedStr.trim();

  try {
    return JSON.parse(cleanedStr);
  } catch (e) {
  }

  // 修复策略1: 找到有效的JSON起始位置
  const firstBraceIndex = cleanedStr.indexOf('{');
  const firstBracketIndex = cleanedStr.indexOf('[');
  
  // 找到第一个 { 或 [
  let startIndex = -1;
  if (firstBraceIndex !== -1 && firstBracketIndex !== -1) {
    startIndex = Math.min(firstBraceIndex, firstBracketIndex);
  } else if (firstBraceIndex !== -1) {
    startIndex = firstBraceIndex;
  } else if (firstBracketIndex !== -1) {
    startIndex = firstBracketIndex;
  }
  
  // 如果找到有效起始位置，截取从该位置开始的字符串
  if (startIndex !== -1 && startIndex > 0) {
    cleanedStr = cleanedStr.substring(startIndex);
  }

  // 修复策略2: 不再使用extractJsonStructure，直接使用清理后的完整字符串
  // extractJsonStructure会被字符串中的大括号误导（如dataFilters的code字段）
  let fixedStr = cleanedStr;

  try {
    const firstChar = fixedStr.charAt(0);
    if (firstChar !== '{' && firstChar !== '[') {
      fixedStr = '{' + fixedStr;
    }

    const lastChar = fixedStr.charAt(fixedStr.length - 1);
    if (lastChar !== '}' && lastChar !== ']') {
      fixedStr = fixedStr + '}';
    }

    fixedStr = fixedStr
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\n/gm, '');

    // 修复属性值缺少引号的情况：:static" -> :"static"
    fixedStr = fixedStr
      .replace(/:(\s*)([a-zA-Z_][a-zA-Z0-9_]*)"/g, ':$1"$2"');

    // 修复未闭合的字符串
    fixedStr = fixUnclosedStrings(fixedStr);

    // 修复属性名缺少引号的情况
    fixedStr = fixedStr
      .replace(/(['"])?([a-zA-Z_][a-zA-Z0-9_]*)(['"])?\s*:/g, '"$2":');

    // 修复 "key" { 或 "key" [ 的情况（包括中间有多个空格的情况）

    fixedStr = fixedStr
      .replace(/"([^"]+)"\s+\{/g, '"$1":{')
      .replace(/"([^"]+)"\s+\[/g, '"$1":[');
    
    // 再次处理没有空格的情况
    fixedStr = fixedStr
      .replace(/"([^"]+)"\s*\{/g, '"$1":{')
      .replace(/"([^"]+)"\s*\[/g, '"$1":[');

    fixedStr = fixMissingCommas(fixedStr);

    fixedStr = fixedStr
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/,\s*,/g, ',');

    fixedStr = balanceBrackets(fixedStr);

    try {
      return JSON.parse(fixedStr);
    } catch (e) {
      return null;
    }
  } catch (e) {
    return null;
  }
}

/**
 * 转义字符串内的控制字符（JSON 字符串内不允许直接换行）
 * @param {string} str - 原始字符串
 * @returns {string} 处理后的字符串
 */
export function escapeControlCharsInStrings(str) {
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

/**
 * 将字符串中的换行符转义（JSON 字符串内不允许直接换行）
 * @param {string} str - 原始字符串
 * @returns {string} 处理后的字符串
 */
export function escapeNewlinesInStrings(str) {
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escaped) {
      // 如果上一个字符是转义符，直接添加当前字符
      result += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      // 遇到转义符，标记下一个字符需要特殊处理
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      // 遇到双引号，切换字符串状态
      inString = !inString;
      result += char;
      continue;
    }

    if (inString) {
      // 在字符串内部
      if (char === '\n') {
        // 字符串内的换行符需要转义
        result += '\\n';
      } else if (char === '\r') {
        // 字符串内的回车符需要转义
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

/**
 * 提取最外层JSON结构
 * @param {string} str - 原始字符串
 * @returns {string} 提取后的JSON字符串
 */
export function extractJsonStructure(str) {
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escaped = false;
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

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

    if (inString) continue;

    if (char === '{') {
      braceCount++;
      if (startIndex === -1) startIndex = i;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0 && startIndex !== -1) {
        endIndex = i;
        break;
      }
    } else if (char === '[') {
      bracketCount++;
      if (startIndex === -1) startIndex = i;
    } else if (char === ']') {
      bracketCount--;
      if (bracketCount === 0 && startIndex !== -1) {
        endIndex = i;
        break;
      }
    }
  }

  if (startIndex !== -1) {
    if (endIndex !== -1) {
      return str.substring(startIndex, endIndex + 1);
    }
    return str.substring(startIndex);
  }

  return str;
}

/**
 * 修复未闭合的字符串
 * @param {string} str - 原始字符串
 * @returns {string} 修复后的字符串
 */
export function fixUnclosedStrings(str) {
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

/**
 * 修复属性值后缺少逗号的问题
 * @param {string} str - 原始字符串
 * @returns {string} 修复后的字符串
 */
export function fixMissingCommas(str) {
  // 修复字符串值后面缺少逗号的情况（包含换行和空格）
  str = str.replace(/("[^"\\]*(?:\\.[^"\\]*)*")\s*\n?\s*("[^"]+")\s*:/g, '$1,$2:');
  str = str.replace(/("[^"\\]*(?:\\.[^"\\]*)*")\s*\n?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1,"$2":');
  
  // 修复数字值后面缺少逗号的情况
  str = str.replace(/(\d+)\s*\n?\s*("[^"]+")\s*:/g, '$1,$2:');
  str = str.replace(/(\d+)\s*\n?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1,"$2":');
  
  // 修复布尔值后面缺少逗号的情况
  str = str.replace(/(true|false)\s*\n?\s*("[^"]+")\s*:/g, '$1,$2:');
  str = str.replace(/(true|false)\s*\n?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1,"$2":');
  
  // 修复null后面缺少逗号的情况
  str = str.replace(/(null)\s*\n?\s*("[^"]+")\s*:/g, '$1,$2:');
  str = str.replace(/(null)\s*\n?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1,"$2":');
  
  // 修复对象结束后缺少逗号的情况
  str = str.replace(/(})\s*\n?\s*("[^"]+")\s*:/g, '$1,$2:');
  str = str.replace(/(})\s*\n?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1,"$2":');
  
  // 修复数组结束后缺少逗号的情况
  str = str.replace(/(])\s*\n?\s*("[^"]+")\s*:/g, '$1,$2:');
  str = str.replace(/(])\s*\n?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1,"$2":');

  return str;
}

/**
 * 平衡大括号/方括号
 * @param {string} str - 原始字符串
 * @returns {string} 修复后的字符串
 */
export function balanceBrackets(str) {
  let fixedStr = str;
  let openBrace = 0;  // {
  let closeBrace = 0; // }
  let openBracket = 0; // [
  let closeBracket = 0; // ]
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

  // 添加缺失的闭合括号
  while (closeBrace < openBrace) {
    fixedStr += '}';
    closeBrace++;
  }
  while (closeBracket < openBracket) {
    fixedStr += ']';
    closeBracket++;
  }

  return fixedStr;
}

// ==================== JSONRepairTool 类 ====================

/**
 * JSON修复工具类
 * 用于修复大屏配置JSON中的格式问题
 * 基于《大屏配置模板.txt》和《大屏组件模板.txt》的数据结构
 * 支持修复：逗号缺失、双引号不配对、大括号方括号不配对等常见JSON格式问题
 */
class JSONRepairTool {
    constructor() {
        this.templateCache = new Map();
        this.componentWhitelist = [
            'VMainTitle', 'VBasicBar', 'VBasicPie', 'VBasicLine', 'VBasicArea',
            'VBasicRadar', 'VButton', 'VProgress', 'VVideo', 'VBgBox',
            'VBorderBox', 'VDecoration', 'VTimer', 'VMainImg', 'VWaterLevel',
            'VDynamicBar', 'VDynamicLine', 'VBasicHorizontal', 'VArcBar',
            'VDashboardPie', 'VGd3dMap', 'VGroup'
        ];
        this.comsTemplate = comsTemplate;
    }

    /**
     * 修复JSON字符串中的常见格式问题 - 增强版
     * @param {string} jsonString - 需要修复的JSON字符串
     * @returns {string} 修复后的JSON字符串
     */
    repairJSONString(jsonString) {
        try {
            // 0. 首先修复括号不配对问题（基础结构修复）
            jsonString = this.fixUnpairedBraces(jsonString);
            
            // 1. 修复逗号缺失问题
            jsonString = this.fixMissingCommas(jsonString);
            
            // 2. 修复双引号不配对问题
            jsonString = this.fixUnpairedQuotes(jsonString);
            
            // 3. 修复未转义的双引号
            jsonString = this.fixUnescapedQuotes(jsonString);
            
            // 4. 修复尾随逗号
            jsonString = this.fixTrailingCommas(jsonString);
            
            // 5. 修复单引号
            jsonString = this.fixSingleQuotes(jsonString);
            
            // 6. 修复未转义的控制字符
            jsonString = this.fixControlCharacters(jsonString);
            
            // 7. 修复注释（移除JSON中的注释）
            jsonString = this.removeComments(jsonString);
            
            // 8. 修复数字格式
            jsonString = this.fixNumberFormat(jsonString);
            
            // 9. 修复布尔值格式
            jsonString = this.fixBooleanFormat(jsonString);
            
            // 10. 修复null值
            jsonString = this.fixNullValues(jsonString);
            
            // 11. 修复数组和对象格式
            jsonString = this.fixArrayObjectFormat(jsonString);
            
            // 12. 修复转义序列
            jsonString = this.fixEscapeSequences(jsonString);
            
            // 13. 最终验证和修复
            jsonString = this.finalValidationAndFix(jsonString);
            
            return jsonString;
        } catch (error) {
            return jsonString;
        }
    }

    /**
     * 修复逗号缺失问题
     */
    fixMissingCommas(str) {
        // 修复对象中缺少逗号的情况
        // 模式：属性值后跟着另一个属性（缺少逗号）
        str = str.replace(/"\s*:\s*([^,${}"]+)\s*"([^:]+)"\s*:/g, '": $1, "$2":');
        
        // 修复数组中缺少逗号的情况
        // 模式：值后跟着另一个值（缺少逗号）
        str = str.replace(/([^,\[${}"']+)\s*([^,${}"]+)(?=\s*[$}])/g, '$1, $2');
        
        // 修复对象结束和数组开始之间缺少逗号
        str = str.replace(/}\s*$/g, '}, [');
        
        // 修复数组结束和对象开始之间缺少逗号
        str = str.replace(/$\s*{/g, '], {');
        
        // 修复对象结束和对象开始之间缺少逗号
        str = str.replace(/}\s*{/g, '}, {');
        
        // 修复数组结束和数组开始之间缺少逗号
        str = str.replace(/\]\s*$/g, '], [');
        
        return str;
    }

    /**
     * 修复双引号不配对问题
     */
    fixUnpairedQuotes(str) {
        let quoteCount = 0;
        let inString = false;
        let result = '';
        
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const prevChar = i > 0 ? str[i - 1] : '';
            const nextChar = i < str.length - 1 ? str[i + 1] : '';
            
            if (char === '"' && prevChar !== '\\') {
                if (!inString) {
                    // 开始字符串
                    inString = true;
                    quoteCount++;
                    result += char;
                } else {
                    // 结束字符串
                    inString = false;
                    quoteCount--;
                    result += char;
                }
            } else if (char === '"' && prevChar === '\\') {
                // 转义的双引号，保持原样
                result += char;
            } else if (inString && char === '\\' && nextChar === '"') {
                // 转义序列，保持原样
                result += char;
            } else {
                result += char;
            }
        }
        
        // 如果还有未闭合的引号，添加闭合引号
        if (inString) {
            result += '"';
            quoteCount--;
        }
        
        // 如果引号数量为奇数，说明有未配对的引号
        if (quoteCount % 2 !== 0) {
            // 在字符串末尾添加一个引号来配对
            result += '"';
        }
        
        return result;
    }

    /**
     * 修复大括号和方括号不配对问题
     */
    fixUnpairedBraces(str) {
        const stack = [];
        const bracePairs = {
            '{': '}',
            '[': ']'
        };
        const reversePairs = {
            '}': '{',
            ']': '['
        };
        
        let result = str;
        
        // 第一次遍历：检查并修复不配对的括号
        for (let i = 0; i < result.length; i++) {
            const char = result[i];
            
            if (char === '{' || char === '[') {
                stack.push({ char, position: i });
            } else if (char === '}' || char === ']') {
                if (stack.length === 0) {
                    // 多余的闭合括号，删除它
                    result = result.slice(0, i) + result.slice(i + 1);
                    i--; // 调整索引
                } else {
                    const last = stack[stack.length - 1];
                    if (bracePairs[last.char] === char) {
                        stack.pop();
                    } else {
                        // 不匹配的括号，删除当前字符
                        result = result.slice(0, i) + result.slice(i + 1);
                        i--;
                    }
                }
            }
        }
        
        // 第二次遍历：添加缺失的闭合括号
        while (stack.length > 0) {
            const { char } = stack.pop();
            result += bracePairs[char];
        }
        
        return result;
    }

    /**
     * 修复未转义的双引号
     */
    fixUnescapedQuotes(str) {
        // 修复属性值中的未转义双引号
        return str.replace(/(?<!\\)"(.*?)(?<!\\)"/g, (match, content) => {
            const escapedContent = content.replace(/"/g, '\\"');
            return `"${escapedContent}"`;
        });
    }

    /**
     * 修复尾随逗号
     */
    fixTrailingCommas(str) {
        // 修复对象中的尾随逗号
        str = str.replace(/,\s*}/g, '}');
        // 修复数组中的尾随逗号
        str = str.replace(/,\s*]/g, ']');
        return str;
    }

    /**
     * 修复单引号
     */
    fixSingleQuotes(str) {
        // 将单引号替换为双引号，但需要处理转义
        return str.replace(/'([^']*)'/g, (match, content) => {
            const escapedContent = content.replace(/"/g, '\\"');
            return `"${escapedContent}"`;
        });
    }

    /**
     * 修复控制字符
     */
    fixControlCharacters(str) {
        const controlCharMap = {
            '\b': '\\b',
            '\f': '\\f',
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t'
        };
        
        return str.replace(/[\b\f\n\r\t]/g, match => controlCharMap[match]);
    }

    /**
     * 移除注释
     */
    removeComments(str) {
        // 移除单行注释
        str = str.replace(/\/\/.*$/gm, '');
        // 移除多行注释
        str = str.replace(/\/\*[\s\S]*?\*\//g, '');
        return str;
    }

    /**
     * 修复数字格式
     */
    fixNumberFormat(str) {
        // 修复前导零的数字（如 0123 -> 123）
        return str.replace(/"(\d+)"/g, (match, num) => {
            if (num.startsWith('0') && num.length > 1) {
                return parseInt(num, 10);
            }
            return match;
        });
    }

    /**
     * 修复布尔值格式
     */
    fixBooleanFormat(str) {
        return str
            .replace(/"true"/g, 'true')
            .replace(/"false"/g, 'false')
            .replace(/"null"/g, 'null');
    }

    /**
     * 修复null值
     */
    fixNullValues(str) {
        return str.replace(/"null"/g, 'null');
    }

    /**
     * 修复数组和对象格式
     */
    fixArrayObjectFormat(str) {
        // 修复缺失的逗号
        str = str.replace(/([}$"'])\s*([{"'])/g, '$1,$2');
        // 修复多余的逗号
        str = str.replace(/,(\s*[}\]])/g, '$1');
        return str;
    }

    /**
     * 修复转义序列
     */
    fixEscapeSequences(str) {
        // 修复未转义的反斜杠
        return str.replace(/\\[^"\\/bfnrtu]/g, '\\\\$&');
    }

    /**
     * 最终验证和修复
     */
    finalValidationAndFix(str) {
        try {
            // 尝试解析JSON
            JSON.parse(str);
            return str;
        } catch (error) {
            if (error.message.includes('Unexpected token')) {
                str = this.fixUnexpectedTokens(str);
            }
            
            if (error.message.includes('Unexpected end')) {
                str = this.fixUnexpectedEnd(str);
            }
            
            if (error.message.includes('Unexpected number')) {
                str = this.fixNumberIssues(str);
            }
            
            try {
                JSON.parse(str);
                return str;
            } catch (e) {
                return str;
            }
        }
    }

    /**
     * 修复意外的token
     */
    fixUnexpectedTokens(str) {
        // 移除JSON字符串开头和结尾的空白字符
        str = str.trim();
        
        // 修复常见的意外字符
        const replacements = [
            // 修复中文引号
            [/"/g, '"'],
            [/'/g, "'"],
            // 修复中文括号
            [/（/g, '('],
            [/）/g, ')'],
            [/［/g, '['],
            [/］/g, ']'],
            [/｛/g, '{'],
            [/｝/g, '}'],
            // 修复全角字符
            [/，/g, ','],
            [/：/g, ':'],
            [/；/g, ';'],
            // 移除控制字符
            [/[\x00-\x1F\x7F]/g, ''],
            // 修复多余的点
            [/\.\.+/g, '.'],
            // 修复连续的逗号
            [/,,+/g, ',']
        ];
        
        replacements.forEach(([pattern, replacement]) => {
            str = str.replace(pattern, replacement);
        });
        
        return str;
    }

    /**
     * 修复意外的结束
     */
    fixUnexpectedEnd(str) {
        // 统计括号数量
        let openBraces = (str.match(/{/g) || []).length;
        let closeBraces = (str.match(/}/g) || []).length;
        let openBrackets = (str.match(/\[/g) || []).length;
        let closeBrackets = (str.match(/]/g) || []).length;
        
        // 添加缺失的闭合括号
        while (openBraces > closeBraces) {
            str += '}';
            closeBraces++;
        }
        
        while (openBrackets > closeBrackets) {
            str += ']';
            closeBrackets++;
        }
        
        // 如果字符串以逗号结尾，移除它
        str = str.replace(/,\s*$/, '');
        
        return str;
    }

    /**
     * 修复数字格式问题
     */
    fixNumberIssues(str) {
        // 修复科学计数法
        str = str.replace(/"([+-]?\d+(?:\.\d+)?[eE][+-]?\d+)"/g, '$1');
        
        // 修复前导零
        str = str.replace(/"0+(\d+)"/g, '"$1"');
        
        // 修复十六进制数字
        str = str.replace(/"0x[0-9a-fA-F]+"/g, (match) => {
            const num = parseInt(match.slice(1, -1), 16);
            return isNaN(num) ? match : num.toString();
        });
        
        return str;
    }

    /**
     * 验证并修复大屏配置JSON结构
     * @param {Object} screenConfig - 大屏配置对象
     * @returns {Object} 修复后的配置对象
     */
    repairScreenConfig(screenConfig) {
        const repairedConfig = { ...screenConfig };
        
        // 1. 验证根结构
        this.validateRootStructure(repairedConfig);
        
        // 2. 验证并修复组件数组
        if (repairedConfig.coms && Array.isArray(repairedConfig.coms)) {
            repairedConfig.coms = repairedConfig.coms.map(component => 
                this.repairComponent(component)
            );
        }
        
        // 3. 验证组件白名单
        this.validateComponentWhitelist(repairedConfig.coms);
        
        // 4. 修复ID唯一性
        this.ensureUniqueIds(repairedConfig.coms);
        
        // 5. 修复VGroup引用完整性
        this.repairGroupReferences(repairedConfig.coms);
        
        // 6. 修复apiData中的JSON字符串
        this.repairApiDataStrings(repairedConfig.coms);
        
        return repairedConfig;
    }

    /**
     * 验证根结构
     */
    validateRootStructure(config) {
        const requiredRootFields = ['screen', 'config', 'coms', 'variables', 'dataFilters'];
        
        for (const field of requiredRootFields) {
            if (!config.hasOwnProperty(field)) {
                config[field] = this.getDefaultRootField(field);
            }
        }
    }

    /**
     * 获取默认的根级字段值
     */
    getDefaultRootField(field) {
        const defaults = {
            screen: { id: 0, name: '', share: '', thumbnail: null, groupId: 0 },
            config: {
                width: 1920,
                height: 1080,
                bgimage: '',
                bgcolor: 'rgba(13,42,67,0)',
                grid: 1,
                screenshot: '',
                zoomMode: 0,
                useWatermark: false,
                styleFilterParams: {
                    enable: false,
                    hue: 0,
                    saturate: 100,
                    brightness: 100,
                    contrast: 100,
                    opacity: 100
                },
                tokenSettings: []
            },
            coms: [],
            variables: {
                componentsView: {},
                publishersView: {},
                subscribersView: {}
            },
            dataFilters: []
        };
        
        return defaults[field] || null;
    }

    /**
     * 修复单个组件 - 严格按照模板校对
     */
    repairComponent(component) {
        if (!component || !component.name) {
            return component;
        }
        
        // 获取组件类型对应的模板
        const template = this.comsTemplate[component.name];
        
        if (template) {
            // 严格按照模板结构重构组件
            return this.refineComponentByTemplate(component, template);
        } else {
            // 如果模板中没有该组件类型，使用原有逻辑
            const repairedComponent = { ...component };
            
            this.ensureRequiredFields(repairedComponent);
            this.repairComponentId(repairedComponent);
            this.repairAttrFields(repairedComponent);
            this.repairComponentConfig(repairedComponent);
            this.repairComponentApiData(repairedComponent);
            
            return repairedComponent;
        }
    }
    
    /**
     * 根据模板严格重构组件结构
     * @param {Object} component - 原始组件
     * @param {Object} template - 组件模板
     * @returns {Object} 重构后的组件
     */
    refineComponentByTemplate(component, template) {
        // 创建新的组件对象，以模板为基础
        const refinedComponent = {};
        
        // 遍历模板中的所有字段
        for (const key of Object.keys(template)) {
            if (key === 'attr' && typeof template[key] === 'object') {
                // 处理attr字段 - 合并原始值和模板结构
                refinedComponent[key] = this.mergeObject(template[key], component[key]);
            } else if (key === 'config' && typeof template[key] === 'object') {
                // 处理config字段 - 合并原始值和模板结构
                refinedComponent[key] = this.mergeObject(template[key], component[key]);
            } else if (key === 'handles' && typeof template[key] === 'object') {
                // 处理handles字段 - 合并原始数据和模板结构
                refinedComponent[key] = this.mergeHandles(template[key], component[key]);
            } else if (key === 'ichandles' && typeof template[key] === 'object') {
                // 处理ichandles字段 - 合并原始数据和模板结构
                refinedComponent[key] = this.mergeIchandles(template[key], component[key]);
            } else if (key === 'apis' && typeof template[key] === 'object') {
                // 处理apis字段 - 合并原始数据和模板结构
                refinedComponent[key] = this.mergeObject(template[key], component[key]);
            } else if (key === 'apiData' && typeof template[key] === 'object') {
                // 处理apiData字段 - 合并原始数据和模板结构
                refinedComponent[key] = this.mergeApiData(template[key], component[key]);
            } else if (key === 'id') {
                // 保留原始ID，如果不存在则生成新ID
                refinedComponent[key] = component[key] || `${component.name}_${this.generateRandomId()}`;
            } else if (key === 'name') {
                // 保留原始name
                refinedComponent[key] = component[key] || template[key];
            } else if (key === 'type') {
                // 保留原始type，如果不存在则根据组件类型设置
                refinedComponent[key] = component[key] || (component.name === 'VGroup' ? 'layer' : 'com');
            } else {
                // 其他字段：保留原始值，如果不存在则使用模板值
                refinedComponent[key] = component[key] !== undefined && component[key] !== null 
                    ? component[key] 
                    : template[key];
            }
        }
        
        // 处理特殊字段（模板中可能没有，但需要保留）
        if (component.subComs) {
            refinedComponent.subComs = component.subComs;
        }
        if (component.parentId !== undefined) {
            refinedComponent.parentId = component.parentId;
        }
        if (component.groupId !== undefined) {
            refinedComponent.groupId = component.groupId;
        }
        
        return refinedComponent;
    }
    
    /**
     * 合并apiData字段 - 保留原始数据，使用模板结构
     * @param {Object} templateApiData - 模板apiData
     * @param {Object} originalApiData - 原始apiData
     * @returns {Object} 合并后的apiData
     */
    mergeApiData(templateApiData, originalApiData) {
        if (!originalApiData || typeof originalApiData !== 'object') {
            return { ...templateApiData };
        }
        
        const merged = {};
        
        for (const key of Object.keys(templateApiData)) {
            if (typeof templateApiData[key] === 'object' && !Array.isArray(templateApiData[key])) {
                // 对于source等嵌套对象，使用模板结构但保留原始数据
                if (key === 'source') {
                    merged[key] = this.mergeApiDataSource(templateApiData[key], originalApiData[key]);
                } else {
                    merged[key] = this.mergeObject(templateApiData[key], originalApiData[key]);
                }
            } else {
                merged[key] = originalApiData[key] !== undefined && originalApiData[key] !== null 
                    ? originalApiData[key] 
                    : templateApiData[key];
            }
        }
        
        return merged;
    }
    
    /**
     * 合并apiData.source字段 - 保留原始数据配置
     * @param {Object} templateSource - 模板source
     * @param {Object} originalSource - 原始source
     * @returns {Object} 合并后的source
     */
    mergeApiDataSource(templateSource, originalSource) {
        if (!originalSource || typeof originalSource !== 'object') {
            return { ...templateSource };
        }
        
        const merged = { ...templateSource };
        
        // 保留原始的关键字段
        if (originalSource.comId) {
            merged.comId = originalSource.comId;
        }
        if (originalSource.id) {
            merged.id = originalSource.id;
        }
        if (originalSource.type) {
            merged.type = originalSource.type;
        }
        if (originalSource.pageFilters) {
            merged.pageFilters = originalSource.pageFilters;
        }
        if (originalSource.config) {
            // 保留原始的数据配置
            merged.config = this.mergeObject(templateSource.config || {}, originalSource.config);
        }
        
        return merged;
    }
    
    /**
     * 合并handles字段 - 以模板为基础，合并原始数据
     * @param {Object} templateHandles - 模板handles
     * @param {Object} originalHandles - 原始handles
     * @returns {Object} 合并后的handles
     */
    mergeHandles(templateHandles, originalHandles) {
        if (!templateHandles || typeof templateHandles !== 'object') {
            return originalHandles || {};
        }
        
        if (!originalHandles || typeof originalHandles !== 'object') {
            return { ...templateHandles };
        }
        
        // 以模板为基础，合并原始数据（优先保留原始数据的值）
        const merged = { ...templateHandles };
        
        // 遍历原始数据中的key
        for (const key of Object.keys(originalHandles)) {
            if (key in merged && typeof originalHandles[key] === 'object' && typeof merged[key] === 'object') {
                // 如果双方都有这个key且都是对象，递归合并
                merged[key] = { ...merged[key], ...originalHandles[key] };
            } else {
                // 否则直接使用原始数据的值（包括新增字段）
                merged[key] = originalHandles[key];
            }
        }
        
        return merged;
    }
    
    /**
     * 合并ichandles字段 - 以模板为基础，合并原始数据
     * @param {Object} templateIchandles - 模板ichandles
     * @param {Object} originalIchandles - 原始ichandles
     * @returns {Object} 合并后的ichandles
     */
    mergeIchandles(templateIchandles, originalIchandles) {
        if (!templateIchandles || typeof templateIchandles !== 'object') {
            return originalIchandles || {};
        }
        
        if (!originalIchandles || typeof originalIchandles !== 'object') {
            return { ...templateIchandles };
        }
        
        // 以模板为基础，合并原始数据（优先保留原始数据的值）
        const merged = { ...templateIchandles };
        
        // 遍历原始数据中的key
        for (const key of Object.keys(originalIchandles)) {
            if (key in merged && typeof originalIchandles[key] === 'object' && typeof merged[key] === 'object') {
                // 如果双方都有这个key且都是对象，递归合并
                merged[key] = { ...merged[key], ...originalIchandles[key] };
            } else {
                // 否则直接使用原始数据的值（包括新增字段）
                merged[key] = originalIchandles[key];
            }
        }
        
        return merged;
    }
    
    /**
     * 合并两个对象，保留原始值，使用模板结构
     * @param {Object} template - 模板对象
     * @param {Object} original - 原始对象
     * @returns {Object} 合并后的对象
     */
    mergeObject(template, original) {
        if (!original || typeof original !== 'object') {
            return { ...template };
        }
        
        if (!template || typeof template !== 'object') {
            return { ...original };
        }
        
        const merged = {};
        
        // 遍历模板中的key
        for (const key of Object.keys(template)) {
            if (Array.isArray(template[key])) {
                // 处理数组类型
                if (Array.isArray(original[key]) && original[key].length > 0) {
                    // 如果原始数组有元素，保留原始数组，但确保每个元素都有必需字段
                    merged[key] = original[key].map((item, index) => {
                        // 跳过 null 或 undefined 元素
                        if (item === null || item === undefined) {
                            return null;
                        }
                        // 如果元素是对象，使用模板的第一个元素作为基础结构
                        if (typeof item === 'object' && template[key][0]) {
                            return this.mergeObject(template[key][0], item);
                        }
                        return item;
                    }).filter(item => item !== null); // 过滤掉 null 元素
                } else {
                    // 如果原始数组为空或不存在，使用模板数组
                    merged[key] = [...template[key]];
                }
            } else if (typeof template[key] === 'object' && template[key] !== null) {
                // 递归合并嵌套对象
                merged[key] = this.mergeObject(template[key], original[key]);
            } else {
                // 保留原始值，如果不存在则使用模板值
                merged[key] = original[key] !== undefined && original[key] !== null 
                    ? original[key] 
                    : template[key];
            }
        }
        
        // 保留原始数据中模板没有的额外字段
        for (const key of Object.keys(original)) {
            if (!(key in merged)) {
                merged[key] = original[key];
            }
        }
        
        return merged;
    }

    /**
     * 确保必需字段存在
     */
    ensureRequiredFields(component) {
        const requiredFields = ['id', 'name', 'type', 'alias', 'icon', 'img', 'attr', 'config'];
        
        for (const field of requiredFields) {
            if (!component.hasOwnProperty(field)) {
                component[field] = this.getDefaultComponentField(field, component.name);
            }
        }
    }

    /**
     * 获取默认组件字段值
     */
    getDefaultComponentField(field, componentName) {
        const defaults = {
            id: `${componentName}_${this.generateRandomId()}`,
            name: componentName,
            type: componentName === 'VGroup' ? 'layer' : 'com',
            alias: componentName,
            icon: `v-icon-${this.getComponentType(componentName)}`,
            img: `images/缩略图/${this.getComponentImage(componentName)}.png`,
            attr: {
                x: 0,
                y: 0,
                w: 100,
                h: 100,
                deg: 0,
                opacity: 1,
                filpV: false,
                filpH: false
            },
            config: this.getDefaultConfig(componentName)
        };
        
        return defaults[field];
    }

    /**
     * 生成随机ID
     */
    generateRandomId() {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    /**
     * 获取组件类型
     */
    getComponentType(componentName) {
        const typeMap = {
            'VMainTitle': 'title',
            'VBasicBar': 'chart-bar',
            'VBasicPie': 'chart-pie',
            'VBasicLine': 'chart-line',
            'VBasicArea': 'chart-line',
            'VBasicRadar': 'chart-radar',
            'VButton': 'interact',
            'VProgress': 'interact',
            'VVideo': 'media',
            'VBgBox': 'media',
            'VBorderBox': 'media',
            'VDecoration': 'media',
            'VTimer': 'title',
            'VMainImg': 'media',
            'VWaterLevel': 'other',
            'VDynamicBar': 'chart-bar',
            'VDynamicLine': 'chart-line',
            'VBasicHorizontal': 'chart-bar',
            'VArcBar': 'chart-bar',
            'VDashboardPie': 'chart-pie',
            'VGd3dMap': 'map',
            'VGroup': 'other'
        };
        
        return typeMap[componentName] || 'other';
    }

    /**
     * 获取组件图片名称
     */
    getComponentImage(componentName) {
        const imageMap = {
            'VMainTitle': '通用标题',
            'VBasicBar': '柱状图',
            'VBasicPie': '基本饼图',
            'VBasicLine': '基本折线图',
            'VBasicArea': '区域图',
            'VBasicRadar': '雷达图',
            'VButton': '按钮',
            'VProgress': '进度条',
            'VVideo': '视频播放',
            'VBgBox': '自定义背景块',
            'VBorderBox': '边框',
            'VDecoration': '装饰',
            'VTimer': '时间器',
            'VMainImg': '单张图片',
            'VWaterLevel': '水位图',
            'VDynamicBar': '垂直分组柱状图',
            'VDynamicLine': '基本折线图',
            'VBasicHorizontal': '基本条形图',
            'VArcBar': '玉环图',
            'VDashboardPie': '仪表饼图',
            'VGd3dMap': '高德地图',
            'VGroup': '成组'
        };
        
        return imageMap[componentName] || componentName;
    }

    /**
     * 获取默认配置
     */
    getDefaultConfig(componentName) {
        // 这里应该从模板中获取完整的配置结构
        // 为简化示例，返回基本结构
        return {
            // 根据组件类型返回不同的默认配置
        };
    }

    /**
     * 修复组件ID
     */
    repairComponentId(component) {
        if (!component.id || !component.id.startsWith(component.name)) {
            component.id = `${component.name}_${this.generateRandomId()}`;
        }
    }

    /**
     * 修复attr字段
     */
    repairAttrFields(component) {
        if (!component.attr) {
            component.attr = {
                x: 0,
                y: 0,
                w: 100,
                h: 100,
                deg: 0,
                opacity: 1,
                filpV: false,
                filpH: false
            };
            return;
        }
        
        // 确保必需的属性存在
        const requiredAttrFields = ['x', 'y', 'w', 'h', 'deg', 'opacity', 'filpV', 'filpH'];
        for (const field of requiredAttrFields) {
            if (component.attr[field] === undefined) {
                const defaults = {
                    x: 0,
                    y: 0,
                    w: 100,
                    h: 100,
                    deg: 0,
                    opacity: 1,
                    filpV: false,
                    filpH: false
                };
                component.attr[field] = defaults[field];
            }
        }
    }

    /**
     * 根据组件类型修复config结构
     */
    repairComponentConfig(component) {
        if (!component.config) {
            component.config = {};
        }
        
        // 根据组件类型进行特定的配置修复
        switch (component.name) {
            case 'VMainTitle':
                this.repairVMainTitleConfig(component.config);
                break;
            case 'VBasicBar':
                this.repairVBasicBarConfig(component.config);
                break;
            case 'VBasicPie':
                this.repairVBasicPieConfig(component.config);
                break;
            case 'VBasicLine':
                this.repairVBasicLineConfig(component.config);
                break;
            default:
                break;
        }
    }

    /**
     * 修复VMainTitle配置
     */
    repairVMainTitleConfig(config) {
        const defaults = {
            fontSize: 32,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
            backgroundColor: 'transparent'
        };
        
        for (const [key, value] of Object.entries(defaults)) {
            if (config[key] === undefined) {
                config[key] = value;
            }
        }
    }

    /**
     * 修复VBasicBar配置
     */
    repairVBasicBarConfig(config) {
        const defaults = {
            chartType: 'bar',
            showLegend: true,
            showGrid: true,
            showDataLabel: true
        };
        
        for (const [key, value] of Object.entries(defaults)) {
            if (config[key] === undefined) {
                config[key] = value;
            }
        }
    }

    /**
     * 修复VBasicPie配置
     */
    repairVBasicPieConfig(config) {
        const defaults = {
            chartType: 'pie',
            showLegend: true,
            showDataLabel: true,
            radius: [0, '75%']
        };
        
        for (const [key, value] of Object.entries(defaults)) {
            if (config[key] === undefined) {
                config[key] = value;
            }
        }
    }

    /**
     * 修复VBasicLine配置
     */
    repairVBasicLineConfig(config) {
        const defaults = {
            chartType: 'line',
            showLegend: true,
            showGrid: true,
            showDataLabel: true,
            smooth: true
        };
        
        for (const [key, value] of Object.entries(defaults)) {
            if (config[key] === undefined) {
                config[key] = value;
            }
        }
    }

    /**
     * 修复apiData结构
     */
    repairComponentApiData(component) {
        if (!component.apiData) {
            return;
        }
        
        // 确保apiData结构正确
        if (typeof component.apiData === 'string') {
            try {
                // 如果是JSON字符串，尝试解析并重新格式化
                const parsed = JSON.parse(component.apiData);
                component.apiData = parsed;
            } catch (e) {
                // 解析失败，重置为默认结构
                component.apiData = {
                    sourceType: 'static',
                    staticData: '[]',
                    dynamicData: ''
                };
            }
        }
    }

    /**
     * 验证组件白名单
     */
    validateComponentWhitelist(components) {
        if (!components || !Array.isArray(components)) {
            return;
        }
        
        components.forEach(component => {
            if (component.name && !this.componentWhitelist.includes(component.name)) {
            }
        });
    }

    /**
     * 确保ID唯一性
     */
    ensureUniqueIds(components) {
        if (!components || !Array.isArray(components)) {
            return;
        }
        
        const ids = new Set();
        components.forEach(component => {
            if (component.id) {
                if (ids.has(component.id)) {
                    component.id = `${component.name}_${this.generateRandomId()}`;
                }
                ids.add(component.id);
            }
        });
    }

    /**
     * 修复VGroup引用完整性
     */
    repairGroupReferences(components) {
        if (!components || !Array.isArray(components)) {
            return;
        }
        
        // 获取所有有效的VGroup ID
        const validGroupIds = new Set();
        components.forEach(component => {
            if (component.name === 'VGroup' && component.id) {
                validGroupIds.add(component.id);
            }
        });
        
        // 修复组件的groupId引用
        components.forEach(component => {
            if (component.groupId && !validGroupIds.has(component.groupId)) {
                component.groupId = null;
            }
        });
    }

    /**
     * 修复apiData中的JSON字符串
     */
    repairApiDataStrings(components) {
        if (!Array.isArray(components)) return;
        
        components.forEach(comp => {
            if (comp.apiData && comp.apiData.source && comp.apiData.source.config) {
                const dataString = comp.apiData.source.config.data;
                if (typeof dataString === 'string') {
                    comp.apiData.source.config.data = this.ensureEscapedJSONString(dataString);
                } else if (typeof dataString === 'object') {
                    // 如果是对象，转换为JSON字符串（JSON.stringify已正确处理转义）
                    comp.apiData.source.config.data = JSON.stringify(dataString);
                }
            }
        });
    }

    /**
     * 确保JSON字符串正确转义
     */
    ensureEscapedJSONString(str) {
        try {
            // 尝试解析，如果成功说明已经是有效的JSON字符串，不需要额外转义
            JSON.parse(str);
            // 如果已经是有效的JSON，直接返回，不要再次转义
            return str;
        } catch (e) {
            // 解析失败，返回原始字符串
            return str;
        }
    }

    /**
     * 导出为可用格式
     */
    export() {
        return {
            calibrateJsonString: this.repairJSONString,
            repairScreenConfig: this.repairScreenConfig,
            repairComponent: this.repairComponent
        };
    }
}

// 导出类和函数
export { JSONRepairTool };
export default new JSONRepairTool();
