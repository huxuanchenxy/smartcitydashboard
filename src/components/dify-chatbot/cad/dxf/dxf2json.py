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

# DXF单位代码映射
UNIT_CODES = {
    0: 'unitless',      # 无单位
    1: 'inch',          # 英寸
    2: 'foot',          # 英尺
    3: 'mile',          # 英里
    4: 'millimeter',    # 毫米
    5: 'centimeter',    # 厘米
    6: 'meter',         # 米
    7: 'kilometer',     # 千米
}

def detect_drawing_units(doc):
    """检测DXF图纸的单位设置"""
    # 优先从HEADER中读取单位设置
    units = doc.header.get('$INSUNITS', 0)
    
    # 如果未设置或为0（无单位），尝试通过坐标范围推断
    if units == 0:
        # 获取所有实体的坐标范围
        x_coords = []
        y_coords = []
        for entity in doc.modelspace():
            if entity.dxftype() == 'LWPOLYLINE':
                points = list(entity.get_points('xy'))
                for pt in points:
                    x_coords.append(pt[0])
                    y_coords.append(pt[1])
        
        if x_coords:
            # 计算坐标范围
            x_range = max(x_coords) - min(x_coords)
            y_range = max(y_coords) - min(y_coords)
            max_range = max(x_range, y_range)
            
            # 根据坐标范围推断单位
            # 通常建筑图纸范围如果是几百到几千，可能是米；如果是几十万，可能是毫米
            if max_range < 1000:
                # 范围较小，可能是米
                units = 6  # meter
            elif max_range > 100000:
                # 范围较大，可能是毫米
                units = 4  # millimeter
            else:
                # 中间范围，默认按毫米处理
                units = 4  # millimeter
        else:
            # 没有找到坐标数据，默认毫米
            units = 4
    
    return units, UNIT_CODES.get(units, 'unknown')

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

