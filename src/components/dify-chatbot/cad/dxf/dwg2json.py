import ezdxf
import json
import sys
import os

# 需要过滤的非建筑图层（图框、标注、道路等）
FILTERED_LAYERS = {
    'PUB_TITLE',   # 图框
    'PUB_DIM',     # 标注线
    'LVDI',        # 道路
    'DIM',         # 尺寸标注
    'HATCH',       # 填充
    'TEXT',        # 纯文字层
    'GRID',        # 网格
    'AXIS',        # 轴线
}

def calculate_polygon_area(points):
    """使用鞋带公式计算多边形面积"""
    if len(points) < 3:
        return 0.0
    area = 0.0
    n = len(points)
    for i in range(n):
        j = (i + 1) % n
        area += points[i][0] * points[j][1]
        area -= points[j][0] * points[i][1]
    return abs(area) / 2.0

def calculate_centroid(points):
    """计算多边形的几何中心"""
    if not points:
        return [0.0, 0.0]
    
    n = len(points)
    cx = sum(point[0] for point in points) / n
    cy = sum(point[1] for point in points) / n
    return [cx, cy]

def calculate_dimensions(points):
    """计算多边形的真实宽高（max-min）"""
    if not points:
        return 0.0, 0.0
    
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    
    width = max(xs) - min(xs)
    height = max(ys) - min(ys)
    return width, height

def is_valid_building(entity):
    """判断是否为有效的建筑实体"""
    # 必须是闭合多段线
    if entity.dxftype() != 'LWPOLYLINE':
        return False
    
    # 必须是闭合的
    if not entity.closed:
        return False
    
    # 必须有足够的点数（至少3个点构成多边形）
    points = list(entity.get_points('xy'))
    if len(points) < 3:
        return False
    
    # 检查图层是否需要过滤
    layer = entity.dxf.layer.upper()
    if layer in FILTERED_LAYERS:
        return False
    
    return True

def extract_building_info(entity):
    """提取建筑实体的详细信息"""
    points = list(entity.get_points('xy'))
    
    # 计算面积（鞋带公式）
    area = calculate_polygon_area(points)
    
    # 计算几何中心
    centroid = calculate_centroid(points)
    
    # 计算真实宽高
    width, height = calculate_dimensions(points)
    
    # 获取图层信息
    layer = entity.dxf.layer
    handle = entity.dxf.handle
    
    return {
        "type": "Building",
        "layer": layer,
        "handle": handle,
        "geometry": {
            "points": points,
            "closed": True,
            "centroid": centroid,
            "width": width,
            "height": height,
            "area": area  # 原始单位面积
        }
    }

def extract_text_info(entity):
    """提取文本实体信息"""
    text = entity.dxf.text
    insert = list(entity.dxf.insert)[:2]  # 只取XY坐标
    height = entity.dxf.height
    layer = entity.dxf.layer
    handle = entity.dxf.handle
    
    return {
        "type": "Text",
        "layer": layer,
        "handle": handle,
        "geometry": {
            "text": text,
            "insert": insert,
            "height": height
        }
    }

def main():
    if len(sys.argv) < 2:
        print("使用方法：")
        print("  python dwg2json.py <图纸文件.dxf>")
        print("  或直接将 DXF 文件拖到这个脚本上")
        input("按回车退出...")
        sys.exit(1)

    input_file = sys.argv[1]
    base_name = os.path.splitext(input_file)[0]
    output_json = base_name + ".json"

    # 检查文件格式
    if input_file.lower().endswith(".dwg"):
        print("❌ 错误：当前版本不支持直接读取 DWG 文件")
        print("💡 解决方法：先用 CAD 软件将 DWG 另存为 DXF 格式")
        input("按回车退出...")
        sys.exit(1)

    if not input_file.lower().endswith(".dxf"):
        print("❌ 错误：只支持 DXF 格式的图纸文件")
        input("按回车退出...")
        sys.exit(1)

    try:
        print(f"正在读取：{input_file}")

        # 使用 ezdxf 读取 DXF 文件
        doc = ezdxf.readfile(input_file)

        print("正在提取数据...")
        
        # 提取数据
        data = {
            "meta": {
                "source": input_file,
                "unit": "millimeter",  # DXF通常使用毫米为单位
                "note": "面积单位为平方毫米，需除以1000000转换为平方米"
            },
            "buildings": [],  # 建筑实体（闭合多段线）
            "texts": [],      # 文本标注
            "layers": []      # 所有图层列表
        }

        # 获取所有图层
        for layer in doc.layers:
            data["layers"].append(layer.dxf.name)

        # 遍历模型空间实体
        building_count = 0
        text_count = 0
        
        for entity in doc.modelspace():
            entity_type = entity.dxftype()
            
            # 处理闭合多段线（建筑轮廓）
            if entity_type == 'LWPOLYLINE' and is_valid_building(entity):
                building_info = extract_building_info(entity)
                data["buildings"].append(building_info)
                building_count += 1
            
            # 处理文本（标注）
            elif entity_type in ['TEXT', 'MTEXT']:
                text_info = extract_text_info(entity)
                data["texts"].append(text_info)
                text_count += 1

        # 保存 JSON
        with open(output_json, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"\n✅ 转换成功！")
        print(f"文件已保存到：{output_json}")
        print(f"\n📊 提取统计：")
        print(f"   - 建筑实体（闭合多段线）: {building_count} 个")
        print(f"   - 文本标注: {text_count} 个")
        print(f"   - 总图层数: {len(data['layers'])} 个")
        print(f"\n💡 单位说明：")
        print(f"   - 坐标单位: 毫米 (mm)")
        print(f"   - 面积单位: 平方毫米 (mm²)")
        print(f"   - 转换公式: 平方米 = 平方毫米 / 1000000")

    except Exception as e:
        print(f"\n❌ 错误：{str(e)}")
        print("\n💡 解决方法：")
        print("1. 确保文件是正常的 DXF 格式图纸")
        print("2. 如果是 DWG 文件，请先用 CAD 另存为 DXF 格式")
        print("3. 确保已安装 ezdxf：pip install ezdxf")

    input("\n按回车退出...")

if __name__ == "__main__":
    main()
