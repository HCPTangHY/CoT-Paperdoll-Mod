import { PaperDollSystem } from "./paperDollClass.ts";

interface IClothes {
  path: string;
  color?: string | null;
}

export interface ISetupClothes {
  item: string;
  name: string;
  category: string;
  subs: Record<string, string>;
  layer: number;
  configs: Record<string, string>;
}

interface IClotheMap {
  bodyClothes: any;
  leftHandClothes: any;
  rightHandClothes: any;
}

interface IPCLayers {
  [key: string]: {
    layer: number;
    load: (p: PaperDollSystem, clotheMap: IClotheMap) => Promise<void>;
  };
}

// eslint-disable-next-line unused-imports/no-unused-vars
function createCanvas(id: string) {
  const canvas = document.createElement("canvas");
  canvas.id = id;
  canvas.style.position = "absolute";
  canvas.style.left = "-5px";
  canvas.style.top = "0px";
  canvas.style.transform = "scale(1.75)";
  canvas.style.transformOrigin = "top left";
  return canvas;
}

async function checkImgExists(src: string) {
  return Boolean(await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src));
}

async function checkSubsExists(imgPath: string) {
  return await checkImgExists(`${imgPath}_full_gray.png`)
    || await checkImgExists(`${imgPath}_left_gray.png`)
    || await checkImgExists(`${imgPath}_right_gray.png`)
    || await checkImgExists(`${imgPath}_full.png`)
    || await checkImgExists(`${imgPath}_left.png`)
    || await checkImgExists(`${imgPath}_right.png`);
}

function colorConvert(color: string) {
  if (setup.color_table[color]) {
    return setup.color_table[color];
  }
  else {
    return color;
  }
}

async function ifColorPush(path: string, targetArray: IClothes[], color: string | null) {
  if (await checkImgExists(`${path}_gray.png`)) {
    targetArray.push({ path: `${path}_gray.png`, color });
  }
  else {
    targetArray.push({ path: `${path}.png` });
  }
  return targetArray;
}
async function clotheBaseSubLayers(imgPath: string, color: string | null, bodyClothes: Array<IClothes>, leftHandClothes: Array<IClothes>, rightHandClothes: Array<IClothes>) {
  bodyClothes = await ifColorPush(`${imgPath}full`, bodyClothes, color);
  leftHandClothes = await ifColorPush(`${imgPath}left`, leftHandClothes, color);
  rightHandClothes = await ifColorPush(`${imgPath}right`, rightHandClothes, color);
  return [bodyClothes, leftHandClothes, rightHandClothes];
}

async function clotheSubLayers(imgPath: string, color: string | null, bodyClothes: Array<IClothes>, leftHandClothes: Array<IClothes>, rightHandClothes: Array<IClothes>) {
  [bodyClothes, leftHandClothes, rightHandClothes] = await clotheBaseSubLayers(imgPath, color, bodyClothes, leftHandClothes, rightHandClothes);
  console.log(typeof bodyClothes, typeof leftHandClothes, typeof rightHandClothes);
  bodyClothes.push({ path: `${imgPath}acc_full.png` });
  leftHandClothes.push({ path: `${imgPath}acc_left.png` });
  rightHandClothes.push({ path: `${imgPath}acc_right.png` });
  return [bodyClothes, leftHandClothes, rightHandClothes];
}

