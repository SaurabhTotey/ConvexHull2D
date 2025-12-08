/*
 * ------------------------------------------------
 * Initialize the canvas element
 * ------------------------------------------------
 */
const canvas = document.getElementById("screen");
canvas.setAttribute("width", `${canvas.offsetWidth}`);
canvas.setAttribute("height", `${canvas.offsetHeight}`);
const renderer = canvas.getContext("2d");
window.onresize = () => {
	canvas.setAttribute("width", `${window.innerWidth * 0.6}`);
	canvas.setAttribute("height", `${window.innerHeight}`);
};

/*
 * ------------------------------------------------
 * Define main classes for visualization
 * ------------------------------------------------
 */

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

class Point {
    constructor(x, y, color = "black") {
        this.x = x;
        this.y = y;
        this.color = color;
    }
}

class DrawingManager {

    constructor(canvas) {
        this.canvas = canvas;
        this.objects = [];
        this.animationInProgress = false;
        this.animationFrame = 0;
    }

    clear() {
        this.objects = [];
        this.animationInProgress = false;
        this.animationFrame = 0;
    }

    add(...objectsToAdd) {
        this.objects.push(...objectsToAdd);
    }

    step() {
        if (!this.animationInProgress) {
            return;
        }
        this.animationFrame += 1;
        // TODO: loop through objects and update accordingly; this is mostly relevant for animations
    }

    draw() {
        this.canvas.clear();
        this.canvas.drawDrawingArea();
        // TODO: this will need to handle all sorts of objects that aren't just points
        for (let objectToDraw of this.objects) {
            this.canvas.renderer.beginPath();
            this.canvas.renderer.arc(...this.canvas.convertLogicalCoordinatesToPhysical(objectToDraw.x, objectToDraw.y), 5, 0, 2 * Math.PI);
            this.canvas.renderer.fill();
        }
    }

}

const LOGICAL_WIDTH = 600;
const LOGICAL_HEIGHT = 400

const drawingCanvas = new Canvas(canvas, renderer, LOGICAL_WIDTH, LOGICAL_HEIGHT);
const drawing = new DrawingManager(drawingCanvas);

/*
 * ------------------------------------------------
 * Initialize the animation status paragraph element
 * ------------------------------------------------
 */
const animationStatusParagraph = document.getElementById("animation-status");
const updateStatusText = (statusText) => animationStatusParagraph.textContent = statusText;

/*
 * ------------------------------------------------
 * Initialize the points input text area element
 * ------------------------------------------------
 */
const pointsInputElement = document.getElementById("points-input");
let previousText = "";
let points = [];
const handlePointsInput = () => {
    const currentText = pointsInputElement.value;
    if (currentText === previousText) {
        return;
    }
    previousText = currentText;

    // TODO: update status text if animation was interrupted
    drawing.clear();

    let newPoints = [];
    try {
        newPoints = JSON.parse(`[${currentText.replaceAll("(", "[").replaceAll(")", "]")}]`);
        // TODO: validate points: the object should be valid (i.e. what we're expecting), and the points must be in the range
        updateStatusText(`Parsed ${newPoints.length} points!`);
    } catch (e) {
        updateStatusText(`Couldn't parse points:\n${e}`);
        return;
    }
    
    points = newPoints;
    drawing.add(...points.map(point => new Point(point[0], point[1])));
};
pointsInputElement.onchange = handlePointsInput;
handlePointsInput();

/*
 * ------------------------------------------------
 * Set up buttons to add randomly generated points
 * ------------------------------------------------
 */
const addRandomPointsToPointsInput = (numberOfPoints) => {
    const pointsToAdd = [...Array(numberOfPoints).keys()].map(i => [Math.floor(Math.random() * LOGICAL_WIDTH), Math.floor(Math.random() * LOGICAL_HEIGHT)]);
    if (pointsInputElement.value) {
        pointsInputElement.value += ", ";
    }
    let pointsToAddString = JSON.stringify(pointsToAdd);
    pointsInputElement.value += pointsToAddString
        .substring(1, pointsToAddString.length - 1) // Get rid of outside brackets
        .replaceAll("[", "(")
        .replaceAll("]", ")")
        .replaceAll(",", ", ");
    handlePointsInput();
};
const generateOneRandomPointButton = document.getElementById("generate-one-random-point-button");
const generateTenRandomPointsButton = document.getElementById("generate-ten-random-points-button");
const clearButton = document.getElementById("clear-button");
generateOneRandomPointButton.onclick = () => addRandomPointsToPointsInput(1);
generateTenRandomPointsButton.onclick = () => addRandomPointsToPointsInput(10);
clearButton.onclick = () => {
    pointsInputElement.value = "";
    handlePointsInput();
};

/*
 * ------------------------------------------------
 * Implement convex hull algorithms
 * ------------------------------------------------
 */
const makeJarvisMarchAnimation = (points) => {
    console.log("Consider Jarvis to be marched!"); // TODO:
    return points.map(point => new Point(point[0], point[1]));
};

const makeGrahamScanAnimation = (points) => {
    console.log("Consider Graham to be scanned!"); // TODO:
    return points.map(point => new Point(point[0], point[1]));
};

/*
 * ------------------------------------------------
 * Initialize buttons to start animations
 * ------------------------------------------------
 */
const jarvisMarchButton = document.getElementById("jarvis-march-button");
const grahamScanButton = document.getElementById("graham-scan-button");
const makeAlgorithmAnimationHandlerFor = (algorithmName, algorithmAnimationCreator) => () => {
    // TODO: update status text if animation was interrupted
    drawing.clear();

    if (points.length < 3) {
        updateStatusText("Not enough points to create a convex hull!");
        return;
    }

    updateStatusText(`${algorithmName} in progress.`);
    drawing.add(...algorithmAnimationCreator(points));
};
jarvisMarchButton.onclick = makeAlgorithmAnimationHandlerFor("Jarvis March", makeJarvisMarchAnimation);
grahamScanButton.onclick = makeAlgorithmAnimationHandlerFor("Graham Scan", makeGrahamScanAnimation);

window.setInterval(() => {
    drawing.step();
    drawing.draw();
    // TODO:
}, 17);