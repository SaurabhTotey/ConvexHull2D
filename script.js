const canvas = document.getElementById("screen");
canvas.setAttribute("width", `${canvas.offsetWidth}`);
canvas.setAttribute("height", `${canvas.offsetHeight}`);
const renderer = canvas.getContext("2d");
canvas.strokeStyle = "black";

window.onresize = () => {
	canvas.setAttribute("width", `${window.innerWidth * 0.6}`);
	canvas.setAttribute("height", `${window.innerHeight}`);
};

const logicalWidth = 600;
const logicalHeight = 400;

const getCanvasPhysicalSize = () => [parseInt(canvas.getAttribute("width")), parseInt(canvas.getAttribute("height"))];
const getCanvasDrawingAreaSize = () => {
    const logicalAspectRatio = logicalWidth / logicalHeight;
    const [physicalWidth, physicalHeight] = getCanvasPhysicalSize();
    const physicalAspectRatio = physicalWidth / physicalHeight;
    let drawingAreaWidth = physicalWidth;
    let drawingAreaHeight = physicalHeight;
    if (logicalAspectRatio < physicalAspectRatio) { // physical canvas is wider than logical drawing area, limited by height
        drawingAreaWidth = logicalAspectRatio * physicalHeight;
    } else { // physical canvas is taller than logical drawing area, limited by width
        drawingAreaHeight = physicalWidth / logicalAspectRatio;
    }
    return [drawingAreaWidth, drawingAreaHeight];
};

const convertLogicalCoordinatesToPhysical = (logicalX, logicalY) => {
    const [physicalWidth, physicalHeight] = getCanvasPhysicalSize();
    const [drawingAreaWidth, drawingAreaHeight] = getCanvasDrawingAreaSize();
    let physicalX = (logicalX / logicalWidth) * drawingAreaWidth + (physicalWidth - drawingAreaWidth) / 2;
    let physicalY = (logicalY / logicalHeight) * drawingAreaHeight + (physicalHeight - drawingAreaHeight) / 2;
    return [physicalX, physicalHeight - physicalY];
};

window.setInterval(() => {
    renderer.clearRect(0, 0, ...getCanvasPhysicalSize());
    renderer.strokeRect(...convertLogicalCoordinatesToPhysical(0, logicalHeight), ...getCanvasDrawingAreaSize());
    // TODO:
}, 17);