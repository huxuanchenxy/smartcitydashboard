import json

def generate_com_item(building_data):
    """
    根据建筑数据生成符合 payloadpie 格式的 VMainTitle 组件对象
    """
    screen_info = building_data.get('screen', {})
    screen_x = screen_info.get('x', 0)
    screen_y = screen_info.get('y', 0)
    screen_width = screen_info.get('width', 0)
    screen_height = screen_info.get('height', 0)
    handle = building_data.get('handle', 'Unknown')
    geometry_info = building_data.get('geometry', {})
    area_sqm = geometry_info.get('area_sqm', 0)

    com_item = {
        "id": f"Building_{handle}",
        "name": "VMainTitle",
        "type": "com",
        "alias": "建筑实体",
        "icon": "v-icon-title",
        "img": "images/缩略图/通用标题.png",
        "locked": False,
        "hided": False,
        "eventhub": False,
        "selected": False,
        "hovered": False,
        "renameing": False,
        "special": "",
        "attr": {
            "x": screen_x,
            "y": screen_y,
            "w": screen_width,
            "h": screen_height,
            "deg": 0,
            "opacity": 1,
            "filpV": False,
            "filpH": False
        },
        "projectId": 197,
        "handles": {
            "click": {
                "eventName": "click",
                "description": "点击",
                "fields": []
            },
            "refreshData": {
                "eventName": "refreshData",
                "description": "更新数据",
                "fields": []
            },
            "mouseEnter": {
                "eventName": "mouseEnter",
                "description": "鼠标移入",
                "fields": []
            },
            "mouseLeave": {
                "eventName": "mouseLeave",
                "description": "鼠标移出",
                "fields": []
            }
        },
        "ichandles": {
            "property": {
                "eventName": "property",
                "description": "属性-点位",
                "fields": [],
                "properties": [
                    {
                        "name": "标题内容",
                        "type": "string",
                        "path": "config.title"
                    },
                    {
                        "name": "字体颜色",
                        "type": "color",
                        "path": "config.textStyle.color"
                    },
                    {
                        "name": "背景颜色",
                        "type": "color",
                        "path": "config.backgroundStyle.bgColor"
                    }
                ],
                "events": None
            },
            "event": {
                "eventName": "event",
                "description": "事件-点位",
                "fields": [],
                "properties": None,
                "events": []
            }
        },
        "config": {
            "title": f"B-{area_sqm}㎡",
            "textStyle": {
                "fontFamily": "Microsoft Yahei",
                "fontSize": 14,
                "color": "#66CCFF",
                "fontWeight": "bold"
            },
            "textAlign": "center",
            "writingMode": "horizontal-tb",
            "letterSpacing": 0,
            "backgroundStyle": {
                "show": True,
                "bgColor": "rgba(0, 139, 139, 0.3)",
                "borderRadius": 4,
                "borderColor": "#00EEFF",
                "borderStyle": "solid",
                "borderWidth": 1
            },
            "ellipsis": False,
            "urlConfig": {
                "url": "",
                "isBlank": False
            },
            "animation": {
                "enable": False,
                "name": "Updown",
                "duration": 1000,
                "timing": "linear",
                "delay": 0,
                "iteration": "infinite",
                "direction": "alternate"
            },
            "cursor": "pointer"
        },
        "apis": {
            "source": {
                "fields": {
                    "title": {
                        "type": "string",
                        "map": "",
                        "description": "标题值",
                        "optional": True
                    },
                    "url": {
                        "type": "string",
                        "map": "",
                        "description": "超链接",
                        "optional": True
                    }
                },
                "render": "render",
                "description": "",
                "useAutoUpdate": False,
                "autoUpdate": 1
            }
        },
        "apiData": {
            "source": {
                "comId": f"Building_{handle}",
                "id": f"V{handle}",
                "type": "static",
                "pageFilters": [],
                "config": {
                    "useFilter": False,
                    "data": "{}",
                    "postBodyType": "static"
                }
            }
        },
        "events": {},
        "actions": {}
    }
    return com_item

def main():
    try:
        with open('build.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if isinstance(data, dict) and 'buildings' in data:
            buildings = data['buildings']
        elif isinstance(data, list):
            buildings = data
        else:
            buildings = list(data.values())[0] if data else []

        print(f"成功读取 {len(buildings)} 个建筑数据")

        coms_array = []
        for building in buildings:
            com = generate_com_item(building)
            coms_array.append(com)

        output_data = {
            "screen": {
                "id": 197,
                "name": "测试雷达图v1",
                "share": "",
                "thumbnail": None,
                "groupId": 4
            },
            "config": {
                "width": 1920,
                "height": 1080,
                "bgimage": "data/originPic/bj.png",
                "bgcolor": "rgba(13,42,67,0)",
                "grid": 8,
                "screenshot": "",
                "zoomMode": 1,
                "useWatermark": False,
                "styleFilterParams": {
                    "enable": False,
                    "hue": 0,
                    "saturate": 100,
                    "brightness": 100,
                    "contrast": 100,
                    "opacity": 100
                },
                "tokenSettings": []
            },
            "coms": coms_array,
            "variables": {
                "componentsView": {},
                "publishersView": {},
                "subscribersView": {}
            },
            "dataFilters": []
        }

        output_file = 'payloadpie_buildings.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"转换完成！已生成 {len(coms_array)} 个组件，结果保存在 {output_file}")

    except FileNotFoundError:
        print("错误：找不到 build.json 文件，请确保文件与脚本在同一目录下。")
    except Exception as e:
        print(f"转换过程中发生错误: {e}")

if __name__ == "__main__":
    main()
