import type { ModBootJsonAddonPlugin } from "./types.ts";
import { TweeReplacer } from "./twee-replacer.ts";
import {ImageLoaderHook} from "./image-loader-hook.ts"

export const addonPlugin: ModBootJsonAddonPlugin[] = [
  TweeReplacer,
  ImageLoaderHook,
];
