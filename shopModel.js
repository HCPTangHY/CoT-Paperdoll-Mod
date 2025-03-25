if (!("Paperdoll" in setup)) setup.Paperdoll = {};

setup.Paperdoll.shopModel = async function(canvas) {
    let ModelLayers = {
        // 衣服后背
        "backClothes": {
            layer: -20,
            load: async function() {
                for (let i = 0; i < backClothes.length; i++) {
                    if (backClothes[i].color) await SMp.loadLayer(backClothes[i].path, backClothes[i].color, 'clothes');
                    else await SMp.loadLayer(backClothes[i].path);
                }
            }
        },
        // 身体(无手)
        "bodynoarms": {
            layer: 0,
            load: async function() {
                await SMp.loadLayer(`${baseURL}body/basenoarms.png`, "#F5F5F5");
            }
        },
        // 头
        "head": {
            layer: 10,
            load: async function() {
                await SMp.loadLayer(`${baseURL}body/basehead.png`, "#F5F5F5");
            }
        },
        // 左手
        "leftarm": {
            layer: 30,
            load: async function() {
                await SMp.loadLayer(`${baseURL}body/leftarm.png`, "#F5F5F5");
            }
        },
        // 左手衣服层
        "leftHandClothes": {
            layer: 40,
            load: async function() {
                for (let i = 0; i < leftHandClothes.length; i++) {
                    if (leftHandClothes[i].color) await SMp.loadLayer(leftHandClothes[i].path, leftHandClothes[i].color, 'clothes');
                    else await SMp.loadLayer(leftHandClothes[i].path);
                }
            }
        },
        // 身体衣服层
        "bodyClothes": {
            layer: 60,
            load: async function() {
                for (let i = 0; i < bodyClothes.length; i++) {
                    if (bodyClothes[i].color) await SMp.loadLayer(bodyClothes[i].path, bodyClothes[i].color, 'clothes');
                    else await SMp.loadLayer(bodyClothes[i].path);
                }
            }
        },
        // 右手
        "rightarm": {
            layer: 70,
            load: async function() {
                await SMp.loadLayer(`${baseURL}body/rightarm.png`, "#F5F5F5");
            }
        },
        // 右手衣服层
        "rightHandClothes": {
            layer: 80,
            load: async function() {
                for (let i = 0; i < rightHandClothes.length; i++) {
                    if (rightHandClothes[i].color) await SMp.loadLayer(rightHandClothes[i].path, rightHandClothes[i].color, 'clothes');
                    else await SMp.loadLayer(rightHandClothes[i].path);
                }
            }
        },

    }
    let SMp = new PaperDollSystem(canvas);
    const baseURL = `res/paperdoll/`;
    // 加载人模
    await SMp.loadBaseModel(`${baseURL}body/basenoarms.png`);

    let clothe = V.shopitem;
    clothe.subs = T.subs;
    clothe.configs = {};
    let clothes = [clothe];
    let leftHandClothes = [];
    let rightHandClothes = [];
    let bodyClothes = [];
    let backClothes = [];
    [SMp, bodyClothes, leftHandClothes, rightHandClothes, backClothes] = await setup.Paperdoll.clotheLayers(SMp, clothes, bodyClothes, leftHandClothes, rightHandClothes, backClothes);

    let layers = Object.keys(ModelLayers).sort((a, b) => ModelLayers[a].layer - ModelLayers[b].layer);
    for (let layer of layers) {
        await ModelLayers[layer].load();
    }

    setTimeout(() => {
        console.log('All layers loaded, caching result');
        // p.ctx.imageSmoothingEnabled = false;
        SMp.draw();
        if (SMp.canvas.width<200)canvas.style.transform = `scale(1)`;

        if (SMp.canvas.height <= 256) {
            canvas.style.imageRendering = "pixelated";
            canvas.style.imageRendering = "crisp-edges";
            canvas.style.msInterpolationMode = "nearest-neighbor";
        }
    }, 50);

    return SMp;
}