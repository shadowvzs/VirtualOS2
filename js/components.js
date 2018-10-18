const componentData = {
	settings: {
		taskManager: {
			id: "tskmngr",
			name: "System Taskbar",
			description: "Responsable for managing the taskbar",
			icon: "",
			launchbar: false,
			taskbar: false,
			maxProc: 1,
			movable: false,
			focusable: false,
		},
		clockManager: {
			id: "clkmngr",
			name: "System Clock",
			description: "Responsable for keep time realated parts like right side clock",
			icon: "",
			launchbar: false,
			taskbar: true,
			maxProc: 1,
			movable: false,
			focusable: false,
			showUI: true,
			placeholder: "time#clock",
		},
		contextMenu: {
			id: "cntxtmn",
			name: "Right Click Menu",
			description: "Responsable for create right click menu from array",
			icon: "",
			launchbar: false,
			taskbar: false,
			width: 200,
			className: 'contextMenu',
			maxProc: 1,
			movable: false,
			focusable: false,
		},
		virtualClipboard: {
			id: "vrtlclpbrd",
			name: "Clipboard",
			description: "Responsable for register item/items in virtual clipboard",
			icon: "",
			launchbar: false,
			taskbar: false,
			maxProc: 1,
			movable: false,
			focusable: false,
		},
		desktopManager: {
			id: "dsktpmngr",
			name: "Desktop Manager",
			description: "Responsable for create, arrange icons, send data to context menu",
			icon: "",
			launchbar: true,
			taskbar: true,
			maxProc: 1,
			movable: false,
			focusable: false,
			container: '.desktop-container',
			relationship: {
				datasource: 'fileSystem',
				menu: 'contextMenu',
				clipboard: 'virtualClipboard',
			}
		},
		startMenuManager: {
			id: "strtmnmngr",
			name: "Start Menu",
			description: "Responsable for start menu",
			icon: "",
			label: "Start",
			placeholder: ".start-menu-button",
			launchbar: false,
			taskbar: false,
			maxProc: 1,
			movable: false,
			focusable: false,
		},
		fileSystem: {
			id: "flsstm",
			name: "File System",
			description: "Responsable for file & folder crud (json data manipulation)",
			icon: "",
			launchbar: false,
			taskbar: false,
			maxProc: 1,
			movable: false,
			focusable: false,
			relationship: {
				desktop: 'desktopManager',
				startmenu: 'startMenuManager',
			},
			database: './vfs.json',
			fileExtension: './vfs.json',
		}
	},
	classes: {
		taskManager(settings, shared = false) {

			return {
				remove() {

				}
			}
		},
		clockManager(settings, shared = false) {
			const placeholder = document.body.querySelector(settings.placeholder) || null;
			let timerId;
			if (settings.showUI) {
				updateClock(new Date())
				if (placeholder) {
					placeholder.dataset.timezone = getTimeZone();
					timerId =  setInterval( () => {
						updateClock(new Date());
					}, 1000);
				}
			}

			function updateClock(time) {
				const clock = shared.getFormattedTime(time);
				placeholder.textContent = clock;
				placeholder.dataset.time = clock;
				placeholder.dataset.date = shared.getNamedDate(time);
			}

			function getTimeZone() {
				const time = new Date(),
					timeZone = Math.round(time.getTimezoneOffset() / 60);
				return timeZone > 0 ? "-" + timeZone : "+" + -timeZone;
			}

			return {
				remove() {
					if (timerId) {
						clearInterval(timerId);
					}
				}
			}
		},
		contextMenu (settings, shared = false) {
			const width = settings.width || 200,
				id = 'contextmenu_'+Date.now();
			let dom;

			function init() {
				dom = document.createElement("div");
				dom.classList.add(settings.className);
				dom.setAttribute("tabindex","-1");
				dom.style.width = width+'px';
				dom.textContent = "";
				dom.id = id;
				document.body.appendChild(dom);
				dom.addEventListener('blur', blurEvent);
				dom.onclick = function() { setTimeout( blurEvent, 100); };
			}

			function blurEvent() {
				dom.classList.remove('show');
			}

			function moveContextMenu(e) {
				const px = e.pageX,
					  py = e.pageY,
					  cx = dom.offsetWidth,
					  cy = dom.offsetHeight,
				 	  wx = document.body.clientWidth,
	 			  	  wy = document.body.clientHeight;
				let	nx, ny;

				ny = (py+cy > wy) ? (wy-cy > 0 ? wy-cy : 0) : py;
				nx = (px+cx > wx) ? (wx-cx > 0 ? wx-cx : 0) : px;

				dom.style.top = py+'px';
				dom.style.left = ((px+cx > wx) ? (wx-cx > 0 ? wx-cx : 0) : px)+'px';
				dom.classList.add('show');
				dom.focus();
			}

			function populateContextMenu(list, id) {
				let str = "";
				while (dom.firstChild) {dom.removeChild(dom.firstChild)};
				if (list) {
					const ul = document.createElement('ul');
					ul.dataset.id = id;
					for (let row of list) {
						str = `data-click="${row[1]}.${row[2]}." data-extra = "${row[3].join('/')}"`;
						if (!row[1]) {
							str += ` class="disabled"`;
						}
						ul.insertAdjacentHTML('beforeend', `<li ${str}>${row[0]}</li>`);
					}
					dom.appendChild(ul);
				}
			}

			init();

			return {
				getId() {
					return dom.id || false;
				},
				remove() {
					dom.removeEventListener('blur', blurEvent);
				},
				create(e, list = [], id = 0) {
					populateContextMenu(list, id);
					moveContextMenu(e);
					e.preventDefault();
				}
			}
		},
		virtualClipboard(settings, shared = false) {
			const container = document.querySelector(settings.container),
				{ components, isEmpty } = shared;
			let clipboard = [];


			function addItems(e) {
				clipboard = [{...[e.dataset.extra.split("/")]}];
				return true;
			}

			return {
				getItems() {
					return clipboard;
				},
				addItems(e, ev) {
					addItems(e);
				},
				clear() {

				}
			}
		},
		desktopManager(settings, shared = false) {
			const container = document.querySelector(settings.container),
				{ guid, sec2Date, getPath, components } = shared,
				datasource = components[settings.relationship.datasource || "null"] || null,
				cName = settings.constructorName,
				ds = settings.relationship.datasource;
			let icons = [];

			function createTooltip(item) {
				const child = item.child && item.child.length,
					content = child ?
					`Content: &nbsp; ${child} file(s) or folder(s)&#013;`
					: "";
				return `ID: ${item.id}
					Description: ${item.description}&#013;
					Type: ${item.type}&#013;
					Status: ${item.readonly ? "readonly" : "writeable"}&#013;
					${content}
					Created at: ${sec2Date(item.createtime)}&#013;
					Modified at: ${sec2Date(item.lastmodify)}`.replace(/\t/g,'');
			}

			function CreateDesktopIcon(item, targetContainer = container, newWindow = true){
				targetContainer.insertAdjacentHTML('beforeend', `<div class="de-icon">
					<a title="${createTooltip(item)}" data-contextmenu="${cName}.createMenu" data-id="${item.id}" data-container="${settings.container}" data-new="${newWindow}" data-type="icon">
						<div class="DesktopIconImgBox">
							<img src="${getPath('desktop', item.icon)}" />
						</div>
					</a>
					<p title="${item.name}">
						<div class="de-text-box icon-text" data-id="${item.id}">
							<input class="d-none" type="text" maxlength="24" value="${item.name}" />
							<a class="d-none" data-click="${cName}.rename">&#10004;</a>
							<a class="d-none" data-click="${cName}.toggleRename">&#10008;</a>
							<span data-click="${cName}.toggleRename">${item.name}</span>
						</div>
					</p>
				</div>`);
			}

			function loadContent(list) {
				for (const item of list) {
					CreateDesktopIcon(item);
				}
			}

			function toggleRename(e) {
				const childs = e.children || false;
				if (childs) {
					for (const child of childs) {
						child.classList.toggle('d-none');
					}
				}
			}

			function rename(e) {
				const datasource = components[ds],
					id = e.parentNode.dataset.id || null;
				if (!datasource || !id) {
					return console.log("file system not exist or missing id");
				}
				const vfs = datasource.getDatabase(),
					item = datasource.search(vfs.child, id),
					input = e.parentNode.querySelector("input");
				if (!item || !input) {
					return console.log("file or folder not exist!");
				}


				item.name = input.value;
				if (datasource.save()) {
					const parent = e.parentNode;
						span = parent.querySelector('span');
					if (span) {
						span.textContent = item.name;
					}
					toggleRename(parent);
				}
			}

			function createMenu(e, ev) {
				const { id, container = false, type = "icon" } = e.dataset,
					datasource = components[ds],
					relationship = settings.relationship,
					clipboard = components[relationship.clipboard || "null"] || null;
					menu = components[relationship.menu || "null"] || null;

				if (!id || !container) {
					return console.log("Not exist id or container data on this element");
				}

				const vfs = datasource.getDatabase();
				if (type == "") {
					const list = [
						["New Folder", cName, "execute", [id]],
						["New File", relationship.clipboard, "addItems", ['fs', id, 'false']],
						["Arrange Icon", relationship.clipboard, "addItems", ['fs', id, 'true']],
						["Paste", cName, "paste", [id]],
						["Settings", cName, "toggleRename", [id]],
						["Terminal", cName, "remove", [id]],
						["Properties", cName, "details", [id]],
					];

					if (!clipboard.getItems() || item.type != "dir") {
						list.splice(3, 1);
					}

				} else {
					const item = datasource.search(vfs.child, id),
						list = [
							["Run", cName, "execute", [id]],
							["Copy", relationship.clipboard, "addItems", ['fs', id, 'false']],
							["Cut", relationship.clipboard, "addItems", ['fs', id, 'true']],
							["Paste", cName, "paste", [id]],
							["Rename", cName, "toggleRename", [id]],
							["Delete", cName, "remove", [id]],
							["Properties", cName, "details", [id]],
						];


					if (item.type == "dir") {
						list[0][0] = "Open";
					}

					if (e.readonly) {
						list[2][1] = false;
						list.splice(4, 1);
					}

					if (!clipboard.getItems() || item.type != "dir") {
						list[3][1] = false;
						list.splice(3, 1);
					}

				}
				menu.create(ev, list, id );
			}

			function remove(e) {
				const id = e.dataset.id,
					datasource = components[ds];
				if (datasource.remove(id)) {
					e.parentNode.remove();
				}
			}

			function getParent(e) {
				const parent = e.parentNode,
					id = parent.dataset.id || null;
				if (!id) {
					return console.log("Id not exist on parent elem!");
				}
				return document.body.querySelector(`div.icon-text[data-id="${id}"]`);
			}

			return {
				createMenu(e, ev) {
					createMenu(e, ev);
				},
				rename(e) {
					rename(e);
				},
				toggleRename(e) {
					toggleRename(getParent(e));
				},
				remove(e) {
					remove(getParent(e));
				},
				loadContent(list) {
					loadContent(list);
				}
			}
		},

		startMenuManager(settings, shared = false) {

			function loadContent(list) {

			}

			return {
				remove() {

				},
				loadContent(list) {
					loadContent(list);
				}
			}
		},

		fileSystem(settings, shared = false) {

			const {req, components} = shared,
				relationship = settings.relationship;
			let vfs;

			if (localStorage.getItem('vfs')) {
				vfs = JSON.parse(localStorage.getItem('vfs'));
				init();
			} else {
				req("json", "vfs", d => {
					vfs = d;
					init();
				}, 'json' );
			}

			function init() {
				let desktopItems = [],
					startMenuItems = [],
					item;
				for (item of vfs.child) {
					if (item.ondesktop) {
						desktopItems.push(item);
					}
					if (item.onstartmenu) {
						startMenuItems.push(item);
					}
				}

				if (desktopItems.length) {
					components[relationship.desktop].loadContent(desktopItems);
				}

				if (startMenuItems.length) {
					components[relationship.startmenu].loadContent(startMenuItems);
				}
			}

			function searchInVfs(items, id) {
				let e, item;
				for (item of items) {
					if (item.id == id) {
						item.path = [];
						item.parent = [];
						return item;
					}
					if (item.child) {
						e = searchInVfs(item.child, id);
						if (e && e.id == id) {
							e.path.push(item.id);
							e.parent.push(item.name);
							return e;
						}
					}
				}
				return null;
			}

			function deleteItem(items, id) {
				let i, max = items.length;
				for (i = 0; i < max; i++) {
					if (items[i].id == id) {
						items.splice(i, 1);
						save();
						return true;
					}
					if (items[i].child) {
						if (deleteItem(items[i].child, id) === true) {
							return true;
						};
					}
				}
				return null;
			}

			function save() {
				return true;
			}

			return {
				search(items, id) {
					return searchInVfs(items, id);
				},
				remove(id) {
					return deleteItem(vfs.child, id)
				},
				save() {
					return save();// save into localstorage
				},
				getDatabase() {
					return vfs;
				}
			}
		}
	},
}
