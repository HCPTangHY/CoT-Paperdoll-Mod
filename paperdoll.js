if (!("Paperdoll" in setup)) setup.Paperdoll = {};
// Paperdoll extension slots are declared here so TweeReplacer can insert @tag@ layer definitions without touching render code.
setup.Paperdoll.tagSlots = {

};
setup.Paperdoll.cache = {
    canvasCache: new Map(),
    maxCacheSize: 10, // 最大缓存数量

    // 生成缓存key
    generateKey: function(clothes, pc) {
        const relevantPCData = {
            penis: pc.has_part("penis"),
            skin: pc['skin color'],
            hair: pc['hair color'],
            eye: pc['eye color'],
            hairStyle: pc['hair style'],
            hairLength: pc['hair length'],
            breastSize: pc['breast size'],
            penisSize: pc['penis size'],
            dmarks: pc.distinguishing_marks,
        };
        return JSON.stringify({ clothes, pc: relevantPCData});
    },

    // 获取缓存
    get: function(key) {
        return this.canvasCache.get(key);
    },

    // 设置缓存
    set: function(key, canvas) {
        // 如果缓存已满，删除最早的缓存
        if (this.canvasCache.size >= this.maxCacheSize) {
            const firstKey = this.canvasCache.keys().next().value;
            this.canvasCache.delete(firstKey);
        }

        // 创建新的canvas并复制内容
        const cachedCanvas = document.createElement('canvas');
        cachedCanvas.width = canvas.width;
        cachedCanvas.height = canvas.height;
        const ctx = cachedCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0);

        this.canvasCache.set(key, cachedCanvas);
    }
};

setup.Paperdoll.clothesIndex = {
    // layer层数，order顺序（1：正序，-1：倒序）
    'outerwear': { layer: 10, order: 1 },
    'dresses': { layer: 5.5, order: 1 },
    'bodysuits': { layer: 4, order: 1 },
    'tops': { layer: 7, order: 1 },
    'bottoms': { layer: 5, order: 1 },
    'footwear': { layer: 4, order: 1 },
    'underwear': { layer: 1, order: 1 },
    'swimwear': { layer: 2, order: 1 },
    'accessories': { layer: 7.5, order: 1 },
    'masks': { layer: 8, order: 1 },
    'bags': { layer: 10, order: 1 },
    'other': { layer: 10, order: 1 },
    sortClothes: function(clothes) {
        let map = {};
        for (let i = 0; i < clothes.length; i++) {
            let citem = setup.clothes[clothes[i].item];
            if (citem.category in map) {
                map[citem.category].push(clothes[i]);
            } else {
                map[citem.category] = [clothes[i]];
            }
        }
        let result = [];
        for (let cat of Object.keys(map).sort((a, b) => setup.Paperdoll.clothesIndex[a].layer - setup.Paperdoll.clothesIndex[b].layer)) {
            let clothes = map[cat];
            let order = this[cat].order;
            if (order === 1) {
                clothes.sort((a, b) => setup.clothes[a.item].layer - setup.clothes[b.item].layer);
            } else {
                clothes.sort((a, b) => setup.clothes[b.item].layer - setup.clothes[a.item].layer);
            }
            result.push(...clothes);
        }
        return result;
    }
}

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

setup.Paperdoll.colorConvert = function(color, type = "") {
    let colorTable = setup.color_table;
    if (type == "clothe") { colorTable = setup.clothe_color_table }
    if (colorTable[color]) {
        return colorTable[color];
    } else {
        return color;
    }
}

// ClothesSlot centralizes the original clothing sub-layer expansion. It keeps the legacy path order,
// including the unchanged no-normalization behavior for imgPath, so existing image packs keep working.
class ClothesSlot {
    constructor(basePath, prefix = '') {
        // prefix='' -> full.png, full_gray.png, acc_full.png
        // prefix='laces_' -> laces_full_gray.png
        // prefix='@sleeve@_' -> @sleeve@_full_gray.png
        this.basePath = basePath;
        this.prefix = prefix;
    }

