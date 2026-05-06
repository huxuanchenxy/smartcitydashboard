import json

# 修改点：使用 **kwargs 接收所有传入的变量，防止参数名不匹配报错
def main(**kwargs) -> dict:
    """
    通用入口：自动获取 Dify 传入的第一个变量
    """
    # 1. 获取输入数据
    # 尝试获取常见的变量名，或者直接取第一个值
    input_data = kwargs.get('json_input') or kwargs.get('components') or kwargs.get('input') or list(kwargs.values())[0] if kwargs else None

    if not input_data:
        return {'components': '[]'}

    comp_list = []
    
    # 2. 解析逻辑
    try:
        # 如果输入是字符串，尝试解析
        if isinstance(input_data, str):
            parsed_data = json.loads(input_data)
            # 处理嵌套情况：如果解析后是字典且包含 components 键
            if isinstance(parsed_data, dict):
                inner_comp = parsed_data.get('components')
                # 如果 components 还是字符串（双重 JSON），再次解析
                if isinstance(inner_comp, str):
                    comp_list = json.loads(inner_comp)
                elif isinstance(inner_comp, list):
                    comp_list = inner_comp
                else:
                    comp_list = []
            # 如果解析后直接是列表
            elif isinstance(parsed_data, list):
                comp_list = parsed_data
            else:
                comp_list = []
        # 如果输入已经是列表（Dify 对象类型）
        elif isinstance(input_data, list):
            comp_list = input_data
        # 如果输入是字典（直接就是对象）
        elif isinstance(input_data, dict):
             # 尝试直接取 components 字段
            inner_comp = input_data.get('components')
            if isinstance(inner_comp, list):
                comp_list = inner_comp
            elif isinstance(inner_comp, str):
                 comp_list = json.loads(inner_comp)
            else:
                comp_list = []
        else:
            comp_list = []
            
    except Exception as e:
        print(f"解析错误: {e}")
        return {'components': '[]'}

    # --- 组件配置字典 (保持不变) ---
    component_dict = {
        'bar': {
            'default': {'name': 'VBasicBar', 'alias': '柱状图', 'icon': 'v-icon-chart-bar', 'img': 'images/大图/柱状图.png'},
            'multi': {'name': 'VMultiBar', 'alias': '垂直分组柱状图', 'icon': 'v-icon-chart-bar', 'img': 'images/大图/垂直分组柱状图.png'},
            'dynamic': {'name': 'VDynamicBar', 'alias': '动态分组柱状图', 'icon': 'v-icon-chart-bar', 'img': 'images/大图/垂直分组柱状图.png'},
            'drill': {'name': 'VDrillDownBar', 'alias': '钻取柱图', 'icon': 'v-icon-chart-bar', 'img': 'images/大图/柱状图.png'},
            'polar': {'name': 'VPolarBar', 'alias': '极坐标柱状图', 'icon': 'v-icon-chart-bar', 'img': 'images/大图/极坐标柱状图.png'},
            'waterfall': {'name': 'VWaterfall', 'alias': '瀑布图', 'icon': 'v-icon-chart-bar', 'img': 'images/大图/瀑布图.png'},
        },
        'pie': {
            'default': {'name': 'VBasicPie', 'alias': '基本饼图', 'icon': 'v-icon-chart-pie', 'img': 'images/大图/基本饼图.png'},
            'dashboard': {'name': 'VDashboardPie', 'alias': '仪表饼图', 'icon': 'v-icon-chart-pie', 'img': 'images/大图/仪表饼图.png'},
            'proportion': {'name': 'VProportionRing', 'alias': '指标占比饼图', 'icon': 'v-icon-chart-pie', 'img': 'images/大图/指标占比饼图.png'},
            'multiarc': {'name': 'VMArcBar', 'alias': '多维环图', 'icon': 'v-icon-chart-pie', 'img': 'images/大图/多维环图.png'},
            'arc': {'name': 'VArcBar', 'alias': '玉环图', 'icon': 'v-icon-chart-pie', 'img': 'images/大图/玉环图.png'},
        },
        'line': {
            'default': {'name': 'VBasicLine', 'alias': '基本折线图', 'icon': 'v-icon-chart-line', 'img': 'images/大图/基本折线图.png'},
            'dynamic': {'name': 'VDynamicLine', 'alias': '动态折线图', 'icon': 'v-icon-chart-line', 'img': 'images/大图/基本折线图.png'},
        },
        'area': {
            'default': {'name': 'VBasicArea', 'alias': '区域图', 'icon': 'v-icon-chart-line', 'img': 'images/大图/区域图.png'},
            'stack': {'name': 'VStackArea', 'alias': '堆叠区域图', 'icon': 'v-icon-chart-line', 'img': 'images/大图/堆叠区域图.png'},
        },
        'radar': {
            'default': {'name': 'VBasicRadar', 'alias': '雷达图', 'icon': 'v-icon-chart-radar', 'img': 'images/大图/雷达图.png'},
        },
        'scatter': {
            'default': {'name': 'VPunchCardScatter', 'alias': '打卡气泡图', 'icon': 'v-icon-chart-scatter', 'img': 'images/大图/打卡气泡图.png'},
        },
        'heatmap': {
            'default': {'name': 'VCartesianHeatmap', 'alias': '笛卡尔热力图', 'icon': 'v-icon-chart-heatmap', 'img': 'images/大图/笛卡尔热力图.png'},
        },
        'funnel': {
            'default': {'name': 'VFunnel', 'alias': '漏斗图', 'icon': 'v-icon-chart-bar', 'img': 'images/大图/漏斗图.png'},
        },
        'wordcloud': {
            'default': {'name': 'VWordCloud', 'alias': '词云', 'icon': 'v-icon-other', 'img': 'images/大图/词云.png'},
        },
        'waterlevel': {
            'default': {'name': 'VWaterLevel', 'alias': '水位图', 'icon': 'v-icon-other', 'img': 'images/大图/水位图.png'},
        },
        'map': {
            'default': {'name': 'VGdMap', 'alias': '高德地图', 'icon': 'v-icon-map', 'img': 'images/大图/高德地图.png'},
        },
        'title': {
            'default': {'name': 'VMainTitle', 'alias': '通用标题', 'icon': 'v-icon-title', 'img': 'images/大图/通用标题.png'},
        },
        'table': {
            'default': {'name': 'VBasicCarousel', 'alias': '滚动表格', 'icon': 'v-icon-other', 'img': 'images/大图/滚动表格.png'},
        },
        'button': {
            'default': {'name': 'VButton', 'alias': '按钮', 'icon': 'v-icon-interact', 'img': 'images/大图/按钮.png'},
        },
        'progress': {
            'default': {'name': 'VProgress', 'alias': '进度条', 'icon': 'v-icon-interact', 'img': 'images/大图/进度条.png'},
        },
        'video': {
            'default': {'name': 'VVideo', 'alias': '视频播放', 'icon': 'v-icon-media', 'img': 'images/大图/视频播放.png'},
        },
        'threed': {
            'default': {'name': 'VThreedViewer', 'alias': '3D视图', 'icon': 'v-icon-media', 'img': 'images/大图/threedViewer.png'},
        },
        'bgbox': {
            'default': {'name': 'VBgBox', 'alias': '自定义背景块', 'icon': 'v-icon-media', 'img': 'images/大图/自定义背景块.png'},
        },
        'border': {
            'default': {'name': 'VBorderBox', 'alias': '边框', 'icon': 'v-icon-media', 'img': 'images/大图/边框.png'},
        },
        'decoration': {
            'default': {'name': 'VDecoration', 'alias': '装饰', 'icon': 'v-icon-media', 'img': 'images/大图/装饰.png'},
        },
        'timer': {
            'default': {'name': 'VTimer', 'alias': '时间器', 'icon': 'v-icon-title','img': 'images/缩略图/时间器.png'},
        },
        'image': {
            'default': {'name': 'VMainImg', 'alias': '单张图片', 'icon': 'v-icon-media','img': 'images/缩略图/单张图片.png'},
        },
    }
    
    result = []
    for comp in comp_list:
        if not isinstance(comp, dict):
            continue
            
        chart_type = comp.get('chartType', '')
        detail = comp.get('detail', '')
        position = comp.get('position', 'auto')
        
        variants = component_dict.get(chart_type, {})
        
        if detail and detail in variants:
            selected = variants[detail].copy()
        else:
            selected = variants.get('default', {'name': 'VBasicBar', 'alias': '柱状图', 'icon': 'v-icon-chart-bar', 'img': 'images/大图/柱状图.png'}).copy()
        
        selected['position'] = position
        result.append(selected)
    
    return {
        'components': json.dumps(result, ensure_ascii=False)
    }