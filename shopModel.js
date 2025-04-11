if (!("Paperdoll" in setup)) setup.Paperdoll = {};

setup.Paperdoll.shopModel = async function(canvas) {
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

    let ModelLayers = setup.Paperdoll.models.shop.layer;
    let content = {SMp, baseURL, backClothes, leftHandClothes, rightHandClothes, bodyClothes}
    let layers = Object.keys(ModelLayers).sort((a, b) => ModelLayers[a].layer - ModelLayers[b].layer);
    for (let layer of layers) {
        await ModelLayers[layer].load(content);
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