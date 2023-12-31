import { helpers } from "algernon-js"
import {
	AGENT,
	AGENT_FOUND_END,
	BACKGROUND,
	END,
	MAX_DENSITY_COLOR,
	WALL,
} from "../constants"

/**
 * Render a maze within the given region.
 *
 * Assumes that the background is black, and the obstacles and walls will be white.
 *
 * @param {*} p p5 object
 * @param {boolean[][]} maze Maze matrix with true as a wall and false as open
 * @param {number[]} dimensions [rows, cols, w, h]
 */
export const renderGridMaze = (p, maze, dimensions) => {
	const [rows, cols, w, h, x1, y1] = dimensions

	p.stroke(BACKGROUND)
	p.strokeWeight(1)
	p.fill(WALL)

	// Render all obstacles
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			if (maze[row][col]) {
				const [x, y] = [x1 + col * w, y1 + row * h]

				// Render a rectangle to represent the obstacle
				p.rect(x, y, w, h)
			}
		}
	}
}

/**
 * Render a maze within the given region.
 *
 * Assumes that the background is black, and the walls will be white.
 *
 * @param {*} p p5 object
 * @param {number[][]} maze Maze matrix with binary representation of walls
 * @param {number[]} dimensions [rows, cols, w, h]
 */
export const renderRawMaze = (p, maze, dimensions) => {
	const [rows, cols, w, h, x1, y1] = dimensions

	p.stroke(WALL)
	p.strokeWeight(2)
	p.noFill()

	// Render all walls
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const [x, y] = [x1 + col * w, y1 + row * h]

			if (
				helpers.cellIs(helpers.North, helpers.cellAt([row, col], maze))
			) {
				p.line(x, y, x + w, y)
			}

			if (
				helpers.cellIs(helpers.South, helpers.cellAt([row, col], maze))
			) {
				p.line(x + w, y + h, x, y + h)
			}

			if (
				helpers.cellIs(helpers.East, helpers.cellAt([row, col], maze))
			) {
				p.line(x + w, y, x + w, y + h)
			}

			if (
				helpers.cellIs(helpers.West, helpers.cellAt([row, col], maze))
			) {
				p.line(x, y + h, x, y)
			}
		}
	}
}

/**
 * Render a maze within the given region.
 *
 * Assumes that the background is black, and the obstacles and walls will be white.
 *
 * @param {*} p p5 object
 * @param {Path} path The path to render on the maze
 * @param {Object} color The r, g, b representing the color of the path
 * @param {number[]} dimensions [rows, cols, w, h]
 */
export const renderPath = (p, path, color, dimensions) => {
	const [, , w, h, x, y] = dimensions

	p.stroke(color.r, color.g, color.b)
	p.strokeWeight(w / 2)
	p.noFill()

	p.beginShape()

	// Add all points in the path to the shape
	for (const position of path.getPositions()) {
		const [row, col] = position.getCoordinate()
		p.vertex(x + col * w + w / 2, y + row * h + h / 2)
	}

	p.endShape()
}

export const renderAgent = (p, position, dimensions, foundEnd = false) => {
	const [, , w, h, x, y] = dimensions

	const color = foundEnd ? AGENT_FOUND_END : AGENT

	p.noStroke()
	p.fill(color.r, color.g, color.b)

	const [row, col] = position.getCoordinate()

	p.circle(x + col * w + w / 2, y + row * h + h / 2, w / 1.5)
}

export const renderEnd = (p, position, dimensions) => {
	const [, , w, h, x, y] = dimensions

	p.noStroke()
	p.fill(END.r, END.g, END.b)

	const [row, col] = position.getCoordinate()

	p.circle(x + col * w + w / 2, y + row * h + h / 2, w / 1.5)
}

export const renderDensityRanges = (p, ranges, dimensions) => {
	const [, , w, h, x, y] = dimensions

	p.noStroke()

	for (const { range, densityProportion } of ranges) {
		const dp = Math.min(densityProportion, 1)

		// Set the fill color based on the density of the area
		p.fill(`rgba(${Math.trunc(MAX_DENSITY_COLOR.r * dp)},
			${Math.trunc(MAX_DENSITY_COLOR.g * dp)},
			${Math.trunc(MAX_DENSITY_COLOR.b * dp)}, 0.5)`)

		const width = (range.endCol - range.startCol) * w
		const height = (range.endRow - range.startRow) * h

		const [_x, _y] = [x + range.startCol * w, y + range.startRow * h]

		// Render a rectangle to represent the obstacle
		p.rect(_x, _y, width, height)
	}
}

