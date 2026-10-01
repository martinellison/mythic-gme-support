import { DiceRandom } from '../dice.js';

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
	interpretation: Interpretation = Interpretation.None;
	// protect?: boolean;
	constructor(weight: number = 1, text: string = "", interpretation: Interpretation = Interpretation.None,) {
		// this.min = min;
		this.max = 0;
		this.weight = weight ?? 1;
		this.text = text;
		this.interpretation = interpretation;
		// this.protect = protect;
	}
}
/** a check table is a table that can be selected from randomly. */
export class CheckTable {
	entries: Array<CheckTableEntry> = new Array<CheckTableEntry>;
	totWeights: number = 0;
	// totWeightsUnprotected: number = 0;
	diceType?: string;
	diceMin: number = 0;
	diceMax: number = 0;
	// diceMaxUnprot: number = 0;
	texts(): Array<string> { return this.entries.map((entry) => entry.text); }
	fix(entries: Array<CheckTableEntry> = [], diceType?: string) {
		// mTrace('', "fixing", diceType, entries);
		this.diceType = diceType;
		this.totWeights = 0;
		entries.forEach((entry) => {
			this.totWeights += entry.weight;
			// mTrace('', "entry", entry, this.totWeights);
			// if (entry.protect === undefined || !entry.protect)
			// 	this.totWeightsUnprotected += entry.weight;
		});
		let w = 0;
		// let wu = 0;
		entries.forEach((entry) => {
			w += entry.weight;
			entry.max = w;
			// if (entry.protect == undefined || !entry.protect) {
			// 	wu += entry.weight;
			// 	entry.maxUnprot = wu;
			// }
			// mTrace('', "entry", entry, this.totWeights);
		});
		if (this.diceType === undefined) {
			this.diceMax = this.totWeights;
			// this.diceMaxUnprot = this.totWeightsUnprotected;
			this.diceMin = 1;
		}
		else {
			const d = new DiceRandom(this.diceType);
			this.diceMax = d.max();
			// this.diceMaxUnprot = d.max();
			this.diceMin = d.min();
		}
		this.entries = entries;
	}
	/** throw the dice, with values that can be fed to `resolve()` */
	throwDiceStandardised(): number {
		if (this.diceType === undefined) {
			// const tw = includeProtected ? this.totWeightsUnprotected : this.totWeights;
			const tw = this.totWeights;
			return Math.floor(tw * Math.random());
		} else {
			const d = new DiceRandom(this.diceType);
			const diceThrow = d.throw();
			return diceThrow[0] - d.min() + 1;
		}
	}
	/** This selects an entry from a table, given a random number. The table must be in increasing order. The tables can be weighted (not all entries have the same probability). `value` is the dice throw and should be 'standardised', meaning that the lowest value should be 1. If the value is too low, the first entry is returned; if too high, the last. */
	resolve(value: number,): CheckTableEntry {
		// mTrace("resolving", value);
		for (let entry of this.entries) {
			// mTrace("try", entry.max);
			if (value <= entry.max) {
				// mTrace('tables', `resolving ${value}, found `, entry);
				// if (!includeProtected && entry.protect) {
				// 	console.error("(tables) protected object selected when not included", value);
				// }
				return entry;
			}
		}
		const last = this.entries[this.entries.length - 1];
		if (last !== undefined) return last;
		// if there are no entries, return a dummy value
		return new CheckTableEntry(0, "(unknown)", Interpretation.None,);
	}
}
