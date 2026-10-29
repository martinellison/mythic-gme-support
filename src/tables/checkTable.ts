import { DiceRandom } from '../dice-utils.js';
import { mTrace } from '../utils.js';

/** Interpretation covers the interpretations of an EventFocus that do not have an entry in the `eventFocus` table. */
export const enum Interpretation {
	None = 'none',
	NewNPC = 'newnpc',
}
/** an entry on a check table. The result of a random selection. The interpretation is what action to take as a result. */
export class CheckTableEntry {
	max: number = 0;
	maxUnprot: number = 0;
	weight: number = 0;
	text: string = "??";
	interpretation: string = Interpretation.None;
	protect: boolean = false;
	constructor(weight: number = 1, text: string = "", interpretation: string = Interpretation.None, protect: boolean = false,) {
		this.max = 0;
		this.weight = weight ?? 1;
		this.text = text;
		this.interpretation = interpretation;
		this.protect = protect;
	}
}
/** a check table is a table that can be selected from randomly. */
export class CheckTable {
	entries: Array<CheckTableEntry> = new Array<CheckTableEntry>;
	totWeights: number = 0;
	diceType?: string;
	diceMin: number = 0;
	diceMax: number = 0;
	texts(): Array<string> { return this.entries.map((entry) => entry.text); }
	fix(entries: Array<CheckTableEntry> = [], diceType?: string) {
		// mTrace('', "fixing", diceType, entries);
		this.diceType = diceType;
		this.totWeights = 0;
		entries.forEach((entry) => {
			this.totWeights += entry.weight;
		});
		let w = 0;
		entries.forEach((entry) => {
			w += entry.weight;
			entry.max = w;
		});
		if (this.diceType === undefined) {
			this.diceMax = this.totWeights;
			this.diceMin = 1;
		}
		else {
			const d = new DiceRandom(this.diceType);
			this.diceMax = d.max();
			this.diceMin = d.min();
		}
		this.entries = entries;
	}
	/** throw the dice, with values that can be fed to `resolve()` */
	throwDiceStandardised(): number {
		if (this.diceType === undefined) {
			const tw = this.totWeights;
			mTrace('checktable', `random to total weights ${tw}`);
			return Math.floor(tw * Math.random());
		} else {
			const d = new DiceRandom(this.diceType);
			mTrace('checktable', `random to dice type ${this.diceType}`);
			const diceThrow = d.throwActual();
			return diceThrow[0] - d.min() + 1;
		}
	}
	/** This selects an entry from a table, given a random number. The table must be in increasing order. The tables can be weighted (not all entries have the same probability). `value` is the dice throw and should be 'standardised', meaning that the lowest value should be 1. If the value is too low, the first entry is returned; if too high, the last. */
	resolve(value: number,): CheckTableEntry {
		mTrace('checktable', `resolving ${value}`);
		for (let entry of this.entries) {
			// mTrace("try", entry.max);
			if (value <= entry.max) {
				mTrace('checktable', `resolving ${value}, found ${entry.text}`);
				return entry;
			}
		}
		const last = this.entries[this.entries.length - 1];
		if (last !== undefined) return last;
		// if there are no entries, return a dummy value
		return new CheckTableEntry(0, "(unknown)", Interpretation.None,);
	}
}
