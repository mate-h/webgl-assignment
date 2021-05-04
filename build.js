const fs = require("fs");
const fse = require("fs-extra");

fs.copyFileSync("./node_modules/dat.gui/build/dat.gui.module.js", "./build/dat.gui.module.js");
fse.copySync("./node_modules/gl-matrix/esm", "./build/gl-matrix");