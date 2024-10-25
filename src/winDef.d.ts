import type { ISetupClothes } from "./scriptFileList/utils/paperdoll.util.ts";
import type { PaperDollSystem } from "./scriptFileList/utils/paperDollClass.ts";

export {};
export interface IDistinguishingMarks {
  pre?: Pre;
  cn_name: string;
  slot: string;
  plural?: boolean;
  coding?: Coding[];
  pconly?: boolean;
}

declare global {
  interface Window {
    modUtils: ModUtils;
    modSC2DataManager: SC2DataManager;

    modImgLoaderHooker: ImgLoaderHooker;

    jQuery: jQuery;
  }

  let Macro: {
    add: (name: string | string[], def) => any;
    delete: (name: string) => any;
    isEmpty: () => any;
    has: (name: string) => any;
    get: (name: string) => any;
  };

  interface Window {
    breastType: string;
    hoodState: string;
  }

  const Wikifier: WikifierAPI;
  const Scripting: ScriptingAPI;

  const setup: {
    Paperdoll: {
      paperdollPC: (HTMLCanvasElement) => Promise<PaperDollSystem>;
    };
    clothes: Record<string, ISetupClothes>;
    color_table: Record<string, string>;
    skin_color_table: Record<string, string>;
    distinguishing_marks: Record<string, IDistinguishingMarks>;
  };
  const V: {
    pc: {
      "clothes": Array<ISetupClothes>;
      "innermost_covering": (string)=>({ item: string;name: string });
      "outermost_covering": (string)=>({ item: string;name: string });
      "get_clothingItems_classes": () => void;
      "virgin": () => boolean;
      "has_part": (part: string) => boolean;
      "is_part_visible": (part: string) => boolean;
      "hair length": string;
      "hair color": string;
      "hair style": string;
      "eye color": string;
      "skin color": string;
      "penis type": string;
      "breast size": number;
      "penis size": number;
      "distinguishing_marks": string[];
    };
  };
}

export interface WikifierAPI {
  new(destination: OutputDestination | null, source: string, options?: WikifierOptions): unknown;

  createExternalLink: (destination: OutputDestination, url: string, text: string) => HTMLAnchorElement;

  createInternalLink: (
    destination: OutputDestination,
    passage: string,
    text: string,
    callback: () => void,
  ) => HTMLAnchorElement;

  isExternalLink: (link: string) => boolean;

  wikifyEval: (text: string) => DocumentFragment;
}

export interface ScriptingAPI {
  parse: (rawCodeString: string) => string;

  /**
   * Evaluates the given JavaScript code and returns the result, throwing if there were errors.
   */
  evalJavaScript: (code: string) => any;

  /**
   * Evaluates the given TwineScript code and returns the result, throwing if there were errors.
   */
  evalTwineScript: (code: string) => any;
}
