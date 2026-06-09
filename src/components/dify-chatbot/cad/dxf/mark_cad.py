import json
import os
from PIL import Image, ImageDraw, ImageFont


def mark_image_with_boxes(image_path: str, json_path: str, output_path: str = None):
    """
    根据JSON中定义的设备坐标和尺寸，在图片上绘制红框并标注坐标值。
    支持坐标转换：JSON中的坐标是相对于screen_resolution的，需要转换到原图实际尺寸。

    Args:
        image_path: JPG图片路径
        json_path: 对应的JSON配置文件路径
        output_path: 输出文件路径，默认为原文件名+(标记).jpg
    """
    # 读取JSON配置
    with open(json_path, 'r', encoding='utf-8') as f:
        config = json.load(f)

    # 打开图片
    img = Image.open(image_path)
    img_width, img_height = img.size
    draw = ImageDraw.Draw(img)

    # 尝试加载字体，使用默认字体作为后备
    try:
        font = ImageFont.truetype("arial.ttf", 16)
    except:
        font = ImageFont.load_default()

    # 获取JSON中的屏幕分辨率（默认1920x1080）
    metadata = config.get("metadata", {})
    screen_res = metadata.get("screen_resolution", [1920, 1080])
    screen_width, screen_height = screen_res[0], screen_res[1]

    # 计算缩放比例（等比缩放，宽度填满）
    scale_x = img_width / screen_width
    scale_y = img_height / screen_height
    
    # 根据"宽度填满"策略，使用宽度比例，高度可能有黑边
    # 计算实际内容区域的偏移
    content_height = screen_height * scale_x
    offset_y = (img_height - content_height) / 2 if content_height < img_height else 0

    print(f"原图尺寸: {img_width}x{img_height}")
    print(f"JSON屏幕分辨率: {screen_width}x{screen_height}")
    print(f"缩放比例: {scale_x:.4f}")
    print(f"垂直偏移: {offset_y:.2f}")

    # 遍历所有元素（支持新格式 elements）
    elements = config.get("elements", config.get("equipment", []))
    
    for element in elements:
        try:
            # 解析 screen_position 和 screen_size（新格式）
            screen_pos = element.get("screen_position", {})
            screen_size = element.get("screen_size", {})
            
            if screen_pos and screen_size:
                # 使用 screen_position 和 screen_size
                center_x = float(screen_pos["x"])
                center_y = float(screen_pos["y"])
                width_px = float(screen_size["width"])
                height_px = float(screen_size["height"])
            else:
                # 兼容旧格式
                center_x = float(element["center_x"])
                center_y = float(element["center_y"])
                width_px = float(element["width_px"])
                height_px = float(element["height_px"])

            # 坐标转换：从JSON分辨率转换到原图实际尺寸
            # 使用宽度缩放比例，并考虑垂直偏移
            actual_center_x = center_x * scale_x
            actual_center_y = center_y * scale_x + offset_y
            actual_width = width_px * scale_x
            actual_height = height_px * scale_x

            # 计算边界框（左上角和右下角坐标）
            left = actual_center_x - actual_width / 2
            top = actual_center_y - actual_height / 2
            right = actual_center_x + actual_width / 2
            bottom = actual_center_y + actual_height / 2

            # 绘制红色边框矩形
            outline_color = (255, 0, 0)  # 红色
            draw.rectangle([left, top, right, bottom], outline=outline_color, width=2)

            # 准备标注文本（显示原图坐标）
            label = element.get("label", element.get("name", ""))
            text = f"{label}\n({int(actual_center_x)}, {int(actual_center_y)})\n{int(actual_width)}x{int(actual_height)}"

            # 计算文本位置（放在矩形上方或右侧）
            text_x = right + 5
            text_y = top

            # 绘制文本
            draw.text((text_x, text_y), text, fill=(255, 0, 0), font=font)

            print(f"已标记: {label} at ({actual_center_x:.2f}, {actual_center_y:.2f}) size: {actual_width:.2f}x{actual_height:.2f}")

        except Exception as e:
            print(f"处理元素 {element.get('label', 'unknown')} 时出错: {e}")
            continue

    # 保存结果
    if output_path is None:
        base_name = os.path.splitext(image_path)[0]
        ext = os.path.splitext(image_path)[1]
        output_path = f"{base_name}(标记){ext}"

    img.save(output_path)
    print(f"标记完成，输出文件: {output_path}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("用法: python mark_cad.py <图片路径> <JSON配置路径> [输出文件路径]")
        sys.exit(1)

    image_path = sys.argv[1]
    json_path = sys.argv[2]
    output_path = sys.argv[3] if len(sys.argv) > 3 else None

    mark_image_with_boxes(image_path, json_path, output_path)
