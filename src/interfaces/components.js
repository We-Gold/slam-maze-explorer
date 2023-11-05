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
