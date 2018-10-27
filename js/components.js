const componentData = {
	settings: {
		launchBar: {
			id: "lnchbr",
			name: "Launchbar",
			description: "Responsable for launcher icons",
			icon: "",
			container: ".task-app-list",
			toggle: ".app-list-toggle",
			maxProc: 1,
		},
		taskManager: {
			id: "tskmngr",
			name: "System Taskbar",
			description: "Responsable for managing the taskbar",
			icon: "sys_task",
			launchbar: true,
			focusClass: "active",
			group: ".task-win-group",
			container: ".task-win-container",
			maxProc: 1,
			relationship: {
				datasource: 'fileSystem',
				window: 'windowManager',
			}
		},
		displayManager: {
			id: "dsplymngr",
			name: "Display Settings",
			description: "Responsable for managing background",
			icon: "sys_display",
			launchbar: true,
			windowClass: 'desktop-settings',
			maxProc: 1,
			relationship: {
				window: 'windowManager',
				window: 'windowManager',
			}
		},
		clockManager: {
			id: "clkmngr",
			name: "System Clock",
			description: "Responsable for keep time realated parts like right side clock",
			icon: "",
			taskbar: true,
			maxProc: 1,
			showUI: true,
			placeholder: "time#clock",
		},
		contextMenu: {
			id: "cntxtmn",
			name: "Right Click Menu",
			description: "Responsable for create right click menu from array",
			icon: "",
			width: "auto",
			className: 'contextMenu',
			maxProc: 1,
		},
		virtualClipboard: {
			id: "vrtlclpbrd",
			name: "Clipboard",
			description: "Responsable for register item/items in virtual clipboard",
			icon: "",
			maxProc: 1,
		},
		desktopManager: {
			id: "dsktpmngr",
			name: "Desktop Manager",
			description: "Responsable for create, arrange icons, send data to context menu",
			icon: "sys_display",
			maxProc: 1,
			container: '.desktop-container',
			relationship: {
				datasource: 'fileSystem',
				menu: 'contextMenu',
				clipboard: 'virtualClipboard',
				explorer: 'fileExplorer',
				window: 'windowManager',
			}
		},
		startMenuManager: {
			id: "strtmnmngr",
			name: "Start Menu",
			description: "Responsable for start menu",
			icon: "",
			label: "Start",
			placeholder: ".start-menu-button",
			maxProc: 1,
			relationship: {
				datasource: 'fileSystem'
			}
		},
		fileSystem: {
			id: "flsstm",
			name: "File System",
			description: "Responsable for file & folder crud (json data manipulation)",
			icon: "",
			maxProc: 1,
			relationship: {
				desktop: 'desktopManager',
				startmenu: 'startMenuManager',
			},
			database: './vfs.json',
		},
		fileExplorer: {
			id: "flxplrr",
			name: "File Explorer",
			description: "Responsable for browsing in directories",
			windowClass: 'file-explorer',
			icon: "folder",
			taskbar: true,
			randomPosition: true,
			maxProc: 20,
			relationship: {
				desktop: 'desktopManager',
				window: 'windowManager',
				datasource: 'fileSystem'
			},
		},
		windowManager: {
			id: "wndwmngr",
			name: "Window Manager",
			description: "Responsable for handle the windows",
			icon: "",
			maxProc: 1,
			contentSelector: '.content',
			relationship: {
				task: 'taskManager',
			},
		},
		audioManager: {
			id: "dmngr",
			name: "Sound Settings",
			description: "Responsable for volume controll",
			icon: "soundon",
			launchbar: true,
			maxProc: 1,
			relationship: {
				launch: 'launchBar',
			},
		},
		terminal: {
			id: "trmnl",
			name: "Terminal",
			description: "Ubuntu terminal simulator",
			icon: "terminal",
			launchbar: true,
			maxProc: 20,
			relationship: {
				launch: 'launchBar',
			},
		},
	},
	classes: {
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
				clipboard.push(...[e.dataset.extra.split("/")]);
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
					clipboard = [];
				}
			}
		},

		desktopManager(settings, shared = false) {
			const defaultContainer = getDOM(settings.container),
				{ guid, sec2Date, getPath, components, isEmpty } = shared,
				cName = settings.constructorName,
				relationship = settings.relationship,
				{datasource: ds, window: win} = relationship;
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

			function CreateDesktopIcon(item, targetContainer = defaultContainer, newWindow = true) {
				targetContainer.insertAdjacentHTML('beforeend', `<div class="de-icon no-select" data-item-id="${item.id}">
					<a title="${createTooltip(item)}" data-click="${ds}.execute" data-contextmenu="${cName}.createMenu" data-id="${item.id}" data-container="${targetContainer.dataset.id}" data-new="${newWindow}" data-type="icon">
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

			function getContainer(id) {
				const window = components[win].getWindow(id);
				if (!window) {
					return defaultContainer;
				}
				return window.body;
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
						if (child.tagName == "INPUT") {
							child.focus();
							child.select();
						}
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
				const { id, container = false, type = "icon", itemId = false } = e.dataset,
					datasource = components[ds],
					clipboard = components[relationship.clipboard || "null"] || null;
					menu = components[relationship.menu || "null"] || null;
				const targetId = itemId || id;
				if (!targetId || !container) {
					return console.log("Not exist id or container data on this element");
				}

				const vfs = datasource.getDatabase();
				let list;
				if (type == "free") {
					list = [
						["New Folder", cName, "createNew", [targetId, container, 'dir']],
						["New File", cName, "createNew", [targetId, container, 'html']],
						["Paste", cName, "paste", [targetId, container, type]],
					//	["Arrange Icon", relationship.clipboard, "addItems", ['fs', id, 'true']],
						["Terminal", cName, "remove", [targetId]],
						["Settings", cName, "toggleRename", [targetId]],
						["Properties", cName, "details", [targetId]],
					];

					if (isEmpty(clipboard.getItems())) {
						list.splice(2, 1);
					}

				} else if (type == "icon") {
					const item = datasource.search(vfs.child, targetId);
					list = [
						["Run", ds, "execute", [targetId]],
						["Copy", relationship.clipboard, "addItems", ['fs', targetId, 'false']],
						["Cut", relationship.clipboard, "addItems", ['fs', targetId, 'true']],
						["Paste", cName, "paste", [targetId, type]],
						["Rename", cName, "toggleRename", [targetId]],
						["Delete", cName, "remove", [targetId]],
						["Properties", cName, "details", [targetId]],
					];


					if (item.type == "dir") {
						list[0][0] = "Open";
					}

					if (e.readonly) {
						list[2][1] = false;
						list.splice(4, 1);
					}

					if (isEmpty(clipboard.getItems()) || item.type != "dir") {
						list[3][1] = false;
						list.splice(3, 1);
					}
				}

				if (list) {
					menu.create(ev, list, targetId );
				}
			}

			function deleteIcon(id) {
				const icons = document.body.querySelectorAll(`.de-icon[data-item-id="${id}"]`);
				for (const icon of icons) {
					icon.remove();
				}
			}

			function remove(e) {
				const id = e.dataset.id,
					datasource = components[ds];

				if (datasource.remove(id)) {
					deleteIcon(id);
				}
			}

			function getParent(e) {
				const parent = e.parentNode,
					id = parent.dataset.id || null;
				if (!id) {
					return console.log("Id not exist on parent elem!");
				}
				return getDOM(`div.icon-text[data-id="${id}"]`);
			}

			function getDOM(selector) {
				return document.body.querySelector(selector);
			}

			function createNew(e) {
				const [id, container, type] = e.dataset.extra.split('/'),
					time = Math.round(+new Date() / 1000),
					icons = {
						dir: "folder",
						html: "file"
					},
					datasource = components[ds];

				const newItem = {
					name: "New Folder",
					id: guid(),
					description: "This is a new folder",
					icon: icons[type],
					type: type,
					readonly: false,
					onstartmenu: false,
					ondesktop: id == -1,
					createtime: time,
					lastmodify:1503812702,
				}

				if (datasource.add([newItem], id)) {
					CreateDesktopIcon(newItem, getContainer(container), true);
				}
			}

			function paste(e) {
				const [targetId, container, targetType] = e.dataset.extra.split('/'),
					time = Math.round(+new Date() / 1000),
					icons = {
						dir: "folder",
						html: "file"
					},
					datasource = components[ds],
					clipboard = components[relationship.clipboard],
					items = clipboard.getItems();
				let containerDOM,
					newWindow;
				if (!clipboard.getItems()) {
					return console.log("Clipboard is empty");
				}
				if (targetType == "free") {
					containerDOM = getContainer(container)
					if (!containerDOM) {
						return console.log("Container not exist!");
					}
					newWindow = targetId == -1 ? true : false;
				}

				for (let [sourceType, itemId, remove] of items) {
					if (sourceType == "fs") {
						remove = remove == "true";
						console.log(targetId, itemId, remove);
						const item = datasource.copyItem(targetId, itemId, remove);
						if (item && targetType == "free") {
							CreateDesktopIcon(item, containerDOM, newWindow);
							if (remove) {
								deleteIcon(itemId);
							}
						}
					}
				}
				clipboard.clear()
			}

			return {
				createNew(e, ev) {
					createNew(e);
				},
				createMenu(e, ev) {
					createMenu(e, ev);
				},
				createIcon(item, container, newWindow) {
					CreateDesktopIcon(item, container, newWindow);
				},
				deleteIcon(id) {
					deleteIcon(id);
				},
				paste(e, ev) {
					paste(e);
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
			const taskbar = document.body.querySelector('footer#taskbar'),
				cName = settings.constructorName,
				ds = settings.relationship.datasource;
			let startMenu, selected = false;

			const template = {
				startMenu(itemList) {
					const [mainList, subList] = template.createList(itemList);
					return `<div class="start-menu no-select">
						<div class="start-menu-title">
							<h3> Welcome Guest! </h3>
						</div>
						<div class="sub-item-list">
							${subList}
						</div>
						<div class="main-item-list">
							<ul>${mainList}</ul>
						</div>
					</div>`;
				},
				createList(itemList) {
					let mainList = "",
						subList = "";
					for (const item of itemList) {
						mainList += template.mainList(item);
						subList += template.subList(item);
					}
					return [mainList, subList];

				},
				mainList(item) {
					return `<li data-click="${cName}.select" data-extra="${item.id}">
							<img src="./img/startmenu/${item.icon}.png" width="22" height="22"> ${item.name}
						</li>`;
				},
				subList(item) {
					if (!item.child) {
						return "";
					}
					return `<ul class="d-none" data-item-id="${item.id}">
						${item.child.map(item => template.subItem(item)).join("")}
					</ul>`;
				},
				subItem(item) {
					return `<li data-click="${ds}.execute" data-id="${item.id}" data-new="true" data-type="startSubIcon">
							<img src="./img/startmenu/${item.icon}.png"> ${item.name}
						</li>`;
				}
			}


			function loadContent(list) {
				taskbar.insertAdjacentHTML('afterbegin', template.startMenu(list));
				startMenu = taskbar.querySelector('.start-menu');
				select(list[0].id);
			}

			function toggleList(id) {
				const main = startMenu.querySelector(`li[data-click="${cName}.select"][data-extra="${id}"]`);
				if (main) {
					main.classList.toggle('active');
				}
				const sub = startMenu.querySelector(`ul[data-item-id="${id}"]`);
				if (sub) {
					sub.classList.toggle('d-none');
				}
			}

			function select(id) {
				if (selected) {
					toggleList(selected);
				}
				toggleList(id);
				selected = id;
			}

			return {
				select(e) {
					select(e.dataset.extra);
				},
				toggle() {
					startMenu.classList.toggle('show');
				},
				remove() {

				},
				loadContent(list) {
					loadContent(list);
				}
			}
		},

		fileSystem(settings, shared = false) {
			const {req, components, guid, objClone, assoc} = shared,
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

			function add(items, to) {
				let target = to == -1 ? vfs : searchInVfs(vfs.child, to);
				if (!target) {
					return false;
				}
				if (!target.child) {
					target.child = [];
				}
				target.child.push(...items);
				save();
				return true;
			}

			function save() {
				localStorage.setItem('vfs', JSON.stringify(vfs))
				return true;
			}

			function prepareItems(items, remove) {
				let i, max = items.length;
				for (i = 0; i < max; i++) {
					items[i].id = guid();
					if (!remove) {
						items[i].name = items[i].name + " copy";
					}
					if (items[i].child) {
						prepareItems(items[i].child, remove);
					}
				}
				return null;
			}

			function prepareItem(item, remove) {
				if (Array.isArray(item)) {
					return prepareItems(item, remove);
				}

				item.id = guid();
				if (!remove) {
					item.name = item.name + " copy";
				}

				if (item.child && item.child.length > 0) {
					return prepareItems(item.child, true);
				}
				return;
			}

			function copyItem(targetId, sourceId, removeItem = false) {
				const sourceItem = searchInVfs(vfs.child, sourceId);
				if (!sourceItem) { return null; }
				const itemCopy = objClone(sourceItem);
				if (targetId == -1) {
					itemCopy['ondesktop'] = true;
				}
				prepareItem(itemCopy, removeItem);
				if (!add([itemCopy], targetId)) {
					return false;
				};
				if (removeItem) {
					deleteItem(vfs.child, sourceId);
				}
				return itemCopy;
			}


			function execute(e, ev) {
				const id = e.dataset.id;
				if (!id) {
					return console.log("This file not have id!");
				}
				const item = searchInVfs(vfs.child, id),
					app = components[assoc[item.type] || "-"] || false;

				console.log('open with: '+ assoc[item.type], app);

				if (!item) {
					return console.log("File corrupt or not exist anymore!");
				} else if (!app || !app.open) {
					return console.log("Not exist associated application!");
				}
				app.open(e, ev);
			}

			return {
				add(items, to) {
					return add(items, to);
				},
				copyItem(targetId, sourceId, removeItem = false) {
					return copyItem(targetId, sourceId, removeItem);
				},
				execute(e, ev) {
					execute(e, ev);
				},
				get(id) {
					return searchInVfs(vfs.child, id);
				},
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
		},
		fileExplorer(settings, shared = false) {

			const { components } = shared,
				{ datasource: ds, window, desktop: icon } = settings.relationship;

			const template = {
				addressbar(item, options) {
					const {cont, itemId, newWin} = options;
					return `<div class="addressbar">
								<span class="home">
									<img src="./img/app/home.png">
								</span>
								<span class="up">
									<img src="./img/app/up.png">
								</span>
								<nav>
									<ul></ul>
								</nav>
							</div>`;
				}
			}

			let windows = [];

			function addNavLink(win, item) {
				const label = item.parent,
					path = item.path,
					len = label.length;
				let i = 0, li;
				win.nav.innerHTML = "";
				win.nav.append(document.createElement("li"));
				if (len > 0) {
					label.reverse();
					path.reverse();

					for (;i < len; i++) {
						li = document.createElement("li");
						updateTargetData(li, path[i], win.id);
						li.textContent = label[i];
						win.nav.append(li);
					}
				}
				li = document.createElement("li");
				li.textContent = item.name;
				win.nav.append(li);
			}

			function createNewWindow(item, d) {
				const options = {
					data: d,
					appClass: settings.windowClass,
					title: settings.name,
					subTitle: "- "+item.name,
					source: settings.constructorName,
					theme: 'window-light-blue',
					icon: item.icon,
					randomPosition: settings.randomPosition,
					afterHeader: template.addressbar(
						item, {
							cont: d.container,
							itemId: d.id,
							newWin: d.new
						}
					),
				};
				return components[window].register(options);
			}

			function updateContent(item, d, win) {
				const items = item.child || [],
					desktop = components[icon];
				for(const itm of items) {
					desktop.createIcon(itm, win.body, false);
				}
			}

			function updateTargetData(e, itemId, winId) {
				e.dataset.id = itemId;
				e.dataset.container = winId;
				e.dataset.new = false;
				e.dataset.click = `${ds}.execute`;
			}

			function open(e, ev) {

				const d = e.dataset,
					newWin = (d.new || false) === "true";
				let win;
				if (!d.container || !d.id) {
					return console.log('Cannot execute, insufficient information!');
				}
				const item = components[ds].get(d.id);
				if (!item) {
					return console.log('File or folder not exist!');
				}

				if (windows.length >= settings.maxProc && d.new) {
					return console.log('Too much opened window, cannot open more!');
				}

				if (newWin) {
					win = createNewWindow(item, d);

					if (!win) {
						return console.log("Failed to create new file explorer window!");
					}
					win.up = win.dom.querySelector('.up');
					win.home = win.dom.querySelector('.home');
					win.nav = win.dom.querySelector('.addressbar nav ul');
					win.h4 = win.dom.querySelector('.header h4');
					win.body.dataset.type = "free";
					win.body.dataset.container = win.id;
					win.body.dataset.contextmenu = "desktopManager.createMenu";
					windows.push(win);
				} else if (d.container != "-1") {
					win = components[window].getWindow(d.container);
					if (!win) {
						return console.log("File Explorer window not exist!");
					}
					win.body.innerHTML = "";
				}
				win.h4.dataset["afterText"] = "- " + item.name;
				addNavLink(win, item);
				win.body.dataset.itemId = item.id;
				updateTargetData(win.home, item.path[0] || item.id, win.id)
				updateTargetData(win.up, item.path.slice(-1)[0] || item.id, win.id)
				updateContent(item, d, win);
			}

			function close(win) {
				const len = windows.length;
				let i = 0;
				for (; i < len; i++) {
					if (windows[i].id == win.id) {
						return windows.splice(i, 1);
					}
				}
			}

			return {
				close(win) {
					close(win);
				},
				open(e, ev) {
					open(e, ev);
				},
				remove() {

				}
			}
		},

		windowManager(settings, shared = false) {
			const { guid, components } = shared,
				taskMName = settings.relationship.task,
				cName = settings.constructorName,
			 	template = {
					window(settings) {
						const {
							id,
							appClass = "",
							title = "",
							subTitle = "",
							theme = "",
							afterHeader = "",
							afterContent = "",
							content = ""
						} = settings;
						return `<div class="container">
									<div class="header no-select">
										<h4 data-after-text="${subTitle}">
											${title}
										</h4>
										<div class="minimize" data-click="${cName}.minimize" data-id="${id}">_</div>
										<div class="close" data-click="${cName}.close" data-id="${id}">✖</div>
									</div>
									${afterHeader}
									<div class="content" data-id="${id}">${content}</div>
									${afterContent}
								</div>`;
					}
				},
				focusedZ = 3,
				normalZ = 2;

			let windows = {}, focusedId;

			function getNewId() {
				let newId = guid();
				if (!windows['win_'+newId]) {
					return newId;
				}
				return getNewId();
			};


			function dragdrop(e1, e2 = null) {
				e1 = typeof e1 === "string" ? document.body.querySelector(e1) : e1;
				e2 = typeof e2 === "string" ?  document.body.querySelector(e2 || e1) : e2;
				e2.addEventListener('mousedown', dragHandler);
				let body = document.body,
					html = document.documentElement,
					eWidth = e1.offsetWidth,
					eHeight = e1.offsetHeight,
					mWidth = Math.max(body.offsetWidth, html.offsetWidth)-eWidth,
					mHeight =  Math.max(body.offsetHeight, html.offsetHeight)-eHeight,
					cX, cY, x, y, pos = e1.style.position,
					shiftX, shiftY,
					moving = false;

				e1.style.position = 'fixed';

				function move(x, y) {
					e1.style.left = x+'px';
					e1.style.top = y+'px';
				}

				function mousemove (e) {
					x = e.clientX-shiftX;
					y = e.clientY-shiftY;
					cX = x >  mWidth ? mWidth : x < 0 ? 0 : x;
					cY = y >  mHeight ? mHeight : y < 0 ? 0 : y;
					move(cX, cY);
				}

				function mouseup (e) {
					body.removeEventListener('mousemove', mousemove);
					window.removeEventListener('mouseup', mouseup);
					body.removeEventListener('mouseup', mouseup);
					e2.addEventListener('mousedown', dragHandler);
					moving = false;
					e1.dataset.move = "false";
					if (e1.dataset.id && e1.classList.contains('window')) {
						focus(e1.dataset.id);
					}
					//e.preventDefault();
				}

				function dragHandler(e){
					if (moving) return;
					if (e1.dataset.id && e1.classList.contains('window')) {
						focus(e1.dataset.id);
					}
					moving = true;
					body.addEventListener('mousemove', mousemove);
					// use window => mouse could be released when pointer isn't over the body
					window.addEventListener('mouseup', mouseup);
					e1.dataset.move = "true";
					shiftX = e.clientX - e1.offsetLeft;
					shiftY = e.clientY - e1.offsetTop;
				}

				return {
					remove() {
						body.removeEventListener('mousemove', mousemove);
						window.removeEventListener('mouseup', mouseup);
						e2.removeEventListener('mousedown', dragHandler);
					}
				}
			}

			function setRandomPosition(dom = false, options = {}) {
				const body = document.body,
					{
						minW = 200,
						minH = 150,
						maxW = 800,
						maxH = 400
					} = options,
					limitX = body.offsetWidth,
					limitY = body.offsetHeight - 33,
					maxX = Math.min(limitX, maxW),
					maxY = Math.min(limitY, maxH),
					width = Math.random() * (maxX - minW) + minW,
					height = Math.random() * (maxY - minH) + minH,
					x = Math.random() * (limitX - width),
					y = Math.random() * (limitY - height);
				dom.style.top = Math.floor(y) + 'px';
				dom.style.left = Math.floor(x) + 'px';
				dom.style.width = Math.floor(width) + 'px';
				dom.style.height = Math.floor(height) + 'px';
			}

			function create(options) {
				const id = getNewId(),
					dom = document.createElement("div")
					task = components[taskMName];
				options.id = id;
				options.status = true;
				dom.innerHTML = template.window(options);
				dom.id = "win_" + options.id;
				dom.dataset.id = options.id;
				dom.dataset.click = cName+".focus";
				dom.classList.add('window', options.appClass, options.theme);
				const cont = dom.querySelector(settings.contentSelector);
				options.dom = dom;
				options.header = dom.querySelector(".header");
				options.body = cont;
				dragdrop(options.dom, options.header);
				windows[id] = options;
				document.body.append(dom);
				if (options.randomPosition) {
					setRandomPosition(dom);
				}
				task.add(options);
				focus(id);
				return options;
			}

			function register(options) {
				return create(options);
			}

			function minimize(id) {
				const win = windows[id];
				if (!win) { return console.log('Window not found'); }
				win.status = !win.status;
				win.dom.classList.toggle('minify');
				unfocus(id);
				focusedId = null;
			}

			function close(e) {
				const id = e.dataset.id,
					win = windows[id],
					task = components[taskMName];
				if (!win) { return console.log('Window not found'); }
				components[win.source].close(win);
				win.dom.remove();
				task.close(windows[id]);
				delete windows[id];
			}

			function unfocus(id) {
				if (windows[id]) {
					windows[id].dom.style.zIndex = normalZ;
					components[taskMName].unfocus(windows[id]);
				}
				focusedId = null;
			}

			function focus(id = false) {
				if (!id) {
					return;
				}

				unfocus(focusedId);

				if (windows[id] && focusedId != id) {
					if (!windows[id].status) {
						minimize(id);
					}
					windows[id].dom.style.zIndex = focusedZ;
					focusedId = id;
					components[taskMName].focus(windows[id]);
				}
			}

			return {
				close(e, ev) {
					close(e);
				},
				focus(e, ev) {
					const id = typeof e != "object" ? e : e.dataset.id;
					focus(id, status);
				},
				minimize(e, ev) {
					ev.preventDefault();
					minimize(e.dataset.id);
				},
				getWindow(id) {
					return windows[id] || null;
				},
				register(options) {
					return create(options);
				},
				remove() {

				}
			}
		},

		launchBar(settings, shared = false) {
			const { guid, components } = shared,
				cName = settings.constructorName,
				container = document.body.querySelector(settings.container),
				toggleButton = document.body.querySelector(settings.toggle),
				template = {
					icon(appData) {
						return `<figure class="btn-task" data-click="${appData.constructorName}.launch">
								<img class="mini-icon" src="img/startmenu/${appData.icon}.png">
							</figure>`;
					}
				};

			if (toggleButton) {
				toggleButton.dataset.click = `${settings.constructorName}.toggle`;
			}

			function add(appData) {
				if (!container) {
					return console.log("Missing launchbar container");
				}
				container.insertAdjacentHTML('beforeend', template.icon(appData));
			}

			function toggle(e) {
				container.classList.toggle('d-iblock');
			}

			return {
				add(appData) {
					add(appData);
				},
				toggle(e, v) {
					toggle(e);
				},
				unpin() {
					// remove it
				},
				remove() {

				}
			}
		},

		taskManager(settings, shared = false) {
			const { guid, components } = shared,
				{ launch, window } = settings.relationship,
				container = document.body.querySelector(settings.container),
				group = container.querySelector(settings.group),
				cName = settings.constructorName,
				template = {
					taskGroupBtn(options) {
						const { id, icon, title, subTitle = "", source: group } = options;
						return `<figure class="btn-task btn-group" data-click="${cName}.toggle" data-id="${id}" data-group=${group} data-contextmenu="${cName}.createMenu" title="${title}">
									<img class="mini-icon" src="img/startmenu/${icon}.png">
									<figcaption class="btn-text d-none d-md-iblock">${title}</figcaption>
									<div class="d-none" data-sub-group="${group}"></div>
								</figure>`;
					},
					taskBtn(options) {
						const { id, icon, title, subTitle = "", source: group } = options
							headerTitle = subTitle.length > 1 ? subTitle.substr(2) : title;
						return `<figure class="btn-task" data-click="${window}.focus" data-id="${id}" data-group=${group} title="${title} ${subTitle}">
									<img class="mini-icon d-none d-md-iblock" src="img/startmenu/${icon}.png">
									<figcaption class="btn-text">${headerTitle}</figcaption>
									<div data-sub-group="${group}"></div>
								</figure>`;
					},
				},
				focusClass = settings.focusClass;

			let taskGroup = {}
				selectedGroup = null;

			function start(e) {
				alert('clicked to taskManager');
			}

			function getSubContainer(groupId) {
				return group.querySelector(`[data-sub-group="${groupId}"]`);
			}

			function create(options, type) {
				const { id, source: groupId} = options;
				if (type == "main") {
					taskGroup[groupId] = { child: {} };
					group.insertAdjacentHTML('beforeend', template.taskGroupBtn(options));
					taskGroup[groupId]['dom'] = group.lastChild;
					taskGroup[groupId]['subGroup'] = group.lastChild.querySelector(`[data-sub-group="${groupId}"]`);
				}

				const subContainer = getSubContainer(groupId);
				subContainer.insertAdjacentHTML('beforeend', template.taskBtn(options));
				options.btn = subContainer.lastChild;
				taskGroup[groupId]['child'][id] = options;

			}

			function add(options) {
				const { id, source: groupId} = options;
				create(options, !taskGroup[groupId] ? "main" : false);
			}

			function close(options) {
				const { id, source: groupId} = options;
				taskGroup[groupId]['child'][id].btn.remove();
				delete taskGroup[groupId]['child'][id];
				if (Object.keys(taskGroup[groupId].child).length == 0) {
					taskGroup[groupId].dom.remove();
					delete taskGroup[groupId];
				}
			}

			function focus(win, select = false) {
				const { id, source: groupId} = win;
				if (taskGroup[groupId] && taskGroup[groupId]['child'][id]) {
					const taskBtn = taskGroup[groupId]['child'][id];
					taskBtn.btn.classList[select ? 'add' : 'remove'](focusClass);
				}
			}

			function toggle(e) {
				const {id, group} = e.dataset;
				taskGroup[group].subGroup.classList.toggle('d-none');
				if (!selectedGroup) {
					selectedGroup = id;
					return;
				}

				if (selectedGroup == id) {
					// unfocus
					// selectedGroup = null;
				} else {
					// simple focus
				}
			}

			function createMenu(e, ev) {
				const { id, group = false, type = "icon" } = e.dataset,

					list = [
						["New Folder", cName, "createNew", [targetId, container, 'dir']],
						["New File", cName, "createNew", [targetId, container, 'html']],
						["Paste", cName, "paste", [targetId, container, type]],
					//	["Arrange Icon", relationship.clipboard, "addItems", ['fs', id, 'true']],
						["Terminal", cName, "remove", [targetId]],
						["Settings", cName, "toggleRename", [targetId]],
						["Properties", cName, "details", [targetId]],
					];

					if (isEmpty(clipboard.getItems())) {
						list.splice(2, 1);
					}


				if (list) {
					menu.create(ev, list, targetId );
				}
			}

			return {
				focus(win) {
					focus(win, true);
				},
				unfocus(win, select = false) {
					focus(win, false);
				},
				close(options) {
					close(options);
				},
				createMenu(e, ev) {
					createMenu(e, ev);
				},
				add(options) {
					add(options);
				},
				launch(e, ev) {
					start(e);
				},
				remove() {

				},
				toggle(e, ev) {
					toggle(e);
				},
			}
		},

		audioManager(settings, shared = false) {
			const { guid, components } = shared,
				{ launch } = settings.relationship;

			function start(e) {
				alert('1');
			}

			return {
				launch(e, ev) {
					start(e);
				},
				remove() {

				}
			}
		},

		displayManager(settings, shared = false) {
			const { guid, components } = shared,
				{ window } = settings.relationship,
				template = {
					window() {
						const s = screen,
							b = document.body,
							d = document.querySelector('.desktop-container');
						return `<div class="desktop-details">
									<div class="desktop-previews">
										<div class="mini-preview" data-type="image"></div>
										<div class="mini-preview" data-type="color"></div>
									</div>
									<div class="desktop-info">
										<p>Screen Size:</p><span>${s.width} x ${s.height}</span>
										<p>Window Size:</p><span>${b.offsetWidth} x ${b.offsetHeight}</span>
										<p>Desktop Size:</p><span>${d.offsetWidth} x ${d.offsetHeight}</span>
									</div>
									<div>
										<button>Apply</button>
									</div>
								</div>

								<div class="grid-column-2 desktop-options">
									<p>Color:</p>
									<p>
										<input name="startColor" value="#0000FF" type="color">
										<input name="endColor" value="#FFFFFF" type="color">
									</p>
									<p>Alpha:</p>
									<p>
										<input name="colOpacity" min="0" max="100" value="100" type="number">
									</p>
									<p>Direction:</p>
									<p>
										<input name="colDegree" value="135" min="-90" max="180" type="number"> deg
									</p>
									<p>Image:</p>
									<p>
										<select name="wallpaper">${template.options(options.background)}</select>
									</p>
									<p>Position:</p>
									<p>
										<select name="bgPosition">${template.options(options.position)}</select>
									</p>
									<p>Size:</p>
									<p>
										<input name="bgWidth" value="100" min="0" type="number">%,
										<input name="bgHeight" value="100" min="0" type="number">%
									</p>
									<p>Repeat:</p>
									<p>
										<select name="bgRepeat">${template.options(options.repeat)}</select>
									</p>
									<p>Opacity:</p>
									<p>
										<input name="bgOpacity" type="number" min="0" max="100" value="100"> %
									</p>
								</div>`;
					},
					options(list) {
						return list.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('');
					}
				},
				options = {
					position: [
						["center center","Center Center"],
						["center top","Center Top"],
						["center bottom","Center Bottom"],
						["left top","Left Top"],
						["left center","Left Center"],
						["left bottom","Left Bottom"],
						["right top","Right Top"],
						["right center","Right Center"],
						["right bottom","Right Bottom"],
					],
					repeat: [
						["no-repeat","Not repeat"],
						["repeat","Repeat"],
						["repeat-x","Horizontal"],
						["repeat-y","Vertical"],
					],
					background: [
						["","No image"],
						["bg1.jpg","Default"],
						["bg2.jpg","Dot Land"],
						["bg3.jpg","Flying Points"],
						["bg4.jpg","The Colors"],
						["bg5.jpg","Universe"],
						["bg6.jpg","Sunrise in Space"],
						["bg7.jpg","Red Blue Lines"],
						["bg8.jpg","Sun Rise and Flower Field"],
						["bg9.jpg","The Earth"],
						["bg10.jpg","Earth and Moon from Sky"],
						["bg11.jpg","Mountain Spring"],
						["cloud1.png","Rain Cloud"],
						["cloud2.png","Cloud"],
						["cat.gif","Cat ani"],
						["man.gif","Man right ani"],
						["smile.gif","Smile ani"],
						["matrix1.gif","Matrix ani"],
						["matrix2.gif","Matrix ani"]
					]
				};

			let windowId = false;

			function createNewWindow() {
				const options = {
					data: false,
					appClass: settings.windowClass,
					title: settings.name,
					source: settings.constructorName,
					theme: 'window-light-blue',
					icon: settings.icon,
				};
				return components[window].register(options);
			}

			function start(e) {
				if (windowId) {
					return components[window].focus(windowId);
				}

				let win = createNewWindow();
				if (!win) {
					return console.log("Failed to create new window!");
				}
				win.body.innerHTML = template.window();
				windowId = win.id;
			}

			function close(e) {
				windowId = 0;
			}

			return {
				close(e, ev) {
					close(e);
				},
				launch(e, ev) {
					start(e);
				},
				remove() {

				}
			}
		},
		terminal(settings, shared = false) {
			const { guid, components } = shared,
				{ launch = false } = settings.relationship;

			function start(e) {
				alert('clicked to terminal');
			}

			return {
				launch(e, ev) {
					start(e);
				},
				remove() {

				}
			}
		},
	},
}
