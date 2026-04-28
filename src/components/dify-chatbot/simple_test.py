import json
import sys
import os

# 读取模板合并脚本内容
with open('f:/project/smartcity/dashboard2/dashboard/src/components/dify-chatbot/模板合并zutaiv4.python', 'r', encoding='utf-8') as f:
    script_content = f.read()

# 执行脚本内容
exec(script_content)

# 测试饼图组件
test_components = [
    {
        "name": "VBasicPie",
        "alias": "基本饼图",
        "attr": {
            "x": 346,
            "y": 341,
            "w": 500,
            "h": 300,
            "deg": 0,
            "opacity": 1,
            "filpV": False,
            "filpH": False
        }
    }
]

# 调用main函数
result = main("测试demo1", json.dumps(test_components))

# 解析结果
parsed_result = json.loads(result['json'])

# 保存结果到文件
with open('f:/project/smartcity/dashboard2/dashboard/src/components/dify-chatbot/test_output.json', 'w', encoding='utf-8') as f:
    json.dump(parsed_result, f, ensure_ascii=False, indent=2)

print("测试完成，结果已保存到 test_output.json")
