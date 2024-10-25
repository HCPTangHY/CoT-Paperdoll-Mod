import type { ModBootJsonAddonPlugin } from "./types.ts";

export const TweeReplacer: ModBootJsonAddonPlugin = {
  modName: "TweeReplacer",
  addonName: "TweeReplacerAddon",
  modVersion: "^1.6.0",
  params: [{
    passage: "StoryCaption",
    findString: "<div class=\"locimgcontainer\">",
    replace: "<div class=\"locimgcontainer\" style=\"height: 180px;\"><<PaperdollPC>>",
  }, {
    passage: "StoryCaption",
    findString: "<div class=\"todimg\">",
    replace: "<div class=\"todimg\" style=\"left: -60px;\">",
  }, {
    passage: "StoryCaption",
    findString: "<div class=\"locimg\">",
    replace: " <div class=\"locimg\" style=\"left: -100px;top: 125px;\">",
  }, {
    passage: "StoryCaption",
    findString: "<img @src=\"_nodeimg\">",
    replace: "<img @src=\"_nodeimg\" width=\"75px\">",
    all: true,
  }],
};
