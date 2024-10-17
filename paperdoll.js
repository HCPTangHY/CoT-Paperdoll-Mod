setup.createCanvas = function(id) {
    let canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.style.position = 'absolute';
    canvas.style.left = '-5px';
    canvas.style.top = '0px';
    canvas.style.transform = 'scale(1.75)';
    canvas.style.transformOrigin = 'top left';
    return canvas;
}

setup.paperdollPC = async function(canvas) {
    // $(".locimgcontainer").append('<canvas id="paperdollPC-canvas" style="left: -5px;position: absolute;transform: scale(1.75);transform-origin: top left;"></canvas>')
    let p = new PaperDollSystem(canvas);

    // 加载人模
    await p.loadBaseModel('res/bodynoarm.png');

    // 开始图层加载
    const layerPromises = [
        // 后发
        p.loadLayer('res/bhair.png', '#F1C232'),
        // 身体(无手)
        p.loadLayer('res/bodynoarm.png'),
        // 头
        p.loadLayer('res/head.png'),
        // 前发
        p.loadLayer('res/fhair.png', '#F1C232'),
        // 下衣
        p.loadLayer('res/trousers.png', '#FFFF00'),
        // 手
        p.loadLayer('res/arms.png'),
        // 上衣
        p.loadLayer('res/tshirt.png', '#FFA500')
    ];

    // 等待所有的 loadLayer 操作完成
    await Promise.all(layerPromises);
    // 绘制
    p.draw();
    // window.paperdollPC = p;
    return p;
}