    static PARTS = [
        { key: 'full', queue: 'bodyClothes', hasAcc: true, hasMask: true },
        { key: 'left', queue: 'leftHandClothes', hasAcc: true, hasMask: false },
        { key: 'right', queue: 'rightHandClothes', hasAcc: true, hasMask: false },
        { key: 'back', queue: 'backClothes', hasAcc: false, hasMask: false },
    ];

    async pushAll(queues, color, paperdoll, opts = { acc: true, mask: true }) {
        for (const part of ClothesSlot.PARTS) {
            const name = `${this.basePath}${this.prefix}${part.key}`;
            if (await setup.Paperdoll.checkImgExists(`${name}_gray.png`)) {
                queues[part.queue].push({ path: `${name}_gray.png`, color: color });
            } else {
                queues[part.queue].push({ path: `${name}.png` });
            }
            if (opts.acc && part.hasAcc) {
                queues[part.queue].push({ path: `${this.basePath}${this.prefix}acc_${part.key}.png` });
            }
            if (opts.mask && part.hasMask) {
                if (await setup.Paperdoll.checkImgExists(`${this.basePath}${this.prefix}mask.png`)) {
                    await paperdoll.loadMask(`${this.basePath}${this.prefix}mask.png`, 'hair');
                }
                if (await setup.Paperdoll.checkImgExists(`${this.basePath}${this.prefix}clotheMask.png`)) {
                    await paperdoll.loadClotheMask(`${this.basePath}${this.prefix}clotheMask.png`, 'clothe');
                }
            }
        }
        return queues;
    }
}

// The class is exposed so image-pack extension scripts can reuse the same slot expansion logic.
setup.Paperdoll.ClothesSlot = ClothesSlot;

setup.Paperdoll.clotheDiffsLayer = async function(paperdoll, clothe, imgPath, mainColor, queues) {
    // clotheDiffsLayer now receives the grouped queues object, which avoids repeating four array
    // parameters while preserving the original per-layer push order and image path checks.
    for (const subName in clothe.subs) {
        const subValue = clothe.subs[subName].replace(/ /g, '_');

        // 1. 检查预渲染图层 (e.g., red_full.png) - 不染色
        const preRenderedPath = `${imgPath}${subValue}_`;
        if (await setup.Paperdoll.checkImgExists(`${preRenderedPath}full.png`) || await setup.Paperdoll.checkImgExists(`${preRenderedPath}left.png`) || await setup.Paperdoll.checkImgExists(`${preRenderedPath}right.png`)) {
            await new ClothesSlot(preRenderedPath).pushAll(queues, mainColor, paperdoll);
            continue;
        }

        // 2. 检查灰度模板 (e.g., laces_full_gray.png) - 染色
        const grayScalePath = `${imgPath}${subName}_`;
        if (await setup.Paperdoll.checkImgExists(`${grayScalePath}full_gray.png`) || await setup.Paperdoll.checkImgExists(`${grayScalePath}left_gray.png`) || await setup.Paperdoll.checkImgExists(`${grayScalePath}right_gray.png`)) {
            const color = setup.Paperdoll.colorConvert(clothe.subs[subName], "clothe");
            await new ClothesSlot(grayScalePath).pushAll(queues, color, paperdoll);
            continue;
        }

        // 3. 标准差分 (e.g., style/long_sleeve_full.png)
        const defaultPath = `${imgPath}${subName}/${subValue}_`;
        await new ClothesSlot(defaultPath).pushAll(queues, mainColor, paperdoll);
    }

    if (window.breastType) {
        await new ClothesSlot(`${imgPath}breast${window.breastType=="num"?Math.floor(V.pc['breast size']/200):""}_`).pushAll(queues, mainColor, paperdoll);
    }
    return queues;
}

