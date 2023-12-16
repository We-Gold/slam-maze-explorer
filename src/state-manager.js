import { createNumericalConfig } from "./components/numeric-config"
import { defaultConfig } from "./constants"

export const Mode = {
	EDITING: 0,
	SOLVING: 1,
	SOLVING_FOCUS: 2,
	SOLVING_GRAPH: 3,
}

const MenuState = {
	DEFAULT: 0,
	FOCUS: 1,
	GRAPH: 2,
}

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
	// Set initial environment mode
	let mode = Mode.EDITING
	let menuState = MenuState.DEFAULT
	const getMode = () => mode

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
		const callback = () => {
			// Update the mode
			if (mode === Mode.EDITING) {
				switch (menuState) {
					case MenuState.DEFAULT:
						mode = Mode.SOLVING
						break
					case MenuState.FOCUS:
						mode = Mode.SOLVING_FOCUS
						break
					case MenuState.GRAPH:
						mode = Mode.SOLVING_GRAPH
						break
				}
			} else {
				mode = Mode.EDITING
			}

			_callback(beginSimulationButton, getConfigurationCallback(), mode)
		}

		beginSimulationButton.removeEventListener(
			"click",
			beginSimButtonCallback
		)
		beginSimulationButton.addEventListener("click", callback)

		beginSimButtonCallback = callback
	}

	/* Handle simulation mode buttons */
	const activateMenuBtn = (button) =>
		(button.className = "canvas-menu-pill canvas-menu-pill-active")
	const deactivateMenuBtn = (button) =>
		(button.className = "canvas-menu-pill")

	const focusModeButton = document.querySelector("#menu-focus-btn")
	const graphModeButton = document.querySelector("#menu-graph-btn")

	focusModeButton.addEventListener("click", (e) => {
		e.preventDefault()

		if (menuState === MenuState.FOCUS) {
			menuState = MenuState.DEFAULT
			deactivateMenuBtn(focusModeButton)

			// Switch mode if necessary
			if (mode !== Mode.EDITING && mode === Mode.SOLVING_FOCUS)
				mode = Mode.SOLVING
		} else {
			menuState = MenuState.FOCUS
			activateMenuBtn(focusModeButton)
			deactivateMenuBtn(graphModeButton)

			// Switch mode if necessary
			if (mode !== Mode.EDITING && mode !== Mode.SOLVING_FOCUS)
				mode = Mode.SOLVING_FOCUS
		}
	})

	graphModeButton.addEventListener("click", (e) => {
		e.preventDefault()

		if (menuState === MenuState.GRAPH) {
			menuState = MenuState.DEFAULT
			deactivateMenuBtn(graphModeButton)

			// Switch mode if necessary
			if (mode !== Mode.EDITING && mode === Mode.SOLVING_GRAPH)
				mode = Mode.SOLVING
		} else {
			menuState = MenuState.GRAPH
			activateMenuBtn(graphModeButton)
			deactivateMenuBtn(focusModeButton)

			// Switch mode if necessary
			if (mode !== Mode.EDITING && mode !== Mode.SOLVING_GRAPH)
				mode = Mode.SOLVING_GRAPH
		}
	})

	return {
		setBeginSimButtonCallback,
		getMode,
		endSimulation: () => beginSimButtonCallback(),
	}
}

