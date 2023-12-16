import "./style.css"

import p5 from "p5"
import {
	braidMaze,
	generateBacktrackingGrid,
	degradeGrid,
	solveAStarGrid,
	supersampleMazeGrid,
	fillGrid,
} from "algernon-js"
import {
	BACKGROUND,
	CURRENT_PATH,
	PAST_PATH,
	defaultConfig,
} from "./src/constants"
import { createOccupancyGrid } from "./src/interfaces/grid"
import { convertCoordsToPath } from "./src/interfaces/motion-planner"
import { createPosition } from "./src/interfaces/components"
import { sampleRegion } from "./src/interfaces/environment"
import { createAgentManager } from "./src/agent/agent-manager"
import { createMazeRenderer } from "./src/rendering/renderer"
import { createStateManager, createTimer, Mode } from "./src/state-manager"

let occupancyGrid
let completeMap
let end
let agentManager
let timer
let stateManager

const maps = {}

const initializeMaze = (config) => {
	initializeMazeRecursive(config)

	occupancyGrid = createOccupancyGrid(completeMap)
	occupancyGrid.setEndPosition(end)
}

const initializeMazeRecursive = (config) => {
	const supersampleFactor = 4 // Multiple of 2 for best results

	const mazeSize = Math.trunc(config.mazeSize / supersampleFactor) - 1

	// Create the full maze
	completeMap = generateBacktrackingGrid(mazeSize, mazeSize)

	// Open up the maze (multiple potential paths)
	braidMaze(completeMap, 0.2)

	completeMap = supersampleMazeGrid(completeMap, supersampleFactor)

	fillGrid(completeMap, 0.1)
	degradeGrid(completeMap, 0.3)

	end = sampleRegion(0, completeMap.length, 0, completeMap[0].length)

	// Since we fill the grid randomly, ensure that the start and end are open
	completeMap[0][0] = false
	completeMap[end.getRow()][end.getCol()] = false

	// Find the optimal solution (not currently optimal)
	const path = convertCoordsToPath(
		solveAStarGrid(completeMap, [0, 0], end.getCoordinate())
	)

	// Recursively regenerate the maze if there is no valid path
	// TODO replace with while loop and keep variables internal
	if (path.length() == 0) initializeMaze(config)
}

const initAgents = (config) => {
	agentManager = createAgentManager(config)

	// Initialize the SLAM agents
	for (let i = 0; i < config.agents; i++)
		agentManager.makeAgent(occupancyGrid, createPosition(0, 0))
}

const setup = (p) => {
	// Create the canvas to render on
	p.createCanvas(800, 800)

	initializeMaze(defaultConfig)

	initAgents(defaultConfig)

	// Create the editing map
	maps.editingMap = createMazeRenderer(
		p,
		calculateMazeDimensions(occupancyGrid, [0, 0], [800, 800])
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

	// TODO: implement graph mode
	if (stateManager.getMode() === Mode.EDITING) {
		maps.editingMap.renderMaze(occupancyGrid.getGrid())
		maps.editingMap.renderEnd(end)
	} else {
		// Have all agents take their next action
		agentManager.act()

		// Update the timer
		timer.updateTimerElement()

		if (
			stateManager.getMode() === Mode.SOLVING ||
			stateManager.getMode() === Mode.SOLVING_GRAPH
		) {
			maps.editingMap.renderMaze(occupancyGrid.getGrid())

			maps.editingMap.renderAgents(agentManager.getAllAgents(), false)

			maps.editingMap.renderEnd(end)
		} else if (stateManager.getMode() === Mode.SOLVING_FOCUS) {
			const agent = agentManager.getAgent(0)

			maps.editingMap.renderMaze(agent.getInternalMap().getGrid())

			agentManager.act()

			// Show the past and future paths of the given agent
			maps.editingMap.renderPathWithColor(
				agent.getFuturePath(),
				CURRENT_PATH
			)
			maps.editingMap.renderPathWithColor(agent.getAgentPath(), PAST_PATH)

			maps.editingMap.renderAgents(agentManager.getAllAgents(), false)
		}

		// Render the end goal
		maps.editingMap.renderEnd(end)

		// Check if all of the agents have reached the goal
		if (
			agentManager
				.getAllAgents()
				.every((agent) => agent.getPosition().equals(end))
		) {
			stateManager.endSimulation()
		}
	}
}

const mousePressed = (p) => {
	// Only allow editing cells when in EDITING mode
	if (stateManager.getMode() !== Mode.EDITING) return

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

const P5 = new p5(sketch, "canvas-container")

// Initialize DOM
document.addEventListener("DOMContentLoaded", () => {
	stateManager = createStateManager()

	// Initialize the timer
	timer = createTimer(document.getElementById("timer"))

	stateManager.setBeginSimButtonCallback((button, config, newMode) => {
		if (newMode !== Mode.EDITING) {
			if (config.mazeSize !== defaultConfig.mazeSize)
				// TODO: store previous size
				initializeMaze(config)

			initAgents(config)

			// Update button text
			button.textContent = `End Simulation`

			// Reset the timer
			timer.reset()
		} else {
			// Update button text
			button.textContent = `Begin Simulation`
		}
	})
})

