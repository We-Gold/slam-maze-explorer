import { AStarHeuristic, helpers, solveAStarGrid } from "algernon-js"

/**
 * Create a SLAM agent that
 * @param {number[][]} completeMaze
 * @param {number[]} startPosition
 * @param {number[]} goalPosition
 * @param {number} visibleRadius
 */
export const createSLAMAgent = (
	completeMaze,
	startPosition,
	goalPosition,
	visibleRadius = 2
) => {
	// Extract the dimensions of the maze
	const [rows, cols] = [completeMaze.length, completeMaze[0].length]

	// Store the current position of the agent
	let currentPosition = startPosition

	// Store the path the agent has taken
	let agentPath = [startPosition]

	// Create the internal map, which will be updated
	// as the agent explores
	const internalMap = helpers.createFilledMatrix(rows, cols, false)

	// Store updated maze information
	let updatedCellIndices = []
	let originalCellValues = []

	// Update the internal map by observing the surrounding area
	const updateLocalObservation = () => {
		updatedCellIndices = []
		originalCellValues = []

		for (
			let row = currentPosition[0] - visibleRadius;
			row < currentPosition[0] + visibleRadius;
			row++
		) {
			for (
				let col = currentPosition[1] - visibleRadius;
				col < currentPosition[1] + visibleRadius;
				col++
			) {
				// Update the internal map from the complete maze
				if (cellIsValid([row, col])) {
					const currentCellValue = internalMap[row][col]

					internalMap[row][col] = completeMaze[row][col]

					// Record changes for the planner
					updatedCellIndices.push([row, col])
					originalCellValues.push(currentCellValue)
				}
			}
		}
	}

	const cellIsValid = ([row, col]) =>
		row >= 0 && row < rows && col >= 0 && col < cols

	// Explore the initial surrounding area
	updateLocalObservation()

	// Create getter and setter methods for the current position
	const getCurrentPosition = () => currentPosition
	const setCurrentPosition = (updatedPosition) => {
		// Update the current position
		currentPosition = updatedPosition

		// Update the internal map
		updateLocalObservation()
	}

	const getAgentPath = () => agentPath

	// Create a getter method for the internal map
	const getInternalMap = () => internalMap

	const getGoalPosition = () => goalPosition
	const setGoalPosition = (updatedGoal) => {
		// Update the goal position
		goalPosition = updatedGoal
	}

	const moveManual = ([rowMovement, colMovement]) => {
		// Calculate the target position of the movement
		const targetPosition = [
			currentPosition[0] + rowMovement,
			currentPosition[1] + colMovement,
		]

		if (cellIsValid(targetPosition)) {
			setCurrentPosition(targetPosition)
		}
	}

	const moveWithPlanner = () => {
		// No need to move if we are at the goal
		if (
			currentPosition[0] === goalPosition[0] &&
			currentPosition[1] === goalPosition[1]
		)
			return []

		const path = solveAStarGrid(internalMap, currentPosition, goalPosition, AStarHeuristic.manhattan)

		// Move to the next position in the path
		setCurrentPosition(path[1])

		// Store the current point as part of the route
		agentPath.push(path[1])

		return path.slice(1)
	}

	return {
		setGoalPosition,
		getGoalPosition,
		getCurrentPosition,
		getAgentPath,
		getInternalMap,
		moveManual,
		moveWithPlanner,
	}
}

