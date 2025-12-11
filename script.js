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
	canvas.setAttribute("width", `${window.innerWidth * 0.7}`);
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
        this.renderer.strokeStyle = "black";
        this.renderer.strokeRect(...this.convertLogicalCoordinatesToPhysical(0, this.logicalHeight), ...this.getDrawingAreaSize());
    }

}

class Drawable {
    draw(renderer, canvas) {}
}
class Point extends Drawable {
    constructor(x, y, color = "black") {
        super();
        this.x = x;
        this.y = y;
        this.color = color;
    }

    draw(renderer, canvas) {
        renderer.strokeStyle = this.color;
        renderer.fillStyle = this.color;
        renderer.beginPath();
        const radius = canvas.convertLogicalCoordinatesToPhysical(2, 0)[0];
        renderer.arc(...canvas.convertLogicalCoordinatesToPhysical(this.x, this.y), radius, 0, 2 * Math.PI);
        renderer.fill();

    }
}
class Line extends Drawable {
    constructor(x1, y1, x2, y2, color = "black") {
        super();
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.color = color;
    }

    draw(renderer, canvas) {
        renderer.strokeStyle = this.color;
        renderer.beginPath();
        renderer.moveTo(...canvas.convertLogicalCoordinatesToPhysical(this.x1, this.y1));
        renderer.lineTo(...canvas.convertLogicalCoordinatesToPhysical(this.x2, this.y2));
        renderer.stroke();

    }
}
class Timed {
    constructor(duration, animationStage) {
        this.duration = duration;
        this.animationStage = animationStage;
        this.progress = -1;
    }

    step() {
        this.progress += 1;
    }

    hasStarted() {
        return this.progress >= 0;
    }

    isDone() {
        return this.progress >= this.duration;
    }
}
class Animated extends Timed { // also effectively extends Drawable
    constructor(duration, animationStage, frameToRepresentationFunction) {
        super(duration, animationStage);
        this.frameToRepresentationFunction = frameToRepresentationFunction;
    }

    draw(renderer, canvas) {
        const representation = this.getRepresentation();
        if (representation) {
            representation.draw(renderer, canvas);
        }
    }

    getRepresentation() {
        if (!this.hasStarted()) {
            return null;
        }
        return this.frameToRepresentationFunction(this.progress);
    }
}
class RemovalInstruction extends Timed {
    constructor(delay, animationStage, filterForRemovalFunction) {
        super(delay, animationStage);
        this.filterForRemovalFunction = filterForRemovalFunction;
    }
}

class DrawingManager {

    constructor(canvas) {
        this.canvas = canvas;
        this.objects = [];
        this.animationInProgress = false;
        this.animationStage = 0;
    }

    clear() {
        this.objects = [];
        this.animationInProgress = false;
    }

    add(...objectsToAdd) {
        this.objects.push(...objectsToAdd);
    }

    startAnimation() {
        this.animationStage = 0;
        this.animationInProgress = true;
    }

    step() {
        if (!this.animationInProgress) {
            return;
        }

        let minSeenAnimationStage = Infinity;
        let hasSeenAnimation = false;

        const newObjects = [];
        const filterFunctions = [];
        for (const objectToUpdate of this.objects) {
            if (!objectToUpdate) {
                continue;
            }

            if (objectToUpdate instanceof Timed) {
                hasSeenAnimation = true;
                if (this.animationStage === objectToUpdate.animationStage) {
                    objectToUpdate.step();
                }
                if (objectToUpdate.animationStage < minSeenAnimationStage) {
                    minSeenAnimationStage = objectToUpdate.animationStage;
                }
            }

            if (objectToUpdate instanceof Animated) {
                newObjects.push(objectToUpdate.isDone() ? objectToUpdate.getRepresentation() : objectToUpdate);
            } else if (objectToUpdate instanceof RemovalInstruction) {
                if (objectToUpdate.isDone()) {
                    filterFunctions.push(objectToUpdate.filterForRemovalFunction);
                } else {
                    newObjects.push(objectToUpdate);
                }
            } else {
                newObjects.push(objectToUpdate);
            }
            
        };
        this.objects = newObjects.filter((objectCandidate) => !filterFunctions.some(filterFunction => filterFunction(objectCandidate)));

        this.animationStage = minSeenAnimationStage;

        if (!hasSeenAnimation) {
            updateStatusText("success", "Completed animation!");
            this.animationInProgress = false;
        }
    }