setup.Paperdoll.clotheLayers = async function(paperdoll, clothes, bodyClothes, leftHandClothes, rightHandClothes, backClothes, content) {
    // The four clothing queues are grouped for ClothesSlot and @tag@ support, while the public return
    // value remains the original array tuple used by paperdollPC and existing callers.
    let queues = { bodyClothes, leftHandClothes, rightHandClothes, backClothes };
    content = content || queues;
    Object.assign(content, queues);

    window.breastType = null
    let breastType = []
    for (let i = 0; i < clothes.length; i++) {
        let citem = setup.clothes[clothes[i].item];
        if (citem.covers.indexOf("nipples") === -1) { continue }
        breastType.push(null);
        let imgPath = `res/paperdoll/clothes/${citem.category}/${clothes[i].item.replace(/ /g, '_')}/`;
        if (await setup.Paperdoll.checkSubsExists(`${imgPath}breast${Math.floor(V.pc['breast size']/200)}`)) {
            breastType[breastType.length-1] = "num"
        } else if (await setup.Paperdoll.checkSubsExists(`${imgPath}breast`)) {
            breastType[breastType.length-1] = "dafault"
        }
    }
    window.breastType = breastType.length > 0 ?
        breastType.every(type => type === breastType[0]) ? breastType[0] : null
        : null;
    // window.breastType = nowBreastType
    clothes = setup.Paperdoll.clothesIndex.sortClothes(clothes);
    for (let i = 0; i < clothes.length; i++) {
        let citem = setup.clothes[clothes[i].item];
        let imgPath = `res/paperdoll/clothes/${citem.category}/${clothes[i].item.replace(/ /g, '_')}/`;
        let mainColor = null;
        if (clothes[i].subs['color'] || clothes[i].subs['color1']) {
            mainColor = setup.Paperdoll.colorConvert(clothes[i].subs['color'], "clothe") || setup.Paperdoll.colorConvert(clothes[i].subs['color1'], "clothe");
        }
        // main
        await new ClothesSlot(imgPath).pushAll(queues, mainColor, paperdoll);
        // configurations
        if (Object.keys(clothes[i].configs).length > 0) {
            for (let configName in clothes[i].configs) {
                await new ClothesSlot(`${imgPath}${configName.replace(/ /g, '_')}/${clothes[i].configs[configName].replace(/ /g, '_')}_`).pushAll(queues, mainColor, paperdoll);
                await setup.Paperdoll.clotheDiffsLayer(paperdoll, clothes[i], `${imgPath}${configName.replace(/ /g, '_')}/`, mainColor, queues);
                if (configName === "hood" && clothes[i].configs[configName] === "up") {
                    window.hoodState = "up"
                }
            }
        }
        // sub
        await setup.Paperdoll.clotheDiffsLayer(paperdoll, clothes[i], imgPath, mainColor, queues);

        // @tag@ child layers are scanned after the base, config, and sub layers so each clothing item can
        // contribute optional overlay queues without changing the legacy queue return format.
        if (setup.Paperdoll._tagIndex) {
            const tags = setup.Paperdoll._tagIndex.get(imgPath);
            if (tags) {
                for (const tag of tags) {
                    const tagDef = setup.Paperdoll.tagSlots[tag];
                    if (!tagDef || tagDef.z == null) {
                        // 没声明 z → 推进原衣服的四个队列，跟主体同层
                        await new ClothesSlot(imgPath, `@${tag}@_`).pushAll(queues, mainColor, paperdoll, {acc:false, mask:false});
                    } else {
                        // 有 z → 推进独立 tag 队列，渲染到自定义层
                        const tagQueues = content[`_tag_${tag}`] || {bodyClothes:[], leftHandClothes:[], rightHandClothes:[], backClothes:[]};
                        await new ClothesSlot(imgPath, `@${tag}@_`).pushAll(tagQueues, mainColor, paperdoll, {acc:false, mask:false});
                        content[`_tag_${tag}`] = tagQueues;
                    }
                }
            }
        }
    }
    return [paperdoll, queues.bodyClothes, queues.leftHandClothes, queues.rightHandClothes, queues.backClothes];
}
setup.Paperdoll.layerBlendMode = {
    'clothes': 'hard-light',
    'hair': 'hard-light',
    'skin': 'multiply',
    'default': 'hard-light'
}
setup.Paperdoll.paperdollPC = async function(canvas) {
    // 自定义缩放大小
    const SCALE_SIZE = null;
    // 生成缓存key
    window.cacheKey = setup.Paperdoll.cache.generateKey(V.pc.clothes, V.pc);

    // 检查是否有缓存
    const cachedCanvas = setup.Paperdoll.cache.get(cacheKey);
    if (cachedCanvas) {
        console.log('Using cached paperdoll');
        const ctx = canvas.getContext('2d');
        canvas.width = cachedCanvas.width;
        canvas.height = cachedCanvas.height;
        ctx.drawImage(cachedCanvas, 0, 0);

        // 设置缩放
        function calculateScale(x) {
            if (x <= 400) return -4.5413062686002426e-8 * x * x * x + 0.000051298595610111764 * x * x - 0.018759300595236547 * x + 3.752380952380881
            else return (-0.000004481132075471626*x+1.4)/2
        }

        let scalebase = canvas.height>canvas.width?canvas.height:canvas.width
        canvas.style.transform = `scale(${SCALE_SIZE?SCALE_SIZE:calculateScale(scalebase)})`;
        if (scalebase <= 256) {
            canvas.style.imageRendering = "pixelated";
            canvas.style.imageRendering = "crisp-edges";
            canvas.style.msInterpolationMode = "nearest-neighbor";
        }
        return;
    }

    // 原有的渲染逻辑
    window.breastType = null;
    window.hoodState = "";

    let p = new PaperDollSystem(canvas);
    const baseURL = `res/paperdoll/`;
    // 加载人模
    await p.loadBaseModel(`${baseURL}body/basenoarms.png`);

    V.pc.get_clothingItems_classes();
    let clothes = V.pc.clothes;
    let leftHandClothes = [];
    let rightHandClothes = [];
    let bodyClothes = [];
    let backClothes = [];
    // content is created before clotheLayers so @tag@ queues discovered during clothing expansion can be
    // carried into the later dynamic layer registration step without changing the tuple return interface.
    let content = {p, baseURL, backClothes, leftHandClothes, rightHandClothes, bodyClothes};
    [p, bodyClothes, leftHandClothes, rightHandClothes, backClothes] = await setup.Paperdoll.clotheLayers(p, clothes, bodyClothes, leftHandClothes, rightHandClothes, backClothes, content);
    Object.assign(content, {p, baseURL, backClothes, leftHandClothes, rightHandClothes, bodyClothes});

    // 其他图层插入点
    // Object.assign(PCLayers, {xxxx});

    // 后景替换插入点
    let PCLayers = setup.Paperdoll.models.main.layer;

    // Registered @tag@ queues become render layers here, allowing image packs to place optional clothing
    // overlays at custom z values declared in setup.Paperdoll.tagSlots.
    for (const [tag, def] of Object.entries(setup.Paperdoll.tagSlots)) {
        const queueKey = `_tag_${tag}`;
        if (content[queueKey] && def.z != null) {
            PCLayers[`tagClothes_${tag}`] = {
                layer: def.z,
                load: async function(ctx) {
                    const items = ctx[queueKey];
                    if (!items) return;
                    for (const q of ['bodyClothes','leftHandClothes','rightHandClothes','backClothes']) {
                        for (const item of (items[q] || [])) {
                            if (item.color) await ctx.p.loadLayer(item.path, item.color, 'clothes');
                            else await ctx.p.loadLayer(item.path);
                        }
                    }
                }
            };
        }
    }

    const sortedLightingLayers = Object.entries(setup.Paperdoll.models.lighting.layer).sort(([, a], [, b]) => a.layer - b.layer);
    for (const [name, layerDef] of sortedLightingLayers) {
         console.log(`Loading lighting layer: ${name}`);
         await layerDef.load(content);
    }
    
    let layers = Object.keys(PCLayers).sort((a, b) => PCLayers[a].layer - PCLayers[b].layer);
    for (let layer of layers) {
        await PCLayers[layer].load(content);
    }

    // 前景替换插入点

    function calculateScale(x) {
        if (x <= 400) return -4.5413062686002426e-8 * x * x * x + 0.000051298595610111764 * x * x - 0.018759300595236547 * x + 3.752380952380881
        else return (-0.000004481132075471626*x+1.4)/2
    }

    setTimeout(() => {
        console.log('All layers loaded, caching result');
        // p.ctx.imageSmoothingEnabled = false;
        p.draw();

        let scalebase = p.canvas.height>p.canvas.width?p.canvas.height:p.canvas.width
        canvas.style.transform = `scale(${SCALE_SIZE?SCALE_SIZE:calculateScale(scalebase)})`;
        if (scalebase <= 256) {
            canvas.style.imageRendering = "pixelated";
            canvas.style.imageRendering = "crisp-edges";
            canvas.style.msInterpolationMode = "nearest-neighbor";
        }
        setup.Paperdoll.cache.set(cacheKey, p.canvas);
    }, 50);

    return p;
}

