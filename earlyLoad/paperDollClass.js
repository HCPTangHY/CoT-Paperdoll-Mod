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
        }

        async init() {
            this.draw();
        }

        async loadBaseModel(src) {
            const img = new Image();
            img.src = await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src);
            img.onload = () => {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.baseModel = img;
            };
            console.log("Loading base model " + this.canvas.width)
        }

        async loadLayer(src, color = "", type = "") {
            const img = new Image();
            img.src = await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src);
            return new Promise((resolve) => {
                img.onload = () => {
                    console.log("Layer loaded " + src)
                    if (color === "") {
                        this.layers.push(img);
                    } else {
                        let mode = "hard-light";
                        if (type === "skin") {
                            mode = "multiply";
                        }
                        const desaturatedImg = this.desaturateImage(img);
                        const coloredLayer = this.colorLayer(type === "skin" ? img : desaturatedImg, color, mode);
                        if (type === "hair") {
                            this.layers.push(this.hairMaskDraw(coloredLayer));
                        } else {
                            this.layers.push(coloredLayer);
                        }
                    }
                };
                resolve(true);
            });
        }

        async loadHairMask(src) {
            const img = new Image();
            img.src = await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src);
            img.onload = () => {
                this.hairMaskUpdate(img);
                console.log('hair mask loaded')
            };
        }

        hairMaskUpdate(img) {
            let tempCanvas = document.createElement('canvas');
            let tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;

            if (this.hairMask === null) {
                this.hairMask = document.createElement('canvas');
                this.hairMask.width = img.width;
                this.hairMask.height = img.height;
                tempCtx.fillStyle = "#FFFFFF";
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            } else {
                tempCtx.drawImage(this.hairMask, 0, 0)
            }
            tempCtx.globalCompositeOperation = "destination-in";
            tempCtx.drawImage(img, 0, 0);
            console.log(tempCanvas.toDataURL('image/png', 1));

            this.hairMask.getContext('2d').drawImage(tempCanvas, 0, 0);
            console.log(this.hairMask.toDataURL('image/png', 1));
        }
        hairMaskDraw(img) {
            let tempCanvas = document.createElement('canvas');
            let tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;

            tempCtx.drawImage(img, 0, 0)
            tempCtx.globalCompositeOperation = "destination-in";
            if (this.hairMask !== null) {
                tempCtx.drawImage(this.hairMask, 0, 0);
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