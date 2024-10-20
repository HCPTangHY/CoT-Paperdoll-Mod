if (!("Paperdoll" in setup)) setup.Paperdoll = {};

setup.Paperdoll.createCanvas = function(id) {
    let canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.style.position = 'absolute';
    canvas.style.left = '-5px';
    canvas.style.top = '0px';
    canvas.style.transform = 'scale(1.75)';
    canvas.style.transformOrigin = 'top left';
    return canvas;
}

setup.Paperdoll.checkImgExists = function(src) {
    return Boolean(window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src));
}

setup.Paperdoll.colorConvert = function(color) {
    if (setup.color_table[color]) {
        return setup.color_table[color];
    } else {
        return color;
    }
}

setup.Paperdoll.ifColorPush = function(path, targetArray, color) {
    if (setup.Paperdoll.checkImgExists(`${path}_gray.png`)) {
        targetArray.push({ "path": `${path}_gray.png`, "color": color });
    } else {
        targetArray.push({ "path": `${path}.png` });
    }
    return targetArray;
}

setup.Paperdoll.clotheBaseSubLayers = function(imgPath, color, bodyClothes, leftHandClothes, rightHandClothes) {
    bodyClothes = setup.Paperdoll.ifColorPush(`${imgPath}full`, bodyClothes, color);
    leftHandClothes = setup.Paperdoll.ifColorPush(`${imgPath}left`, leftHandClothes, color);
    rightHandClothes = setup.Paperdoll.ifColorPush(`${imgPath}right`, rightHandClothes, color);
    return [bodyClothes, leftHandClothes, rightHandClothes];
}

setup.Paperdoll.clotheSubLayers = function(imgPath, color, bodyClothes, leftHandClothes, rightHandClothes) {
    [bodyClothes, leftHandClothes, rightHandClothes] = setup.Paperdoll.clotheBaseSubLayers(imgPath, color, bodyClothes, leftHandClothes, rightHandClothes);
    console.log(typeof bodyClothes, typeof leftHandClothes, typeof rightHandClothes);
    bodyClothes.push({ "path": `${imgPath}acc_full.png` });
    leftHandClothes.push({ "path": `${imgPath}acc_left.png` });
    rightHandClothes.push({ "path": `${imgPath}acc_right.png` });
    return [bodyClothes, leftHandClothes, rightHandClothes];
}

