# ConvexHull2D

Final project for CS/MATH 163 at Tufts (https://www.cs.tufts.edu/comp/163/Project_25f.pdf). Accessible at https://saurabhtotey.github.io/ConvexHull2D/ with source at https://github.com/SaurabhTotey/ConvexHull2D/.

## Project Structure

Nothing special besides a web browser is needed to run the animations. One need only open https://saurabhtotey.github.io/ConvexHull2D/ (or `index.html`), put some points in the text box in the console at the right (the canvas is 600 wide and 400 tall, so points should fall in that range), and then choose a convex hull algorithm to visualize. Then the canvas will display how the convex hull is determined via that algorithm.

Page structure is defined in `index.html` and `style.css`, but `script.js` has all the functionality. The major sections of `script.js` are labelled, but the bulk of the code is devoted to handling animations and timing events so that things appear on the canvas as expected. Because the animation infrastructure was determined as I was making this project, a lot of things are labelled misleadingly. Importantly, the DrawingManager maintains a list of 'instructions' and draws according to whichever instructions are determined to be active to give the illusion of animations occurring. The convex hull algorithms mainly serve to generate the animation instructions to show the convex hull creation.

The animations run nominally at ~60 frames per second (one frame every 17 milliseconds), and most animations last for 10 frames.

## Learnings

* The way we learned Graham Scan was to find the left-most point and then Graham Scan can tell us the top and bottom hulls. However, starting with the bottom-most point is how the algorithm was originally proposed.
* One shortcut to take with Jarvis March is that, when looking for the point to connect to in the gift wrapping phase, one can skip checking points that are already in the convex hull. However, the starting point cannot be omitted because that point must be connected to in order to complete the hull.
* When checking if the supplied points were colinear, the most numerically stable method was taking cross products and checking for zeros. Other methods (e.g. checking dot products or determining if the points lie on a line) were more prone to floating point errors.
* I augmented my knowledge about animation structure (e.g. rendering loops, instruction queueus, logical vs. physical coordinates, etc.).