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
    await p.loadBaseModel('res/body/basenoarms.png');

    // 开始图层加载
    // 后发
    // await p.loadLayer('res/bhair.png', '#F1C232');
    // 身体(无手)
    await p.loadLayer('res/body/basenoarms.png');

    // 下衣
    // await p.loadLayer('res/trousers.png', '#FFFF00');
    // 手
    await p.loadLayer('res/body/arms.png');

    if (V.pc.has_part("penis")) {
        await p.loadLayer(V.pc.virgin() ? `res/body/penis/penis_virgin${Math.floor(V.pc['penis size']/200)-2}.png` : `res/body/penis/penis${Math.floor(V.pc['penis size']/200)-2}.png`);
    } else if (V.pc.has_part("breasts")) {
        await p.loadLayer(`res/body/breasts/breasts${Math.floor(V.pc['breast size']/200)}.png`)
    }
    // 头
    await p.loadLayer('res/body/basehead.png');
    // 前发
    // await p.loadLayer('res/fhair.png', '#F1C232');
    // 上衣
    // await p.loadLayer('res/tshirt.png', '#FFA500')

    setTimeout(function() {
        console.log('All layers loaded');
        p.draw()
    }, 50);
    return p;
}