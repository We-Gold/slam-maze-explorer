import { createNumericalConfig } from "./components/numeric-config"
import { defaultConfig } from "./constants"

export const createConfiguration = (
	agents,
	mazeSize,
	visibleRadius,
	commsRadius
) => ({
	agents,
	mazeSize,
	visibleRadius,
	commsRadius,
})

export const createTimer = (element) => {
	let start = Date.now()

	const getDuration = () => {
		const rawSeconds = Math.trunc((Date.now() - start) / 1000)
		const min = Math.trunc(rawSeconds / 60)
		const sec = rawSeconds - min * 60

		return { min, sec }
	}

	const updateTimerElement = () => {
		const { min, sec } = getDuration()
        const formatSec = sec >= 10 ? sec : "0" + sec
		element.textContent = `${min}:${formatSec}`
	}

	const reset = () => (start = Date.now())

	return { updateTimerElement, reset }
}

export const createStateManager = () => {
	const { agents, mazeSize, visibleRadius, commsRadius } = defaultConfig

	// Store references to the numeric configuration elements
	const agentsConfig = createNumericalConfig("Agents:", agents, 1, 5)
	const mazeSizeConfig = createNumericalConfig(
		"Maze Size:",
		mazeSize,
		20,
		100,
		2
	)
	const visibleRadiusConfig = createNumericalConfig(
		"Visible Radius:",
		visibleRadius,
		1,
		10
	)
	const commsRadiusConfig = createNumericalConfig(
		"Comms Radius:",
		commsRadius,
		1,
		10
	)

	// Add the elements to the page
	document
		.getElementById("numeric-config-area")
		.append(
			agentsConfig.element,
			mazeSizeConfig.element,
			visibleRadiusConfig.element,
			commsRadiusConfig.element
		)

	// TODO: Store references to the color configuration elements

	const getConfigurationCallback = () =>
		createConfiguration(
			agentsConfig.get(),
			mazeSizeConfig.get(),
			visibleRadiusConfig.get(),
			commsRadiusConfig.get()
		)

	/* Handle Starting Simulation */
	const beginSimulationButton = document.querySelector("#start-sim-btn")
	let beginSimButtonCallback = () => {}
	const setBeginSimButtonCallback = (_callback) => {
		// Create a callback that gives the caller access to the current configuration and the simulation button
		const callback = () =>
			_callback(beginSimulationButton, getConfigurationCallback())

		beginSimulationButton.removeEventListener(
			"click",
			beginSimButtonCallback
		)
		beginSimulationButton.addEventListener("click", callback)

		beginSimButtonCallback = callback
	}

	return { setBeginSimButtonCallback }
}