setup.Paperdoll.clotheLayers = function(clothes, bodyClothes, leftHandClothes, rightHandClothes) {
    for (let i = 0; i < clothes.length; i++) {
        let citem = setup.clothes[clothes[i].item];
        let imgPath = `res/clothes/${citem.category}/${clothes[i].item.replace(/ /g, '_')}/`;
        let mainColor = null;
        if (clothes[i].subs['color'] || clothes[i].subs['color1']) {
            mainColor = setup.Paperdoll.colorConvert(clothes[i].subs['color']) || setup.Paperdoll.colorConvert(clothes[i].subs['color1']);
        }
        // main
        [bodyClothes, leftHandClothes, rightHandClothes] = setup.Paperdoll.clotheSubLayers(imgPath, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
        // configurations
        if (Object.keys(clothes[i].configs).length > 0) {
            for (let configName in clothes[i].configs) {
                [bodyClothes, leftHandClothes, rightHandClothes] = setup.Paperdoll.clotheSubLayers(`${imgPath}${configName.replace(/ /g, '_')}/${clothes[i].configs[configName].replace(/ /g, '_')}_`, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
                for (let subName in clothes[i].subs) {
                    if (subName === 'color' || subName === 'color1') {
                        continue;
                    } else {
                        if (subName.indexOf('color') !== -1) {
                            [bodyClothes, leftHandClothes, rightHandClothes] = setup.Paperdoll.clotheSubLayers(`${imgPath}${configName.replace(/ /g, '_')}/${clothes[i].configs[configName].replace(/ /g, '_')}_${subName}_`, setup.Paperdoll.colorConvert(clothes[i].subs[subName]), bodyClothes, leftHandClothes, rightHandClothes);
                        }
                    }
                }
            }
        }
        // sub
        for (let subName in clothes[i].subs) {
            if (subName === 'color' || subName === 'color1') {
                continue;
            } else {
                if (subName.indexOf('color') !== -1) {
                    [bodyClothes, leftHandClothes, rightHandClothes] = setup.Paperdoll.clotheSubLayers(`${imgPath}${subName}`, setup.Paperdoll.colorConvert(clothes[i].subs[subName]), bodyClothes, leftHandClothes, rightHandClothes);
                } else {
                    [bodyClothes, leftHandClothes, rightHandClothes] = setup.Paperdoll.clotheSubLayers(`${imgPath}${subName}/${clothes[i].subs[subName].replace(/ /g, '_')}_`, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
                }
            }
        }
    }
    return [bodyClothes, leftHandClothes, rightHandClothes];
}

setup.Paperdoll.paperdollPC = async function(canvas) {
    let p = new PaperDollSystem(canvas);

    // 加载人模
    await p.loadBaseModel('res/body/basenoarms.png');

    V.pc.get_clothingItems_classes();
    let clothes = V.pc.clothes;
    clothes.sort((a, b) => setup.clothes[a.item].layer - setup.clothes[b.item].layer);
    let leftHandClothes = [];
    let rightHandClothes = [];
    let bodyClothes = [];
    [bodyClothes, leftHandClothes, rightHandClothes] = setup.Paperdoll.clotheLayers(clothes, bodyClothes, leftHandClothes, rightHandClothes);
    // 开始图层加载
    // 后发
    await p.loadLayer(`res/hair/back/${V.pc['hair style'].replace(/ /g,'_')}/${V.pc['hair length'].replace(/ /g,'_')}.png`, setup.Paperdoll.colorConvert(V.pc['hair color']));
    // 身体(无手)
    await p.loadLayer('res/body/basenoarms.png');
    // 头
    await p.loadLayer('res/body/basehead.png');
    await p.loadLayer('res/face/face.png');
    // 眼睛
    await p.loadLayer('res/face/eyes.png', setup.Paperdoll.colorConvert(V.pc['eye color']));

    // 身体衣服
    for (let i = 0; i < bodyClothes.length; i++) {
        if (bodyClothes[i].color) await p.loadLayer(bodyClothes[i].path, bodyClothes[i].color);
        else await p.loadLayer(bodyClothes[i].path);
    }
    // 手
    await p.loadLayer('res/body/leftarm.png');

    if (V.pc.has_part("penis") && V.pc.is_part_visible('penis')) {
        await p.loadLayer(V.pc.virgin() ? `res/body/penis/penis_virgin${Math.floor(V.pc['penis size']/200)-2}.png` : `res/body/penis/penis${Math.floor(V.pc['penis size']/200)-2}.png`);
    } else if (V.pc.has_part("breasts") && V.pc.is_part_visible('nipples')) {
        await p.loadLayer(`res/body/breasts/breasts${Math.floor(V.pc['breast size']/200)}.png`)
    }

    // 左手衣服
    for (let i = 0; i < leftHandClothes.length; i++) {
        if (leftHandClothes[i].color) await p.loadLayer(leftHandClothes[i].path, leftHandClothes[i].color);
        else await p.loadLayer(leftHandClothes[i].path);
    }
    // 右手
    await p.loadLayer('res/body/rightarm.png');
    // 右手衣服
    for (let i = 0; i < rightHandClothes.length; i++) {
        if (rightHandClothes[i].color) await p.loadLayer(rightHandClothes[i].path, rightHandClothes[i].color);
        else await p.loadLayer(rightHandClothes[i].path);
    }

    // 前发
    await p.loadLayer(`res/hair/front/${V.pc['hair style'].replace(/ /g,'_')}/${V.pc['hair length'].replace(/ /g,'_')}.png`, setup.Paperdoll.colorConvert(V.pc['hair color']));

    function calculateScale(height) {
        if (height <= 0) return 0;

        if (height <= 64) {
            return (2.75 / 64) * height;
        } else if (height <= 256) {
            return 1.75 * (height - 64) / 192;
        } else {
            return 1.75 * (height - 256) / 192;
        }
    }
    canvas.style.transform = `scale(${calculateScale(p.canvas.height)})`;
    setTimeout(function() {
        console.log('All layers loaded');
        p.draw()
    }, 50);
    return p;
}