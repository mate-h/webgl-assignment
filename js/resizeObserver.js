window.addEventListener("resize", resize())
function resize() {
  const canvas = document.getElementById("ICG-canvas");
  const dppx = window.devicePixelRatio;
  canvas.width = window.innerWidth * dppx;
  canvas.height = window.innerHeight * dppx;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
}
resize();