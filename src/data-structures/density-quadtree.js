const DENSITY_THRESHOLD = 25
const MAX_DEPTH = 5

/**
 * Creates a quadtree for a grid-based environment that
 * is based on density, and doesn't actually track specific points.
 * @param {number} rows
 * @param {number} cols
 * @param {number} [densityThreshold]
 */
export const createDensityQuadtree = (rows, cols) => {
	const root = makeQuadtreeNode(
		0,
		0,
		rows - 1,
		0,
		cols - 1,
		DENSITY_THRESHOLD,
		MAX_DEPTH
	)

	const addPosition = (position) => root.addPosition(position)
	const findMinDensity = () => root.findMinDensity()

	return { addPosition, findMinDensity }
}

const makeQuadtreeNode = (
	totalDensity,
	startRow,
	endRow,
	startCol,
	endCol,
	densityThreshold,
	depthRemaining
) => {
	let density = totalDensity
	let topLeft, topRight, bottomLeft, bottomRight
	let isSplit = false

	const midRow = Math.floor(startRow + (endRow - startRow) / 2)
	const midCol = Math.floor(startCol + (endCol - startCol) / 2)

	const splitNode = () => {
		const avgDensity = density / 4

		topLeft = makeQuadtreeNode(
			avgDensity,
			startRow,
			midRow,
			startCol,
			midCol,
			depthRemaining - 1
		)
		topRight = makeQuadtreeNode(
			avgDensity,
			startRow,
			midRow,
			midCol,
			endCol,
			depthRemaining - 1
		)
		bottomLeft = makeQuadtreeNode(
			avgDensity,
			midRow,
			endRow,
			startCol,
			midCol,
			depthRemaining - 1
		)
		bottomRight = makeQuadtreeNode(
			avgDensity,
			midRow,
			endRow,
			midCol,
			endCol,
			depthRemaining - 1
		)

		isSplit = true
		density = 0
	}

	const addPosition = (position) => {
		if (!isSplit) {
			density++

			// Split if the area is dense enough
			if (density > densityThreshold && depthRemaining > 0) splitNode()

			return
		}

		const isTop = position.getRow() <= midRow
		const isLeft = position.getCol() <= midCol

		if (isTop && isLeft) {
			topLeft.addPosition(position)
		} else if (isTop && !isLeft) {
			topRight.addPosition(position)
		} else if (!isTop && isLeft) {
			bottomLeft.addPosition(position)
		} else if (!isTop && !isLeft) {
			bottomRight.addPosition(position)
		}
	}

	const findMinDensity = () => {
		if (!isSplit)
			return { range: { startRow, endRow, startCol, endCol }, density }

		const quadrants = [topRight, bottomLeft, bottomRight]

		let min = topLeft.findMinDensity()

		// Find the region with the least density
		for (const quad of quadrants) {
			const _min = quad.findMinDensity()

			if (_min.density < min.density) min = _min
		}

		return min
	}

	// Split if the area is dense enough
	if (density > densityThreshold && !isSplit && depthRemaining > 0)
		splitNode()

	return { addPosition, findMinDensity }
}

