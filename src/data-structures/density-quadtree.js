const MAX_DEPTH = 3

/**
 * Creates a quadtree for a grid-based environment that
 * is based on density, and doesn't actually track specific points.
 * @param {number} rows
 * @param {number} cols
 * @param {number} [densityThreshold]
 */
export const createDensityQuadtree = (rows, cols) => {
	const root = makeQuadtreeNode([], 0, rows, 0, cols, rows * cols, MAX_DEPTH)

	const addPosition = (position) => root.addPosition(position)
	const findMinDensity = () => root.findMinDensity()
	const collectDensityRanges = () => root.collectDensityRanges()

	return { addPosition, findMinDensity, collectDensityRanges }
}

const makeQuadtreeNode = (
	initialPoints,
	startRow,
	endRow,
	startCol,
	endCol,
	area,
	depthRemaining
) => {
	let points = initialPoints
	let topLeft, topRight, bottomLeft, bottomRight
	let isSplit = false

	const midRow = Math.floor(startRow + (endRow - startRow) / 2)
	const midCol = Math.floor(startCol + (endCol - startCol) / 2)

	const splitThreshold = area / 16

	const splitNode = () => {
		let topLeftPoints = [],
			topRightPoints = [],
			bottomLeftPoints = [],
			bottomRightPoints = []

		// Sort points into their respective quadrants
		for (const pos of points) {
			const isTop = pos.getRow() <= midRow
			const isLeft = pos.getCol() <= midCol

			if (isTop && isLeft) {
				topLeftPoints.push(pos)
			} else if (isTop && !isLeft) {
				topRightPoints.push(pos)
			} else if (!isTop && isLeft) {
				bottomLeftPoints.push(pos)
			} else if (!isTop && !isLeft) {
				bottomRightPoints.push(pos)
			}
		}

		// Calculate the area of each of the splits
		const newArea = area / 4

		topLeft = makeQuadtreeNode(
			topLeftPoints,
			startRow,
			midRow,
			startCol,
			midCol,
			newArea,
			depthRemaining - 1
		)
		topRight = makeQuadtreeNode(
			topRightPoints,
			startRow,
			midRow,
			midCol,
			endCol,
			newArea,
			depthRemaining - 1
		)
		bottomLeft = makeQuadtreeNode(
			bottomLeftPoints,
			midRow,
			endRow,
			startCol,
			midCol,
			newArea,
			depthRemaining - 1
		)
		bottomRight = makeQuadtreeNode(
			bottomRightPoints,
			midRow,
			endRow,
			midCol,
			endCol,
			newArea,
			depthRemaining - 1
		)

		isSplit = true
		points = []
	}

	const addPosition = (position) => {
		if (!isSplit) {
			points.push(position)

			// Split if the area is dense enough
			if (points.length > splitThreshold && depthRemaining > 0)
				splitNode()

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
			return {
				range: { startRow, endRow, startCol, endCol },
				density: points.length / area,
			}

		const quadrants = [topRight, bottomLeft, bottomRight]

		let min = topLeft.findMinDensity()

		// Find the region with the least density
		for (const quad of quadrants) {
			const _min = quad.findMinDensity()

			if (_min.density < min.density) min = _min
			if (_min.density === min.density && Math.random() > 0.5) min = _min
		}

		return min
	}

	const collectDensityRanges = () => {
		if (!isSplit)
			return [
				{
					range: { startRow, endRow, startCol, endCol },
					densityProportion: points.length / splitThreshold,
				},
			]

		return [topLeft, topRight, bottomLeft, bottomRight]
			.map((node) => node.collectDensityRanges())
			.flat()
	}

	// Split if the area is dense enough
	if (points.length > splitThreshold && !isSplit && depthRemaining > 0)
		splitNode()

	return { addPosition, findMinDensity, collectDensityRanges }
}

