/**
 * Represents a position in the maze.
 * @typedef {Object} Position
 * @property {function(): number} getRow - Returns the row of the position.
 * @property {function(): number} getCol - Returns the column of the position.
 * @property {function(): [number, number]} getCoordinate - Returns the coordinate of the position as an array.
 * @property {function(Position): boolean} equals - Returns true if the given position is equal to this position.
 */

/**
 * Takes in a position as either comma separated values or as an array and
 * creates a new position object.
 * @param {number | number[]} rowOrArray
 * @param {number | undefined} col
 * @returns {Position} the equivalent position object
 */
export const createPosition = (rowOrArray, colOrEmpty) => {
	let [row, col] =
		colOrEmpty === undefined ? rowOrArray : [rowOrArray, colOrEmpty]

	const getRow = () => row
	const getCol = () => col
	const getCoordinate = () => [row, col]
	const equals = (otherPosition) =>
		otherPosition.getRow() === getRow() &&
		otherPosition.getCol() === getCol()

	return { getRow, getCol, getCoordinate, equals }
}

/**
 * Calculates the Manhattan distance between two positions.
 * @param {Position} position1 
 * @param {Position} position2 
 * @returns The distance between the two positions
 */
export const manhattanDistance = (position1, position2) => {
	return (
		Math.abs(position1.getRow() - position2.getRow()) +
		Math.abs(position1.getCol() - position2.getCol())
	)
}

/**
 * Represents a path in the maze.
 * @typedef {Object} Path
 * @property {function(): Position[]} getPositions - Returns an array of positions in the path.
 * @property {function(): number} getLength - Returns the length of the path.
 * @property {function(number): Position} get - Returns the position at the given index
 * @property {function(Position): void} add - Adds the given position to the path
 */

/**
 * Creates a path object from a list of positions
 * @param {Position[]} positions
 * @returns {Path}
 */
export const createPath = (positions) => {
	const get = (i) => positions[i]
	const length = () => positions.length
	const getPositions = () => positions
	const add = (position) => positions.push(position)

	return { get, length, getPositions, add }
}

