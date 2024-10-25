(async () => {
    // https://developer.mozilla.org/en-US/docs/Glossary/Base64
    // https://developer.mozilla.org/zh-CN/docs/Glossary/Base64
    // function b64EncodeUnicode(str: string) {
    //     return btoa(encodeURIComponent(str));
    // }
    //
    // function UnicodeDecodeB64(str: string) {
    //     return decodeURIComponent(atob(str));
    // }
    const utf8_to_b64 = (str) => {
        return window.btoa(unescape(encodeURIComponent(str)));
    };
    const b64_to_utf8 = (str) => {
        return decodeURIComponent(escape(window.atob(str)));
    };
    const calcRef = (modName) => {
        if (typeof modName !== 'string') {
            console.error('calcRef modName is not string', modName);
            throw new Error('calcRef modName is not string');
        }
        return utf8_to_b64(modName);
        // return b64EncodeUnicode(nodeName);
    };
    const setRef = (modName, ref) => {
        window.modSimpleCryptWrapperRefList = window.modSimpleCryptWrapperRefList || new Map();
        const refName = calcRef(modName);
        const refItem = window.modSimpleCryptWrapperRefList.get(refName);
        if (refItem) {
            console.warn('setRef() duplicate refName, will overwrite. ', [modName, refName, ref, refItem]);
        }
        window.modSimpleCryptWrapperRefList.set(refName, ref);
    };
    const getRef = (modName) => {
        var _a;
        const refName = calcRef(modName);
        return (_a = window.modSimpleCryptWrapperRefList) === null || _a === void 0 ? void 0 : _a.get(refName);
    };
    // ================================ import '../../src/CalcRef';
    // console.warn('SimpleCryptWrapper earlyload done', window.modUtils.getNowRunningModName());
    // window.modUtils.getLogger().warn(`SimpleCryptWrapper earlyload done ${window.modUtils.getNowRunningModName()}`);
    // await window.modSimpleCryptWrapper.decrypt();
    const logger = window.modUtils.getLogger();
    const modName = window.modUtils.getNowRunningModName();
    if (!modName) {
        console.error('[SimpleCryptWrapper] earlyload cannot get NowRunningModName');
        logger.error('[SimpleCryptWrapper] earlyload cannot get NowRunningModName');
        return;
    }
    const ref = getRef(modName);
    if (!ref) {
        console.error('[SimpleCryptWrapper] earlyload cannot get ref', [modName]);
        logger.error(`[SimpleCryptWrapper] earlyload cannot get ref [${modName}]`);
        return;
    }
    await ref.decrypt();
})();
//# sourceMappingURL=earlyload.js.map