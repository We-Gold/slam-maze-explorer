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
import { createSLAMAgent } from "./src/agent/slam-agent"
import { createOccupancyGrid } from "./src/interfaces/grid"
import { convertCoordsToPath } from "./src/interfaces/motion-planner"
import { createPosition } from "./src/interfaces/components"

let occupancyGrid

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

	goal1 = createPosition(0, completeMap[0].length - 1)
	goal2 = createPosition(completeMap.length - 1, 0)

	// Since we fill the grid randomly, ensure that the start and goal are open
	completeMap[0][0] = false
	completeMap[goal1.getRow()][goal1.getCol()] = false
	completeMap[goal2.getRow()][goal2.getCol()] = false

	// Find the optimal solution (not currently optimal)
	perfectPath1 = convertCoordsToPath(solveAStarGrid(completeMap, [0, 0], goal1.getCoordinate()))

	perfectPath2 = convertCoordsToPath(solveAStarGrid(completeMap, [0, 0], goal2.getCoordinate()))

	// Recursively regenerate the maze if there is no valid path
	// TODO replace with while loop and keep variables internal
	if (perfectPath1.length() == 0 || perfectPath2.length() == 0) initializeMaze()
}

const setup = (p) => {
	// Create the canvas to render on
	p.createCanvas(800, 800)

	initializeMaze()

	occupancyGrid = createOccupancyGrid(completeMap)

	// Initialize the SLAM agents
	agent1 = createSLAMAgent(occupancyGrid, createPosition(0, 0), goal1, 3)

	agent2 = createSLAMAgent(occupancyGrid, createPosition(0, 0), goal2, 3)

	// Create the dimensions for the editing map
	mapDimensions["editingMap"] = calculateMazeDimensions(
		occupancyGrid,
		[0, 0],
		[800, 800]
	)

	// Create the first column
	mapDimensions["primaryMap1"] = calculateMazeDimensions(
		occupancyGrid,
		[0, 0],
		[400, 400]
	)

	mapDimensions["secondaryMap1"] = calculateMazeDimensions(
		occupancyGrid,
		[0, 400],
		[400, 800]
	)

	// Create the second column
	mapDimensions["primaryMap2"] = calculateMazeDimensions(
		occupancyGrid,
		[400, 0],
		[800, 400]
	)

	mapDimensions["secondaryMap2"] = calculateMazeDimensions(
		occupancyGrid,
		[400, 400],
		[800, 800]
	)
}

const calculateMazeDimensions = (occupancyGrid, topLeft, bottomRight) => {
	const [rows, cols] = occupancyGrid.getDimensions()

	const [x1, y1] = topLeft
	const [x2, y2] = bottomRight

	const [w, h] = [(x2 - x1) / cols, (y2 - y1) / rows]

	return [rows, cols, w, h, x1, y1]
}

const render = (p) => {
	p.background(BACKGROUND)

	if (currentMode === Mode.SOLVING) {
		// TODO: This type of getter potentially exposes too much
		renderGridMaze(p, agent1.getInternalMap().getGrid(), mapDimensions["primaryMap1"])
		renderGridMaze(p, agent2.getInternalMap().getGrid(), mapDimensions["primaryMap2"])
		renderGridMaze(
			p,
			occupancyGrid.getGrid(),
			mapDimensions["secondaryMap1"]
		)
		renderGridMaze(
			p,
			occupancyGrid.getGrid(),
			mapDimensions["secondaryMap2"]
		)

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
			agent1.getPosition(),
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
			agent2.getPosition(),
			mapDimensions["primaryMap2"]
		)

		frameRateText.textContent = `FPS: ${Math.round(p.frameRate())}`
	} else if (currentMode === Mode.EDITING) {
		renderGridMaze(p, occupancyGrid.getGrid(), mapDimensions["editingMap"])
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

			// Initialize the SLAM agents
			agent1 = createSLAMAgent(occupancyGrid, createPosition(0, 0), goal1, 3)

			agent2 = createSLAMAgent(occupancyGrid, createPosition(0, 0), goal2, 3)

			// Update button text
			modeButton.textContent = `Cancel`
		} else {
			currentMode = Mode.EDITING

			// Update button text
			modeButton.textContent = `Start`
		}
	})
})
