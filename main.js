import "./style.css";
import * as THREE from "three";
import { GUI } from "dat.gui";  // استيراد dat.GUI
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Water } from "three/addons/objects/Water.js";
import { Sky } from "three/addons/objects/Sky.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BoatPhysics } from "./phy.js";

// Fetch the parameters from the URL
const urlParams = new URLSearchParams(window.location.search);
const totalSailArea = parseFloat(urlParams.get('totalSailArea')) || 5;
const sailAngle = parseFloat(urlParams.get('sailAngle')) || 120;
const windDirection = parseFloat(urlParams.get('windDirection')) || 30;
const windSpeed = parseFloat(urlParams.get('windSpeed')) || 2;

// Create and setup the simulation
const simulation = new BoatPhysics();
simulation.setup({
  totalSailArea,
  sailAngle,
  windDirection,
  windSpeed,
});

const loader = new GLTFLoader();

class Boat {
  constructor() {
    loader.load("assets/boat/scene.gltf", (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(3, 3, 3);
      this.boat = gltf.scene;
    });
  }

  update() {
    if (this.boat) {
      simulation.update();
      this.boat.position.set(
        simulation.boatPosition.x,
        simulation.boatPosition.y,
        simulation.boatPosition.z
      );
      this.boat.rotation.y = simulation.boatAngle;
    }
  }
}

const boat = new Boat();

let camera, scene, renderer;
let controls, water, sun;
let Bomb = false;

init();

function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  document.body.appendChild(renderer.domElement);
  
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.set(0, 25, 100);
  
  sun = new THREE.Vector3();

  // Water
  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      "assets/waternormals.jpg",
      function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined,
  });

  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  // Skybox
  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);
  const skyUniforms = sky.material.uniforms;
  skyUniforms["turbidity"].value = 10;
  skyUniforms["rayleigh"].value = 2;
  skyUniforms["mieCoefficient"].value = 0.005;
  skyUniforms["mieDirectionalG"].value = 0.8;

  const parameters = {
    elevation: 2,
    azimuth: 180,
  };

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const sceneEnv = new THREE.Scene();
  let renderTarget;

  function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms["sunPosition"].value.copy(sun);
    water.material.uniforms["sunDirection"].value.copy(sun).normalize();
    if (renderTarget !== undefined) renderTarget.dispose();
    sceneEnv.add(sky);
    renderTarget = pmremGenerator.fromScene(sceneEnv);
    scene.add(sky);
    scene.environment = renderTarget.texture;
  }

  updateSun();

  window.addEventListener("resize", onWindowResize);

  window.addEventListener("keydown", (event) => {
    switch (event.code) {
      case "ArrowLeft":
        if (simulation.windDirection - simulation.sailAngle > -179.9) {
          simulation.sailAngle += 0.2;
          cameraAngle -= 0.004;

        }
        break;
      case "ArrowRight":
        if (simulation.windDirection - simulation.sailAngle < -0.1) {
          simulation.sailAngle -= 0.2;
          cameraAngle += 0.004;
        }
        break;
      case "KeyB":
        Bomb = true;
        break;
    }
  });

  // إضافة واجهة GUI
  const gui = new GUI();
  gui.add(simulation, 'windSpeed', 0, 32).name('Wind Speed (m/s)').onChange(value => {
    simulation.windSpeed = value;
  });
  gui.add(simulation, 'totalSailArea', 0, 50).name('Sail Area (m²)').onChange(value => {
    simulation.totalSailArea = value;
  });
  gui.add({ Bomb: false }, 'Bomb').name('Activate Bomb').onChange(value => {
    Bomb = value;
  });

}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  boat.update();
  updateCamera();
  render();
  updateValuesDisplay()
}

function updateValuesDisplay() {
  document.getElementById('thrust-force').textContent = simulation.thrustForce().toFixed(2);
  document.getElementById('drag-force').textContent = simulation.dragForce().toFixed(2);
  document.getElementById('sail_area').textContent = simulation.sailArea().toFixed(2);
  document.getElementById('boat-speed').textContent = simulation.boatSpeed.toFixed(2);
  document.getElementById('sail-angle').textContent = simulation.sailAngle.toFixed(2);
  document.getElementById('wind-speed').textContent = simulation.windSpeed.toFixed(2);
  document.getElementById('direction').textContent = (simulation.boatAngle * 180 / Math.PI).toFixed(2);
  //document.getElementById('wind-direction').textContent = simulation.windDirection.toFixed(2);
  document.getElementById('terminal-velocity').textContent = simulation.terminalVelocity().toFixed(2);
  document.getElementById('acceleration').textContent = simulation.acceleration().toFixed(2);
  document.getElementById('boat-position').textContent = 
      `(${simulation.boatPosition.x.toFixed(2)}, ${simulation.boatPosition.y.toFixed(2)}, ${simulation.boatPosition.z.toFixed(2)})`;
}



let cameraAngle = 1.6;
const cameraDistance = 100; // المسافة بين الكاميرا والقارب
const cameraHeight = 30; // ارتفاع الكاميرا بالنسبة للقارب


function updateCamera() {
  const time = Date.now() * 0.0005;

  // تأثير حركة الأمواج على الكاميرا
  const waveOffsetX = Math.sin(time) * 10; // مثال على تأثير الأمواج
  const waveOffsetZ = Math.cos(time) * 10;

  camera.position.x = simulation.boatPosition.x + cameraDistance * Math.cos(cameraAngle) + waveOffsetX;
  camera.position.z = simulation.boatPosition.z + cameraDistance * Math.sin(cameraAngle) + waveOffsetZ;
  camera.position.y = simulation.boatPosition.y + cameraHeight;
  camera.lookAt(simulation.boatPosition.x, simulation.boatPosition.y, simulation.boatPosition.z);

  
}



function render() {
  water.material.uniforms["time"].value += 1.0 / 60.0;
  renderer.render(scene, camera);
  if (Bomb == true) {
    if (boat.boat.rotation.x > -0.8) {
      boat.boat.rotation.x -= 0.0002;
    }
    simulation.M += 5;
  }

  console.log("thrustForce (N):", simulation.thrustForce().toFixed(1));
  console.log("dragForce (N):", simulation.dragForce().toFixed(1));
  console.log("SailArea (m^2):", simulation.sailArea().toFixed(1));
  console.log("Boat Speed (m/s):", simulation.boatSpeed.toFixed(1));
  console.log("SailAngle (Rad):", simulation.sailAngle.toFixed(1));
  console.log("Direction (Rad):", simulation.boatAngle.toFixed(1));

  console.log(
    "Terminal Velocity (m/s):",
    simulation.terminalVelocity().toFixed(1)
  );
  console.log("acceleration (ms^-2):", simulation.acceleration().toFixed(1));
  console.log(
    "Position:",
    simulation.boatPosition.x.toFixed(1),
    simulation.boatPosition.z.toFixed(1),
    simulation.boatPosition.y.toFixed(1)
  );
}
