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
    scale: 1,
    rotate: [0, 0, 0],
    shear: 90,
  },
};
function deepcopy(o) {
  return JSON.parse(JSON.stringify(o));
}
export const parameters = {
  currentShader: "phong",
  background: [20, 20, 20],
  wireframe: false,
  camera: {
    position: [0, 0, 40],
    fov: 45,
  },
  scene: [
    {
      type: "mesh",
      model: "Teapot",
      transform: {
        translate: [0, 3, 1],
        scale: 0.1,
        rotate: [16, 3, -24],
        shear: 85,
      },
    },
    {
      type: "mesh",
      model: "Kangaroo",
      transform: {
        translate: [0, 8, 0],
        scale: 10,
        rotate: [-90, 0, 0],
        shear: 90,
      },
    },
    {
      type: "mesh",
      model: "Csie",
      transform: {
        translate: [-10, -8, 2],
        scale: 20,
        rotate: [-90, 0, 0],
        shear: 90,
      },
    },
    {
      type: "light",
      transform: {
        translate: [-10.0,4.0,-16.0]
      }
    }
  ],
  addObject: () => {
    parameters.scene.push(deepcopy(defaultObject));
    const i = parameters.scene.length - 1;
    addParam(parameters.scene[i], i);
    refreshAddObject();
    loadScene();
  },
  turnSpeed: 0.01,
};

gui
  .addColor(parameters, "background")
  .name("Background")
  .onChange((c) => {
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
camGui.add(parameters.camera.position, "2", 0, 40, 0.01).name("z");
camGui.add(parameters.camera, "fov", 1, 179, 0.001).name("FOV");

const sceneGui = gui.addFolder("Scene");
sceneGui.open();

let addObjectController = sceneGui.add(parameters, "addObject").name("Add object");
function refreshAddObject() {
  try {
    sceneGui.remove(addObjectController);
  }catch(e){}
  addObjectController = sceneGui.add(parameters, "addObject").name("Add object");
}
function addParam(obj, i) {
  let objFolder;
  function refreshType(t) {
    const n = parameters.scene.filter(o => o.type === obj.type).findIndex(o => o === obj);
    const name = `${obj.type} ${n + 1}`;
    try {
      sceneGui.removeFolder(objFolder);
    }catch(e){}
    objFolder = sceneGui.addFolder(name);
    refreshAddObject();
    objFolder.open();
    objFolder.add(obj, "type").name("Type").options("mesh", "light").onChange(type => {
      refreshType(type);
      loadScene();
    });
    if (t === 'mesh') {
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
      }).forEach(([k, v]) => {
        const folder = transformFolder.addFolder(v);
        if (k === "translate") folder.open();
        folder.add(obj.transform[k], "0").name("x");
        folder.add(obj.transform[k], "1").name("y");
        folder.add(obj.transform[k], "2").name("z");
      });
      transformFolder.add(obj.transform, "scale", 0, 40, 0.1).name("Scale");
      transformFolder.add(obj.transform, "shear", 1, 179).name("Shear");
    }
    else if (t === 'light') {
      const transformFolder = objFolder.addFolder("Transform");
      transformFolder.open();
      Object.entries({
        translate: "Translate",
      }).forEach(([k, v]) => {
        const folder = transformFolder.addFolder(v);
        if (k === "translate") folder.open();
        folder.add(obj.transform[k], "0").name("x");
        folder.add(obj.transform[k], "1").name("y");
        folder.add(obj.transform[k], "2").name("z");
      });
    }
    objFolder
    .add(
      {
        remove: () => {
          const idx = parameters.scene.findIndex((v) => v == obj);
          parameters.scene.splice(idx, 1);
          sceneGui.removeFolder(objFolder);
          loadScene();
        },
      },
      "remove"
    )
    .name("Remove");
  }
  refreshType(obj.type);
}

parameters.scene.forEach((obj, i) => {
  addParam(obj, i);
});

gui.add(parameters, "turnSpeed", 0, 0.2, 0.001).name("Turn speed");

window.parameters = parameters;
