import "./style.css"

import p5 from "p5"
import {
	braidMaze,
	generateBacktrackingGrid,
	supersampleMazeGridSparse,
	degradeGrid,
	solveAStarGrid,
	supersampleMazeGrid,
	fillGrid,
} from "algernon-js"
import {
	BACKGROUND,
	CURRENT_PATH,
	PAST_PATH,
	PERFECT_PATH,
	mazeSize,
} from "./src/constants"
import { renderAgent, renderGridMaze, renderPath } from "./src/render-helpers"
import { createSLAMAgent } from "./src/slam-agent"

let completeMap
let perfectPath1
let perfectPath2

let agent1
let agent1FuturePath = []

let agent2
let agent2FuturePath = []

let goal1
let goal2

const mapDimensions = {}

const Mode = {
	EDITING: 0,
	SOLVING: 1,
}

let currentMode = Mode.EDITING

const frameRateText = document.querySelector("#frameRate")

const initializeMaze = () => {
	// Create the full maze
	completeMap = generateBacktrackingGrid(mazeSize.rows, mazeSize.cols)

	// Open up the maze (multiple potential paths)
	braidMaze(completeMap, 0.2)

	const supersampleFactor = 4 // Multiple of 2 for best results

	completeMap = supersampleMazeGrid(completeMap, supersampleFactor)

	fillGrid(completeMap, 0.1)
	degradeGrid(completeMap, 0.3)

	goal1 = [0, completeMap[0].length - 1]
	goal2 = [completeMap.length - 1, 0]

	// Since we fill the grid randomly, ensure that the start and goal are open
	completeMap[0][0] = false
	completeMap[goal1[0]][goal1[1]] = false
	completeMap[goal2[0]][goal2[1]] = false

	// Find the optimal solution (not currently optimal)
	perfectPath1 = solveAStarGrid(completeMap, [0, 0], goal1)

	perfectPath2 = solveAStarGrid(completeMap, [0, 0], goal2)

	// Recursively regenerate the maze if there is no path
	if (perfectPath1.length == 0 || perfectPath2.length == 0) initializeMaze()
}

const setup = (p) => {
	// Create the canvas to render on
	p.createCanvas(800, 800)

	initializeMaze()

	// Initialize the SLAM agent
	agent1 = createSLAMAgent(completeMap, [0, 0], goal1, 3)

	agent2 = createSLAMAgent(completeMap, [0, 0], goal2, 3)

	// Create the dimensions for the editing map
	mapDimensions["editingMap"] = calculateMazeDimensions(
		completeMap,
		[0, 0],
		[800, 800]
	)

	// Create the first column
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

	const [w, h] = [(x2 - x1) / cols, (y2 - y1) / rows]

	return [rows, cols, w, h, x1, y1]
}

const render = (p) => {
	p.background(BACKGROUND)

	if (currentMode === Mode.SOLVING) {
		renderGridMaze(p, agent1.getInternalMap(), mapDimensions["primaryMap1"])
		renderGridMaze(p, agent2.getInternalMap(), mapDimensions["primaryMap2"])
		renderGridMaze(p, completeMap, mapDimensions["secondaryMap1"])
		renderGridMaze(p, completeMap, mapDimensions["secondaryMap2"])

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

		// Set a particular update rate
		agent1FuturePath = agent1.moveWithPlanner()
		agent2FuturePath = agent2.moveWithPlanner()

		// Render the first agent
		renderPath(
			p,
			agent1FuturePath,
			CURRENT_PATH,
			mapDimensions["primaryMap1"]
		)
		renderPath(
			p,
			agent1.getAgentPath(),
			PAST_PATH,
			mapDimensions["primaryMap1"]
		)

		renderAgent(
			p,
			agent1.getCurrentPosition(),
			mapDimensions["primaryMap1"]
		)

		// Render the second agent
		renderPath(
			p,
			agent2FuturePath,
			CURRENT_PATH,
			mapDimensions["primaryMap2"]
		)
		renderPath(
			p,
			agent2.getAgentPath(),
			PAST_PATH,
			mapDimensions["primaryMap2"]
		)

		renderAgent(
			p,
			agent2.getCurrentPosition(),
			mapDimensions["primaryMap2"]
		)

		frameRateText.textContent = `FPS: ${Math.round(p.frameRate())}`
	} else if (currentMode === Mode.EDITING) {
		renderGridMaze(p, completeMap, mapDimensions["editingMap"])
	}
}

const mousePressed = (p) => {
	// Only allow editing cells when in EDITING mode
	if (currentMode !== Mode.EDITING) return

	const [, , w, h] = mapDimensions["editingMap"]
	const [x, y] = [p.mouseX, p.mouseY]

	// Prevent invalid events
	if (x < 0 || x > p.width || y < 0 || y > p.height) return

	// Determine the current cell
	const [row, col] = [Math.floor(y / h), Math.floor(x / w)]

	// Toggle the current cell in the grid (switch to simple state machine later)
	completeMap[row][col] = !completeMap[row][col]
}

const sketch = (p) => {
	// Initialize the setup and draw methods
	p.setup = () => setup(p)
	p.draw = () => render(p)
	p.mousePressed = (e) => mousePressed(p, e)
}

const P5 = new p5(sketch)

// Initialize DOM
document.addEventListener("DOMContentLoaded", () => {
	const modeButton = document.querySelector(".modeButton")

	modeButton.addEventListener("click", () => {
		if (currentMode === Mode.EDITING) {
			currentMode = Mode.SOLVING

			// Find the optimal solution (not currently optimal)
			perfectPath1 = solveAStarGrid(completeMap, [0, 0], goal1)

			perfectPath2 = solveAStarGrid(completeMap, [0, 0], goal2)

			// Update button text
			modeButton.textContent = `Cancel`
		} else {
			currentMode = Mode.EDITING

			// Update button text
			modeButton.textContent = `Start`
		}
	})
})