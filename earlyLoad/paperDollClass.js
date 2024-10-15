(async() => {
    class PaperDollSystem {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            this.ctx = this.canvas.getContext('2d');
            this.layers = [];
        }

        async init() {
            // await this.loadBaseModel('basemodel.png');
            // await this.loadClothing('lo.png', '#00FF00');
            // await this.loadClothing('up.png', '#FF0000');

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
            img.onload = () => {
                if (color === "") {
                    this.layers.push(img);
                } else {
                    const desaturatedImg = this.desaturateImage(img, 1); // 0.8 表示 80% 的去饱和度
                    const coloredLayer = this.colorLayer(desaturatedImg, color);
                    this.layers.push(coloredLayer);
                }
            };
            img.src = await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src);
        }

        desaturateImage(img, amount = 1) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // 计算亮度（使用人眼感知权重）
                const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;

                // 应用去饱和度
                data[i] = r + amount * (gray - r);
                data[i + 1] = g + amount * (gray - g);
                data[i + 2] = b + amount * (gray - b);
                // Alpha 通道保持不变
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
            this.ctx.drawImage(this.baseModel, 0, 0);

            for (const layer of this.layers) {
                this.ctx.drawImage(layer, 0, 0);
            }
        }
    }
    window.PaperDollSystem = PaperDollSystem;
})();