setup.Paperdoll.mirrorPC = function() {
    $("#paperdollMirror").height('85vh');
    $("#paperdollMirror").width('85vw');
    $("#paperdollMirror").css("display", "grid");
    $("#paperdollMirror").append(`<canvas id="paperdollPC-canvas-dialog"></canvas>`);
    (async function() {
        const cache = setup.Paperdoll.cache.generateKey(V.pc.clothes, V.pc);
        setup.Paperdoll.cache.canvasCache.delete(cache);
        const canvas = document.getElementById("paperdollPC-canvas-dialog");
        let paperdoll = await setup.Paperdoll.paperdollPC(canvas);
        setTimeout(() => {
            canvas.style.transform = "none";
            if ($("#paperdollMirror").height() > $("#paperdollMirror").width()) {
                canvas.style.width = $("#paperdollMirror").width();
                canvas.style.height = "auto";
            } else {
                canvas.style.height = $("#paperdollMirror").height()+"px";
                canvas.style.width = "auto";
            }
            $("#paperdollMirror").height(canvas.style.height);
            $("#paperdollMirror").width(canvas.style.width);
        }, 500);
    })();
}

let oldversion = false;
// 旧版兼容
for (let type of window.addonBeautySelectorAddon.getTypeOrder()) {
    let imgListRef = type.imgListRef;
    if (!imgListRef.get('res/paperdoll/body/basenoarms-f.png')){continue}
    imgListRef.forEach((v,k)=>{
        if((k||"").includes("-f/") || ((k||"").includes("-f."))) {
            window.addonBeautySelectorAddon.table.get(type.type).typeImg.get(type.type).set(k.replace("-f/","/").replace("-f.","."),v)
        }
    });
    oldversion = true;
}

if (oldversion) {
    window.modSweetAlert2Mod.fire({
        text: '旧版兼容已启动，可能在数个版本后移除，请及时更新美化包！ Old version compatibility has been started, and may be removed in several versions. Please update your beauty package as soon as possible!',
        icon: 'warning',
        confirmButtonText: '我知道了 I understand'
    });
}

if (window.addonBeautySelectorAddon.getTypeOrder().filter(x=>x.type=="PaperdollImagePackTemplate你的美化名字").length>0) {
    window.modSweetAlert2Mod.fire({
        title: '你正在使用非法美化Type! You are using an illegal beauty type!',
        text: "如果你是玩家，请立刻卸载名为 PaperdollImagePackTemplate改为你的美化名字 的模组。\n如果你是美化作者，请修改你的美化名字name栏位，type栏，imgDir栏为你自己的名字与路径！ \n\n If you are a player, please uninstall the mod named PaperdollImagePackTemplate. \n If you are a beauty author, please modify the name, type, and imgDir fields of your beauty to your own name and path!",
        icon: 'error',
        confirmButtonText: '我知道了 I understand'
    });
}