import json

def main(screen_name: str, components: str) -> dict:
    # 健壮性处理
    if isinstance(components, str):
        comp_list = json.loads(components)
    else:
        comp_list = components
    
    count = len(comp_list)
    
    CANVAS_W = 1920
    CANVAS_H = 1080
    
    if count == 1:
        size = {"w": 500, "h": 300}
        layouts = [{
            "x": (CANVAS_W - size["w"]) // 2,
            "y": (CANVAS_H - size["h"]) // 2,
            **size
        }]
    elif count == 2:
        positions = [c.get('position', 'auto') for c in comp_list]
        
        if 'left' in positions and 'right' in positions:
            size = {"w": 800, "h": 400}
            layouts = [
                {"x": 100, "y": 200, **size},
                {"x": CANVAS_W - 100 - size["w"], "y": 200, **size}
            ]
        elif 'top' in positions and 'bottom' in positions:
            size = {"w": 800, "h": 400}
            layouts = [
                {"x": (CANVAS_W - size["w"]) // 2, "y": 100, **size},
                {"x": (CANVAS_W - size["w"]) // 2, "y": CANVAS_H - 100 - size["h"], **size}
            ]
        else:
            size = {"w": 800, "h": 400}
            layouts = [
                {"x": 100, "y": 200, **size},
                {"x": CANVAS_W - 100 - size["w"], "y": 200, **size}
            ]
    elif count == 3:
        size = {"w": 560, "h": 350}
        gap = (CANVAS_W - 3 * size["w"]) // 4
        layouts = [
            {"x": gap, "y": 200, **size},
            {"x": gap * 2 + size["w"], "y": 200, **size},
            {"x": gap * 3 + size["w"] * 2, "y": 200, **size}
        ]
    else:
        cols = 2 if count <= 4 else 3
        rows = (count + cols - 1) // cols
        cell_w = (CANVAS_W - 200) // cols
        cell_h = (CANVAS_H - 200) // rows
        layouts = []
        for i in range(count):
            row = i // cols
            col = i % cols
            layouts.append({
                "x": 100 + col * cell_w,
                "y": 100 + row * cell_h,
                "w": cell_w - 20,
                "h": cell_h - 20
            })
    
    for i, comp in enumerate(comp_list):
        comp['attr'] = {
            **layouts[i],
            "deg": 0,
            "opacity": 1,
            "filpV": False,
            "filpH": False
        }
    
    return {
        'screen_name': screen_name,
        'components': json.dumps(comp_list, ensure_ascii=False)
    }