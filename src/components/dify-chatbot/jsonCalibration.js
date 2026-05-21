/**
 * JSON校准工具模块
 * 用于修复非法的JSON字符串和验证大屏配置
 */

/**
 * 校准JSON字符串（修复非法JSON）
 * @param {string} jsonStr - 需要校准的JSON字符串
 * @returns {any} 解析后的对象，如果失败返回null
 */
export function calibrateJsonString(jsonStr) {
  let cleanedStr = jsonStr.trim();

  cleanedStr = cleanedStr.replace(/^```(json)?\s*/i, '');
  cleanedStr = cleanedStr.replace(/\s*```$/, '');
  cleanedStr = cleanedStr.replace(/^\s*\.{3}\s*(json)?\s*/i, '');
  cleanedStr = cleanedStr.replace(/\s*\.{3}\s*$/, '');

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

    fixedStr = fixUnclosedStrings(fixedStr);

    fixedStr = fixedStr
      .replace(/(['"])?([a-zA-Z_][a-zA-Z0-9_]*)(['"])?\s*:/g, '"$2":');

    fixedStr = fixedStr
      .replace(/"([^"]+)"\s*\{/g, '"$1":{')
      .replace(/"([^"]+)"\s*\[/g, '"$1":[');

    fixedStr = fixMissingCommas(fixedStr);

    fixedStr = fixedStr
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/,\s*,/g, ',');

    fixedStr = balanceBrackets(fixedStr);

    return JSON.parse(fixedStr);
  } catch (e) {
    return null;
  }
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
     * 修复单个组件
     */
    repairComponent(component) {
        if (!component || !component.name) {
            return component;
        }
        
        const repairedComponent = { ...component };
        
        // 1. 确保必需字段存在
        this.ensureRequiredFields(repairedComponent);
        
        // 2. 修复ID格式
        this.repairComponentId(repairedComponent);
        
        // 3. 修复attr字段
        this.repairAttrFields(repairedComponent);
        
        // 4. 根据组件类型修复config结构
        this.repairComponentConfig(repairedComponent);
        
        // 5. 修复apiData结构
        this.repairComponentApiData(repairedComponent);
        
        return repairedComponent;
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
                    // 如果是对象，转换为JSON字符串
                    comp.apiData.source.config.data = JSON.stringify(dataString)
                        .replace(/"/g, '\\"');
                }
            }
        });
    }

    /**
     * 确保JSON字符串正确转义
     */
    ensureEscapedJSONString(str) {
        try {
            // 尝试解析，如果成功说明是有效的JSON
            JSON.parse(str);
            // 确保双引号被正确转义
            return str.replace(/\\(["\\])/g, '$1').replace(/"/g, '\\"');
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
