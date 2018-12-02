const { task, context } = require("fuse-box/sparky");
const {
  FuseBox,
  WebIndexPlugin,
  QuantumPlugin,
  CSSResourcePlugin,
  CSSPlugin,
} = require("fuse-box");
context(
  class {
    getConfig() {
      return FuseBox.init({
        homeDir: "src",
        target: "browser@es6",
        output: "dist/$name.js",
        sourceMaps: !this.isProduction,
        plugins: [
          [
            CSSResourcePlugin({
              dist: "dist/fonts",
              resolve: f => `fonts/${f}`,
            }),
            CSSPlugin(),
          ],
          this.isProduction &&
            QuantumPlugin({
              uglify: true,
              treeshake: true,
              bakeApiIntoBundle: "app",
            }),
          WebIndexPlugin({
            path: ".",
            template: "./src/index.template.html",
          }),
        ],
      });
    }
  },
);
task("default", async context => {
  const fuse = context.getConfig();
  fuse.dev(); // launch http server
  fuse
    .bundle("app")
    .instructions(" > index.ts")
    .watch();
  await fuse.run();
});
task("dist", async context => {
  context.isProduction = true;
  const fuse = context.getConfig();
  fuse.bundle("app").instructions(" > index.ts");
  await fuse.run();
});
