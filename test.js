// التأكد من استيراد مكتبة Three.js
import * as THREE from 'three';

// الصف الفيزيائي للسفينة
export class BoatPhysics {
    constructor() {
        this.waterDensity = 1025; // كثافة الماء
        this.gravity = 9.8; // تسارع الجاذبية
        this.boatMass = 50; // كتلة القارب
        this.length = 2; // طول القارب بالمتر
        this.width = 1; // عرض القارب بالمتر

        this.sailArea = 4; // مساحة الشراع
        this.liftCoefficient = 1.0; // معامل الرفع

        this.windSpeed = 10; // سرعة الرياح
        this.windDirection = Math.PI / 4; // اتجاه الرياح بالدرجات
        this.sailAngle = 90; // زاوية الشراع بالدرجات
        this.airDensity = 1.2; // كثافة الهواء

        this.dragCoefficient = 0.1; // معامل الجر

        this.boatSpeed = 0; // سرعة القارب
        this.boatPosition = { x: 0, y: 5, z: 0 }; // موضع القارب (رفع القارب قليلاً في البداية)
        this.terminalVelocity = 5; // السرعة الحدية

        this.timeStep = 0.1; // خطوة الزمن
        this.boatHeading = -90; // اتجاه القارب بالدرجات

        this.submergedVolume = 0.4;

        this.noGoZone = 45; // زاوية المنطقة الميتة حيث لا يمكن الإبحار مباشرة ضد الرياح
    }

    // حساب قوة الطفو
    calculateBuoyantForce() {
        const volume = this.boatMass / this.waterDensity;
        return this.waterDensity * volume * this.gravity;
    }

    // دالة لحساب قوة الرياح على الشراع
    calculateWindForce(boatVelocity) {
        const apparentWindSpeed = this.windSpeed - boatVelocity; // سرعة الرياح الظاهرة
        const liftForce = 0.5 * this.airDensity * this.sailArea * this.liftCoefficient * Math.pow(apparentWindSpeed, 2);
        return liftForce;
    }

    // دالة لحساب قوة الجر
    calculateDragForce(boatVelocity) {
        const dragForce = 0.5 * this.waterDensity * this.dragCoefficient * Math.pow(boatVelocity, 2);
        return dragForce;
    }

    // دالة لتحديث حركة القارب
    updateBoat() {
        const buoyantForce = this.calculateBuoyantForce();
        const windForce = this.calculateWindForce(this.boatSpeed);
        const dragForce = this.calculateDragForce(this.boatSpeed);

        // حساب القوة الصافية وتسارع القارب
        const netForce = windForce - dragForce;
        const acceleration = netForce / this.boatMass;

        // تحديث موقع وسرعة القارب
        this.boatSpeed += acceleration * this.timeStep;
        if (this.boatSpeed > this.terminalVelocity) {
            this.boatSpeed = this.terminalVelocity;
        }

        this.boatPosition.x += this.boatSpeed * Math.cos(this.boatHeading * Math.PI / 180) * this.timeStep;
        this.boatPosition.z += this.boatSpeed * Math.sin(this.boatHeading * Math.PI / 180) * this.timeStep;
    }

    posy() {
        const volume = this.boatMass / this.waterDensity; // حجم الجزء المغمور
        const heightMelted = volume / (this.length * this.width); // حساب الارتفاع المغمور
        this.boatPosition.y = 9 - heightMelted; // تحديث موقع القارب بناءً على العمق الكلي (مثلاً 9 متر)
        return this.boatPosition.y;
    }
}

// إعداد مشهد Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// إضافة البحر
const oceanGeometry = new THREE.PlaneGeometry(100, 100);
const oceanMaterial = new THREE.MeshBasicMaterial({ color: 0x1e90ff, side: THREE.DoubleSide });
const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
ocean.rotation.x = Math.PI / 2;
scene.add(ocean);

// إضافة القارب
const boatGeometry = new THREE.BoxGeometry(2, 0.5, 1);
const boatMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const boat = new THREE.Mesh(boatGeometry, boatMaterial);
scene.add(boat);

// إعداد الإضاءة
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// ضبط موقع الكاميرا
camera.position.z = 10;
camera.position.y = 5;

// إنشاء كائن الفيزياء للقارب
const boatPhysics = new BoatPhysics();

// دالة للتحديث
function animate() {
    requestAnimationFrame(animate);

    // تحديث موقع القارب
    boatPhysics.updateBoat();
    boat.position.set(
        boatPhysics.boatPosition.x, 
        boatPhysics.boatPosition.y,
         boatPhysics.boatPosition.z);

    renderer.render(scene, camera);
}

// بدء عملية التحديث
animate();
