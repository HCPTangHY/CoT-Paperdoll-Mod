if (!("Paperdoll" in setup)) setup.Paperdoll = {};

setup.Paperdoll.models = {};

// content = {p, baseURL, backClothes, leftHandClothes, rightHandClothes, bodyClothes}
setup.Paperdoll.models.main = {
    name:"shopModel",
    layer: {
        "backClothes": {
            layer: -20,
            load: async function(content) {
                for (let i = 0; i < content.backClothes.length; i++) {
                    if (content.backClothes[i].color) await content.p.loadLayer(content.backClothes[i].path, content.backClothes[i].color, 'clothes');
                    else await content.p.loadLayer(content.backClothes[i].path);
                }
            }
        },
        // 后发
        "backhair": {
            layer: -10,
            load: async function(content) {
                let hairStyleID = V.pc['hair style'].replace(/ /g, '_');
                let hairLengthID = V.pc['hair length'].replace(/ /g, '_');
                let hairColor = setup.hair_color_table[V.pc['hair color']];
                let basePath = `${content.baseURL}hair/back/${hairStyleID}/${hairLengthID}.png`;
                if (window.hoodState === "up") { return }
                if (typeof hairColor === "string") {
                    await content.p.loadLayer(basePath, hairColor, 'hair');
                } else {
                    await content.p.processDualColorHair(
                        basePath,
                        `${content.baseURL}hair/back/${hairStyleID}/color2_${hairColor.type}.png`,
                        hairColor.color.color1,
                        hairColor.color.color2
                    );
                }
            }
        },
        // 身体(无手)
        "bodynoarms": {
            layer: 0,
            load: async function(content) {
                await content.p.loadLayer(`${content.baseURL}body/basenoarms.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
            }
        },
        // 头
        "head": {
            layer: 10,
            load: async function(content) {
                await content.p.loadLayer(`${content.baseURL}body/basehead.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
                let dmarkSlot = { "chin": null, "face": null, "eyebrows": null, "eyes": null, "lips": null, "nose": null };
                for (let dmark of V.pc.distinguishing_marks) {
                    let dmarkobj = setup.distinguishing_marks[dmark];
                    dmarkSlot[dmarkobj.slot] = dmark;
                }
                for (let i in dmarkSlot) {
                    if (dmarkSlot[i] && await setup.Paperdoll.checkImgExists(`${content.baseURL}face/dmark/${i}/${dmarkSlot[i].replace(/ /g, '_')}.png`)) {
                        if (i === "eyes") {
                            await content.p.loadLayer(`${content.baseURL}face/dmark/eyes/${dmarkSlot[i].replace(/ /g, '_')}.png`);
                            await content.p.loadLayer(`${content.baseURL}face/dmark/eyes/${dmarkSlot[i].replace(/ /g, '_')}_iris.png`, setup.eye_color_table[V.pc['eye color']]);
                            continue;
                        }
                        if (i === "eyebrows") {
                            await content.p.loadLayer(`${content.baseURL}face/dmark/${i}/${dmarkSlot[i].replace(/ /g, '_')}.png`, setup.hair_color_table[V.pc['hair color']]);
                        } else {
                            await content.p.loadLayer(`${content.baseURL}face/dmark/${i}/${dmarkSlot[i].replace(/ /g, '_')}.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
                        }
                    } else {
                        if (i === "eyes") {
                            await content.p.loadLayer(`${content.baseURL}face/baseeyes.png`);
                            await content.p.loadLayer(`${content.baseURL}face/baseiris.png`, setup.eye_color_table[V.pc['eye color']]);
                            continue;
                        }
                        if (i === "eyebrows") {
                            await content.p.loadLayer(`${content.baseURL}face/base${i}.png`, setup.hair_color_table[V.pc['hair color']]);
                        } else {
                            await content.p.loadLayer(`${content.baseURL}face/base${i}.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
                        }
                    }
                }
            }
        },
        // 左手
        "leftarm": {
            layer: 30,
            load: async function(content) {
                await content.p.loadLayer(`${content.baseURL}body/leftarm.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
            }
        },
        // 左手衣服层
        "leftHandClothes": {
            layer: 40,
            load: async function(content) {
                for (let i = 0; i < content.leftHandClothes.length; i++) {
                    if (content.leftHandClothes[i].color) await content.p.loadLayer(content.leftHandClothes[i].path, content.leftHandClothes[i].color, 'clothes');
                    else await content.p.loadLayer(content.leftHandClothes[i].path);
                }
            }
        },
        // 阴茎和乳房
        "penisbreasts": {
            layer: 50,
            load: async function(content) {
                if (V.pc.has_part("penis") && V.pc.is_part_visible('penis')) {
                    await content.p.loadLayer(V.pc.virgin() ? `${content.baseURL}body/penis/penis_virgin${Math.floor(V.pc['penis size']/200)-2}.png` : `${content.baseURL}body/penis/penis${Math.floor(V.pc['penis size']/200)}${V.pc['penis type']=="uncircumcised"?"_uncircumcised":""}.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
                }
                if (V.pc.has_part("breasts") && V.pc.is_part_visible('nipples')) {
                    await content.p.loadLayer(`${content.baseURL}body/breasts/breast${Math.floor(V.pc['breast size']/200)}.png`, setup.skin_color_table[V.pc['skin color']], 'skin')
                }
                if (window.breastType) {
                    await content.p.loadLayer(`${content.baseURL}body/breasts/breast${window.breastType=="num"?Math.floor(V.pc['breast size']/200):"3"}_clothed.png`, setup.skin_color_table[V.pc['skin color']], 'skin')
                }
            }
        },
        // 身体衣服层
        "bodyClothes": {
            layer: 60,
            load: async function(content) {
                for (let i = 0; i < content.bodyClothes.length; i++) {
                    if (content.bodyClothes[i].color) await content.p.loadLayer(content.bodyClothes[i].path, content.bodyClothes[i].color, 'clothes');
                    else await content.p.loadLayer(content.bodyClothes[i].path);
                }
            }
        },
        // 右手
        "rightarm": {
            layer: 70,
            load: async function(content) {
                await content.p.loadLayer(`${content.baseURL}body/rightarm.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
            }
        },
        // 右手衣服层
        "rightHandClothes": {
            layer: 80,
            load: async function(content) {
                for (let i = 0; i < content.rightHandClothes.length; i++) {
                    if (content.rightHandClothes[i].color) await content.p.loadLayer(content.rightHandClothes[i].path, content.rightHandClothes[i].color, 'clothes');
                    else await content.p.loadLayer(content.rightHandClothes[i].path);
                }
            }
        },
        // 侧发
        "sidehair": {
            layer: 85,
            load: async function(content) {
                let hairStyleID = V.pc['hair style'].replace(/ /g, '_');
                let hairLengthID = V.pc['hair length'].replace(/ /g, '_');
                let hairColor = setup.hair_color_table[V.pc['hair color']];
                let basePath = `${content.baseURL}hair/sides/${hairStyleID}/${hairLengthID}.png`;
                // if (window.hoodState === "up") { return }
                if (typeof hairColor === "string") {
                    await content.p.loadLayer(basePath, hairColor, 'hair');
                } else {
                    await content.p.processDualColorHair(
                        basePath,
                        `${content.baseURL}hair/sides/${hairStyleID}/color2_${hairColor.type}.png`,
                        hairColor.color.color1,
                        hairColor.color.color2
                    );
                }
            }
        },
        // 前发
        "fronthair": {
            layer: 90,
            load: async function(content) {
                let hairStyleID = V.pc['hair style'].replace(/ /g, '_');
                let hairLengthID = V.pc['hair length'].replace(/ /g, '_');
                let hairColor = setup.hair_color_table[V.pc['hair color']];
                let basePath = `${content.baseURL}hair/front/${hairStyleID}/${hairLengthID}.png`;
                if (await setup.Paperdoll.checkImgExists(basePath)) {
                    if (typeof hairColor === "string") {
                        await content.p.loadLayer(basePath, hairColor, 'hair');
                    } else {
                        await content.p.processDualColorHair(
                            basePath,
                            `${content.baseURL}hair/front/${hairStyleID}/color2_${hairColor.type}.png`,
                            hairColor.color.color1,
                            hairColor.color.color2
                        );
                    }
                } else {
                    if (typeof hairColor === "string") {
                        await content.p.loadLayer(`${content.baseURL}hair/front/default.png`, hairColor, 'hair');
                    } else {
                        await content.p.processDualColorHair(
                            `${content.baseURL}hair/front/default.png`,
                            `${content.baseURL}hair/front/default_color2_${hairColor.type}.png`,
                            hairColor.color.color1,
                            hairColor.color.color2
                        );
                    }
                }
            }
        }
    }
}

setup.Paperdoll.models.shop = {
    name:"main",
    layer: {
        // 衣服后背
        "backClothes": {
            layer: setup.Paperdoll.models.main.layer["backClothes"].layer,
            load: async function(content) {
                for (let i = 0; i < content.backClothes.length; i++) {
                    if (content.backClothes[i].color) await content.SMp.loadLayer(content.backClothes[i].path, content.backClothes[i].color, 'clothes');
                    else await content.SMp.loadLayer(content.backClothes[i].path);
                }
            }
        },
        // 身体(无手)
        "bodynoarms": {
            layer: setup.Paperdoll.models.main.layer["bodynoarms"].layer,
            load: async function(content) {
                await content.SMp.loadLayer(`${content.baseURL}body/basenoarms.png`, "#F5F5F5");
            }
        },
        // 头
        "head": {
            layer: setup.Paperdoll.models.main.layer["head"].layer,
            load: async function(content) {
                await content.SMp.loadLayer(`${content.baseURL}body/basehead.png`, "#F5F5F5");
            }
        },
        // 左手
        "leftarm": {
            layer: setup.Paperdoll.models.main.layer["leftarm"].layer,
            load: async function(content) {
                await content.SMp.loadLayer(`${content.baseURL}body/leftarm.png`, "#F5F5F5");
            }
        },
        // 左手衣服层
        "leftHandClothes": {
            layer: setup.Paperdoll.models.main.layer["leftHandClothes"].layer,
            load: async function(content) {
                for (let i = 0; i < content.leftHandClothes.length; i++) {
                    if (content.leftHandClothes[i].color) await content.SMp.loadLayer(content.leftHandClothes[i].path, content.leftHandClothes[i].color, 'clothes');
                    else await content.SMp.loadLayer(content.leftHandClothes[i].path);
                }
            }
        },
        // 身体衣服层
        "bodyClothes": {
            layer: setup.Paperdoll.models.main.layer["bodyClothes"].layer,
            load: async function(content) {
                for (let i = 0; i < content.bodyClothes.length; i++) {
                    if (content.bodyClothes[i].color) await content.SMp.loadLayer(content.bodyClothes[i].path, content.bodyClothes[i].color, 'clothes');
                    else await content.SMp.loadLayer(content.bodyClothes[i].path);
                }
            }
        },
        // 右手
        "rightarm": {
            layer: setup.Paperdoll.models.main.layer["rightarm"].layer,
            load: async function(content) {
                await content.SMp.loadLayer(`${content.baseURL}body/rightarm.png`, "#F5F5F5");
            }
        },
        // 右手衣服层
        "rightHandClothes": {
            layer: setup.Paperdoll.models.main.layer["rightHandClothes"].layer,
            load: async function(content) {
                for (let i = 0; i < content.rightHandClothes.length; i++) {
                    if (content.rightHandClothes[i].color) await content.SMp.loadLayer(content.rightHandClothes[i].path, content.rightHandClothes[i].color, 'clothes');
                    else await content.SMp.loadLayer(content.rightHandClothes[i].path);
                }
            }
        },
    }
}