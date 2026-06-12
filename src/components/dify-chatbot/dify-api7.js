const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ================= 配置区域 =================
const CONFIG = {
    baseUrl: 'http://10.89.34.9',
    apiKey: 'app-YnO4uEUjZmKgrrfp2bdUjm0F',
    user: 'huyz',
    filePath: '/home/shdq/scripts/大屏组件模板.txt'
};

// ================= 工具函数 =================

/**
 * 创建交互式命令行接口
 */
function createInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

/**
 * 通用 HTTP 请求 (JSON)
 */
function httpRequestJson(method, pathUrl, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(pathUrl, CONFIG.baseUrl);
        
        const options = {
            hostname: url.hostname,
            port: 80,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Authorization': `Bearer ${CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log(`📡 ${method} ${pathUrl} 响应状态: ${res.statusCode}`);
                    resolve(result);
                } catch (e) {
                    console.log(`📡 ${method} ${pathUrl} 响应状态: ${res.statusCode}, 原始数据: ${data.substring(0, 200)}...`);
                    resolve({ _raw: data, _status: res.statusCode });
                }
            });
        });

        req.on('error', (error) => reject(error));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

/**
 * 步骤1: 上传文件
 */
async function uploadFile() {
    console.log('\n📤 [步骤1] 正在上传文件...');
    
    if (!globalThis.fetch) {
        throw new Error('当前 Node 版本不支持 fetch，请使用 Node 18+');
    }

    if (!fs.existsSync(CONFIG.filePath)) {
        throw new Error(`文件不存在: ${CONFIG.filePath}`);
    }

    const fileContent = fs.readFileSync(CONFIG.filePath);
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, path.basename(CONFIG.filePath));
    formData.append('user', CONFIG.user);

    const uploadUrl = `${CONFIG.baseUrl}/v1/files/upload`;
    const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CONFIG.apiKey}`
        },
        body: formData
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`文件上传失败 (${res.status}): ${errText}`);
    }
    
    const result = await res.json();
    console.log('✅ 文件上传成功');
    console.log('   - File ID:', result.id);
    console.log('   - Name:', result.name);
    console.log('   - 完整响应:', JSON.stringify(result, null, 2));
    return result.id;
}

/**
 * 步骤2: 发起会话并监听 SSE 直到暂停或结束
 */
function startChatSession(fileId, query, conversationId = "") {
    return new Promise((resolve, reject) => {
        console.log(`\n💬 [步骤2] 正在发送消息: "${query.substring(0, 50)}..."`);
        
        const options = {
            hostname: '10.89.34.9',
            port: 80,
            path: '/v1/chat-messages',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            }
        };

        const body = {
            inputs: {},
            query: query,
            response_mode: "streaming",
            conversation_id: conversationId,
            user: CONFIG.user,
            files: fileId ? [{
                type: "document",
                transfer_method: "local_file",
                upload_file_id: fileId
            }] : []
        };

        console.log('📤 请求数据:', JSON.stringify(body, null, 2));

        const req = http.request(options, (res) => {
            let buffer = '';
            let lastEventData = null;
            let pauseData = null;
            let messageContent = '';

            res.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop(); 

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.substring(6);
                        if (jsonStr === '[DONE]') continue;
                        try {
                            const eventData = JSON.parse(jsonStr);
                            lastEventData = eventData;
                            
                            // 收集消息内容
                            if (eventData.answer) {
                                messageContent += eventData.answer;
                                process.stdout.write(eventData.answer);
                            }
                            
                            // 打印事件信息
                            if (eventData.event) {
                                console.log(`\n📢 事件: ${eventData.event}`);
                                if (eventData.event === 'workflow_paused') {
                                    console.log('⏸️ 工作流已暂停，等待人工介入...');
                                    pauseData = eventData;
                                }
                            }

                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            });

            res.on('end', () => {
                console.log('\n📥 会话结束');
                if (messageContent) {
                    console.log('📝 收集到的完整消息:', messageContent);
                }
                
                if (pauseData) {
                    resolve({ 
                        type: 'paused', 
                        data: pauseData, 
                        conversationId: pauseData.conversation_id,
                        messageContent: messageContent
                    });
                } else if (lastEventData) {
                    resolve({ 
                        type: 'finished', 
                        data: lastEventData, 
                        conversationId: lastEventData.conversation_id,
                        messageContent: messageContent
                    });
                } else {
                    reject(new Error('未收到有效事件'));
                }
            });
        });

        req.on('error', reject);
        req.write(JSON.stringify(body));
        req.end();
    });
}

/**
 * 步骤3: 交互式人工介入
 */
async function handleHumanInteraction(pauseData, rl) {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 AI 助手需要您的反馈:');
    console.log('='.repeat(60));
    
    // 打印暂停时的输出信息
    if (pauseData.data && pauseData.data.reasons && pauseData.data.reasons.length > 0) {
        const reason = pauseData.data.reasons[0];
        if (reason.form_content) {
            const cleanContent = reason.form_content
                .replace(/\\n/g, '\n')
                .replace(/\*\*/g, '')
                .replace(/\{\{.*?\}\}/g, '');
            console.log(cleanContent);
        }
    }
    
    console.log('\n' + '-'.repeat(60));

    // 1. 获取用户评论
    const userComments = await new Promise((resolve) => {
        rl.question('✍️ 请输入您的回复 (usercomments): ', (answer) => {
            resolve(answer);
        });
    });

    // 2. 选择动作
    const action = await new Promise((resolve) => {
        console.log('\n请选择下一步操作:');
        console.log('  [R] Revise (修改/继续追问)');
        console.log('  [A] Approve (确认/结束流程)');
        
        rl.question('➡️ 请输入选项 (R/A): ', (input) => {
            const val = input.trim().toUpperCase();
            if (val === 'A') resolve('approve');
            else resolve('revise');
        });
    });

    console.log(`\n📤 正在提交动作: ${action.toUpperCase()} ...`);
    return { userComments, action };
}

/**
 * 步骤4: 提交表单
 */
async function submitForm(formToken, inputs, action) {
    const submitUrl = `${CONFIG.baseUrl}/api/form/human_input/${formToken}`;
    
    console.log(`📤 提交表单到: ${submitUrl}`);
    console.log('📤 提交数据:', JSON.stringify({ inputs, action }, null, 2));
    
    const result = await httpRequestJson('POST', submitUrl, {
        inputs: inputs,
        action: action
    });
    
    console.log('✅ 表单提交成功');
    console.log('📥 返回数据:', JSON.stringify(result, null, 2));
    return result;
}

/**
 * 步骤5: 查询工作流运行结果 (用户提交 approve 后调用)
 */
async function getWorkflowRunResult(workflowRunId) {
    console.log(`\n🔍 [步骤5] 正在查询工作流运行结果: ${workflowRunId}`);
    
    const url = `${CONFIG.baseUrl}/v1/workflows/run/${workflowRunId}`;
    const result = await httpRequestJson('GET', url);
    
    console.log('📊 工作流运行结果:');
    console.log('   - 状态:', result.status);
    console.log('   - 工作流ID:', result.workflow_id);
    console.log('   - 耗时:', result.elapsed_time, '秒');
    console.log('   - 总步数:', result.total_steps);
    console.log('   - 总令牌数:', result.total_tokens);
    
    if (result.outputs && result.outputs.answer) {
        console.log('\n📝 输出内容:');
        console.log(result.outputs.answer);
        
        // 尝试解析 JSON 格式的 answer
        try {
            const answerJson = JSON.parse(result.outputs.answer);
            console.log('\n📋 解析后的输出:');
            console.log(JSON.stringify(answerJson, null, 2));
        } catch (e) {
            console.log('\n📋 原始输出 (非JSON格式)');
        }
    }
    
    if (result.error) {
        console.log('❌ 错误信息:', result.error);
    }
    
    return result;
}

/**
 * 从暂停数据中提取 form_token
 */
function extractFormToken(pauseData) {
    if (pauseData.data && pauseData.data.reasons && pauseData.data.reasons.length > 0) {
        const reason = pauseData.data.reasons[0];
        if (reason.form_token) return reason.form_token;
        
        // 尝试从原始数据中提取
        const raw = JSON.stringify(pauseData);
        const match = raw.match(/"form_token"\s*:\s*"([^"]+)"/);
        if (match) return match[1];
        
        // 尝试从 node_id 中提取
        if (pauseData.data.paused_nodes && pauseData.data.paused_nodes.length > 0) {
            return pauseData.data.paused_nodes[0];
        }
    }
    return null;
}
async function waitForWorkflowCompletion(workflowRunId, intervalMs = 2000, maxRetries = 30) {
    console.log(`\n⏳ [步骤5] 开始轮询工作流状态 (ID: ${workflowRunId})...`);
    
    let retries = 0;
    let finalResult = null;

    while (retries < maxRetries) {
        retries++;
        const url = `${CONFIG.baseUrl}/v1/workflows/run/${workflowRunId}`;
        
        try {
            const result = await httpRequestJson('GET', url);
            const status = result.status;
            
            console.log(`   🔁 第 ${retries} 次查询: 状态 = ${status}`);

            if (status === 'succeeded') {
                console.log('   ✅ 工作流执行成功！');
                finalResult = result;
                break;
            } else if (status === 'failed') {
                console.error('   ❌ 工作流执行失败');
                console.error('   错误信息:', result.error);
                finalResult = result;
                break;
            } else if (status === 'stopped') {
                console.warn('   ⚠️ 工作流已停止');
                finalResult = result;
                break;
            } else {
                // running, paused 等中间状态，继续等待
                // 可选：打印更多细节
            }
        } catch (error) {
            console.error(`   ⚠️ 查询出错: ${error.message}`);
        }

        // 如果不是最终状态，等待一段时间后再次查询
        if (!finalResult) {
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
    }

    if (!finalResult) {
        throw new Error(`轮询超时：在 ${maxRetries} 次尝试后工作流仍未完成`);
    }

    return finalResult;
}

/**
 * 主流程控制
 */
async function main() {
    const rl = createInterface();
    
    try {
        // 1. 上传文件
        const fileId = await uploadFile();

        // 2. 开始第一轮对话
        let currentConversationId = "";
        let currentWorkflowRunId = null;
        let isFinished = false;
        let loopCount = 0;

        // 初始查询
        let nextQuery = "hi"; 
        let currentFileId = fileId;

        while (!isFinished && loopCount < 10) {
            loopCount++;
            console.log(`\n🔄 [循环 ${loopCount}] 开始...`);

            // 发起会话
            const result = await startChatSession(currentFileId, nextQuery, currentConversationId);
            
            // 更新 conversation_id
            currentConversationId = result.conversationId;
            currentFileId = null; // 后续对话不再上传文件

            if (result.type === 'finished') {
                console.log('\n🏁 [结束] 会话自然结束');
                console.log('📥 最终返回数据:', JSON.stringify(result.data, null, 2));
                console.log('📝 完整消息内容:', result.messageContent);
                isFinished = true;
            } else if (result.type === 'paused') {
                console.log('\n⏸️ [暂停] 检测到工作流暂停');
                console.log('📊 暂停事件数据:', JSON.stringify(result.data, null, 2));
                
                // 保存 workflow_run_id
                if (result.data.data && result.data.data.workflow_run_id) {
                    currentWorkflowRunId = result.data.data.workflow_run_id;
                    console.log('📌 Workflow Run ID:', currentWorkflowRunId);
                }
                
                // 提取 form_token
                const formToken = extractFormToken(result.data);
                if (!formToken) {
                    console.error('❌ 错误: 无法从暂停事件中获取 form_token');
                    console.log('原始数据:', JSON.stringify(result.data, null, 2));
                    break;
                }

                console.log('🔑 Form Token:', formToken);
                
                // 交互式获取用户输入
                const { userComments, action } = await handleHumanInteraction(result.data, rl);

                // 提交表单
                await submitForm(formToken, { usercomments: userComments }, action);

                // 根据动作决定下一步
                if (action === 'approve') {
                    console.log('\n✅ 用户选择 Approve，查询工作流最终结果...');
                    
                    // 等待一段时间让工作流处理
                    console.log('⏳ 等待工作流处理完成...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    // 查询工作流运行结果
                    if (currentWorkflowRunId) {
                        const finalResult = await waitForWorkflowCompletion(currentWorkflowRunId);
                        console.log('\n🎉 流程执行完成！');
                        console.log('📋 最终状态:', finalResult.status);
                        console.log('📝 最终输出:', finalResult.outputs?.answer || '无输出');
                        console.log('\n🎉 ===== 最终结果详情 =====');
                        console.log('📋 状态:', finalResult.status);
                        console.log('⏱️ 耗时:', finalResult.elapsed_time, '秒');
                        console.log('🔢 总步数:', finalResult.total_steps);
                        console.log('🔢 总令牌:', finalResult.total_tokens);
                        
                        if (finalResult.outputs && finalResult.outputs.answer) {
                            console.log('\n📝 AI 最终输出 (Answer):');
                            console.log(finalResult.outputs.answer);
                            
                            // 尝试美化输出 JSON
                            try {
                                // 简单清洗非标准 JSON
                                let cleanJson = finalResult.outputs.answer
                                    .replace(/[“”]/g, '"')
                                    .replace(/,\s*}/g, '}')
                                    .replace(/,\s*]/g, ']');
                                
                                // 如果看起来像 JSON 对象
                                if (cleanJson.trim().startsWith('{')) {
                                    const parsed = JSON.parse(cleanJson);
                                    console.log('\n📋 结构化输出:');
                                    console.log(JSON.stringify(parsed, null, 2));
                                }
                            } catch (e) {
                                // 忽略解析错误，已打印原始文本
                            }
                        }
                        console.log('==========================\n');
                    } else {
                        console.log('⚠️ 未找到 Workflow Run ID，无法查询结果');
                    }
                    
                    isFinished = true;
                } else {
                    // revise: 将用户的评论作为下一次查询的内容
                    nextQuery = userComments; 
                    console.log(`🔄 用户选择 Revise，下一轮查询: "${nextQuery.substring(0, 50)}..."`);
                }
            }
        }

        if (loopCount >= 10) {
            console.log('⚠️ 达到最大循环次数，强制退出');
        }

    } catch (error) {
        console.error('\n❌ 执行出错:', error.message);
        console.error(error.stack);
    } finally {
        rl.close();
        console.log('\n👋 脚本执行完毕。');
    }
}

// 启动
main();
