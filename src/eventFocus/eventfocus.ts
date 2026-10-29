import { assertDefined, mTrace } from "../utils.js";
import { Metadata } from "../metadata.js";
import { Expose } from 'class-transformer';
import { Tables } from "../tables/tables.js";
import { CheckTableEntry, Interpretation } from "../tables/checkTable.js";

/** the focus of a random event.  MGME book p36ff. */
export class EventFocus {
	@Expose() eventFocusIndex: number = 0;
	@Expose() object: string = "";
	@Expose() objectNumber: number = 0; // not stable as the lists are not stable
	constructor() {
		mTrace('eventfocus', "creating event focus");
	}
	/** this does random things for an event focus. */
	makeRandom(tables: Tables, metadata: Metadata) {
		mTrace('eventfocus', "creating focus, throwing dice for focus");
		assertDefined(tables);
		this.eventFocusIndex = tables.eventFocus.throwDiceStandardised();
		this.objectNumber = Math.floor(Math.random() * 100.0) / 100.0;
		let ent = this.focusDescr(tables);
		this.defineSelectedObject(metadata, ent.interpretation, !ent.protect);
		mTrace('eventfocus', `random gave index ${this.eventFocusIndex}, object #${this.objectNumber}, entry ${ent.text}:${ent.interpretation}`);
	}

	/** set the object (or no object, for some interpretations). Having no object is the normal situation for some interpretations, such as 'none'. */
	defineSelectedObject(metadata: Metadata, interpretation: string, includeProtected: boolean) {
		const objects = metadata.blockTable.objects(interpretation, includeProtected);
		if (objects.length == 0) {
			mTrace('eventfocus', "no objects to select from, for", interpretation);
			this.objectNumber = 0;
			this.object = '';
		} else {
			mTrace('eventfocus', "objects are", objects.map((obj) => { return `${obj.name ?? '?'}/${obj.description ?? '?'}`; }).join(", "));
			this.objectNumber = Math.floor(objects.length * this.objectNumber);
			const obj = objects[this.objectNumber];
			this.object = obj === undefined ? "(?)" : obj.name ?? obj.description;
			mTrace('eventfocus', `random object #${this.objectNumber} of ${objects.length} is ${this.object}`);
		}
	}
	/** this returns the description of the random event focus. */
	focusDescr(tables: Tables): CheckTableEntry {
		mTrace('eventfocus', `focus index is ${this.eventFocusIndex}`);
		const entry = tables.eventFocus.resolve(this.eventFocusIndex);
		mTrace('eventfocus', `focus resolved to ${entry.text}: ${entry.interpretation}`);
		return entry;
	}
	/** This returns a string describing the event focus. ~~This consults two separate tables for some MeaningKinds, but only one for the rest.~~ */
	asText(tables: Tables): string {
		mTrace('eventfocus', "random event: explaining ");
		let parts = new Array<string>;
		// parts.push("[random event focus!]"); // TODO trace, remove later
		const focusDescr = this.focusDescr(tables);
		const meta = tables.objectKinds.get(focusDescr.interpretation);
		if (meta !== undefined) {
			parts.push(meta.displayName);
		}
		// parts.push(`[${focusDescr.text}]`);
		switch (focusDescr.interpretation) {
			case Interpretation.None.toString(): break;
			case Interpretation.NewNPC.toString(): parts.push("Create a new NPC"); break;
			default:
				// parts.push(`[interp as ${focusDescr.interpretation.toString()}]`); 
				break;
		}
		parts.push(focusDescr.text);
		if (this.object != "")
			parts.push(this.object);
		return parts.join(' ');
	}
	/** create HTML for display */
	asHtml(divElt: HTMLElement, tables: Tables): void {
		let spanFocus: HTMLSpanElement = divElt.createSpan({ text: " (focus) ", cls: 'mythic-focus' });
		try {
			mTrace('eventfocus', "random event: explaining to HTML ");
			// spanFocus.createSpan({ text: "(random event focus)" }); // TODO trace, remove later
			const focusDescr = this.focusDescr(tables);
			const meta = tables.objectKinds.get(focusDescr.interpretation);
			if (meta !== undefined) {
				spanFocus.createSpan({ text: ` ${meta.displayName}` });
			}
			spanFocus.createEl('b', { text: ` ${focusDescr.text}` });
			switch (focusDescr.interpretation) {
				case Interpretation.None.toString(): break;
				case Interpretation.NewNPC.toString(): spanFocus.createSpan({ text: " Create a new NPC" }); break;
				default: break; // spanFocus.createSpan({ text: `[interp as ${focusDescr.interpretation.toString()}]` });
			}
			// spanFocus.createSpan({ text: ` ${focusDescr.text}` });
			if (this.object != "")
				spanFocus.createEl('b', { text: ` (${this.object})` });
		} catch (error) {
			console.error("error displaying event focus: ", error);
			spanFocus.createSpan({ text: `error in displaying event focus: ${error as Error}`, cls: 'mythic-error' });
		}
	}
}
