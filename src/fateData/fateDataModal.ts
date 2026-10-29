import { Setting, TextAreaComponent, ButtonComponent, DisplayValueComponent, DropdownComponent, SettingGroup, } from 'obsidian';
import { Tables } from '../tables/tables.js';
import { assertDefined, mTrace, } from '../utils.js';
// import { Exclude, Expose, Type, plainToInstance, instanceToPlain } from 'class-transformer';
// import { EventFocus } from '../eventfocus.js';
import { Metadata } from '../metadata.js';
// import { MeaningModal } from '../meaning/meaning.js';
import { FateData } from './fatedata.js';
import { MeaningPartModal } from '../meaning/meaningPartModal.js';
import { EventFocusPartModal } from '../eventFocus/eventFocusPartModal.js';
/** create a Modal for the user interface to a FateData. 
  
main controls are:  
	chaos factor
	question
	odds
	meaning
	event focus
*/
export class FateDataModal {
	fateData?: FateData;
	hasRandom: boolean = false;
	// questionSetting: Setting;
	// oddsSetting: Setting;
	textArea?: TextAreaComponent;
	oddsComponent?: DropdownComponent;
	throwButton?: ButtonComponent;
	infoDisplay?: DisplayValueComponent;
	// throwButtonSetting: Setting;
	// meaningSetting?: Setting;
	meaningPartModal?: MeaningPartModal;
	infoDisplaySetting?: Setting;
	// infoDisplay1?: DisplayValueComponent;
	// focusDisplay?: DisplayValueComponent;
	// focusDisplaySetting?: Setting;
	eventFocusPartModal?: EventFocusPartModal;
	onDone?: (isRandom: boolean) => void;
	constructor(elt: HTMLElement, tables: Tables, metadata: Metadata, onDone?: (isRandom: boolean) => void) {
		// mTrace('fate data', "constructing fate data for modal");
		this.onDone = onDone;

		new SettingGroup(elt)
			.setHeading("Fate data")
			// .addSetting((setting) => {
			// 	setting.setName("FD DEBUG").setDesc("FOR DEBUGGING").addDisplayValue((dvc) => { dvc.setValue("DEBUG - fate data"); });
			// })
			.addSetting((setting) => {
				setting.setName('Chaos')
					.setDesc("The current Chaos Factor").addSlider((slider) => {
						const initChaos = this.fateData == undefined ? 5 : this.fateData.chaosProvider.chaosValue();
						slider.setLimits(1, 9, 1)
							.setInstant(true)
							.setValue(initChaos)
							.onChange((value) => {
								if (this.fateData !== undefined)
									this.fateData.chaosProvider.setChaos(value);
							});
					});
			})
			.addSetting((setting) => {
				setting.setName('Include protected')
					.setDesc("include protected objects in any random selection")
					.addToggle((toggle) => {
						const initProt = this.fateData !== undefined && this.fateData.includeProtected;
						toggle.setValue(initProt ?? false)
							.onChange((value) => { if (this.fateData !== undefined) this.fateData.includeProtected = value; });
					});
			})
			.addSetting((setting) => {
				setting
					.setName('Fate Question')
					.setDesc("The question to be answered")
					.addTextArea((text) => {
						this.textArea = text;
						if (this.fateData !== undefined)
							text.setValue(this.fateData.description);
						else mTrace('fate', "fate data modal descr: no data on add question");
						text.onChange((value) => {
							if (this.fateData !== undefined)
								this.fateData.description = value;
							else console.warn("fate data modal descr: no data on change");
						});
					});
			})
			.addSetting((setting) => {
				setting
					.setName('Fate Odds')
					.setDesc("Fate data odds")
					.addDropdown((dropDown) => {
						this.oddsComponent = dropDown;
						// 	mTrace('fate data', "loading odds to dropdown", tables);
						for (let quOdds of tables.questionOdds) dropDown.addOption(quOdds.ident, quOdds.display);
						if (this.fateData !== undefined)
							dropDown.setValue(this.fateData.odds);
						else mTrace('fate', "fate data modal odds: no data on add odds");
						dropDown.onChange((value) => {
							if (this.fateData !== undefined)
								this.fateData.odds = value;
							else console.warn("fate data modal odds: no data on change");
						});
					});
			})
			.addSetting((setting) => {
				setting
					.setDesc("This resolves the random event.").addButton((btn) => {
						this.throwButton = btn;
						btn
							.setButtonText("Resolve fate event")
							.setCta()
							.onClick(() => {
								// mTrace('fate data', "randomising fate event");
								if (this.fateData === undefined) {
									console.warn("no fate data");
									return;
								}
								this.fateData.makeRandomEvent(true, tables, metadata); // TODO fix
								this.fateData?.throwDice(); // TODO fix
								if (this.infoDisplay !== undefined)
									this.infoDisplay.setValue(this.fateData?.asText(tables));
								if (this.onDone !== undefined) {
									// mTrace('fate', "random, callback");
									this.onDone(this.fateData == undefined ? false : this.fateData.isRandom());
								}
							});
					});
			})
			// .addSetting((setting) => {
			// 	setting.setDesc("FD1").addDisplayValue(disp => {
			// 		this.infoDisplay1 = disp;
			// 	});
			// })
			.addSetting((setting) => {
				setting./* setDesc("FD2"). */addDisplayValue(disp => {
					this.infoDisplay = disp;
				});
			});
		if (this.fateData !== undefined && this.fateData.meaning !== undefined)
			this.meaningPartModal = new MeaningPartModal(this.fateData.meaning, elt, tables);
		if (this.eventFocusPartModal === undefined)
			this.eventFocusPartModal = new EventFocusPartModal(elt, tables, metadata);
		// this.meaningSetting = MeaningModal.makeMeaningModal(elt, tables,
		// 	(value) => {
		// 		if (this.fateData !== undefined) {
		// 			if (this.fateData.meaning !== undefined)
		// 				this.fateData.meaning.action = value;
		// 			this.fateData.meaningKind = value;
		// 			this.fateData.makeRandomEvent(this.hasRandom, tables, metadata);
		// 		}
		// 	}, this.fateData == undefined ? undefined : this.fateData.meaning);
		// this.focusDisplaySetting = new Setting(elt).addDisplayValue(disp => {
		// 	this.focusDisplay = disp;
		// });
	}
	/** update the FateDataModal to reflect the change in the FateData. */
	setData(fateData: FateData | undefined, tables: Tables) {
		// mTrace('fate data', "setting fate data");
		assertDefined(fateData);
		this.fateData = fateData;
		if (fateData === undefined) return;
		if (this.textArea !== undefined)
			this.textArea.setValue(fateData.description);
		if (this.oddsComponent !== undefined)
			this.oddsComponent.setValue(this.fateData.odds);
		if (this.infoDisplay !== undefined)
			this.infoDisplay.setValue(this.fateData?.asText(tables));
		// if (this.focusDisplay != undefined && this.fateData.focus !== undefined)
		// 	this.focusDisplay.setValue(this.fateData.focus?.toText(tables));
		if (this.fateData.focus !== undefined)
			this.eventFocusPartModal?.setFocus(this.fateData.focus);
	}
	/** set the visibility of FateDataModal components. */
	setVisibility(visible: boolean, narr: string = "sv?") {
		// mTrace('fate data', "setting fate", visible ? "visible" : "invisible", narr);
		// this.questionSetting.setVisibility(visible);
		// this.oddsSetting.setVisibility(visible);
		// this.throwButtonSetting.setVisibility(visible);
		// if (this.infoDisplaySetting !== undefined)
		// 	this.infoDisplaySetting.setVisibility(visible);
		// // this.chaosSetting.setVisibility(visible);
		// this.eventFocusPartModal?.setVisibility(visible);
	}
	// /** updates the Modal to reflect whether a random event has occurred. */
	// setRandom(hasRandom: boolean, tables: Tables) {
	// 	if (this.fateData !== undefined) {
	// 		this.fateData.hasRandom = hasRandom;
	// 		if (this.infoDisplay1 !== undefined) {
	// 			this.infoDisplay1.setValue(this.fateData.asText(tables));
	// 			// if (this.fateData.focus !== undefined)
	// 			// 	this.focusDisplay?.setValue(this.fateData.focus?.toText(tables));
	// 		}
	// 	}
	// 	this.hasRandom = hasRandom;
	// 	// this.meaningSetting?.setVisibility(hasRandom);
	// 	// if (this.dropdownComponent !== undefined)
	// }
}
