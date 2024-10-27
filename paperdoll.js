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

setup.Paperdoll.checkImgExists = async function(src) {
    return Boolean(await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src));
}

setup.Paperdoll.checkSubsExists = async function(imgPath) {
    return await setup.Paperdoll.checkImgExists(`${imgPath}_full_gray.png`) || await setup.Paperdoll.checkImgExists(`${imgPath}_left_gray.png`) || await setup.Paperdoll.checkImgExists(`${imgPath}_right_gray.png`) || await setup.Paperdoll.checkImgExists(`${imgPath}_full.png`) || await setup.Paperdoll.checkImgExists(`${imgPath}_left.png`) || await setup.Paperdoll.checkImgExists(`${imgPath}_right.png`);
}

setup.Paperdoll.colorConvert = function(color) {
    if (setup.color_table[color]) {
        return setup.color_table[color];
    } else {
        return color;
    }
}

setup.Paperdoll.ifColorPush = async function(path, targetArray, color) {
    if (await setup.Paperdoll.checkImgExists(`${path}_gray.png`)) {
        targetArray.push({ "path": `${path}_gray.png`, "color": color });
    } else {
        targetArray.push({ "path": `${path}.png` });
    }
    return targetArray;
}

setup.Paperdoll.clotheBaseSubLayers = async function(imgPath, color, bodyClothes, leftHandClothes, rightHandClothes) {
    bodyClothes = await setup.Paperdoll.ifColorPush(`${imgPath}full`, bodyClothes, color);
    leftHandClothes = await setup.Paperdoll.ifColorPush(`${imgPath}left`, leftHandClothes, color);
    rightHandClothes = await setup.Paperdoll.ifColorPush(`${imgPath}right`, rightHandClothes, color);
    return [bodyClothes, leftHandClothes, rightHandClothes];
}

setup.Paperdoll.clotheSubLayers = async function(imgPath, color, bodyClothes, leftHandClothes, rightHandClothes) {
    [bodyClothes, leftHandClothes, rightHandClothes] = await setup.Paperdoll.clotheBaseSubLayers(imgPath, color, bodyClothes, leftHandClothes, rightHandClothes);
    console.log(typeof bodyClothes, typeof leftHandClothes, typeof rightHandClothes);
    bodyClothes.push({ "path": `${imgPath}acc_full.png` });
    leftHandClothes.push({ "path": `${imgPath}acc_left.png` });
    rightHandClothes.push({ "path": `${imgPath}acc_right.png` });
    return [bodyClothes, leftHandClothes, rightHandClothes];
}

