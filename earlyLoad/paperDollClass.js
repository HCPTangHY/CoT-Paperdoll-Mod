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
        }

        async init() {
            this.draw();
        }

        async loadBaseModel(src) {
            const img = new Image();
            img.onload = () => {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.baseModel = img;
            };
            img.src = await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src);
        }

        async loadLayer(src, color = "") {
            const img = new Image();
            img.src = await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src);
            return new Promise((resolve) => {
                img.onload = () => {
                    console.log("Layer loaded" + src)
                    if (color === "") {
                        this.layers.push(img);
                    } else {
                        const desaturatedImg = this.desaturateImage(img);
                        const coloredLayer = this.colorLayer(desaturatedImg, color);
                        this.layers.push(coloredLayer);
                    }
                };
                resolve(true);
            });
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

        colorLayer(img, hexColor) {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;

            tempCtx.drawImage(img, 0, 0);
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;

            const r = parseInt(hexColor.substr(1, 2), 16);
            const g = parseInt(hexColor.substr(3, 2), 16);
            const b = parseInt(hexColor.substr(5, 2), 16);

            for (let i = 0; i < data.length; i += 4) {
                const gray = data[i]; // Assuming grayscale, we only need one channel
                data[i] = (gray / 255) * r;
                data[i + 1] = (gray / 255) * g;
                data[i + 2] = (gray / 255) * b;
                // Alpha channel remains unchanged
            }

            tempCtx.putImageData(imageData, 0, 0);
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