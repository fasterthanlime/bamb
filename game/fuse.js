const { task, context } = require("fuse-box/sparky");
const {
  FuseBox,
  WebIndexPlugin,
  QuantumPlugin,
  CSSResourcePlugin,
  CSSPlugin
} = require("fuse-box");
context(
  class {
    getConfig() {
      return FuseBox.init({
        homeDir: "src",
        target: "browser@es6",
        output: "dist/$name.js",
        plugins: [
          [CSSResourcePlugin(), CSSPlugin()],
          this.isProduction &&
            QuantumPlugin({
              uglify: true,
              treeshake: true,
              bakeApiIntoBundle: "app"
            }),
          WebIndexPlugin({
            path: "."
          })
        ]
      });
    }
  }
);
task("default", async context => {
  const fuse = context.getConfig();
  fuse.dev(); // launch http server
  fuse
    .bundle("app")
    .instructions(" > index.ts")
    .hmr({ reload: true })
    .watch();
  await fuse.run();
});
task("dist", async context => {
  context.isProduction = true;
  const fuse = context.getConfig();
  fuse.bundle("app").instructions(" > index.ts");
  await fuse.run();
});
