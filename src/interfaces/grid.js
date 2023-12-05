import { helpers } from "algernon-js"
import { createPosition } from "./components"

/**
 * @typedef {Object} Observation
 * @property {Position} index - The index of the observation
 * @property {boolean} value - The value of the observation
 * @property {boolean} [isEnd] - Whether or not the observation is the end position
 */

/**
 * @typedef {Object} OccupancyGrid
 * @property {function} setEndPosition - Sets the end position of the environment
 * @property {function} getEndPosition - Returns the end position of the environment or null
 * @property {function(): boolean[][]} getGrid - Returns the internal grid
 * @property {function(): [number, number]} getDimensions - Returns the dimensions of the grid
 * @property {function(Position, number): Observation[]} getRectObservation - Returns a rectangular observation from the grid
 * @property {function(): Observation[]} getAllObservations - Returns a list of all observations in the grid
 * @property {function(Observation[]): void} updateWithObservations - Modifies the grid based on a set of observations
 * @property {function} filterNewObservations - Returns of only the observations that are new
 */

/**
 * Creates an interface for interacting with the occupancy grid
 * @param {boolean[][]} sourceGrid the internal grid
 * @returns {OccupancyGrid} an interface for getting observations from the grid
 */
export const createOccupancyGrid = (sourceGrid) => {
	// Extract the dimensions of the maze
	const [rows, cols] = [sourceGrid.length, sourceGrid[0].length]

	// Helper method for observation methods
	const cellIsValid = ([row, col]) =>
		row >= 0 && row < rows && col >= 0 && col < cols

	const getGrid = () => sourceGrid
	const getDimensions = () => [rows, cols]

	// Enable storing the end position of the environment
	let endPosition = null

	const setEndPosition = (position) => (endPosition = position)
	const getEndPosition = () => endPosition

	/**
	 * Returns a rectangular observation from the given occupancy grid
	 * @param {Position} position
	 * @param {number} radius
	 * @returns {Observation[]} a list of observations
	 */
	const getRectObservation = (position, radius) => {
		const [currentRow, currentCol] = position.getCoordinate()

		// Each observation has an index and a value
		const observations = []

		// If this region contains the goal, send it as an observation
		if (rectContainsPosition(position, radius, endPosition))
			observations.push({
				index: createPosition(
					endPosition.getRow(),
					endPosition.getCol()
				),
				value: false,
				isEnd: true,
			})

		// Add all values within the rectangle to the observation
		for (let row = currentRow - radius; row < currentRow + radius; row++) {
			for (
				let col = currentCol - radius;
				col < currentCol + radius;
				col++
			) {
				if (cellIsValid([row, col]) && sourceGrid[row][col])
					observations.push({
						index: createPosition(row, col),
						value: true,
					})
			}
		}

		return observations
	}

	/**
	 * Returns a list of all observations in the occupancy grid
	 * @returns {Observation[]} a list of observations
	 */
	const getAllObservations = () => {
		// Each observation has an index and a value
		const observations = []

		// Add the end position to the set of observations if known
		if (endPosition !== null)
			observations.push({
				index: createPosition(
					endPosition.getRow(),
					endPosition.getCol()
				),
				value: false,
				isEnd: true,
			})

		// Add all values within the rectangle to the observation
		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				// Store the observation as long as it encodes new information
				if (sourceGrid[row][col])
					observations.push({
						index: createPosition(row, col),
						value: true,
					})
			}
		}

		return observations
	}

	/**
	 * Modifies the occupancy grid based on a set of observations.
	 * @param {Observation[]} observations a list of observations
	 */
	const updateWithObservations = (observations) => {
		// Store the end position if it comes in as an observation
		if (observations?.[0]?.isEnd) setEndPosition(observations[0].index)

		for (const { index, value } of observations) {
			sourceGrid[index.getRow()][index.getCol()] = value
		}
	}

	/**
	 * Returns a list of only the observations that are new.
	 * @param {Observation[]} observations a list of observations
	 * @returns A list of new observations
	 */
	const filterNewObservations = (observations) => {
		return observations.filter(({ index, value, isEnd }) => {
			const _isEnd = isEnd !== undefined && isEnd
			return (
				_isEnd || sourceGrid[index.getRow()][index.getCol()] !== value
			)
		})
	}

	return {
		setEndPosition,
		getEndPosition,
		getGrid,
		getDimensions,
		getRectObservation,
		getAllObservations,
		updateWithObservations,
		filterNewObservations,
	}
}

const rectContainsPosition = (centerPos, radius, otherPos) => {
	const rowDist = Math.abs(centerPos.getRow() - otherPos.getRow())
	const colDist = Math.abs(centerPos.getCol() - otherPos.getCol())

	return rowDist <= radius && colDist <= radius
}

/**
 * Creates an occupancy grid of a given size, with all cells initialized to empty.
 * @param {number} rows
 * @param {number} cols
 * @returns {OccupancyGrid}
 */
export const createEmptyOccupancyGrid = (rows, cols) => {
	const emptyGrid = helpers.createFilledMatrix(rows, cols, false)

	return createOccupancyGrid(emptyGrid)
}