setup.Paperdoll.clotheDiffsLayer = async function(clothe, imgPath, mainColor, bodyClothes, leftHandClothes, rightHandClothes) {
    for (let subName in clothe.subs) {
        if ((subName === 'color' || subName === 'color1') && (await setup.Paperdoll.checkImgExists(`${imgPath}${subName}_full_gray.png`) || await setup.Paperdoll.checkImgExists(`${imgPath}${subName}_left_gray.png`) || await setup.Paperdoll.checkImgExists(`${imgPath}${subName}_right_gray.png`))) {
            continue;
        } else {
            if ((subName.indexOf('color') !== -1 || subName == "laces") && (await setup.Paperdoll.checkImgExists(`${imgPath}${subName}_full_gray.png`) || await setup.Paperdoll.checkImgExists(`${imgPath}${subName}_left_gray.png`) || await setup.Paperdoll.checkImgExists(`${imgPath}${subName}_right_gray.png`))) {
                [bodyClothes, leftHandClothes, rightHandClothes] = await setup.Paperdoll.clotheSubLayers(`${imgPath}${subName}`, setup.Paperdoll.colorConvert(clothe.subs[subName]), bodyClothes, leftHandClothes, rightHandClothes);
            } else {
                [bodyClothes, leftHandClothes, rightHandClothes] = await setup.Paperdoll.clotheSubLayers(`${imgPath}${subName}/${clothe.subs[subName].replace(/ /g, '_')}_`, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
            }
        }
    }
    if (!V.pc.is_part_visible("breasts") && V.pc.outermost_covering('breasts').item == V.pc.innermost_covering('breasts').item && V.pc.outermost_covering('breasts').item == clothe.item) {
        if (await setup.Paperdoll.checkSubsExists(`${imgPath}breast${Math.floor(V.pc['breast size']/200)}`)) {
            [bodyClothes, leftHandClothes, rightHandClothes] = await setup.Paperdoll.clotheSubLayers(`${imgPath}breast${Math.floor(V.pc['breast size']/200)}_`, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
            window.breastType = "num"
        } else if (await setup.Paperdoll.checkSubsExists(`${imgPath}breast`)) {
            [bodyClothes, leftHandClothes, rightHandClothes] = await setup.Paperdoll.clotheSubLayers(`${imgPath}breast_`, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
            window.breastType = "dafault"
        }
    }
    return [bodyClothes, leftHandClothes, rightHandClothes];
}

setup.Paperdoll.clotheLayers = async function(paperdoll, clothes, bodyClothes, leftHandClothes, rightHandClothes) {
    for (let i = 0; i < clothes.length; i++) {
        let citem = setup.clothes[clothes[i].item];
        let imgPath = `res/paperdoll/clothes-${V.pc.has_part("penis")? "m" : "f"}/${citem.category}/${clothes[i].item.replace(/ /g, '_')}/`;
        let mainColor = null;
        if (clothes[i].subs['color'] || clothes[i].subs['color1']) {
            mainColor = setup.Paperdoll.colorConvert(clothes[i].subs['color']) || setup.Paperdoll.colorConvert(clothes[i].subs['color1']);
        }
        // main
        [bodyClothes, leftHandClothes, rightHandClothes] = await setup.Paperdoll.clotheSubLayers(imgPath, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
        // configurations
        if (Object.keys(clothes[i].configs).length > 0) {
            for (let configName in clothes[i].configs) {
                [bodyClothes, leftHandClothes, rightHandClothes] = await setup.Paperdoll.clotheSubLayers(`${imgPath}${configName.replace(/ /g, '_')}/${clothes[i].configs[configName].replace(/ /g, '_')}_`, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
                [bodyClothes, leftHandClothes, rightHandClothes] = await setup.Paperdoll.clotheDiffsLayer(clothes[i], `${imgPath}${configName.replace(/ /g, '_')}/`, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
                if (configName === "hood" && clothes[i].configs[configName] === "up") {
                    window.hoodState = "up"
                }
            }
        }
        // sub
        [bodyClothes, leftHandClothes, rightHandClothes] = await setup.Paperdoll.clotheDiffsLayer(clothes[i], imgPath, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
        if (await setup.Paperdoll.checkImgExists(`${imgPath}mask.png`)) {
            await paperdoll.loadHairMask(`${imgPath}mask.png`);
        }
    }
    return [paperdoll, bodyClothes, leftHandClothes, rightHandClothes];
}

setup.Paperdoll.paperdollPC = async function(canvas) {
    window.breastType = ""
    window.hoodState = ""
    let PCLayers = {
        // 后发
        "backhair": {
            layer: -10,
            load: async function() {
                if (window.hoodState === "up") { return }
                await p.loadLayer(`${baseURL}hair/back/${V.pc['hair style'].replace(/ /g, '_')}/${V.pc['hair length'].replace(/ /g, '_')}.png`, setup.hair_color_table[V.pc['hair color']], 'hair');
            }
        },
        // 身体(无手)
        "bodynoarms": {
            layer: 0,
            load: async function() {
                await p.loadLayer(`${baseURL}body/basenoarms-${V.pc.has_part("penis")? "m" : "f"}.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
            }
        },
        // 头
        "head": {
            layer: 10,
            load: async function() {
                await p.loadLayer(`${baseURL}body/basehead.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
                let dmarkSlot = { "chin": null, "face": null, "eyebrows": null, "eyes": null, "lips": null, "nose": null };
                for (let dmark of V.pc.distinguishing_marks) {
                    let dmarkobj = setup.distinguishing_marks[dmark];
                    dmarkSlot[dmarkobj.slot] = dmark;
                }
                for (let i in dmarkSlot) {
                    if (dmarkSlot[i] && await setup.Paperdoll.checkImgExists(`${baseURL}face/dmarks/${dmarkSlot[i].replace(/ /g, '_')}.png`)) {
                        if (i === "eyebrows") {
                            await p.loadLayer(`${baseURL}face/dmarks/${i}/${dmarkSlot[i].replace(/ /g, '_')}.png`, setup.hair_color_table[V.pc['hair color']]);
                        } else {
                            await p.loadLayer(`${baseURL}face/dmarks/${i}/${dmarkSlot[i].replace(/ /g, '_')}.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
                        }
                        if (i === "eyes") {
                            await p.loadLayer(`${baseURL}face/eyes/${i}/${dmarkSlot[i].replace(/ /g, '_')}_iris.png`, setup.eye_color_table[V.pc['eye color']]);
                        }
                    } else {
                        await p.loadLayer(`${baseURL}face/base${i}.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
                        if (i === "eyes") {
                            await p.loadLayer(`${baseURL}face/baseiris.png`, setup.eye_color_table[V.pc['eye color']]);
                        }
                    }
                }
            }
        },
        // 左手
        "leftarm": {
            layer: 30,
            load: async function() {
                await p.loadLayer(`${baseURL}body/leftarm.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
            }
        },
        // 左手衣服层
        "leftHandClothes": {
            layer: 40,
            load: async function() {
                let leftHandClothes = clotheMap.leftHandClothes || [];
                for (let i = 0; i < leftHandClothes.length; i++) {
                    if (leftHandClothes[i].color) await p.loadLayer(leftHandClothes[i].path, leftHandClothes[i].color);
                    else await p.loadLayer(leftHandClothes[i].path);
                }
            }
        },
        // 阴茎和乳房
        "penisbreasts": {
            layer: 50,
            load: async function() {
                if (V.pc.has_part("penis") && V.pc.is_part_visible('penis')) {
                    await p.loadLayer(V.pc.virgin() ? `${baseURL}body/penis/penis_virgin${Math.floor(V.pc['penis size']/200)-2}.png` : `${baseURL}body/penis/penis${Math.floor(V.pc['penis size']/200)}${V.pc['penis type']=="uncircumcised"?"_uncircumcised":""}.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
                } else if (V.pc.has_part("breasts") && V.pc.is_part_visible('nipples')) {
                    switch (window.breastType) {
                        case "num":
                            await p.loadLayer(`${baseURL}body/breasts/breast${Math.floor(V.pc['breast size']/200)}_clothed.png`, setup.skin_color_table[V.pc['skin color']], 'skin')
                        case "dafault":
                            await p.loadLayer(`${baseURL}body/breasts/breast3_clothed.png`, setup.skin_color_table[V.pc['skin color']], 'skin')
                        default:
                            await p.loadLayer(`${baseURL}body/breasts/breast${Math.floor(V.pc['breast size']/200)}.png`, setup.skin_color_table[V.pc['skin color']], 'skin')
                    }
                }
            }
        },
        // 身体衣服层
        "bodyClothes": {
            layer: 60,
            load: async function() {
                let bodyClothes = clotheMap.bodyClothes || [];
                for (let i = 0; i < bodyClothes.length; i++) {
                    if (bodyClothes[i].color) await p.loadLayer(bodyClothes[i].path, bodyClothes[i].color);
                    else await p.loadLayer(bodyClothes[i].path);
                }
            }
        },
        // 右手
        "rightarm": {
            layer: 70,
            load: async function() {
                await p.loadLayer(`${baseURL}body/rightarm.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
            }
        },
        // 右手衣服层
        "rightHandClothes": {
            layer: 80,
            load: async function() {
                let rightHandClothes = clotheMap.rightHandClothes || [];
                for (let i = 0; i < rightHandClothes.length; i++) {
                    if (rightHandClothes[i].color) await p.loadLayer(rightHandClothes[i].path, rightHandClothes[i].color);
                    else await p.loadLayer(rightHandClothes[i].path);
                }
            }
        },
        // 前发
        "fronthair": {
            layer: 90,
            load: async function() {
                let frontHair = V.pc['hair style'].replace(/ /g, '_') + '/' + V.pc['hair length'].replace(/ /g, '_') + '.png';
                if (await setup.Paperdoll.checkImgExists(`${baseURL}hair/front/${frontHair}`)) {
                    await p.loadLayer(`${baseURL}hair/front/${frontHair}`, setup.hair_color_table[V.pc['hair color']], 'hair');
                } else {
                    await p.loadLayer(`${baseURL}hair/front/default.png`, setup.hair_color_table[V.pc['hair color']], 'hair');
                }
            }
        }

    }
    let p = new PaperDollSystem(canvas);
    const baseURL = `res/paperdoll/`;
    // 加载人模
    await p.loadBaseModel(`${baseURL}body/basenoarms-${V.pc.has_part("penis")? "m" : "f"}.png`);

    V.pc.get_clothingItems_classes();
    let clothes = V.pc.clothes;
    clothes.sort((a, b) => setup.clothes[a.item].layer - setup.clothes[b.item].layer);
    let leftHandClothes = [];
    let rightHandClothes = [];
    let bodyClothes = [];
    [p, bodyClothes, leftHandClothes, rightHandClothes] = await setup.Paperdoll.clotheLayers(p, clothes, bodyClothes, leftHandClothes, rightHandClothes);

    const clotheMap = {
        "bodyClothes": bodyClothes,
        "leftHandClothes": leftHandClothes,
        "rightHandClothes": rightHandClothes
    }

    // 其他图层插入点
    // Object.assign(PCLayers, {xxxx});

    // 后景替换插入点

    let layers = Object.keys(PCLayers).sort((a, b) => PCLayers[a].layer - PCLayers[b].layer);
    for (let layer of layers) {
        await PCLayers[layer].load();
    }

    // 前景替换插入点

    function calculateScale(x) {
        if (x <= 400) return -4.5413062686002426e-8 * x * x * x + 0.000051298595610111764 * x * x - 0.018759300595236547 * x + 3.752380952380881
        else return -0.0002403846153846154 * x + 1.646153846153846
    }

    setTimeout(() => {
        console.log('All layers loaded');
        p.draw();
        canvas.style.transform = `scale(${calculateScale(p.canvas.height)})`;
    }, 50);

    return p;
}