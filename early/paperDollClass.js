(async() => {
    class PaperDollSystem {
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
        }

        async init() {
            this.draw();
        }

        async loadBaseModel(src) {
            src = await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src) || "";
            if (src === "") { return; }
            const img = new Image();
            img.src = src;
            img.onload = () => {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.baseModel = img;
            };
            console.log("Loading base model " + this.canvas.width)
        }

        async loadLayer(src, color = "", type = "") {
            let base64 = await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src) || "";
            if (src === "") { return; }
            const img = new Image();
            img.src = base64;
            return new Promise((resolve) => {
                img.onload = () => {
                    console.log("Layer loaded " + src)
                    if (color === "") {
                        this.layers.push(img);
                    } else {
                        let mode = "";
                        switch (type) {
                            case "":
                                mode = setup.Paperdoll.layerBlendMode['default'];
                                break;
                            default:
                                mode = setup.Paperdoll.layerBlendMode[type]
                        }
                        const desaturatedImg = this.desaturateImage(img);
                        const coloredLayer = this.colorLayer(type === "skin" ? img : desaturatedImg, color, mode);
                        this.layers.push(this.maskDraw(coloredLayer,type));
                    }
                };
                resolve(true);
            });
        }

        async loadMask(src,type) {
            src = await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src) || "";
            if (src === "") { return; }
            const img = new Image();
            img.src = src;
            img.onload = () => {
                this.maskUpdate(img,type);
                console.log('hair mask loaded')
            };
        }

        maskUpdate(img, type) {
            let tempCanvas = document.createElement('canvas');
            let tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
        
            switch (type) {
                case "hair":
                    if (this.hairMask === null) {
                        // 第一次创建 mask
                        this.hairMask = document.createElement('canvas');
                        this.hairMask.width = img.width;
                        this.hairMask.height = img.height;
                        let hairCtx = this.hairMask.getContext('2d');
                        // 初始填充白色
                        hairCtx.fillStyle = "#FFFFFF";
                        hairCtx.fillRect(0, 0, this.hairMask.width, this.hairMask.height);
                    }
                    
                    // 在临时画布上绘制现有的 mask
                    tempCtx.drawImage(this.hairMask, 0, 0);
                    // 与新的 mask 进行交集操作
                    tempCtx.globalCompositeOperation = "destination-in";
                    tempCtx.drawImage(img, 0, 0);
                    
                    // 更新 hairMask
                    let hairCtx = this.hairMask.getContext('2d');
                    hairCtx.clearRect(0, 0, this.hairMask.width, this.hairMask.height);
                    hairCtx.drawImage(tempCanvas, 0, 0);
                    break;
        
                case "clothe":
                    if (this.clothesMask === null) {
                        // 第一次创建 mask
                        this.clothesMask = document.createElement('canvas');
                        this.clothesMask.width = img.width;
                        this.clothesMask.height = img.height;
                        let clotheCtx = this.clothesMask.getContext('2d');
                        // 初始填充白色
                        clotheCtx.fillStyle = "#FFFFFF";
                        clotheCtx.fillRect(0, 0, this.clothesMask.width, this.clothesMask.height);
                    }
                    
                    // 在临时画布上绘制现有的 mask
                    tempCtx.drawImage(this.clothesMask, 0, 0);
                    // 与新的 mask 进行交集操作
                    tempCtx.globalCompositeOperation = "destination-in";
                    tempCtx.drawImage(img, 0, 0);
                    
                    // 更新 clothesMask
                    let clotheCtx = this.clothesMask.getContext('2d');
                    clotheCtx.clearRect(0, 0, this.clothesMask.width, this.clothesMask.height);
                    clotheCtx.drawImage(tempCanvas, 0, 0);
                    break;
            }
        }        
        maskDraw(img,type) {
            let tempCanvas = document.createElement('canvas');
            let tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;

            tempCtx.drawImage(img, 0, 0)
            tempCtx.globalCompositeOperation = "destination-in";
            switch (type) {
                case "hair":
                    if (this.hairMask !== null) {
                        tempCtx.drawImage(this.hairMask, 0, 0);
                    }
                    break;
                case "clothe":
                    if (this.clothesMask !== null) {
                        tempCtx.drawImage(this.clothesMask, 0, 0);
                    }
                    break;
            }
            return tempCanvas;
        }

        desaturateImage(img, params = [2, 1, 1, 1, 1]) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            const [rf, gf, bf, sf, gamma] = params;
            const f = sf / (rf + gf + bf);

            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] === 0) continue;

                let r = data[i] / 255;
                let g = data[i + 1] / 255;
                let b = data[i + 2] / 255;

                let value = (rf * Math.pow(r, gamma) + gf * Math.pow(g, gamma) + bf * Math.pow(b, gamma)) * f;
                value = Math.max(0, Math.min(255, Math.round(value * 255)));

                data[i] = value;
                data[i + 1] = value;
                data[i + 2] = value;
            }

            ctx.putImageData(imageData, 0, 0);
            return canvas;
        }

        colorLayer(img, hexColor, mode, alpha = 1) {
            let tempCanvas = document.createElement('canvas');
            let tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;

            const colorCanvas = document.createElement('canvas');
            const colorCtx = colorCanvas.getContext('2d');
            colorCanvas.width = img.width;
            colorCanvas.height = img.height;

            colorCtx.globalCompositeOperation = 'source-over';
            colorCtx.fillStyle = hexColor;
            colorCtx.globalAlpha = alpha;
            colorCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

            colorCtx.globalCompositeOperation = 'destination-in';
            colorCtx.drawImage(img, 0, 0);

            tempCtx.drawImage(colorCanvas, 0, 0);
            tempCtx.globalCompositeOperation = mode;
            tempCtx.drawImage(img, 0, 0);

            return tempCanvas;
        }

        draw() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            for (const layer of this.layers) {
                this.ctx.drawImage(layer, 0, 0);
            }
        }

    }
    window.PaperDollSystem = PaperDollSystem;
})();