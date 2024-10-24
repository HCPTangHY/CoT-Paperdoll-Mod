## Paperdoll Framework 纸娃娃框架

在COT中实现PC纸娃娃的代码框架，内置一个像素人物示例，可以作为参考。

### 食用方法

在右侧或下侧的Release中下载最新版本，使用模组加载器加载。
每次发布时会附带本版本像素人物图包mod，供美化开发使用，普通玩家无须下载。
**请美化作者根据示例图包mod制作美化包，不需要的原图请留透明**

### 数据指南
- 命名规范：[文档](https://github.com/HCPTangHY/CoT-Paperdoll-Mod/blob/main/doc/命名规范.md)
- 发型大全：[文档](https://github.com/HCPTangHY/CoT-Paperdoll-Mod/blob/main/doc/hairstyle.md)
- 突出特征：[文档](https://github.com/HCPTangHY/CoT-Paperdoll-Mod/blob/main/doc/dmarks.md)
- 衣服：因数据量巨大，此处不提供具体数据，请使用Modloader界面`导出当前所有数据`，找到`js/database_clothes.js`，其中包含所有衣服数据。

### APIs

- Paperdoll类
    - loadBaseModel(src) 加载纸娃娃的基础模型，画布大小将由图片大小决定
    - loadLayer(src, color=='', type=='') 加载图层，不指定颜色即为不染色，type可选：skin，hair。
    - desaturateImage(src) 灰度化图片
    - colorLayer(src, color, mode) 着色图层
    - draw() 最终输出绘制
- setup.Paperdoll.paperdollPC 侧边栏纸娃娃方法
    - 请使用[ReplacePatcherAddon](https://github.com/Lyoko-Jeremie/Degrees-of-Lewdity_Mod_ReplacePatch)替换功能在本方法中插入代码
    - PCLayers，格式{layer:xxx,load: async function(p,clotheMap)}。layer层会和其他层一起排序，最终调用load方法。
        - 请在代码中`// 其他图层插入点`处替换插入，格式为Object.assign(PCLayers, {你的数据});
    - `// 前景替换插入点`，`// 后景替换插入点`：可供插入前后景等美化功能
    - 在本方法中，接收任意大小的基础模型，可以自动分配缩放大小。如需要实现其他地方，请自行研究解决方案。