import { CURRENT_PATH, PAST_PATH } from "../constants"
import {
	renderAgent,
	renderGridMaze,
	renderPath,
	renderEnd as renderEndPosition,
} from "./render-helpers"

/**
 * Creates a renderer for one maze
 * @param {{}} p
 * @param {number[]} dimensions
 * @param {Agent[]} agents
 */
export const createMazeRenderer = (p, dimensions) => {
	const renderMaze = (grid) => renderGridMaze(p, grid, dimensions)

	const renderAgents = (agents, showPaths = false) =>
		agents.forEach((agent) => {
			if (showPaths) {
				renderPathWithColor(
					agent.getFuturePath(),
					CURRENT_PATH
				)
				renderPathWithColor(agent.getAgentPath(), PAST_PATH)
			}

			renderAgent(p, agent.getPosition(), dimensions)
		})

	const renderEnd = (position) => renderEndPosition(p, position, dimensions)

	const renderPathWithColor = (path, color) =>
		renderPath(p, path, color, dimensions)

	const getDimensions = () => dimensions

	return {
		renderMaze,
		renderAgents,
		renderEnd,
		renderPathWithColor,
		getDimensions,
	}
}

