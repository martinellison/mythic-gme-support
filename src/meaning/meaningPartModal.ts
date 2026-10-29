// import { plainToInstance, instanceToPlain, Expose } from 'class-transformer';
import { Setting, DisplayValueComponent, SettingGroup } from 'obsidian';
// import { CodeBlock } from '../codeblock.js';
import { mTrace, } from '../utils.js';
import { Tables } from '../tables/tables.js';
import { Meaning } from './meaning.js';
/** this is for a meaning part of a larger modal */

export class MeaningPartModal {
	meaning: Meaning;
	// setting: Setting;
	infoDisplaySetting: Setting;
	infoDisplay?: DisplayValueComponent;
	/** create the user interface for searching for a Meaning. This will be part of a Modal. Create a drop down to select a meaning oracle. 
	 
	If `meaning` is not defined, this just means that no meaning has been selected yet, and so no value will be initially selected in the dropdown. 
	
	Make sure that the visibility of this setting can be changed after the modal has been created.*/
	constructor(meaning: Meaning, elt: HTMLElement, tables: Tables) {
		this.meaning = meaning;
		if (this.meaning === undefined) { mTrace('meaning/make', "(make meaning) no meaning for dropdown"); } // not a problem

		new SettingGroup(elt)
			.setHeading("Meaning")
			// .addSetting((setting) => {
			// 	setting
			// 		.setName("M DEBUG").setDesc("FOR DEBUGGING")
			// 		.addDisplayValue((dvc) => { dvc.setValue("DEBUG - meaning"); });
			// })
			.addSetting((setting) => {
				setting
					.setDesc("Select which meaning tables to consult.")
					.setName('Meaning')
					.addDropdown((dropDown) => {
						let tabKind, tab;
						for ([tabKind, tab] of tables.oracleNames()) {
							dropDown.addOption(tabKind, tab);
							// for ([tabKind, tab] of tables.oracles) {
							// 	mTrace('meaning', "drop", tab.meta.noAlt ? ", no alt" : "", tab.meta.displayName);
							// 	if (!tab.meta.noAlt)
							// 		dropDown.addOption(tabKind, tab.meta.displayName);
						}
						dropDown.setValue(this.meaning.action);
						dropDown.onChange((value) => {
							mTrace('meaning', "meaning changed to", value);
							this.meaning.action = value;
						});
					});
			})
			.addSetting((setting) => {
				setting
					.addButton((btn) => btn
						.setButtonText("Throw dice for meaning")
						.setCta()
						.onClick(() => {
							this.meaning.makeRandom(tables);
							// this.meaning.throwDice(meaning.tableSizes(tables));
							// this.meaning.explain(tables);
							if (this.infoDisplay !== undefined)
								this.infoDisplay.setValue(this.meaning.result1 + this.meaning.result2);
							// const json = meaning.toJson();
							// mTrace('meaning', "save as", json);
							// let editor = app.workspace.activeEditor?.editor;
							// if (editor !== undefined)
							// 	block.replaceContents(Meaning.TAG, json, editor);
						}));
			});
		this.infoDisplaySetting = new Setting(elt)./* setDesc("M1"). */addDisplayValue(disp => {
			this.infoDisplay = disp;
		});
	}
}
