/* code to create a settings list in an Obsidian plugin */

import { Setting, SettingGroup } from 'obsidian';

/** helper for lists, could be the list class */
export interface ListHelper<T> {
	items(): Array<T>;
	addItem(): void;
	updateItem(index: number, value: T): void;
	deleteItem(index: number): void;
}
/** helper for modal lists */
export interface ModalListHelper<T> {
	listHelper(): ListHelper<T>;
	renderItem(item: T, index: number, setting: Setting): void;
}
/** a list to appear in a Plugin */
export class ModalList<T> {
	helper: ModalListHelper<T>;
	containerEl?: HTMLElement;
	heading: string;
	constructor(helper: ModalListHelper<T>, heading: string) {
		this.helper = helper;
		this.heading = heading;
	}
	create(containerEl: HTMLElement) {
		this.containerEl = containerEl;
		this.render();
	}
	render() {
		if (this.containerEl === undefined) return;
		this.containerEl.empty();
		let settingGroup = new SettingGroup(this.containerEl);
		settingGroup
			.setHeading(this.heading)
			.addExtraButton((addButton) => {
				addButton
					.setIcon("plus")
					.setTooltip("add item")
					.onClick(() => {
						this.helper.listHelper().addItem();
						this.render();
					});
			});
		let items = this.helper.listHelper().items();
		for (let entry of items.entries()) {
			settingGroup.addSetting((setting) => {
				this.helper.renderItem(entry[1], entry[0], setting);
				setting.addButton((deleteButton) => {
					deleteButton
						.setIcon("minus")
						.setTooltip("delete this item")
						.onClick(() => {
							this.helper.listHelper().deleteItem(entry[0]);
							this.render();
						});
				});
			});
		}
	}
}
/** helps a string array,  */
export class StringListHelper implements ListHelper<string> {
	data: Array<string>;
	constructor(data: Array<string>) { this.data = data; }
	updateItem(index: number, value: string): void {
		this.data[index] = value;
	}
	deleteItem(index: number): void {
		this.data.splice(index, 1);
	}
	addItem(): void {
		this.data.push("");
	}
	items(): string[] {
		return this.data;
	}
}
/** for StringListHelper */
export class ModalStringListHelper implements ModalListHelper<string> {
	listHelper_: ListHelper<string>;
	constructor(listHelper: ListHelper<string>) { this.listHelper_ = listHelper; }
	renderItem(item: string, index: number, setting: Setting): void {
		setting.addText((text) => {
			text.setValue(item)
				.setPlaceholder("enter value")
				.onChange((value) => {
					this.listHelper_.updateItem(index, value);
				});
		});
	}
	listHelper(): ListHelper<string> {
		return this.listHelper_;
	}
}
