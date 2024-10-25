import type { RspackOptions } from "@rspack/core";
import { existsSync, readdirSync } from "node:fs";
import { join, parse, resolve } from "node:path";
import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";
import { name, version } from "./package.json";
import { createZip } from "./utils/zip.util.ts";

// Target browsers, see: https://github.com/browserslist/browserslist
const targets = ["chrome >= 87", "edge >= 88", "firefox >= 78", "safari >= 14"];
const scriptFileDir = new Set([
  "scriptFileList_earlyload",
  "scriptFileList_inject_early",
  "scriptFileList_preload",
  "scriptFileList",
]);

function commonConfig(): RspackOptions {
  return {
    entry() {
      const entryDir = readdirSync("./src").filter(item => scriptFileDir.has(item));

      return Object.fromEntries(entryDir.flatMap(item =>
        readdirSync(resolve("./src", item))
          .filter(item => item.endsWith(".ts"))
          .map(_file => [
            join(item, parse(_file).name).replaceAll("\\", "/"),
            `./${join("./src", item, _file).replaceAll("\\", "/")}`,
          ]),
      ));
    },
    output: {
      clean: true,
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: [
            {
              loader: "builtin:swc-loader",
              options: {
                jsc: {
                  parser: {
                    syntax: "ecmascript",
                  },
                },
                env: { targets },
              },
            },
          ],
        },
        {
          test: /\.ts$/,
          use: [
            {
              loader: "builtin:swc-loader",
              options: {
                jsc: {
                  parser: {
                    syntax: "typescript",
                  },
                },
                env: { targets },
              },
            },
          ],
        },
      ],
    },
    plugins: [

    ],
    optimization: {
      minimize: false,
    },
    devtool: "inline-source-map",
    experiments: {
      css: true,
    },
  };
}
function devServer() {
  if (existsSync("./game/index.html")) {
    return {
      devServer: {
        port: 5678,
        liveReload: false,
        hot: false,
        static: "game",
        setupMiddlewares: (middlewares, devServer) => {
          if (!devServer) {
            throw new Error("@rspack/dev-server is not defined");
          }
          devServer.app?.get("/modList.json", (_, response) => {
            console.log("get mod list");
            if (existsSync("./game/mods")) {
              const modList = readdirSync("./game/mods/").filter(item => item.endsWith(".zip")).map(item => `/mods/${item}`);
              response.send(JSON.stringify([
                ...modList,
                `/${name}-${version}.mod.zip`,
              ]));
            }
            else {
              response.send(JSON.stringify([
                `/${name}-${version}.mod.zip`,
              ]));
            }
          });
          const filename = `${name}-${version}.mod.zip`;

          devServer.app?.get(`/${filename}`, (_, response) => {
            rspack(commonConfig(), (_err, _stats) => {
              // eslint-disable-next-line node/prefer-global/process
              createZip(process.cwd(), filename).then((zip) => {
                response.send(zip.toBuffer());
              });
            });
          });
          return middlewares;
        },
      },
    } as RspackOptions;
  }
  return {};
}
export default defineConfig({
  ...commonConfig(),
  ...devServer(),
});
