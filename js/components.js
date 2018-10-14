const componentData = {
	settings: {
		taskManager: {
			id: "tskmngr",
			name: "Task Manager",
			description: "Open the HTML files",
			icon: "",
			visible: true,
			maxProc: 1,
			movable: false,
			focusable: false,
		}
	},
	classes: {
		taskManager(settings, req) {
			console.log(settings);

			return {
				remove() {

				}
			}
		},
	},
}
