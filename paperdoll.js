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

    V.pc.get_clothingItems_classes();
    let clothes = V.pc.clothes;
    clothes.sort((a, b) => setup.clothes[a.item].layer - setup.clothes[b.item].layer);
    // 开始图层加载
    // 后发
    await p.loadLayer(`res/hair/back/${V.pc['hair style'].replace(/ /g,'_')}/${V.pc['hair length']}.png`, V.pc['hair color']);
    // 身体(无手)
    await p.loadLayer('res/body/basenoarms.png');
    // 头
    await p.loadLayer('res/body/basehead.png');
    // 眼睛
    await p.loadLayer('res/face/eyes.png', setup.color_table[V.pc['eye color']]);

    // 身体衣服
    for (let i = 0; i < clothes.length; i++) {
        let citem = setup.clothes[clothes[i].item];
        if (citem.name.indexOf('color2') !== -1) {
            await p.loadLayer(`res/clothes/${citem.category}/${clothes[i].item.replace(/ /g,'_')}/full_gray.png`, setup.color_table[clothes[i].subs['color1']] ? setup.color_table[clothes[i].subs['color1']] : clothes[i].subs['color1']);
            await p.loadLayer(`res/clothes/${citem.category}/${clothes[i].item.replace(/ /g,'_')}/color2_gray.png`, setup.color_table[clothes[i].subs['color2']] ? setup.color_table[clothes[i].subs['color2']] : clothes[i].subs['color2']);
        } else {
            await p.loadLayer(`res/clothes/${citem.category}/${clothes[i].item.replace(/ /g,'_')}/full_gray.png`, setup.color_table[clothes[i].subs['color']] ? setup.color_table[clothes[i].subs['color1']] : clothes[i].subs['color1']);
        }
    }
    // 手
    await p.loadLayer('res/body/leftarm.png');

    if (V.pc.has_part("penis") && V.pc.is_part_visible('penis')) {
        await p.loadLayer(V.pc.virgin() ? `res/body/penis/penis_virgin${Math.floor(V.pc['penis size']/200)-2}.png` : `res/body/penis/penis${Math.floor(V.pc['penis size']/200)-2}.png`);
    } else if (V.pc.has_part("breasts") && V.pc.is_part_visible('nipples')) {
        await p.loadLayer(`res/body/breasts/breasts${Math.floor(V.pc['breast size']/200)}.png`)
    }

    // 左手衣服
    for (let i = 0; i < clothes.length; i++) {
        let citem = setup.clothes[clothes[i].item];
        await p.loadLayer(`res/clothes/${citem.category}/${clothes[i].item.replace(/ /g,'_')}/left_gray.png`, setup.color_table[clothes[i].subs['color']]);
    }
    // 右手
    await p.loadLayer('res/body/rightarm.png');
    // 右手衣服
    for (let i = 0; i < clothes.length; i++) {
        let citem = setup.clothes[clothes[i].item];
        await p.loadLayer(`res/clothes/${citem.category}/${clothes[i].item.replace(/ /g,'_')}/right_gray.png`, setup.color_table[clothes[i].subs['color']]);
    }

    // 前发
    await p.loadLayer(`res/hair/front/${V.pc['hair style'].replace(/ /g,'_')}/${V.pc['hair length']}.png`, V.pc['hair color']);

    setTimeout(function() {
        console.log('All layers loaded');
        p.draw()
    }, 50);
    return p;
}