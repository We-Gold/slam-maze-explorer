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

const constrain = (input, min, max) => Math.min(Math.max(input, min), max)

const createNumericalConfig = (label, initial, min, max, inc = 1) => {
	const baseElement = document.createElement("div")
	baseElement.className = "numeric-config"

	// Create the label element
	const labelElement = document.createElement("span")
	labelElement.className = "config-label"
	labelElement.textContent = label
	baseElement.appendChild(labelElement)

	// Create a container to hold the rest of the configuration options
	const container = document.createElement("span")
	baseElement.appendChild(container)

	// Create the number container
	const displayElement = document.createElement("span")
	displayElement.className = "pill primary-text"
	displayElement.textContent = initial
	container.appendChild(displayElement)

	// Create the controls elements
	const controlsContainer = document.createElement("span")
	controlsContainer.className = "controls"
	container.appendChild(controlsContainer)

	const incrementElement = document.createElement("span")
	incrementElement.className = "pill"
	incrementElement.textContent = "+"
	controlsContainer.appendChild(incrementElement)

	const decrementElement = document.createElement("span")
	decrementElement.className = "pill"
	decrementElement.textContent = "-"
	controlsContainer.appendChild(decrementElement)

	let state = +displayElement.textContent

	incrementElement.addEventListener("click", () => {
		state = constrain(state + inc, min, max)
		displayElement.textContent = state
	})

	decrementElement.addEventListener("click", () => {
		state = constrain(state - inc, min, max)
		displayElement.textContent = state
	})

	return {
		element: baseElement,
		get: () => state,
	}
}