async function clotheDiffsLayer(clothe: ISetupClothes, imgPath: string, mainColor: string | null, bodyClothes: IClothes[], leftHandClothes: IClothes[], rightHandClothes: IClothes[]) {
  for (const subName in clothe.subs) {
    if ((subName === "color" || subName === "color1") && (await checkImgExists(`${imgPath}${subName}_full_gray.png`) || await checkImgExists(`${imgPath}${subName}_left_gray.png`) || await checkImgExists(`${imgPath}${subName}_right_gray.png`))) {
      continue;
    }
    else {
      if ((subName.includes("color") || subName === "laces") && (await checkImgExists(`${imgPath}${subName}_full_gray.png`) || await checkImgExists(`${imgPath}${subName}_left_gray.png`) || await checkImgExists(`${imgPath}${subName}_right_gray.png`))) {
        [bodyClothes, leftHandClothes, rightHandClothes] = await clotheSubLayers(`${imgPath}${subName}`, colorConvert(clothe.subs[subName]), bodyClothes, leftHandClothes, rightHandClothes);
      }
      else {
        [bodyClothes, leftHandClothes, rightHandClothes] = await clotheSubLayers(`${imgPath}${subName}/${clothe.subs[subName].replace(/ /g, "_")}_`, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
      }
    }
  }
  if (!V.pc.is_part_visible("breasts") && V.pc.outermost_covering("breasts").item === V.pc.innermost_covering("breasts").item && V.pc.outermost_covering("breasts").item === clothe.item) {
    if (await checkSubsExists(`${imgPath}breast${Math.floor(V.pc["breast size"] / 200)}`)) {
      [bodyClothes, leftHandClothes, rightHandClothes] = await clotheSubLayers(`${imgPath}breast${Math.floor(V.pc["breast size"] / 200)}_`, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
      window.breastType = "num";
    }
    else if (await checkSubsExists(`${imgPath}breast`)) {
      [bodyClothes, leftHandClothes, rightHandClothes] = await clotheSubLayers(`${imgPath}breast_`, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
      window.breastType = "default";
    }
  }
  return [bodyClothes, leftHandClothes, rightHandClothes];
}

async function clotheLayers(paperdoll: PaperDollSystem, clothes: Array<ISetupClothes>, bodyClothes: Array<IClothes>, leftHandClothes: Array<IClothes>, rightHandClothes: Array<IClothes>): Promise<[PaperDollSystem, IClothes[], IClothes[], IClothes[]]> {
  for (let i = 0; i < clothes.length; i++) {
    const citem = setup.clothes[clothes[i].item];
    const imgPath = `res/paperdoll/clothes/${citem.category}/${clothes[i].item.replace(/ /g, "_")}/`;
    let mainColor = null;
    if (clothes[i].subs.color || clothes[i].subs.color1) {
      mainColor = colorConvert(clothes[i].subs.color) || colorConvert(clothes[i].subs.color1);
    }
    // main
    [bodyClothes, leftHandClothes, rightHandClothes] = await clotheSubLayers(imgPath, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
    // configurations
    if (Object.keys(clothes[i].configs).length > 0) {
      for (const configName in clothes[i].configs) {
        [bodyClothes, leftHandClothes, rightHandClothes] = await clotheSubLayers(`${imgPath}${configName.replace(/ /g, "_")}/${clothes[i].configs[configName].replace(/ /g, "_")}_`, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
        [bodyClothes, leftHandClothes, rightHandClothes] = await clotheDiffsLayer(clothes[i], `${imgPath}${configName.replace(/ /g, "_")}/`, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
        if (configName === "hood" && clothes[i].configs[configName] === "up") {
          window.hoodState = "up";
        }
      }
    }
    // sub
    [bodyClothes, leftHandClothes, rightHandClothes] = await clotheDiffsLayer(clothes[i], imgPath, mainColor, bodyClothes, leftHandClothes, rightHandClothes);
    if (await checkImgExists(`${imgPath}mask.png`)) {
      await paperdoll.loadHairMask(`${imgPath}mask.png`);
    }
  }
  return [paperdoll, bodyClothes, leftHandClothes, rightHandClothes];
}

export async function paperdollPC(canvas: HTMLCanvasElement) {
  const baseURL = `res/paperdoll/`;

  window.breastType = "";
  window.hoodState = "";
  const PCLayers: IPCLayers = {
    // 后发
    backhair: {
      layer: -10,
      async load(p: PaperDollSystem) {
        if (window.hoodState === "up") {
          return;
        }
        await p.loadLayer(`${baseURL}hair/back/${V.pc["hair style"].replace(/ /g, "_")}/${V.pc["hair length"].replace(/ /g, "_")}.png`, colorConvert(V.pc["hair color"]), "hair");
      },
    },
    // 身体(无手)
    bodynoarms: {
      layer: 0,
      async load(p: PaperDollSystem) {
        await p.loadLayer(`${baseURL}body/basenoarms-${V.pc.has_part("penis") ? "m" : "f"}.png`, setup.skin_color_table[V.pc["skin color"]], "skin");
      },
    },
    // 头
    head: {
      layer: 10,
      async load(p: PaperDollSystem) {
        await p.loadLayer(`${baseURL}body/basehead.png`, setup.skin_color_table[V.pc["skin color"]], "skin");
        const dmarkSlot: Record<string, string | null> = { chin: null, eyebrows: null, eyeslashes: null, eyes: null, face: null, lips: null, mouth: null, nose: null, mouse: null };
        for (const dmark of V.pc.distinguishing_marks) {
          const dmarkobj = setup.distinguishing_marks[dmark];
          dmarkSlot[dmarkobj.slot] = dmark;
        }
        for (const i in dmarkSlot) {
          if (dmarkSlot[i] && await checkImgExists(`${baseURL}face/dmarks/${dmarkSlot[i]}.png`)) {
            if (i === "eyebrows") {
              await p.loadLayer(`${baseURL}face/dmarks/${dmarkSlot[i]}.png`, colorConvert(V.pc["hair color"]));
            }
            else {
              await p.loadLayer(`${baseURL}face/dmarks/${dmarkSlot[i]}.png`, setup.skin_color_table[V.pc["skin color"]], "skin");
            }
          }
          else {
            await p.loadLayer(`${baseURL}face/base${i}.png`, setup.skin_color_table[V.pc["skin color"]], "skin");
          }
        }
      },
    },
    // 眼睛
    eyes: {
      layer: 20,
      async load(p: PaperDollSystem) {
        await p.loadLayer(`${baseURL}face/baseeyes.png`, colorConvert(V.pc["eye color"]));
      },
    },
    // 左手
    leftarm: {
      layer: 30,
      async load(p: PaperDollSystem) {
        await p.loadLayer(`${baseURL}body/leftarm.png`, setup.skin_color_table[V.pc["skin color"]], "skin");
      },
    },
    // 左手衣服层
    leftHandClothes: {
      layer: 40,
      async load(p: PaperDollSystem, clotheMap: IClotheMap) {
        const leftHandClothes = clotheMap.leftHandClothes || [];
        for (let i = 0; i < leftHandClothes.length; i++) {
          if (leftHandClothes[i].color)
            await p.loadLayer(leftHandClothes[i].path, leftHandClothes[i].color);
          else await p.loadLayer(leftHandClothes[i].path);
        }
      },
    },
    // 阴茎和乳房
    penisbreasts: {
      layer: 50,
      async load(p: PaperDollSystem) {
        if (V.pc.has_part("penis") && V.pc.is_part_visible("penis")) {
          await p.loadLayer(V.pc.virgin() ? `${baseURL}body/penis/penis_virgin${Math.floor(V.pc["penis size"] / 200) - 2}.png` : `${baseURL}body/penis/penis${Math.floor(V.pc["penis size"] / 200)}${V.pc["penis type"] === "uncircumcised" ? "_uncircumcised" : ""}.png`, setup.skin_color_table[V.pc["skin color"]], "skin");
        }
        else if (V.pc.has_part("breasts") && V.pc.is_part_visible("nipples")) {
          switch (window.breastType) {
            case "num":
              await p.loadLayer(`${baseURL}body/breasts/breast${Math.floor(V.pc["breast size"] / 200)}_clothed.png`, setup.skin_color_table[V.pc["skin color"]], "skin");
              break;
            case "default":
              await p.loadLayer(`${baseURL}body/breasts/breast3_clothed.png`, setup.skin_color_table[V.pc["skin color"]], "skin");
              break;
            default:
              await p.loadLayer(`${baseURL}body/breasts/breast${Math.floor(V.pc["breast size"] / 200)}.png`, setup.skin_color_table[V.pc["skin color"]], "skin");
          }
        }
      },
    },
    // 身体衣服层
    bodyClothes: {
      layer: 60,
      async load(p: PaperDollSystem, clotheMap: IClotheMap) {
        const bodyClothes = clotheMap.bodyClothes || [];
        for (let i = 0; i < bodyClothes.length; i++) {
          if (bodyClothes[i].color)
            await p.loadLayer(bodyClothes[i].path, bodyClothes[i].color);
          else await p.loadLayer(bodyClothes[i].path);
        }
      },
    },
    // 右手
    rightarm: {
      layer: 70,
      async load(p: PaperDollSystem) {
        await p.loadLayer(`${baseURL}body/rightarm.png`, setup.skin_color_table[V.pc["skin color"]], "skin");
      },
    },
    // 右手衣服层
    rightHandClothes: {
      layer: 80,
      async load(p: PaperDollSystem, clotheMap: IClotheMap) {
        const rightHandClothes = clotheMap.rightHandClothes || [];
        for (let i = 0; i < rightHandClothes.length; i++) {
          if (rightHandClothes[i].color)
            await p.loadLayer(rightHandClothes[i].path, rightHandClothes[i].color);
          else await p.loadLayer(rightHandClothes[i].path);
        }
      },
    },
    // 前发
    fronthair: {
      layer: 90,
      async load(p: PaperDollSystem) {
        const frontHair = `${V.pc["hair style"].replace(/ /g, "_")}/${V.pc["hair length"].replace(/ /g, "_")}.png`;
        if (await checkImgExists(`${baseURL}hair/front/${frontHair}`)) {
          await p.loadLayer(`${baseURL}hair/front/${frontHair}`, colorConvert(V.pc["hair color"]), "hair");
        }
        else {
          await p.loadLayer(`${baseURL}hair/front/default.png`, colorConvert(V.pc["hair color"]), "hair");
        }
      },
    },

  };
  const p = new PaperDollSystem(canvas);
  // 加载人模
  await p.loadBaseModel(`${baseURL}body/basenoarms-${V.pc.has_part("penis") ? "m" : "f"}.png`);

  V.pc.get_clothingItems_classes();
  const clothes = V.pc.clothes;
  clothes.sort((a, b) => setup.clothes[a.item].layer - setup.clothes[b.item].layer);

  const [_p, bodyClothes, leftHandClothes, rightHandClothes] = await clotheLayers(p, clothes, [], [], []);

  const clotheMap: IClotheMap = {
    bodyClothes,
    leftHandClothes,
    rightHandClothes,
  };

  // 其他图层插入点
  // Object.assign(PCLayers, {xxxx});

  // 后景替换插入点

  const layers = Object.keys(PCLayers).sort((a, b) => PCLayers[a].layer - PCLayers[b].layer);
  for (const layer of layers) {
    await PCLayers[layer].load(p, clotheMap);
  }

  // 前景替换插入点

  function calculateScale(x: number) {
    if (x <= 400)
      return 1.751391163229336e-12 * x * x * x * x - 8.545255633164328e-9 * x * x * x + 0.000014145710013317692 * x * x - 0.009038956747285762 * x + 3.272763107636594;
    else return 1.5;
  }

  setTimeout(() => {
    console.log("All layers loaded");
    p.draw();
    canvas.style.transform = `scale(${calculateScale(p.canvas.height as number)})`;
  }, 50);

  return p;
}
