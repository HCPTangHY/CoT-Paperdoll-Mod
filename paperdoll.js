if (!("Paperdoll" in setup)) setup.Paperdoll = {};
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

setup.Paperdoll.clotheSubLayers = async function(paperdoll, imgPath, color, bodyClothes, leftHandClothes, rightHandClothes,backClothes) {
    [bodyClothes, leftHandClothes, rightHandClothes] = await setup.Paperdoll.clotheBaseSubLayers(imgPath, color, bodyClothes, leftHandClothes, rightHandClothes);
    if (imgPath.charAt(imgPath.length - 1) !== '/') { imgPath.slice(0,-1); }
    bodyClothes.push({ "path": `${imgPath}acc_full.png` });
    leftHandClothes.push({ "path": `${imgPath}acc_left.png` });
    rightHandClothes.push({ "path": `${imgPath}acc_right.png` });
    if (await setup.Paperdoll.checkImgExists(`${imgPath}mask.png`)) {
        await paperdoll.loadMask(`${imgPath}mask.png`,'hair');
    }
    if (await setup.Paperdoll.checkImgExists(`${imgPath}clotheMask.png`)) {
        await paperdoll.loadClotheMask(`${imgPath}clotheMask.png`,'clothe');
    }
    backClothes = await setup.Paperdoll.ifColorPush(`${imgPath}back`, backClothes, color);
    return [bodyClothes, leftHandClothes, rightHandClothes,backClothes];
}

setup.Paperdoll.clotheDiffsLayer = async function(paperdoll, clothe, imgPath, mainColor, bodyClothes, leftHandClothes, rightHandClothes, backClothes) {
    for (let subName in clothe.subs) {
        if (subName === 'color' || subName === 'color1') {
            continue;
        }

        const subValue = clothe.subs[subName].replace(/ /g, '_');
        const variantPath = `${imgPath}${subName}/${subValue}_`;
        const tintablePath = `${imgPath}${subName}_`;

        // 首先，检查一个特定的变体是否存在于子文件夹中（例如，"laces/red_full.png"）。
        // 这可以是一个预着色的图像或一个不可着色的设计。
        if (await setup.Paperdoll.checkSubsExists(variantPath)) {
            [bodyClothes, leftHandClothes, rightHandClothes, backClothes] = await setup.Paperdoll.clotheSubLayers(paperdoll, variantPath, mainColor, bodyClothes, leftHandClothes, rightHandClothes, backClothes);
        }
        // 如果没有，则检查一个通用的可着色图层（例如，"laces_full_gray.png"）。
        else if (await setup.Paperdoll.checkSubsExists(tintablePath)) {
            const tintColor = setup.Paperdoll.colorConvert(clothe.subs[subName], "clothe");
            [bodyClothes, leftHandClothes, rightHandClothes, backClothes] = await setup.Paperdoll.clotheSubLayers(paperdoll, tintablePath, tintColor, bodyClothes, leftHandClothes, rightHandClothes, backClothes);
        }
    }

    if (window.breastType) {
        [bodyClothes, leftHandClothes, rightHandClothes, backClothes] = await setup.Paperdoll.clotheSubLayers(paperdoll, `${imgPath}breast${window.breastType=="num"?Math.floor(V.pc['breast size']/200):""}_`, mainColor, bodyClothes, leftHandClothes, rightHandClothes, backClothes);
    }
    return [bodyClothes, leftHandClothes, rightHandClothes, backClothes];
}

setup.Paperdoll.clotheLayers = async function(paperdoll, clothes, bodyClothes, leftHandClothes, rightHandClothes, backClothes) {
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
        [bodyClothes, leftHandClothes, rightHandClothes] = await setup.Paperdoll.clotheSubLayers(paperdoll,imgPath, mainColor, bodyClothes, leftHandClothes, rightHandClothes,backClothes);
        // configurations
        if (Object.keys(clothes[i].configs).length > 0) {
            for (let configName in clothes[i].configs) {
                [bodyClothes, leftHandClothes, rightHandClothes, backClothes] = await setup.Paperdoll.clotheSubLayers(paperdoll, `${imgPath}${configName.replace(/ /g, '_')}/${clothes[i].configs[configName].replace(/ /g, '_')}_`, mainColor, bodyClothes, leftHandClothes, rightHandClothes, backClothes);
                [bodyClothes, leftHandClothes, rightHandClothes, backClothes] = await setup.Paperdoll.clotheDiffsLayer(paperdoll, clothes[i], `${imgPath}${configName.replace(/ /g, '_')}/`, mainColor, bodyClothes, leftHandClothes, rightHandClothes, backClothes);
                if (configName === "hood" && clothes[i].configs[configName] === "up") {
                    window.hoodState = "up"
                }
            }
        }
        // sub
        [bodyClothes, leftHandClothes, rightHandClothes, backClothes] = await setup.Paperdoll.clotheDiffsLayer(paperdoll, clothes[i], imgPath, mainColor, bodyClothes, leftHandClothes, rightHandClothes, backClothes);
    }
    return [paperdoll, bodyClothes, leftHandClothes, rightHandClothes, backClothes];
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
            else return -0.000004481132075471626*x+1.504588679245283
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
    [p, bodyClothes, leftHandClothes, rightHandClothes, backClothes] = await setup.Paperdoll.clotheLayers(p, clothes, bodyClothes, leftHandClothes, rightHandClothes, backClothes);

    // 其他图层插入点
    // Object.assign(PCLayers, {xxxx});

    // 后景替换插入点
    let PCLayers = setup.Paperdoll.models.main.layer;
    let content = {p, baseURL, backClothes, leftHandClothes, rightHandClothes, bodyClothes};

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
        else return -0.000004481132075471626*x+1.504588679245283
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