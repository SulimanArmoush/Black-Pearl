export class BoatPhysics {
  constructor() {
    this.waterRo = 1025; // كثافة الماء
    this.airRo = 1.2; // كثافة الهواء
    this.g = 9.8; // الجاذبية
    this.liftCoefficient = 1.0; //  معامل الدفع
    this.dragCoefficient = 1.0; // معامل السحب

    this.M = 50; // كتلة القارب
    this.boatLength = 2; // طول القارب
    this.boatWidth = 1; // عرض القارب
    this.boatHigh = 9; // ارتفاع القارب

    this.totalSailArea = 5; // مساحة الشراع
    this.sailAngle = 120; // زاوية الشراع
    this.windDirection = 30; // اتجاه الرياح
    this.windSpeed = 2; // سرعة الرياح

    this.boatSpeed = 0; // سرعة القارب الابتدائية
    this.boatAngle = 0; //جهة القارب الابتدائية
    this.boatPosition = { x: 0, y: 0, z: 0 }; // مكان القارب الابتدائي في المشهد

    this.timeStep = 0.1; // قيمة تغير الزمن
  }

  setup({
    totalSailArea, sailAngle, windDirection, windSpeed
  }) {
    this.totalSailArea = totalSailArea;
    this.sailAngle = sailAngle;
    this.windDirection = windDirection;
    this.windSpeed = windSpeed;
  }

// تابع يعيد قيمة الجزء المغمور من القارب
  heightMelted() {
    var volume = this.M / this.waterRo;

    return volume / (this.boatLength * this.boatWidth);
  }

// تابع يعيد موقع القارب على المحور الشاقولي حسب التابع السابق
  yPosition() {
    this.boatPosition.y = this.boatHigh - this.heightMelted();

    return this.boatPosition.y;
  }

  sailArea() {
    const relativeAngle =
      (Math.abs(this.windDirection - this.sailAngle) * Math.PI) / 180;

    return this.totalSailArea * Math.sin(relativeAngle);
  }

  effectiveArea() {
    return this.boatWidth * this.heightMelted();
  }

  thrustForce() {
    return (
      0.5 *
      this.airRo *
      this.sailArea() *
      this.liftCoefficient *
      Math.pow(this.windSpeed, 2)
    );
  }

  dragForce() {
    return (
      0.5 *

      this.waterRo *
      this.effectiveArea() *
      this.dragCoefficient *
      Math.pow(this.boatSpeed, 2)
    );
  }


  terminalVelocity() {
    return Math.sqrt(
      this.thrustForce() /
        (0.5 * this.waterRo * this.effectiveArea() * this.dragCoefficient)
    );
  }


  acceleration(){
    const netForce = this.thrustForce() - this.dragForce();
    return netForce / this.M;
  }

  velocity() {
    this.boatSpeed += this.acceleration() * this.timeStep;
  }


  update() {
    this.velocity();

    const relativeWindAngle =
      ((this.windDirection - this.sailAngle) * Math.PI) / 180;

    const deltaX = this.boatSpeed * this.timeStep * Math.cos(relativeWindAngle);
    const deltaZ = this.boatSpeed * this.timeStep * Math.sin (relativeWindAngle);

    this.boatPosition.x += deltaX;
    this.boatPosition.z += deltaZ;

    this.boatPosition.y = this.yPosition();

    let movementAngle = Math.atan2(deltaZ, deltaX);
    movementAngle += Math.PI;

    this.boatAngle = -movementAngle;
  }
  
}