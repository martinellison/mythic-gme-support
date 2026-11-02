// import { assertDefined, mTrace } from "../utils.js";
import { Metadata } from "../metadata.js";
import { Tables } from "../tables/tables.js";
import { ButtonComponent, DisplayValueComponent, SettingGroup } from 'obsidian';
import { EventFocus } from "./eventfocus.js";
export class EventFocusPartModal {
	focus?: EventFocus;
	tables: Tables;
	metadata: Metadata;
	throwButton?: ButtonComponent;
	infoDisplay?: DisplayValueComponent;
	constructor(elt: HTMLElement, tables: Tables, metadata: Metadata,) {
		this.tables = tables;
		this.metadata = metadata;
		new SettingGroup(elt)
			.setHeading("Event focus")
			.addSetting((setting) => {
				setting
					.setDesc("This resolves the event focus of the random event.")
					.addButton((btn) => {
						this.throwButton = btn;
						btn
							.setButtonText("Resolve event focus")
							.setCta()
							.onClick(() => {
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
	}
}
