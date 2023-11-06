import { helpers } from "algernon-js"
import { createPosition } from "./components"

/**
 * @typedef {Object} Observation
 * @property {Position} index - The index of the observation
 * @property {boolean} value - The value of the observation
 */

/**
 * @typedef {Object} OccupancyGrid
 * @property {function(): boolean[][]} getGrid - Returns the internal grid
 * @property {function(): [number, number]} getDimensions - Returns the dimensions of the grid
 * @property {function(Position, number): Observation[]} getRectObservation - Returns a rectangular observation from the grid
 * @property {function(): Observation[]} getAllObservations - Returns a list of all observations in the grid
 * @property {function(Observation[]): void} updateWithObservations - Modifies the grid based on a set of observations
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
		for (const { index, value } of observations) {
			sourceGrid[index.getRow()][index.getCol()] = value
		}
	}

	return {
		getGrid,
		getDimensions,
		getRectObservation,
		getAllObservations,
		updateWithObservations,
	}
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

