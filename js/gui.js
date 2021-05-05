// imports
import * as dat from "dat.gui";
import { loadScene, initShaders, setBackground } from ".";

//parameters
const gui = new dat.GUI({ name: "Parameters" });
const defaultObject = {
  type: "mesh",
  model: "Teapot",
  transform: {
    translate: [0, 0, 0],
    scale: [0, 0, 0],
    rotate: [0, 0, 0],
    shear: [0, 0, 0],
  }
};
export const parameters = {
  currentShader: "phong",
  background: [20,20,20],
  wireframe: false,
  camera: {
    position: [0, 0, 40],
    fov: 45,
  },
  scene: [
    defaultObject
  ],
  addObject: () => {
    parameters.scene.push({
      type: "mesh",
      model: "Teapot",
      transform: {
        translate: [0, 0, 0],
        scale: [0, 0, 0],
        rotate: [0, 0, 0],
        shear: [0, 0, 0],
      },
    });
    const i = parameters.scene.length - 1;
    addParam(parameters.scene[i], i);
    loadScene();
  },
  turnSpeed: 0.03
};

gui.addColor(parameters, 'background').name("Background").onChange(c => {
  setBackground(c);
});

gui
  .add(parameters, "currentShader")
  .options("flat", "gouraud", "phong", "main")
  .name("Shader")
  .onChange((a) => {
    initShaders();
  });
gui.add(parameters, "wireframe").name("Wireframe");
const modelOptions = [
  "Car_road",
  "Church_s",
  "Csie",
  "Easter",
  "Fighter",
  "Kangaroo",
  "Longteap",
  "Mercedes",
  "Mig27",
  "Patchair",
  "Plant",
  "Teapot",
  "Tomcat",
];
const camGui = gui.addFolder("Camera");
camGui.add(parameters.camera.position, "0", -10, 10, 0.01).name("x");
camGui.add(parameters.camera.position, "1", -10, 10, 0.01).name("y");
camGui.add(parameters.camera.position, "2", -40, 0, 0.01).name("z");
camGui.add(parameters.camera, "fov", 1, 179, 0.001).name("FOV");

const sceneGui = gui.addFolder("Scene");
sceneGui.open();
parameters.scene.forEach((obj, i) => {
  addParam(obj, i);
});
sceneGui.add(parameters, "addObject").name("Add object");

function addParam(obj, i) {
  const name = `Object ${i + 1}`
  const objFolder = sceneGui.addFolder(name);
  objFolder.open();
  objFolder.add(obj, "type").name("Type").options("mesh", "light");
  objFolder
    .add(obj, "model")
    .options(modelOptions)
    .name("Model")
    .onChange((o) => {
      loadScene();
    });
  const transformFolder = objFolder.addFolder("Transform");
  transformFolder.open();
  Object.entries({
    translate: "Translate",
    rotate: "Rotate",
    scale: "Scale",
    shear: "Shear",
  }).forEach(([k, v]) => {
    const folder = transformFolder.addFolder(v);
    if (k === "translate") folder.open();
    folder.add(obj.transform[k], "0").name("x");
    folder.add(obj.transform[k], "1").name("y");
    folder.add(obj.transform[k], "2").name("z");
  });
  objFolder.add({
    remove: () => {
      const idx = parameters.scene.findIndex(v => v == obj);
      parameters.scene.splice(idx, 1);
      sceneGui.removeFolder(objFolder);
      loadScene();
    }
  }, "remove").name("Remove");
}

gui.add(parameters, "turnSpeed", 0, 0.2, 0.001).name("Turn speed");
