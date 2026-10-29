// import { Setting, TextAreaComponent, ButtonComponent, DisplayValueComponent, DropdownComponent, } from 'obsidian';
// import { Tables } from '../tables/tables.js';
import { assertDefined, mTrace, mythicDice, } from '../utils.js';
import { Exclude, Expose, Type, } from 'class-transformer';
import { EventFocus } from '../eventFocus/eventfocus.js';
import { Metadata } from '../metadata.js';
import { Meaning, } from '../meaning/meaning.js';
import { Tables } from '../tables/tables.js';
import { CheckTableEntry } from '../tables/checkTable.js';
/** can supply the chaos level. */
export interface ChaosProvider {
	/** returns the chaos level. */
	chaosValue(): number;
	setChaos(chaos: number): void;
}
/** dummy class used as default. */
export class DummmyChaosProvider implements ChaosProvider {
	chaosValue(): number { return 5; }
	setChaos(chaos: number): void { }
}
/** status of a question */
export enum FateQuestionStatus { // TODO revise
	NeedsSpecified, NeedsRandom, NeedsAlterationKind, NeedsFate, NeedsMeaning, OK,
}
/** contains the data for fate questions, including those derived from meaning or random event. MGME book pp17-33. This covers the data for Questions and (sometimes) Scenes. */
export class FateData {
	@Expose() description: string;
	@Expose() odds: string;
	@Expose() hasRandom: boolean = false;
	@Type(() => EventFocus)
	@Expose() focus?: EventFocus;
	@Type(() => Meaning)
	@Expose() meaning?: Meaning;
	@Expose() includeProtected?: boolean;
	@Exclude() chaosProvider: ChaosProvider = new DummmyChaosProvider;
	@Expose() dice: Array<number>;
	constructor(chaosProvider: ChaosProvider) {
		// mTrace('fate', "making fate",);
		this.description = "";
		this.odds = 'certain';
		this.chaosProvider = chaosProvider;
		this.dice = [0, 0];
	}
	/** do this after a FateData has been deserialised */
	afterLoad() {
		if (this.includeProtected == undefined) this.includeProtected = false;
	}
	/** do this before a FateData is serialised */
	beforeUnload() {
		if (this.includeProtected == false) this.includeProtected = undefined;
	}
	/** check the status of the question */
	checkStatus(): FateQuestionStatus {
		if (!this.specified()) return FateQuestionStatus.NeedsSpecified;
		return FateQuestionStatus.OK;
	}
	/**  whether the player/user has specified the question */;
	specified(): boolean {
		return this.description.trim() != '' && this.odds.trim() != '';
	}
	/** the modification resulting from the chaos level. */
	chaosMod(): number {
		assertDefined(this.chaosProvider);
		const chaosFactor = this.chaosProvider.chaosValue();
		return chaosFactor > 7 ? chaosFactor - 4 : chaosFactor < 3 ? chaosFactor - 6 : chaosFactor - 5;
	}
	/** create or remove a random event */
	makeRandomEvent(isRandom: boolean, tables: Tables, metadata: Metadata) {
		mTrace('question', `random set to${isRandom ? "" : " not"} random`);
		if (isRandom) {
			if (this.focus == undefined) {
				this.focus = new EventFocus();

				// this.focus.throwDice(tables);
				// let ent = this.focus.focusDescr(tables);
				// this.focus.defineSelectedObject(metadata, ent.interpretation, this.includeProtected ?? false);
				// this.focus.makeRandom(tables, metadata, this.includeProtected ?? false);
			}
		} else {
			this.focus = undefined;
		}
	}
	/** ?? */;
	throwDiceA(tables: Tables, metadata: Metadata): void {
		// for (let d = 0; d < 2; d++) this.dice[d] = mythicDice(10);// dice max is for a Fate Check
		this.throwDice();
		const isRandom = this.isRandom();
		this.makeRandomEvent(isRandom, tables, metadata);
	};
	/** describe the question in plain text. Do not include the event focus. */
	asText(tables: Tables): string {
		let texts = new Array<string>;
		try {
			// if (this.hasRandom) {
			// texts.push("Random event: ");
			// if (this.focus !== undefined) {
			// 	texts.push(this.focus.asText(tables));
			// }
			// }
			if (this.includeProtected) texts.push(", include protected");
			// let mod: number = tables.getQuestionOdds(this.odds).fate_check_modifier;
			// let rollTotal = (this.dice[0] ?? 0) + (this.dice[1] ?? 0) + mod + this.chaosMod(); // always d10
			// mTrace('fatedata', `roll totla is ${rollTotal}`);
			// let answer = tables.fateCheckAnswers.resolve(rollTotal,);
			const [answer, rollTotal, _mod] = this.interpret(tables);
			texts.push(`${this.description}: ${answer.text} (${this.dice[0]}/${this.dice[1]} = ${rollTotal})`);
		} catch (error) {
			const msg = `error in question: ${error as Error}`;
			console.error(msg);
			texts.push(msg);
		}
		return texts.join(" ");
	}
	interpret(tables: Tables): [CheckTableEntry, number, number] {
		let mod: number = tables.getQuestionOdds(this.odds).fate_check_modifier;
		let rollTotal = (this.dice[0] ?? 0) + (this.dice[1] ?? 0) + mod + this.chaosMod(); // always d10
		mTrace('fatedata', `roll total is ${rollTotal}`);
		let answer = tables.fateCheckAnswers.resolve(rollTotal,);
		return [answer, rollTotal, mod];
	}
	/** create HTML for display. Include the event focus. */
	asHtml(divElt: HTMLElement, tables: Tables) {
		let spanFate: HTMLSpanElement = divElt.createSpan({ text: " (fate) ", cls: 'mythic-fate' });
		try {
			let descElt = spanFate.createEl('i');
			descElt.createEl('b', { text: ` ${this.description}` });
			spanFate.createSpan({ text: ` ${this.dice[0]}/${this.dice[1]}` });
			spanFate.createSpan({ text: ` odds: ${this.odds}` });
			// const mod: number = tables.getQuestionOdds(this.odds).fate_check_modifier;
			// const chaos = this.chaosMod();
			// const rollTotal = (this.dice[0] ?? 0) + (this.dice[1] ?? 0) + mod + chaos; // always d10
			// mTrace('fatedata', `roll totla is ${rollTotal}`);
			// const answer = tables.fateCheckAnswers.resolve(rollTotal);
			const [answer, rollTotal, mod] = this.interpret(tables);
			spanFate.createEl('i', { text: ` (${this.dice[0] ?? 0} + ${this.dice[1] ?? 0} + ${mod} + ${this.chaosMod()})` });
			spanFate.createSpan({ text: ` = ${rollTotal}` });
			spanFate.createEl('b', { text: ` (${answer.text})` });
			// mTrace('fate', this.dice, mod, chaos, "=", roll_total);if (question.hasRandom) {
			// divElt.createSpan({ text: "Random event: ", cls: 'mythic-random' });
			if (this.includeProtected) divElt.createSpan({ text: " include protected" });
			if (this.meaning !== undefined) {
				this.meaning.asHtml(divElt);
				// divElt.createDiv({ text: this.meaning.result1, cls: 'mythic-random' });
				// divElt.createEl('b', { text: this.meaning.result2, cls: 'mythic-random' });
			}
			// if (this.hasRandom) {
			// divElt.createSpan({ text: "Random event ", cls: 'mythic-random' });
			if (this.focus !== undefined) {
				this.focus.asHtml(divElt, tables);
			}
			// }
		} catch (error) {
			const msg = `error when rendering fate: ${error as Error}`;
			console.error(msg);
			spanFate.createSpan({ text: msg, cls: 'mythic-error' });
		}
	}
	/** whether the fate merits creating a random event */
	isRandom(): boolean {
		const chaosFactor = this.chaosProvider.chaosValue();
		return ((this.dice[0] ?? 0) == (this.dice[1] ?? 0) && (this.dice[0] ?? 0) <= chaosFactor);
	}
	/** throw the dice to provide randomness. */
	throwDice(): void {
		for (let d = 0; d < 2; d++) this.dice[d] = mythicDice(10);
	}
}
