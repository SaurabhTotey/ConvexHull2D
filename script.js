const canvas = document.getElementById("screen");
canvas.setAttribute("width", `${canvas.offsetWidth}`);
canvas.setAttribute("height", `${canvas.offsetHeight}`);
const renderer = canvas.getContext("2d");
canvas.strokeStyle = "black";

window.onresize = () => {
	canvas.setAttribute("width", `${window.innerWidth * 0.6}`);
	canvas.setAttribute("height", `${window.innerHeight}`);
};

class Canvas {

    constructor(canvasElement, renderer, logicalWidth, logicalHeight) {
        this.canvas = canvasElement;
        this.renderer = renderer;
        this.logicalWidth = logicalWidth;
        this.logicalHeight = logicalHeight;
    }

    getPhysicalSize() {
        return [parseInt(this.canvas.getAttribute("width")), parseInt(this.canvas.getAttribute("height"))];
    }

    getDrawingAreaSize() {
        const logicalAspectRatio = this.logicalWidth / this.logicalHeight;
        const [physicalWidth, physicalHeight] = this.getPhysicalSize();
        const physicalAspectRatio = physicalWidth / physicalHeight;
        let drawingAreaWidth = physicalWidth;
        let drawingAreaHeight = physicalHeight;
        if (logicalAspectRatio < physicalAspectRatio) { // physical canvas is wider than logical drawing area, limited by height
            drawingAreaWidth = logicalAspectRatio * physicalHeight;
        } else { // physical canvas is taller than logical drawing area, limited by width
            drawingAreaHeight = physicalWidth / logicalAspectRatio;
        }
        return [drawingAreaWidth, drawingAreaHeight];
    }

    convertLogicalCoordinatesToPhysical(logicalX, logicalY) {
        const [physicalWidth, physicalHeight] = this.getPhysicalSize();
        const [drawingAreaWidth, drawingAreaHeight] = this.getDrawingAreaSize();
        let physicalX = (logicalX / this.logicalWidth) * drawingAreaWidth + (physicalWidth - drawingAreaWidth) / 2;
        let physicalY = (logicalY / this.logicalHeight) * drawingAreaHeight + (physicalHeight - drawingAreaHeight) / 2;
        return [physicalX, physicalHeight - physicalY];
    }

    clear() {
        this.renderer.clearRect(0, 0, ...this.getPhysicalSize());
    }

    drawDrawingArea() {
        this.renderer.strokeRect(...this.convertLogicalCoordinatesToPhysical(0, this.logicalHeight), ...this.getDrawingAreaSize());
    }

}

const drawingCanvas = new Canvas(canvas, renderer, 600, 400);

window.setInterval(() => {
    drawingCanvas.clear();
    drawingCanvas.drawDrawingArea();
    // TODO:
}, 17);