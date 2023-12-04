import { renderAgent, renderGridMaze, renderPath } from "./render-helpers"

/**
 * Creates a renderer for one maze
 * @param {{}} p
 * @param {number[]} dimensions
 * @param {Agent[]} agents
 */
export const createMazeRenderer = (p, dimensions) => {
	const renderMaze = (grid) => renderGridMaze(p, grid, dimensions)

	const renderAgents = (agents) =>
		agents.forEach((agent) =>
			renderAgent(p, agent.getPosition(), dimensions)
		)

	const renderPathWithColor = (path, color) =>
		renderPath(p, path, color, dimensions)

    const getDimensions = () => dimensions

	return { renderMaze, renderAgents, renderPathWithColor, getDimensions }
}
