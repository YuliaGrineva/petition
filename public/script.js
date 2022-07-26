

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let coord = { x: 0, y: 0 };

document.addEventListener("mousedown", start);
document.addEventListener("mouseup", stop);

function reposition(event) {
    coord.x = event.offsetX;
    coord.y = event.offsetY;
}
function start(event) {
    document.addEventListener("mousemove", draw);
    reposition(event);
}
function stop() {
    document.removeEventListener("mousemove", draw);
    document.querySelector('[type="hidden"]').value = saveSign();
}

function saveSign() {
    const signId = canvas.toDataURL();
    return signId;
}

function draw(event) {
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#ACD3ED";
    ctx.moveTo(coord.x, coord.y);
    reposition(event);
    ctx.lineTo(coord.x, coord.y);
    ctx.stroke();
}
