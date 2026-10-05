import { App, debounce, Modal, PluginSettingTab, Setting } from 'obsidian';
import type { SettingDefinitionItem__ } from 'obsidian';
import MythicSupportPlugin, { mTrace } from './main.js';

export interface MythicSupportPluginSettings {
	adventureFolder: string;
	autoScanLists: boolean;
	tableFiles: Array<string>,
}
export const DEFAULT_TABLES_FILE = 'tables.kdl';
export const DEFAULT_SETTINGS: MythicSupportPluginSettings = {
	adventureFolder: "",
	autoScanLists: true,
	tableFiles: [DEFAULT_TABLES_FILE],
};
export class SettingsHelper {
	/** return the first table file name, and, if necessary, update settings to ensure that there is one. */
	static ensureTablesFile(settings: MythicSupportPluginSettings): string {
		if (settings.tableFiles.length == 0) {
			settings.tableFiles.push();
		}
		return settings.tableFiles[0] ?? DEFAULT_TABLES_FILE;
	}
}

/** this implements the plugin settings modal. It doesn't implement any specific part of the MGME book. */
export class MythicSettingTab extends PluginSettingTab {
	plugin: MythicSupportPlugin;
	app: App;

	constructor(app: App, plugin: MythicSupportPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.app = app;
		let refresh = debounce(() => this.update(), 200, true);
		plugin.registerEvent(this.app.vault.on('create', refresh));
		plugin.registerEvent(this.app.vault.on('delete', refresh));
		plugin.registerEvent(this.app.vault.on('rename', refresh));
	}
	display() { console.error("display should not be called"); }
	getSettingDefinitions(): SettingDefinitionItem__[] {
		return [
			{ name: "Auto scan lists", desc: "automatically recreate lists", control: { type: 'toggle', defaultValue: true, key: 'autoScanLists' } },
			{ name: "Adventure folder", desc: "folder containing the current adventure", control: { type: 'folder', defaultValue: this.app.vault.getRoot().path, key: 'adventureFolder' } },
			{
				type: 'list',
				heading: "Tables files",
				emptyState: "You need to specify some files containing tables",
				addItem: {
					name: "Add file", action: () => {
						this.plugin.settings.tableFiles.push("?");
						this.update();
						void this.plugin.saveData(this.plugin.settings);
						mTrace('setting', "added table file");
					}
				},
				items: this.plugin.settings.tableFiles.map((s) => ({
					name: s, action: (el: unknown, index: number) => {
						mTrace('settings', "table file action");
						let oldFileName = this.plugin.settings.tableFiles[index] ?? "??";
						new TablesFolderModal(this.plugin.app, oldFileName, (newFileName: string) => {
							this.plugin.settings.tableFiles[index] = newFileName;
							this.update();
							void this.plugin.saveData(this.plugin.settings);
						}).open();
					}
				})),
				onDelete: async (idx: number) => {
					this.plugin.settings.tableFiles.splice(idx, 1);
					if (this.plugin.settings.tableFiles.length == 0)
						void SettingsHelper.ensureTablesFile(this.plugin.settings);
					this.update();
					void this.plugin.saveData(this.plugin.settings);
					mTrace('setting', "removed table file");
				},
			},
			{ name: "Restart this plugin after changing any settings." },
		];
	}
}
class TablesFolderModal extends Modal {
	constructor(app: App, oldFileName: string, onSave: (newFileName: string) => void) {
		let newFileName = oldFileName;
		super(app);
		mTrace('settings', "constructing TablesFolderModal");
		this.setTitle("Tables file name");
		new Setting(this.contentEl)
			.setName('File name')
			.addText((text) => {
				text.setValue(oldFileName);
				text.onChange((value) => {
					newFileName = value;
				});
			});
		new Setting(this.contentEl)
			.addButton((btn) => btn
				.setButtonText('Save')
				.setCta()
				.onClick(() => {
					this.close();
					onSave(newFileName);
				}))
			.addButton((btn) => btn
				.setButtonText('Cancel')
				.setCta()
				.onClick(() => {
					this.close();
				}));
	}
}

