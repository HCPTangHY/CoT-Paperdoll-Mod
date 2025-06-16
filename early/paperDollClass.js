(async() => {
    class PaperDollSystem {
        // ... (constructor, init, loadBaseModel, loadLayer, loadMask, etc. as before) ...
        constructor(canvas) {
            if (typeof canvas === 'string') {
                this.canvas = document.getElementById(canvas);
            } else {
                this.canvas = canvas;
            }
            this.ctx = this.canvas.getContext('2d');
            this.layers = [];
            this.hairMask = null;
            this.clothesMask = null;
            this.baseModel = null;
        }

        async init() {
            this.draw();
        }

        async loadBaseModel(src) {
            src = await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src) || "";
            if (src === "") { return; }
            const img = new Image();
            img.src = src;
            await new Promise(resolve => { img.onload = resolve; });
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            this.baseModel = img;
            console.log("Loading base model " + this.canvas.width);
        }

        async loadLayer(src, color = "", type = "") {
            let base64 = await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src) || "";
            if (base64 === "") { return; }
            const img = new Image();
            img.src = base64;
            await new Promise(resolve => { img.onload = resolve; });

            console.log("Layer loaded " + src);
            let layerToAdd;
            let processedImage = img;

            if (color !== "") {
                let mode = setup.Paperdoll.layerBlendMode[type] || setup.Paperdoll.layerBlendMode['default'];
                const imageToColor = (type === "skin") ? processedImage : this.desaturateImage(processedImage);
                processedImage = this.colorLayer(imageToColor, color, mode);
            }
            layerToAdd = this.applyMask(processedImage, type);

            this.layers.push(layerToAdd);
        }

        async loadMask(src, type) {
            src = await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src) || "";
            if (src === "") { return; }
            const img = new Image();
            img.src = src;
            await new Promise(resolve => { img.onload = resolve; });
            this.updateMask(img, type);
            console.log(type + ' mask loaded and updated');
        }

        clipImageByIntersection(contentImage, maskingImage) {
            const resultCanvas = document.createElement('canvas');
            resultCanvas.width = this.canvas.width;
            resultCanvas.height = this.canvas.height;
            const ctx = resultCanvas.getContext('2d');

            ctx.drawImage(contentImage, 0, 0, resultCanvas.width, resultCanvas.height);
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(maskingImage, 0, 0, resultCanvas.width, resultCanvas.height);
            ctx.globalCompositeOperation = 'source-over';

            return resultCanvas;
        }

        async processDualColorHair(baseHairSrc, secondColorSrc, mainColor, secondColor) {
            // Step 1: Load images
            let baseHairBase64 = await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(baseHairSrc) || "";
            if (!baseHairBase64) return;
            const baseHairImg = new Image();
            baseHairImg.src = baseHairBase64;
            await new Promise(resolve => { baseHairImg.onload = resolve; });

            let secondColorBase64 = await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(secondColorSrc) || "";
            const secondColorImg = new Image();
            if (secondColorBase64) {
                secondColorImg.src = secondColorBase64;
                await new Promise(resolve => { secondColorImg.onload = resolve; });
            }

            // Step 2: Create colored layers in memory
            let processedBaseHair = this.desaturateImage(baseHairImg);
            processedBaseHair = this.colorLayer(processedBaseHair, mainColor, setup.Paperdoll.layerBlendMode['hair'] || setup.Paperdoll.layerBlendMode['default']);

            let processedSecondLayer = null;
            if (secondColorBase64) {
                const clippedSecondColorImg = this.clipImageByIntersection(secondColorImg, baseHairImg);
                let imageToColor = this.desaturateImage(clippedSecondColorImg);
                processedSecondLayer = this.colorLayer(
                    imageToColor,
                    secondColor,
                    setup.Paperdoll.layerBlendMode['hair'] || setup.Paperdoll.layerBlendMode['default']
                );
            }

            // Step 3: Merge layers onto a new temporary canvas
            const mergedCanvas = document.createElement('canvas');
            mergedCanvas.width = this.canvas.width;
            mergedCanvas.height = this.canvas.height;
            const ctx = mergedCanvas.getContext('2d');
            ctx.drawImage(processedBaseHair, 0, 0, mergedCanvas.width, mergedCanvas.height);
            if (processedSecondLayer) {
                ctx.drawImage(processedSecondLayer, 0, 0, mergedCanvas.width, mergedCanvas.height);
            }

            // Step 4: Chain apply the masks that are already on the instance.
            // DO NOT load any masks here. The function signature is now correct.
            let hairMaskedLayer = this.applyMask(mergedCanvas, 'hair');
            let finalLayer = this.applyMask(hairMaskedLayer, 'clothe');

            // Step 5: Push the final, single, fully-masked layer
            this.layers.push(finalLayer);
        }

        updateMask(img, type) {
            const width = this.canvas.width; // 使用画布尺寸统一处理
            const height = this.canvas.height;

            const existingMask = (type === "hair") ? this.hairMask : this.clothesMask;

            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = width;
            tempCanvas.height = height;

            if (existingMask) {
                tempCtx.drawImage(existingMask, 0, 0, width, height); // 绘制现有遮罩
                tempCtx.globalCompositeOperation = "destination-in"; // 求交集
                tempCtx.drawImage(img, 0, 0, width, height); // 绘制新遮罩部分
            } else {
                // 第一个遮罩，通常直接使用，或按需处理（如转为白色形状）
                // 为了保持与之前逻辑一致（交集），先填白再交集
                 tempCtx.fillStyle = "#FFFFFF";
                 tempCtx.fillRect(0, 0, width, height);
                 tempCtx.globalCompositeOperation = "destination-in";
                 tempCtx.drawImage(img, 0, 0, width, height);
                // 如果img本身就是白色形状+透明背景，可以直接绘制:
                // tempCtx.drawImage(img, 0, 0, width, height);
            }
             tempCtx.globalCompositeOperation = "source-over"; // Reset

            if (type === "hair") {
                this.hairMask = tempCanvas;
            } else if (type === "clothe") {
                this.clothesMask = tempCanvas;
            }
             // 考虑触发重绘或更新受影响的图层
             // this.draw();
        }

        applyMask(img, type) {
            let maskToUse = null;
            switch (type) {
                case "hair": maskToUse = this.hairMask; break;
                case "clothe": maskToUse = this.clothesMask; break;
            }

            if (!maskToUse || !(maskToUse instanceof HTMLCanvasElement)) {
                return img; // 没有可用遮罩，返回原图
            }
            if (!img || !(img instanceof HTMLImageElement || img instanceof HTMLCanvasElement)) {
                console.warn("applyMask received an invalid image:", img);
                return img;
            }

            let tempCanvas = document.createElement('canvas');
            let tempCtx = tempCanvas.getContext('2d');
            const width = this.canvas.width;
            const height = this.canvas.height;
            tempCanvas.width = width;
            tempCanvas.height = height;

            tempCtx.drawImage(img, 0, 0, width, height); // 绘制原图层
            tempCtx.globalCompositeOperation = "destination-in";
            tempCtx.drawImage(maskToUse, 0, 0, width, height); // 应用遮罩
            tempCtx.globalCompositeOperation = "source-over";

            return tempCanvas;
        }

        desaturateImage(img, params = [2, 1, 1, 1, 1]) {
             if (!img || !(img instanceof HTMLImageElement || img instanceof HTMLCanvasElement)) {
                console.error("desaturateImage received an invalid image:", img);
                return document.createElement('canvas');
            }
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true }); // 需要读像素
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;

            ctx.drawImage(img, 0, 0);
            try {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const [rf, gf, bf, sf, gamma] = params;
                const f = (rf + gf + bf === 0) ? 0 : sf / (rf + gf + bf);

                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] === 0) continue;

                    let r = data[i] / 255;
                    let g = data[i + 1] / 255;
                    let b = data[i + 2] / 255;

                    let value = 0;
                    if (f > 0 && gamma > 0) {
                         value = (rf * Math.pow(r, gamma) + gf * Math.pow(g, gamma) + bf * Math.pow(b, gamma));
                         // Check for NaN resulting from Math.pow(negative, non-integer) if needed, though RGB shouldn't be negative
                         if (isNaN(value)) value = 0;
                         value *= f;
                         value = Math.max(0, Math.min(1, value));
                         value = Math.round(value * 255);
                    } else if (f > 0) { // Handle gamma=0 or gamma=1 case simply
                        value = (rf * r + gf * g + bf * b) * f;
                        value = Math.max(0, Math.min(1, value));
                        value = Math.round(value * 255);
                    }

                    data[i] = value;
                    data[i + 1] = value;
                    data[i + 2] = value;
                }
                ctx.putImageData(imageData, 0, 0);
            } catch (e) {
                console.error("Error processing image data in desaturateImage:", e);
                 ctx.clearRect(0,0,canvas.width, canvas.height);
                 ctx.drawImage(img, 0, 0); // Return original as fallback
            }
            return canvas;
        }

        colorLayer(img, colorInput, mode, alpha = 1) {
            if (!img || !(img instanceof HTMLImageElement || img instanceof HTMLCanvasElement)) {
                console.error("colorLayer received an invalid image:", img);
                return document.createElement('canvas');
            }

            let colorCanvas = document.createElement('canvas');
            let colorCtx = colorCanvas.getContext('2d');
            colorCanvas.width = img.naturalWidth || img.width;
            colorCanvas.height = img.naturalHeight || img.height;

            if (Array.isArray(colorInput) && colorInput.length > 0) {
                if (colorInput.length === 1) {
                    colorCtx.fillStyle = colorInput[0];
                    colorCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
                } else {
                    const gradient = colorCtx.createLinearGradient(0, 0, 0, colorCanvas.height);
                    const numStops = colorInput.length;
                    for (let i = 0; i < numStops; i++) {
                        const offset = (numStops <= 1) ? 0 : i / (numStops - 1);
                        gradient.addColorStop(offset, colorInput[i]);
                    }
                    colorCtx.fillStyle = gradient;
                    colorCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
                }
            } else if (typeof colorInput === 'string' && colorInput !== '') {
                colorCtx.fillStyle = colorInput;
                colorCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
            }

            colorCtx.globalCompositeOperation = 'destination-in';
            colorCtx.drawImage(img, 0, 0);

            let tempCanvas = document.createElement('canvas');
            let tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = colorCanvas.width;
            tempCanvas.height = colorCanvas.height;

            tempCtx.drawImage(colorCanvas, 0, 0);

            tempCtx.globalCompositeOperation = mode;
            tempCtx.drawImage(img, 0, 0);

            return tempCanvas;
        }

        draw() {
            if (!this.canvas || !this.ctx) {
                console.error("Canvas or context not initialized for drawing.");
                return;
            }
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.baseModel) {
                 this.ctx.drawImage(this.baseModel, 0, 0, this.canvas.width, this.canvas.height);
            }
            for (const layer of this.layers) {
                if (layer && (layer instanceof HTMLImageElement || layer instanceof HTMLCanvasElement)) {
                     this.ctx.drawImage(layer, 0, 0, this.canvas.width, this.canvas.height);
                } else {
                    console.warn("Skipping invalid layer during draw:", layer);
                }
            }
        }

    }
    window.PaperDollSystem = PaperDollSystem;
})();