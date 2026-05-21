/**
 * JSON修复工具脚本 - 完整版
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
            console.error('JSON修复失败:', error);
            return jsonString;
        }
    }

    /**
     * 修复逗号缺失问题
     */
    fixMissingCommas(str) {
        // 修复对象中缺少逗号的情况
        // 模式：属性值后跟着另一个属性（缺少逗号）
        str = str.replace(/"\s*:\s*([^,$\]{}"']+)\s*"([^:]+)"\s*:/g, '": $1, "$2":');
        
        // 修复数组中缺少逗号的情况
        // 模式：值后跟着另一个值（缺少逗号）
        str = str.replace(/([^,\[${}"']+)\s*([^,$\]{}"']+)(?=\s*[$}])/g, '$1, $2');
        
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
        return str.replace(/\$[^"\\/bfnrtu])/g, '\\\\$1');
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
            console.warn('JSON解析失败，尝试修复:', error.message);
            
            // 根据错误信息进行针对性修复
            if (error.message.includes('Unexpected token')) {
                // 处理意外的token
                str = this.fixUnexpectedTokens(str);
            }
            
            if (error.message.includes('Unexpected end')) {
                // 处理意外的结束
                str = this.fixUnexpectedEnd(str);
            }
            
            if (error.message.includes('Unexpected number')) {
                // 处理数字格式问题
                str = this.fixNumberIssues(str);
            }
            
            // 再次尝试解析
            try {
                JSON.parse(str);
                return str;
            } catch (e) {
                console.error('最终修复失败，返回原始字符串');
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
            [/[＂]/g, '"'],
            [/[＇]/g, "'"],
            // 修复中文括号
            [/[（]/g, '('],
            [/[）]/g, ')'],
            [/[［]/g, '['],
            [/[］]/g, ']'],
            [/[｛]/g, '{'],
            [/[｝]/g, '}'],
            // 修复全角字符
            [/[，]/g, ','],
            [/[：]/g, ':'],
            [/[；]/g, ';'],
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
                console.warn(`缺少根级字段: ${field}`);
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
            console.warn('无效的组件对象');
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
                console.warn(`组件 ${component.name} 缺少字段: ${field}`);
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
        const defaultAttr = {
            x: 0,
            y: 0,
            w: 100,
            h: 100,
            deg: 0,
            opacity: 1,
            filpV: false,
            filpH: false
        };
        
        if (!component.attr) {
            component.attr = { ...defaultAttr };
            return;
        }
        
        for (const [key, defaultValue] of Object.entries(defaultAttr)) {
            if (component.attr[key] === undefined || component.attr[key] === null) {
                component.attr[key] = defaultValue;
            }
        }
    }

    /**
     * 修复组件配置
     */
    repairComponentConfig(component) {
        // 这里应该根据组件类型从模板中获取完整的config结构
        // 并确保所有必需的字段都存在
        // 由于模板结构复杂，这里只做基本修复
        
        if (!component.config) {
            component.config = {};
        }
        
        // 确保config中的必需字段
        this.ensureConfigStructure(component);
    }

    /**
     * 确保配置结构
     */
    ensureConfigStructure(component) {
        // 根据组件类型确保特定的config结构
        // 这里只做示例，实际应该根据模板进行完整修复
        switch (component.name) {
            case 'VMainTitle':
                this.ensureMainTitleConfig(component.config);
                break;
            case 'VBasicBar':
                this.ensureBasicBarConfig(component.config);
                break;
            case 'VBasicLine':
                this.ensureBasicLineConfig(component.config);
                break;
            // 其他组件类型的配置修复...
        }
    }

    /**
     * 确保VMainTitle配置结构
     */
    ensureMainTitleConfig(config) {
        const defaultConfig = {
            title: "我是标题数据",
            textStyle: {
                fontFamily: "Microsoft Yahei",
                fontSize: 24,
                color: "#fff",
                fontWeight: "normal"
            },
            textAlign: "center",
            writingMode: "horizontal-tb",
            letterSpacing: 0,
            backgroundStyle: {
                show: false,
                bgColor: "#008bff",
                borderRadius: 15,
                borderColor: "#fff",
                borderStyle: "solid",
                borderWidth: 1
            },
            ellipsis: false,
            urlConfig: {
                url: "",
                isBlank: false
            },
            animation: {
                enable: false,
                name: "Updown",
                duration: 1000,
                timing: "linear",
                delay: 0,
                iteration: "infinite",
                direction: "alternate"
            },
            cursor: "default"
        };
        
        this.mergeConfig(config, defaultConfig);
    }

    /**
     * 确保VBasicBar配置结构
     */
    ensureBasicBarConfig(config) {
        const defaultConfig = {
            global: {
                fontFamily: "Microsoft Yahei",
                margin: { top: 40, bottom: 50, left: 50, right: 10 },
                innerPadding: 20,
                outerPadding: 30,
                barWidth: "auto",
                background: { show: true, color: "rgba(255, 255, 255, 0.1)" }
            },
            label: {
                show: false,
                position: "top",
                textStyle: { fontSize: 12, color: "rgba(255, 255, 255, 0.6)", fontWeight: "normal" },
                offsetX: 0,
                offsetY: 0
            },
            xAxis: {
                show: true,
                type: "category",
                title: {
                    show: false,
                    name: "X轴",
                    location: "center",
                    display: { rotate: 0, offset: 20 },
                    textStyle: { fontSize: 12, color: "#90a0ae", fontWeight: "normal" }
                },
                axisLine: { show: true, type: "solid", width: 1, color: "rgba(255, 255, 255, 0.5)" },
                axisTick: { show: true, type: "solid", width: 1, color: "rgba(255, 255, 255, 0.5)" },
                axisLabel: {
                    show: true,
                    timeFormat: "MM/DD",
                    boundaryGap: true,
                    interval: "auto",
                    display: { rotate: 0, margin: 10 },
                    align: "center",
                    textStyle: { fontSize: 12, color: "rgba(255, 255, 255, 0.6)", fontWeight: "normal" }
                },
                grid: {
                    show: true,
                    line: { type: "dashed", width: 1, color: "rgba(233, 228, 228, 0.1)", dashedLength: 4, dashedSpace: 4 }
                }
            },
            yAxis: {
                show: true,
                extent: { min: "auto", max: "auto" },
                splitNumber: 0,
                title: {
                    show: false,
                    name: "Y轴",
                    location: "center",
                    display: { rotate: 90, offset: 20 },
                    textStyle: { fontSize: 12, color: "#90a0ae", fontWeight: "normal" }
                },
                axisLine: { show: true, type: "solid", width: 1, color: "rgba(255, 255, 255, 0.5)" },
                axisTick: { show: true, type: "solid", width: 1, color: "rgba(255, 255, 255, 0.5)" },
                axisLabel: {
                    show: true,
                    valueFormat: "auto",
                    boundaryGap: 0,
                    display: { rotate: 0, margin: 10 },
                    align: "center",
                    textStyle: { fontSize: 12, color: "rgba(255, 255, 255, 0.6)", fontWeight: "normal" }
                },
                grid: {
                    show: true,
                    line: { type: "dashed", width: 1, color: "rgba(233, 228, 228, 0.1)", dashedLength: 4, dashedSpace: 4 }
                }
            },
            tooltip: {
                show: true,
                textStyle: { fontSize: 14, color: "#fff", fontWeight: "normal" },
                background: { padding: { h: 5, v: 5 }, color: "rgba(0, 0, 0, 0.65)" },
                pointer: {
                    show: true,
                    line: { type: "dashed", width: 1, color: "#f5dc69", dashedLength: 4, dashedSpace: 4 }
                }
            },
            legend: {
                show: true,
                position: "top-center",
                orient: "horizontal",
                textStyle: { fontSize: 12, color: "#90a0ae", fontWeight: "normal" },
                symbol: { show: true, icon: "auto", width: 25, height: 14, gap: 10 },
                page: {
                    enabled: false,
                    size: { width: 100, height: 100 },
                    button: { size: 15, color: "#000", inactiveColor: "#000" },
                    pageNumColor: "#90a0ae"
                }
            },
            series: [{
                type: "bar",
                id: "系列1_qkzh8nVeAD",
                name: "系列1",
                color: { type: "solid", value: "#00baff", from: "#fff", to: "#000" }
            }],
            animation: { enabled: true, duration: 1000, easing: "cubicOut", delay: 0 }
        };
        
        this.mergeConfig(config, defaultConfig);
    }

    /**
     * 确保VBasicLine配置结构
     */
    ensureBasicLineConfig(config) {
        // 类似上面的方法，根据模板确保完整的config结构
        // 这里省略详细实现
    }

    /**
     * 合并配置
     */
    mergeConfig(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    this.mergeConfig(target[key], source[key]);
                } else if (!target.hasOwnProperty(key)) {
                    target[key] = source[key];
                }
            }
        }
    }

    /**
     * 修复组件apiData
     */
    repairComponentApiData(component) {
        if (!component.apiData) {
            component.apiData = {};
        }
        
        if (!component.apiData.source) {
            component.apiData.source = {
                comId: component.id,
                id: this.generateRandomId(),
                type: "static",
                pageFilters: [],
                config: {
                    useFilter: false,
                    data: "{}",
                    postBodyType: "static"
                }
            };
        } else {
            // 确保comId正确
            component.apiData.source.comId = component.id;
            
            // 确保data字段是正确转义的JSON字符串
            if (component.apiData.source.config && component.apiData.source.config.data) {
                component.apiData.source.config.data = this.ensureEscapedJSONString(
                    component.apiData.source.config.data
                );
            }
        }
    }

    /**
     * 确保JSON字符串正确转义
     */
    ensureEscapedJSONString(dataString) {
        try {
            // 尝试解析，如果成功说明已经是有效的JSON字符串
            JSON.parse(dataString);
            return dataString;
        } catch (error) {
            // 如果不是有效的JSON字符串，尝试修复
            try {
                // 尝试修复常见的转义问题
                let fixedString = dataString;
                
                // 修复未转义的双引号
                fixedString = fixedString.replace(/(?<!\$"(.*?)(?<!\\)"/g, (match, content) => {
                    const escapedContent = content.replace(/"/g, '\\"');
                    return `"${escapedContent}"`;
                });
                
                // 尝试再次解析
                JSON.parse(fixedString);
                return fixedString;
            } catch (e) {
                // 如果修复失败，返回空对象
                console.warn('无法修复JSON字符串，返回默认空对象');
                return "{}";
            }
        }
    }

    /**
     * 验证组件白名单
     */
    validateComponentWhitelist(components) {
        if (!Array.isArray(components)) return;
        
        const invalidComponents = components.filter(comp => 
            !this.componentWhitelist.includes(comp.name)
        );
        
        if (invalidComponents.length > 0) {
            console.warn('发现不在白名单中的组件:', invalidComponents.map(c => c.name));
        }
    }

    /**
     * 确保ID唯一性
     */
    ensureUniqueIds(components) {
        if (!Array.isArray(components)) return;
        
        const idMap = new Map();
        
        components.forEach((component, index) => {
            if (!component.id) {
                component.id = `${component.name}_${this.generateRandomId()}`;
            }
            
            if (idMap.has(component.id)) {
                // 如果ID重复，生成新的ID
                component.id = `${component.name}_${this.generateRandomId()}`;
            }
            
            idMap.set(component.id, true);
        });
    }

    /**
     * 修复VGroup引用完整性
     */
    repairGroupReferences(components) {
        if (!Array.isArray(components)) return;
        
        // 收集所有组件的ID
        const componentIds = new Set();
        components.forEach(comp => {
            if (comp.id) {
                componentIds.add(comp.id);
            }
        });
        
        // 处理VGroup组件
        components.forEach(comp => {
            if (comp.name === 'VGroup' && comp.subComs && Array.isArray(comp.subComs)) {
                // 过滤掉不存在的子组件ID
                comp.subComs = comp.subComs.filter(subId => componentIds.has(subId));
                
                // 确保子组件有正确的parentId
                comp.subComs.forEach(subId => {
                    const subComponent = components.find(c => c.id === subId);
                    if (subComponent) {
                        subComponent.parentId = comp.id;
                    }
                });
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
     * 完整的JSON修复方法
     * @param {string|Object} input - 输入JSON字符串或对象
     * @returns {Object} 修复后的JSON对象
     */
    repairCompleteJSON(input) {
        try {
            let jsonObj;
            
            // 1. 如果是字符串，先修复字符串格式
            if (typeof input === 'string') {
                const fixedString = this.repairJSONString(input);
                jsonObj = JSON.parse(fixedString);
            } else if (typeof input === 'object') {
                jsonObj = input;
            } else {
                throw new Error('输入必须是JSON字符串或对象');
            }
            
            // 2. 如果是大屏配置，进行结构修复
            if (jsonObj.screen && jsonObj.config && jsonObj.coms) {
                jsonObj = this.repairScreenConfig(jsonObj);
            }
            
            // 3. 验证最终JSON
            const validationResult = this.validateJSON(jsonObj);
            if (!validationResult.valid) {
                console.warn('JSON验证失败:', validationResult.errors);
            }
            
            return jsonObj;
            
        } catch (error) {
            console.error('JSON修复过程失败:', error);
            throw error;
        }
    }

    /**
     * 验证JSON对象
     */
    validateJSON(jsonObj) {
        const errors = [];
        
        try {
            // 验证是否是有效的JSON对象
            if (typeof jsonObj !== 'object' || jsonObj === null) {
                errors.push('不是有效的JSON对象');
            }
            
            // 验证大屏配置结构
            if (jsonObj.screen) {
                if (!jsonObj.config) errors.push('缺少config字段');
                if (!jsonObj.coms) errors.push('缺少coms字段');
                if (!jsonObj.variables) errors.push('缺少variables字段');
                if (!jsonObj.dataFilters) errors.push('缺少dataFilters字段');
            }
            
            // 验证组件结构
            if (jsonObj.coms && Array.isArray(jsonObj.coms)) {
                jsonObj.coms.forEach((comp, index) => {
                    if (!comp.id) errors.push(`组件 ${index} 缺少id字段`);
                    if (!comp.name) errors.push(`组件 ${index} 缺少name字段`);
                    if (!comp.config) errors.push(`组件 ${comp.name || index} 缺少config字段`);
                    
                    // 验证apiData结构
                    if (comp.apiData && comp.apiData.source && comp.apiData.source.config) {
                        try {
                            JSON.parse(comp.apiData.source.config.data);
                        } catch (e) {
                            errors.push(`组件 ${comp.name || index} 的apiData.data不是有效的JSON字符串`);
                        }
                    }
                });
            }
            
            return {
                valid: errors.length === 0,
                errors: errors
            };
            
        } catch (error) {
            return {
                valid: false,
                errors: [`验证过程中发生错误: ${error.message}`]
            };
        }
    }

    /**
     * 将修复后的JSON转换为字符串
     * @param {Object} jsonObj - JSON对象
     * @param {boolean} pretty - 是否格式化输出
     * @returns {string} JSON字符串
     */
    stringifyJSON(jsonObj, pretty = true) {
        try {
            if (pretty) {
                return JSON.stringify(jsonObj, null, 2);
            } else {
                return JSON.stringify(jsonObj);
            }
        } catch (error) {
            console.error('JSON序列化失败:', error);
            return '{}';
        }
    }

    /**
     * 修复正则表达式中的转义问题
     * 修复原脚本中的正则表达式错误
     */
    fixRegexIssues() {
        // 修复fixMissingCommas方法中的正则表达式
        this.fixMissingCommas = function(str) {
            // 修复对象中缺少逗号的情况
            // 模式：属性值后跟着另一个属性（缺少逗号）
            str = str.replace(/"\s*:\s*([^,$\]{}"']+)\s*"([^:]+)"\s*:/g, '": $1, "$2":');
            
            // 修复数组中缺少逗号的情况
            // 模式：值后跟着另一个值（缺少逗号）
            str = str.replace(/([^,\[${}"']+)\s*([^,$\]{}"']+)(?=\s*[$}])/g, '$1, $2');
            
            // 修复对象结束和数组开始之间缺少逗号
            str = str.replace(/}\s*$/g, '}, [');
            
            // 修复数组结束和对象开始之间缺少逗号
            str = str.replace(/$\s*{/g, '], {');
            
            // 修复对象结束和对象开始之间缺少逗号
            str = str.replace(/}\s*{/g, '}, {');
            
            // 修复数组结束和数组开始之间缺少逗号
            str = str.replace(/\]\s*\[/g, '], [');
            
            return str;
        };

        // 修复fixEscapeSequences方法中的正则表达式
        this.fixEscapeSequences = function(str) {
            // 修复未转义的反斜杠
            return str.replace(/\$[^"\\/bfnrtu])/g, '\\\\$1');
        };

        // 修复ensureEscapedJSONString方法中的正则表达式
        this.ensureEscapedJSONString = function(dataString) {
            try {
                // 尝试解析，如果成功说明已经是有效的JSON字符串
                JSON.parse(dataString);
                return dataString;
            } catch (error) {
                // 如果不是有效的JSON字符串，尝试修复
                try {
                    // 尝试修复常见的转义问题
                    let fixedString = dataString;
                    
                    // 修复未转义的双引号
                    fixedString = fixedString.replace(/(?<!\$"(.*?)(?<!\\)"/g, (match, content) => {
                        const escapedContent = content.replace(/"/g, '\\"');
                        return `"${escapedContent}"`;
                    });
                    
                    // 尝试再次解析
                    JSON.parse(fixedString);
                    return fixedString;
                } catch (e) {
                    // 如果修复失败，返回空对象
                    console.warn('无法修复JSON字符串，返回默认空对象');
                    return "{}";
                }
            }
        };
    }
}

// 导出工具类
module.exports = JSONRepairTool;

// 如果是在浏览器环境
if (typeof window !== 'undefined') {
    window.JSONRepairTool = JSONRepairTool;
}


// 使用示例
/*
// 创建修复工具实例
const repairTool = new JSONRepairTool();

// 修复正则表达式问题
repairTool.fixRegexIssues();

// 示例1：修复JSON字符串
const brokenJSONString = '{"name": "test", "value": 123, "nested": { "inner": "value" },}';
const fixedString = repairTool.repairJSONString(brokenJSONString);
console.log('修复后的字符串:', fixedString);

// 示例2：修复大屏配置JSON
const screenConfig = {
    screen: { id: 1, name: "测试大屏" },
    config: { width: 1920, height: 1080 },
    coms: [
        {
            name: "VMainTitle",
            config: { title: "测试标题" }
        }
    ],
    variables: {},
    dataFilters: []
};

const repairedConfig = repairTool.repairScreenConfig(screenConfig);
console.log('修复后的配置:', JSON.stringify(repairedConfig, null, 2));

// 示例3：完整修复
const completeRepair = repairTool.repairCompleteJSON(brokenJSONString);
console.log('完整修复结果:', completeRepair);
*/
