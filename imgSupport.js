if (!("Paperdoll" in setup)) setup.Paperdoll = {};

// These indexes are built once at startup so rendering can check WebP, directories, and @tag@ slots
// without repeatedly scanning every registered image path.
// 1. WebP 路径集合
const webpPaths = new Set();
// 2. 目录索引: Map<dir, Set<filename>>
const dirIndex = new Map();
// 3. Tag 索引: Map<dir, Set<tagName>>
const tagIndex = new Map();

// @tag@ 文件名正则
const tagRegex = /^@([^@]+)@_/;

try {
    const typeOrder = window.addonBeautySelectorAddon.getTypeOrder();
    for (const item of typeOrder) {
        if (!item.imgListRef) continue;
        for (const path of item.imgListRef.keys()) {
            // webp
            if (path.endsWith('.webp')) {
                webpPaths.add(path);
            }
            // dir index
            const lastSlash = path.lastIndexOf('/');
            if (lastSlash >= 0) {
                const dir = path.substring(0, lastSlash + 1);
                const file = path.substring(lastSlash + 1);
                if (!dirIndex.has(dir)) dirIndex.set(dir, new Set());
                dirIndex.get(dir).add(file);
                // tag detection
                const match = file.match(tagRegex);
                if (match) {
                    if (!tagIndex.has(dir)) tagIndex.set(dir, new Set());
                    tagIndex.get(dir).add(match[1]);
                }
            }
        }
    }
} catch (e) {
    console.warn('[Paperdoll imgSupport] Failed to scan registered paths:', e);
}

// WebP hook
if (webpPaths.size > 0) {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = testCanvas.height = 1;
    if (testCanvas.toDataURL('image/webp').startsWith('data:image/webp')) {
        try {
            const hookObj = window.modUtils.pSC2DataManager.getHtmlTagSrcHook();
            const originalFn = hookObj.requestImageBySrc.bind(hookObj);
            hookObj.requestImageBySrc = function (src) {
                // PNG requests are redirected only when the matching registered WebP path exists,
                // preserving the old PNG behavior for packs that have not converted an image.
                if (typeof src === 'string' && src.endsWith('.png')) {
                    const webpSrc = src.slice(0, -4) + '.webp';
                    if (webpPaths.has(webpSrc)) src = webpSrc;
                }
                return originalFn(src);
            };
            console.log(`[Paperdoll imgSupport] WebP enabled — ${webpPaths.size} images indexed`);
        } catch (e) {
            console.warn('[Paperdoll imgSupport] Failed to hook WebP:', e);
        }
    }
}

// Expose
setup.Paperdoll._webpPaths = webpPaths;
setup.Paperdoll._dirIndex = dirIndex;
setup.Paperdoll._tagIndex = tagIndex;

console.log(`[Paperdoll imgSupport] Indexed ${dirIndex.size} dirs, ${tagIndex.size} dirs with @tags@`);

