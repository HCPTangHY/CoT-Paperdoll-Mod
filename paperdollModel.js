if (!("Paperdoll" in setup)) setup.Paperdoll = {};

setup.Paperdoll.models = {};

// content = {p, baseURL, backClothes, leftHandClothes, rightHandClothes, bodyClothes}
setup.Paperdoll.models.main = {
    name:"main",
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
                    await content.p.loadLayer(`${content.baseURL}body/penis/penis${Math.floor(V.pc['penis size']/200)}${V.pc['penis type']=="uncircumcised"?"_uncircumcised":""}.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
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
    name:"shopMain",
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

setup.Paperdoll.models.lighting = {
    name: "lighting",

    options: {
        yOffset: 0.425,
        xOffset: 0,
        spotlight: {
            maxAlpha: 0.7,
            radiusX: 0.25,
            radiusY: 0.05,
        },
        glow: {
            maxAlpha: 0.6,
            radiusX: 0.215,
            radiusY: 0.39,
            yOffset: -0.32,
        },
        gradient: {
            enabled: true,
            height: 0.78,
            maxAlpha: 0.6,
        },
        flat: {
            enabled: true,
            maxAlpha: 0.6,
        },
        colors: {
            default: "#ffffff",
        },
    },

    layer: {
        "spotlight": {
            layer: 100,
            load: async function(content) {
                const options = setup.Paperdoll.models.lighting.options;
                const p = content.p;

                const lightCanvas = document.createElement('canvas');
                lightCanvas.width = p.canvas.width;
                lightCanvas.height = p.canvas.height;
                const ctx = lightCanvas.getContext('2d');

                const centerX = lightCanvas.width / 2;
                const centerY = lightCanvas.height / 2;

                const baseColor = lightBlendColor(options);

                drawRadialGradient(
                    ctx,
                    centerX,
                    centerY,
                    options.xOffset,
                    options.yOffset,
                    options.spotlight.radiusX,
                    options.spotlight.radiusY,
                    options.spotlight.maxAlpha,
                    0.2,
                    baseColor
                );
                p.layers.push(lightCanvas);
                // console.log("Lighting layer 'spotlight' added.");
            }
        },
        "glow": {
            layer: 110,
            load: async function(content) {
                const options = setup.Paperdoll.models.lighting.options;
                const p = content.p;

                const lightCanvas = document.createElement('canvas');
                lightCanvas.width = p.canvas.width;
                lightCanvas.height = p.canvas.height;
                const ctx = lightCanvas.getContext('2d');

                const centerX = lightCanvas.width / 2;
                const centerY = lightCanvas.height / 2;
                const baseColor = lightBlendColor(options);

                drawRadialGradient(
                    ctx,
                    centerX,
                    centerY,
                    options.xOffset,
                    options.yOffset + options.glow.yOffset,
                    options.glow.radiusX,
                    options.glow.radiusY,
                    options.glow.maxAlpha,
                    0.1,
                    baseColor
                );

                p.layers.push(lightCanvas);
                // console.log("Lighting layer 'glow' added.");
            }
        },
        "linearGradient": {
            layer: 120,
            load: async function(content) {
                const options = setup.Paperdoll.models.lighting.options;
                const p = content.p;

                const lightCanvas = document.createElement('canvas');
                lightCanvas.width = p.canvas.width;
                lightCanvas.height = p.canvas.height;
                const ctx = lightCanvas.getContext('2d');

                const baseColor = lightBlendColor(options);

                drawLinearGradient(
                    ctx,
                    options.gradient.maxAlpha,
                    0.1,
                    options.gradient.height,
                    baseColor
                );

                p.layers.push(lightCanvas);
                // console.log("Lighting layer 'linearGradient' added.");
            }
        },
        "flatColorOverlay": {
            layer: 130,
            load: async function(content) {
                const options =setup.Paperdoll.models.lighting.options;
                const p = content.p;

                const lightCanvas = document.createElement('canvas');
                lightCanvas.width = p.canvas.width;
                lightCanvas.height = p.canvas.height;
                const ctx = lightCanvas.getContext('2d');
                const baseColor = lightBlendColor(options);

                drawColorOverlay(
                    ctx,
                    baseColor, // 使用计算出的基色
                    options.flat.maxAlpha,
                    0
                );

                p.layers.push(lightCanvas);
                // console.log("Lighting layer 'flatColorOverlay' added.");
            }
        }
    }
};

function interpolateColor(color1, color2, factor) {
    const c1 = tinycolor(color1).toRgb();
    const c2 = tinycolor(color2).toRgb();
    const result = {
        r: Math.round(c1.r + factor * (c2.r - c1.r)),
        g: Math.round(c1.g + factor * (c2.g - c1.g)),
        b: Math.round(c1.b + factor * (c2.b - c1.b)),
        a: c1.a + factor * (c2.a - c1.a)
    };
    return tinycolor(result).toRgbString();
}

function drawRadialGradient(ctx, centerX, centerY, xOffset, yOffset, radiusX, radiusY, maxAlpha, intensity, baseColor = "#ffffff") {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    const pixelxOffset = xOffset * canvasWidth;
    const pixelyOffset = yOffset * canvasHeight;
    const pixelradiusX = Math.max(1, radiusX * canvasWidth); // 保证半径至少为 1
    const pixelradiusY = Math.max(1, radiusY * canvasHeight); // 保证半径至少为 1
    const alpha = intensity * maxAlpha;
    const color = tinycolor(baseColor).toRgb(); // 获取基色 RGB

    ctx.save();
    ctx.translate(centerX + pixelxOffset, centerY + pixelyOffset);
    ctx.scale(pixelradiusX / pixelradiusY, 1);
    const effectiveRadius = pixelradiusY;

    const gradient = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        effectiveRadius
    );

    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.33})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.imageSmoothingEnabled = true;

    const invScaleY = radiusY / radiusX;
    ctx.fillRect(- (centerX + xOffset) * invScaleY, - (centerY + yOffset), ctx.canvas.width * invScaleY, ctx.canvas.height);

    ctx.restore();
}

function drawLinearGradient(ctx, maxAlpha, intensity, height, baseColor = "#ffffff") {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    const pixelheight = Math.max(1, height * canvasHeight);
    const alpha = intensity * maxAlpha;
    const color = tinycolor(baseColor).toRgb();
    const gradient = ctx.createLinearGradient(0, 0, 0, pixelheight);

    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, pixelheight);
}

function drawColorOverlay(ctx, color, maxAlpha, intensity) {
    const baseRgba = tinycolor(color).toRgb();
    const finalAlpha = Math.min(1, Math.max(0, intensity * maxAlpha * baseRgba.a));
    const finalColor = `rgba(${baseRgba.r}, ${baseRgba.g}, ${baseRgba.b}, ${finalAlpha})`;

    ctx.fillStyle = finalColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function lightBlendColor(options) {
    const baseColor = options.colors.default;
    const factor = 0;
    return interpolateColor("#ffffff", baseColor, factor);
}