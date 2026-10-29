import { assertDefined, mTrace } from "../utils.js";
import { Metadata } from "../metadata.js";
import { Tables } from "../tables/tables.js";
import { Setting, ButtonComponent, DisplayValueComponent, SettingGroup } from 'obsidian';
import { EventFocus } from "./eventfocus.js";
export class EventFocusPartModal {
	focus?: EventFocus;
	tables: Tables;
	metadata: Metadata;
	// throwButtonSetting: Setting;
	// displaySetting: Setting;
	throwButton?: ButtonComponent;
	infoDisplay?: DisplayValueComponent;
	// debugSetting: Setting;
	constructor(elt: HTMLElement, tables: Tables, metadata: Metadata,) {
		this.tables = tables;
		this.metadata = metadata;
		new SettingGroup(elt)
			.setHeading("Event focus")
			// .addSetting((setting) => {
			// 	setting
			// 		.setName("EF DEBUG")
			// 		.setDesc("FOR DEBUGGING")
			// 		.addDisplayValue((dvc) => { dvc.setValue("DEBUG - event focus"); });
			// })
			.addSetting((setting) => {
				setting
					.setDesc("This resolves the event focus of the random event.")
					.addButton((btn) => {
						this.throwButton = btn;
						btn
							.setButtonText("Resolve event focus")
							.setCta()
							.onClick(() => {
								// mTrace('event focus modal', "randomising event focus");
								if (this.focus === undefined) {
									console.warn("no fate data");
									return;
								}
								this.focus?.makeRandom(this.tables, this.metadata);
								if (this.infoDisplay !== undefined)
									this.infoDisplay.setValue(this.focus?.asText(tables));
							});
					});
			})
			.addSetting((setting) => {
				setting
					.setDesc("Event focus:").addDisplayValue(disp => {
						this.infoDisplay = disp;
					});
			});
	}
	setFocus(focus: EventFocus) {
		this.focus = focus;
	}
	/** set the visibility of EventFocusPartModal components. */
	setVisibility(visible: boolean, narr: string = "sv?") {
		// mTrace('event focus modal', "setting fate", visible ? "visible" : "invisible", narr);
		// this.throwButtonSetting.setVisibility(visible);
		// this.displaySetting.setVisibility(visible);
		// this.debugSetting.setVisibility(visible);
	}
}
