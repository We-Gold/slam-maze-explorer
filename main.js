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
import { createOccupancyGrid } from "./src/interfaces/grid"
import { convertCoordsToPath } from "./src/interfaces/motion-planner"
import { createPosition } from "./src/interfaces/components"
import { sampleRegion } from "./src/interfaces/environment"
import { createAgentManager } from "./src/agent/agent-manager"
import { createMazeRenderer } from "./src/rendering/renderer"

let occupancyGrid

let completeMap
let perfectPath1
let perfectPath2

let agent1
let agent2

let goal

let agentManager

const maps = {}

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

	goal = sampleRegion(0, completeMap.length, 0, completeMap[0].length)

	// Since we fill the grid randomly, ensure that the start and goal are open
	completeMap[0][0] = false
	completeMap[goal.getRow()][goal.getCol()] = false

	// Find the optimal solution (not currently optimal)
	perfectPath1 = convertCoordsToPath(
		solveAStarGrid(completeMap, [0, 0], goal.getCoordinate())
	)

	perfectPath2 = convertCoordsToPath(
		solveAStarGrid(completeMap, [0, 0], goal.getCoordinate())
	)

	// Recursively regenerate the maze if there is no valid path
	// TODO replace with while loop and keep variables internal
	if (perfectPath1.length() == 0 || perfectPath2.length() == 0)
		initializeMaze()
}

const initAgents = () => {
	agentManager = createAgentManager()

	// Initialize the SLAM agents
	agent1 = agentManager.makeAgent(occupancyGrid, createPosition(0, 0))
	agent2 = agentManager.makeAgent(occupancyGrid, createPosition(0, 0))
}

const setup = (p) => {
	// Create the canvas to render on
	p.createCanvas(800, 800)

	initializeMaze()

	occupancyGrid = createOccupancyGrid(completeMap)

	initAgents()

	// Create the editing map
	maps.editingMap = createMazeRenderer(
		p,
		calculateMazeDimensions(occupancyGrid, [0, 0], [800, 800])
	)

	// Create the first column
	maps.primaryMap1 = createMazeRenderer(
		p,
		calculateMazeDimensions(occupancyGrid, [0, 0], [400, 400])
	)

	maps.secondaryMap1 = createMazeRenderer(
		p,
		calculateMazeDimensions(occupancyGrid, [0, 400], [400, 800])
	)

	// Create the second column
	maps.primaryMap2 = createMazeRenderer(
		p,
		calculateMazeDimensions(occupancyGrid, [400, 0], [800, 400])
	)

	maps.secondaryMap2 = createMazeRenderer(
		p,
		calculateMazeDimensions(occupancyGrid, [400, 400], [800, 800])
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
		// Render currrent agent maps
		maps.primaryMap1.renderMaze(agent1.getInternalMap().getGrid())
		maps.primaryMap2.renderMaze(agent2.getInternalMap().getGrid())

		// Render solution maps
		maps.secondaryMap1.renderMaze(occupancyGrid.getGrid())
		maps.secondaryMap2.renderMaze(occupancyGrid.getGrid())

		// Render the "perfect" solution to the secondary map
		maps.secondaryMap1.renderPathWithColor(perfectPath1, PERFECT_PATH)
		maps.secondaryMap2.renderPathWithColor(perfectPath2, PERFECT_PATH)

		agentManager.act()

		// Render the first agent's path
		maps.primaryMap1.renderPathWithColor(
			agent1.getFuturePath(),
			CURRENT_PATH
		)
		maps.primaryMap1.renderPathWithColor(agent1.getAgentPath(), PAST_PATH)
		maps.primaryMap1.renderAgents([agent1])
		maps.primaryMap1.renderGoal(goal)

		// Render the second agent's path
		maps.primaryMap2.renderPathWithColor(
			agent2.getFuturePath(),
			CURRENT_PATH
		)
		maps.primaryMap2.renderPathWithColor(agent2.getAgentPath(), PAST_PATH)
		maps.primaryMap2.renderAgents([agent2])
		maps.primaryMap2.renderGoal(goal)

		frameRateText.textContent = `FPS: ${Math.round(p.frameRate())}`
	} else if (currentMode === Mode.EDITING) {
		maps.editingMap.renderMaze(occupancyGrid.getGrid())
		maps.editingMap.renderGoal(goal)
	}
}

const mousePressed = (p) => {
	// Only allow editing cells when in EDITING mode
	if (currentMode !== Mode.EDITING) return

	const [, , w, h] = maps.editingMap.getDimensions()
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

			initAgents()

			// Update button text
			modeButton.textContent = `Cancel`
		} else {
			currentMode = Mode.EDITING

			// Update button text
			modeButton.textContent = `Start`
		}
	})
})

