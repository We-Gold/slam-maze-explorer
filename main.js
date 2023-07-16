import "./style.css"

import p5 from "p5"
import { generateMazeBacktracking, braidMaze, solveAStar, generateMazeGrowingTree, supersampleMaze } from "algernon-js"
import { BACKGROUND, CURRENT_PATH, PAST_PATH, PERFECT_PATH, mazeSize } from "./src/constants"
import { renderAgent, renderPath, renderRawMaze } from "./src/render-helpers"
import { createSLAMAgent } from "./src/slam-agent"

let completeMap
let perfectPath1
let perfectPath2

let agent1
let agent1FuturePath = []

let agent2
let agent2FuturePath = []

const mapDimensions = {}

/* Only required if supporting editing
const Mode = {
	EDITING: 0,
	SOLVING: 1
}

let currentMode = Mode.EDITING
*/

const frameRateText = document.querySelector("#frameRate")

const setup = (p) => {
	// Create the canvas to render on
	p.createCanvas(800, 800)

	// Create the full maze (20 x 20, starting at the top left)
	completeMap = generateMazeBacktracking(mazeSize.rows, mazeSize.cols)

	const supersampleFactor = 4 // Multiple of 2 for best results

	completeMap = supersampleMaze(completeMap, supersampleFactor)

	// Open up the maze (multiple potential paths)
	braidMaze(completeMap, 0.2)

	// Find the optimal solution (not currently optimal)
	perfectPath1 = solveAStar(
		completeMap,
		[0, 0],
		[0, mazeSize.cols * supersampleFactor - 1]
	)

	perfectPath2 = solveAStar(
		completeMap,
		[0, 0],
		[mazeSize.rows * supersampleFactor - 1, 0]
	)

	// Initialize the SLAM agent
	agent1 = createSLAMAgent(
		completeMap,
		[0, 0],
		[0, mazeSize.cols * supersampleFactor - 1],
		2
	)

	agent2 = createSLAMAgent(
		completeMap,
		[0, 0],
		[mazeSize.rows * supersampleFactor - 1, 0],
		2
	)

	/* Only for editing mode
	// Convert the walled maze to a grid format
	// 1 represents an obstacle, 0 is open
	completeMap = convertRawToGridFormat(backtrackingMaze, OBSTACLE, OPEN)
	*/

	mapDimensions["primaryMap1"] = calculateMazeDimensions(
		completeMap,
		[0, 0],
		[400, 400]
	)

	mapDimensions["secondaryMap1"] = calculateMazeDimensions(
		completeMap,
		[0, 400],
		[400, 800]
	)

	// Create the second column
	mapDimensions["primaryMap2"] = calculateMazeDimensions(
		completeMap,
		[400, 0],
		[800, 400]
	)

	mapDimensions["secondaryMap2"] = calculateMazeDimensions(
		completeMap,
		[400, 400],
		[800, 800]
	)
}

const calculateMazeDimensions = (maze, topLeft, bottomRight) => {
	const [rows, cols] = [maze.length, maze[0].length]

	const [x1, y1] = topLeft
	const [x2, y2] = bottomRight

	const [w, h] = [Math.floor((x2 - x1) / cols), Math.floor((y2 - y1) / rows)]

	return [rows, cols, w, h, x1, y1]
}

const render = (p) => {
	p.background(BACKGROUND)

	renderRawMaze(p, agent1.getInternalMap(), mapDimensions["primaryMap1"])
	renderRawMaze(p, agent2.getInternalMap(), mapDimensions["primaryMap2"])
	renderRawMaze(p, completeMap, mapDimensions["secondaryMap1"])
	renderRawMaze(p, completeMap, mapDimensions["secondaryMap2"])

	// Render the "perfect" solution to the secondary map
	renderPath(
		p,
		perfectPath1,
		PERFECT_PATH,
		mapDimensions["secondaryMap1"]
	)

	renderPath(
		p,
		perfectPath2,
		PERFECT_PATH,
		mapDimensions["secondaryMap2"]
	)

	const updateRate = 1

	// Set a particular update rate
	if (p.frameCount % updateRate === 0) {
		agent1FuturePath = agent1.moveWithPlanner()
		agent2FuturePath = agent2.moveWithPlanner()
	}

	// Render the first agent
	renderPath(p, agent1FuturePath, CURRENT_PATH, mapDimensions["primaryMap1"])
	renderPath(p, agent1.getAgentPath(), PAST_PATH, mapDimensions["primaryMap1"])

	renderAgent(p, agent1.getCurrentPosition(), mapDimensions["primaryMap1"])

	// Render the second agent
	renderPath(p, agent2FuturePath, CURRENT_PATH, mapDimensions["primaryMap2"])
	renderPath(p, agent2.getAgentPath(), PAST_PATH, mapDimensions["primaryMap2"])

	renderAgent(p, agent2.getCurrentPosition(), mapDimensions["primaryMap2"])

	frameRateText.innerHTML = Math.round(p.frameRate())
}

const keyPressed = (p) => {
	if (p.keyCode === p.UP_ARROW) {
		agent1.moveManual([-1, 0])
	} else if (p.keyCode === p.DOWN_ARROW) {
		agent1.moveManual([1, 0])
	}
	if (p.keyCode === p.LEFT_ARROW) {
		agent1.moveManual([0, -1])
	} else if (p.keyCode === p.RIGHT_ARROW) {
		agent1.moveManual([0, 1])
	}
}

/* Editing support, mainly available if using grid format
const mousePressed = (p) => {
	// Only allow editing cells when in EDITING mode
	if (currentMode !== Mode.EDITING) return

	const [ , , w, h] = mapDimensions["primaryMap"]
	const [x, y] = [p.mouseX, p.mouseY]

	// Prevent invalid events
	if (x < 0 || x > p.width || y < 0 || y > p.height) return

	// Determine the current cell
	const [row, col] = [Math.floor(y / h), Math.floor(x / w)]

	// Toggle the current cell in the grid (switch to simple state machine later)
	completeMap[row][col] = !completeMap[row][col]
}
*/

const sketch = (p) => {
	// Initialize the setup and draw methods
	p.setup = () => setup(p)
	p.draw = () => render(p)
	p.keyPressed = () => keyPressed(p)
	// p.mousePressed = (e) => mousePressed(p, e)
}

const P5 = new p5(sketch)