def extract_building_info(entity, unit_factor=1.0, target_unit='millimeter'):
    """提取建筑实体的详细信息
    
    Args:
        entity: DXF实体
        unit_factor: 单位转换系数（原始单位到目标单位）
        target_unit: 目标单位名称
    """
    points = list(entity.get_points('xy'))
    
    # 计算面积（鞋带公式）- 原始单位
    area_original = calculate_polygon_area(points)
    
    # 计算几何中心
    centroid = calculate_centroid(points)
    
    # 计算真实宽高
    width, height = calculate_dimensions(points)
    
    # 获取图层信息
    layer = entity.dxf.layer
    handle = entity.dxf.handle
    
    # 获取边界框（用于屏幕映射）
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    bbox = {
        "min_x": min(xs),
        "min_y": min(ys),
        "max_x": max(xs),
        "max_y": max(ys)
    }
    
    # 转换到目标单位
    width_converted = width * unit_factor
    height_converted = height * unit_factor
    area_converted = area_original * (unit_factor ** 2)
    centroid_converted = [c * unit_factor for c in centroid]
    points_converted = [[p[0] * unit_factor, p[1] * unit_factor] for p in points]
    bbox_converted = {
        "min_x": bbox["min_x"] * unit_factor,
        "min_y": bbox["min_y"] * unit_factor,
        "max_x": bbox["max_x"] * unit_factor,
        "max_y": bbox["max_y"] * unit_factor
    }
    
    return {
        "type": "Building",
        "layer": layer,
        "handle": handle,
        "geometry": {
            "points": points_converted,
            "closed": True,
            "centroid": centroid_converted,
            "width": width_converted,
            "height": height_converted,
            "area": area_converted,
            "area_sqm": area_converted / 1000000 if target_unit == 'millimeter' else area_converted,
            "bbox": bbox_converted
        },
        "screen": {
            "x": 0,
            "y": 0,
            "width": 0,
            "height": 0
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

def map_to_screen(buildings, screen_width=1920, screen_height=1080, padding=50):
    """将建筑坐标映射到屏幕坐标（1920×1080）"""
    if not buildings:
        return
    
    # 计算所有建筑的整体边界框
    all_min_x = float('inf')
    all_min_y = float('inf')
    all_max_x = float('-inf')
    all_max_y = float('-inf')
    
    for building in buildings:
        bbox = building["geometry"]["bbox"]
        all_min_x = min(all_min_x, bbox["min_x"])
        all_min_y = min(all_min_y, bbox["min_y"])
        all_max_x = max(all_max_x, bbox["max_x"])
        all_max_y = max(all_max_y, bbox["max_y"])
    
    # 计算实际范围
    world_width = all_max_x - all_min_x
    world_height = all_max_y - all_min_y
    
    # 计算缩放比例（保持宽高比）
    available_width = screen_width - padding * 2
    available_height = screen_height - padding * 2
    
    scale_x = available_width / world_width if world_width > 0 else 1.0
    scale_y = available_height / world_height if world_height > 0 else 1.0
    scale = min(scale_x, scale_y)
    
    # 映射每个建筑到屏幕坐标
    for building in buildings:
        bbox = building["geometry"]["bbox"]
        
        # 计算屏幕坐标（DXF坐标系Y轴向上，屏幕Y轴向下，需要翻转）
        screen_x = padding + (bbox["min_x"] - all_min_x) * scale
        screen_y = padding + (all_max_y - bbox["max_y"]) * scale
        screen_width_b = (bbox["max_x"] - bbox["min_x"]) * scale
        screen_height_b = (bbox["max_y"] - bbox["min_y"]) * scale
        
        building["screen"] = {
            "x": round(screen_x, 2),
            "y": round(screen_y, 2),
            "width": round(screen_width_b, 2),
            "height": round(screen_height_b, 2),
            "center_x": round(screen_x + screen_width_b / 2, 2),
            "center_y": round(screen_y + screen_height_b / 2, 2)
        }
    
    return {
        "screen_width": screen_width,
        "screen_height": screen_height,
        "world_bbox": {
            "min_x": all_min_x,
            "min_y": all_min_y,
            "max_x": all_max_x,
            "max_y": all_max_y
        },
        "scale": round(scale, 6),
        "padding": padding
    }

def main():
    if len(sys.argv) < 2:
        print("使用方法：")
        print("  python dxf2json.py <图纸文件.dxf>")
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

        # 检测图纸单位
        print("正在检测图纸单位...")
        unit_code, unit_name = detect_drawing_units(doc)
        
        # 设置目标单位为毫米，计算转换系数
        target_unit = 'millimeter'
        unit_factor = 1.0
        if unit_name == 'meter':
            unit_factor = 1000.0  # 米 -> 毫米
        elif unit_name == 'centimeter':
            unit_factor = 10.0    # 厘米 -> 毫米
        elif unit_name == 'inch':
            unit_factor = 25.4    # 英寸 -> 毫米
        elif unit_name == 'foot':
            unit_factor = 304.8   # 英尺 -> 毫米
        # 其他单位保持不变

        print(f"检测到图纸单位: {unit_name}，已转换为 {target_unit}")
        print("正在提取数据...")
        
        # 提取数据
        data = {
            "meta": {
                "source": input_file,
                "original_unit": unit_name,
                "original_unit_code": unit_code,
                "target_unit": target_unit,
                "unit_factor": unit_factor,
                "note": "所有坐标和尺寸已转换为毫米，area_sqm 为平方米"
            },
            "buildings": [],  # 建筑实体（闭合多段线）
            "texts": [],      # 文本标注
            "layers": [],     # 所有图层列表
            "screen_config": {
                "screen_width": 1920,
                "screen_height": 1080,
                "scale": 1.0,
                "padding": 50
            },
            "statistics": {
                "total_buildings": 0,
                "total_area_sqm": 0.0,
                "average_area_sqm": 0.0,
                "filtered_layers": list(FILTERED_LAYERS)
            }
        }

        # 获取所有图层
        for layer in doc.layers:
            data["layers"].append(layer.dxf.name)

        # 遍历模型空间实体
        building_count = 0
        text_count = 0
        total_area_sqm = 0.0
        
        for entity in doc.modelspace():
            entity_type = entity.dxftype()
            
            # 处理闭合多段线（建筑轮廓）
            if entity_type == 'LWPOLYLINE' and is_valid_building(entity):
                building_info = extract_building_info(entity, unit_factor, target_unit)
                data["buildings"].append(building_info)
                building_count += 1
                total_area_sqm += building_info["geometry"]["area_sqm"]
            
            # 处理文本（标注）
            elif entity_type in ['TEXT', 'MTEXT']:
                text_info = extract_text_info(entity)
                data["texts"].append(text_info)
                text_count += 1

        # 将建筑坐标映射到屏幕坐标（1920×1080）
        print("正在映射屏幕坐标...")
        screen_info = map_to_screen(data["buildings"])
        if screen_info:
            data["screen_config"].update(screen_info)

        # 更新统计信息
        data["statistics"]["total_buildings"] = building_count
        data["statistics"]["total_area_sqm"] = round(total_area_sqm, 4)
        data["statistics"]["average_area_sqm"] = round(total_area_sqm / max(building_count, 1), 4)

        # 保存 JSON
        with open(output_json, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"\n✅ 转换成功！")
        print(f"文件已保存到：{output_json}")
        print(f"\n📊 提取统计：")
        print(f"   - 有效建筑实体（闭合多段线）: {building_count} 个")
        print(f"   - 总建筑面积: {total_area_sqm:.4f} 平方米")
        print(f"   - 平均建筑面积: {total_area_sqm / max(building_count, 1):.4f} 平方米")
        print(f"   - 文本标注: {text_count} 个")
        print(f"   - 总图层数: {len(data['layers'])} 个")
        print(f"\n💡 单位说明：")
        print(f"   - 原始单位: {unit_name}")
        print(f"   - 目标单位: {target_unit} (毫米)")
        print(f"   - 转换系数: {unit_factor}")
        print(f"\n🖥️  屏幕映射配置（1920×1080）:")
        if screen_info:
            print(f"   - 缩放比例: {screen_info['scale']:.6f}")
            print(f"   - 世界范围: [{screen_info['world_bbox']['min_x']:.1f}, {screen_info['world_bbox']['min_y']:.1f}] to [{screen_info['world_bbox']['max_x']:.1f}, {screen_info['world_bbox']['max_y']:.1f}]")
        else:
            print(f"   - 无有效建筑实体，跳过屏幕映射")
        print(f"\n🔍 过滤的非建筑图层:")
        print(f"   {', '.join(FILTERED_LAYERS)}")

    except Exception as e:
        print(f"\n❌ 错误：{str(e)}")
        print("\n💡 解决方法：")
        print("1. 确保文件是正常的 DXF 格式图纸")
        print("2. 如果是 DWG 文件，请先用 CAD 另存为 DXF 格式")
        print("3. 确保已安装 ezdxf：pip install ezdxf")

    input("\n按回车退出...")

if __name__ == "__main__":
    main()