    draw() {
        this.canvas.clear();
        this.canvas.drawDrawingArea();
        for (let objectToDraw of this.objects.filter((obj) => obj && obj.draw)) {
            objectToDraw.draw(this.canvas.renderer, this.canvas);
        }
    }

}

const LOGICAL_WIDTH = 600;
const LOGICAL_HEIGHT = 400;

const drawingCanvas = new Canvas(canvas, renderer, LOGICAL_WIDTH, LOGICAL_HEIGHT);
const drawing = new DrawingManager(drawingCanvas);

/*
 * ------------------------------------------------
 * Initialize the animation status paragraph element
 * ------------------------------------------------
 */
const animationStatusParagraph = document.getElementById("animation-status");
const updateStatusText = (type, statusText) => {
    animationStatusParagraph.className = `status-${type}`;
    animationStatusParagraph.textContent = statusText;
};

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

    let isInterrupting = drawing.animationInProgress;
    drawing.clear();

    let newPoints = [];
    try {
        newPoints = JSON.parse(`[${currentText.replaceAll("(", "[").replaceAll(")", "]")}]`);
        // TODO: validate points: the object should be valid (i.e. what we're expecting), and the points must be in the range
        updateStatusText(isInterrupting ? "info" : "success", (isInterrupting ? "Interrupted previous animation. " : "") + `Parsed ${newPoints.length} points!`);
    } catch (e) {
        updateStatusText("error", (isInterrupting ? "Interrupted previous animation. " : "") + `Couldn't parse points:\n${e}`);
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
    const pointsToAdd = [...Array(numberOfPoints).keys()].map(_ => [Math.floor(Math.random() * LOGICAL_WIDTH), Math.floor(Math.random() * LOGICAL_HEIGHT)]);
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
 * Utility functions
 * ------------------------------------------------
 */
const normalized = (v) => {
    const norm = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    return [v[0] / norm, v[1] / norm];
};
const dot = (v, w) => v[0] * w[0] + v[1] * w[1];
const crossMagnitude = (v, w) => v[0] * w[1] - v[1] * w[0];

/*
 * ------------------------------------------------
 * Implement convex hull algorithms
 * ------------------------------------------------
 */
const makeJarvisMarchAnimation = (points) => {
    // Background points
    const drawables = points.map(point => new Point(point[0], point[1]));
    let currentAnimationStage = 0;

    /*
     * Determine which point has the minimum x coordinate
     */
    const findingMinXPointAnimations = [];
    let pointOfMinX = null;
    for (let point of points) {
        if (pointOfMinX === null || point[0] < pointOfMinX[0] || point[0] === pointOfMinX[0] && point[1] < pointOfMinX[1]) {
            if (pointOfMinX) {
                const removalX = pointOfMinX[0];
                const removalY = pointOfMinX[1];
                findingMinXPointAnimations.push(new RemovalInstruction(
                    0,
                    currentAnimationStage,
                    (drawingObject) => (drawingObject instanceof Point) && drawingObject.x === removalX && drawingObject.y === removalY && drawingObject.color === "blue"
                ));
            }
            pointOfMinX = point;
            findingMinXPointAnimations.push(new Animated(10, currentAnimationStage, (_) => new Point(...point, "blue")));
        } else {
            findingMinXPointAnimations.push(new Animated(10, currentAnimationStage, (frameNumber) => frameNumber < 10 ? new Point(...point, "red") : null));
        }
        currentAnimationStage += 1;
    }
    findingMinXPointAnimations.push(new RemovalInstruction(
        0,
        currentAnimationStage,
        (drawingObject) => (drawingObject instanceof Point) && drawingObject.x === pointOfMinX[0] && drawingObject.y === pointOfMinX[1] && drawingObject.color === "black"
    ));
    drawables.push(...findingMinXPointAnimations);

    /*
     * Define the march procedure to get the next convex hull point
     * Takes in the previous convex hull point and the direction vector that reached the point
     * Returns two values: the first is the next convex hull point and the second is the list of animations to add
     * The returned animations visualize what was checked in order to find the next convex hull point
     */
    const getNextConvexHullPointAndMakeAnimationsFrom = (previousConvexHullPoint, directionVectorToPreviousPoint) => {
        const findingBestLineAnimations = [];
        let pointOfLeastLeftTurn = null;
        let largestDotProductSoFar = -Infinity;
        for (let point of points) {
            if (point[0] === previousConvexHullPoint[0] && point[1] == previousConvexHullPoint[1]) {
                continue;
            }
            const directionToPoint = normalized([point[0] - previousConvexHullPoint[0], point[1] - previousConvexHullPoint[1]]);
            const isPointLeftTurnAway = crossMagnitude(directionVectorToPreviousPoint, directionToPoint) > 0;
            const dotProduct = dot(directionVectorToPreviousPoint, directionToPoint);
            if (isPointLeftTurnAway && dotProduct > largestDotProductSoFar) {
                if (pointOfLeastLeftTurn) {
                    const startX = previousConvexHullPoint[0];
                    const startY = previousConvexHullPoint[1];
                    const endX = pointOfLeastLeftTurn[0];
                    const endY = pointOfLeastLeftTurn[1];
                    findingBestLineAnimations.push(new RemovalInstruction(
                        0,
                        currentAnimationStage,
                        (drawingObject) => (drawingObject instanceof Line)
                            && drawingObject.x1 === startX
                            && drawingObject.y1 === startY
                            && drawingObject.x2 === endX
                            && drawingObject.y2 === endY
                            && drawingObject.color === "blue"
                    ));
                }
                pointOfLeastLeftTurn = point;
                largestDotProductSoFar = dotProduct;
                findingBestLineAnimations.push(new Animated(
                    10,
                    currentAnimationStage,
                    (_) => new Line(...previousConvexHullPoint, ...point, "blue")
                ));
            } else {
                findingBestLineAnimations.push(new Animated(
                    10,
                    currentAnimationStage,
                    (frameNumber) => frameNumber < 10 ? new Line(...previousConvexHullPoint, ...point, "red") : null
                ));
            }
            currentAnimationStage += 1;
        }
        findingBestLineAnimations.push(new Animated(
            10,
            currentAnimationStage,
            (_) => new Point(...pointOfLeastLeftTurn, "blue")
        ));
        findingBestLineAnimations.push(new RemovalInstruction(
            0,
            currentAnimationStage,
            (drawingObject) => (drawingObject instanceof Point) && drawingObject.x === pointOfLeastLeftTurn[0] && drawingObject.y === pointOfLeastLeftTurn[1] && drawingObject.color === "black"
        ));
        return [pointOfLeastLeftTurn, findingBestLineAnimations];
    }
    
    /*
     * Repeatedly run the main procedure for Jarvis March (getNextConvexHullPointAndMakeAnimationsFrom) until all convex hull points are found
     * We know we've found all points when the convex hull closes up on itself (i.e. reaches the starting point)
     */
    let previousPreviousConvexHullPoint = [pointOfMinX[0], pointOfMinX[1] + 1];
    let previousConvexHullPoint = pointOfMinX;
    do {
        const directionToPreviousConvexHullPoint = normalized([previousConvexHullPoint[0] - previousPreviousConvexHullPoint[0], previousConvexHullPoint[1] - previousPreviousConvexHullPoint[1]]);
        const [newConvexHullPoint, newAnimations] = getNextConvexHullPointAndMakeAnimationsFrom(previousConvexHullPoint, directionToPreviousConvexHullPoint);
        drawables.push(...newAnimations);
        previousPreviousConvexHullPoint = [previousConvexHullPoint[0], previousConvexHullPoint[1]];
        previousConvexHullPoint = newConvexHullPoint;
    } while (previousConvexHullPoint[0] !== pointOfMinX[0] || previousConvexHullPoint[1] !== pointOfMinX[1]);

    return drawables;
};

const makeGrahamScanAnimation = (points) => {
    // Background points
    const drawables = points.map(point => new Point(point[0], point[1]));
    let currentAnimationStage = 0;

    /*
     * Determine which point has the minimum y coordinate
     */
    const findingMinXPointAnimations = [];
    let pointOfMinY = null;
    for (let point of points) {
        if (pointOfMinY === null || point[1] < pointOfMinY[1] || point[1] === pointOfMinY[1] && point[0] < pointOfMinY[0]) {
            if (pointOfMinY) {
                const removalX = pointOfMinY[0];
                const removalY = pointOfMinY[1];
                findingMinXPointAnimations.push(new RemovalInstruction(
                    0,
                    currentAnimationStage,
                    (drawingObject) => (drawingObject instanceof Point) && drawingObject.x === removalX && drawingObject.y === removalY && drawingObject.color === "blue"
                ));
            }
            pointOfMinY = point;
            findingMinXPointAnimations.push(new Animated(10, currentAnimationStage, (_) => new Point(...point, "blue")));
        } else {
            findingMinXPointAnimations.push(new Animated(10, currentAnimationStage, (frameNumber) => frameNumber < 10 ? new Point(...point, "red") : null));
        }
        currentAnimationStage += 1;
    }
    findingMinXPointAnimations.push(new RemovalInstruction(
        0,
        currentAnimationStage,
        (drawingObject) => (drawingObject instanceof Point) && drawingObject.x === pointOfMinY[0] && drawingObject.y === pointOfMinY[1] && drawingObject.color === "black"
    ));
    drawables.push(...findingMinXPointAnimations);

    return drawables;
};

const dumbTestAnimation = (points) => {
    const drawables = points.map(point => new Point(point[0], point[1]));
    drawables.push(new Line(0, 200, 600, 200));
    drawables.push(new Animated(500, 0, (frame) => new Line(300, 400, 300, 400 - 400 * frame / 500, frame === 500 ? "blue" : "red")));
    drawables.push(new Animated(500, 0, (frame) => new Line(0, 400, 600 * frame / 500, 400 - 400 * frame / 500)));
    drawables.push(new Animated(500, 1, (frame) => new Line(0, 0, 600 * frame / 500, 400 * frame / 500)));
    return drawables;
}

/*
 * ------------------------------------------------
 * Initialize buttons to start animations
 * ------------------------------------------------
 */
const jarvisMarchButton = document.getElementById("jarvis-march-button");
const grahamScanButton = document.getElementById("graham-scan-button");
const makeAlgorithmAnimationHandlerFor = (algorithmName, algorithmAnimationCreator) => () => {
    let isInterrupting = drawing.animationInProgress;
    drawing.clear();

    if (points.length < 3) {
        updateStatusText("error", "Not enough points to create a convex hull!");
        return;
    }

    // TODO: validate that the points aren't collinear

    updateStatusText("info", (isInterrupting ? "Interrupting previous animation. " : "") + `${algorithmName} in progress.`);
    drawing.add(...algorithmAnimationCreator(points));
    drawing.startAnimation();
};
jarvisMarchButton.onclick = makeAlgorithmAnimationHandlerFor("Jarvis March", makeJarvisMarchAnimation);
grahamScanButton.onclick = makeAlgorithmAnimationHandlerFor("Graham Scan", makeGrahamScanAnimation);

window.setInterval(() => {
    drawing.step();
    drawing.draw();
}, 17);