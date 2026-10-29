import { plainToInstance, instanceToPlain, Expose } from 'class-transformer';
import { Modal, App, Setting, MarkdownPostProcessorContext } from 'obsidian';
import { CodeBlock } from '../codeblock.js';
import { assertDefined, mTrace, mythicDice, shorten } from '../utils.js';
import { Oracle, Tables } from '../tables/tables.js';

/**  implements an meaning block. This covers the results of an oracle. MGME book pp46ff, 84ff. Meaning text should come after a meaning block */
export class Meaning {
	@Expose() description: string = "";
	@Expose() action: string = 'action1';
	@Expose() randoms: Array<number> = [0, 0];
	@Expose() result1: string = "";
	@Expose() result2: string = "";
	static readonly TAG = 'mythic-meaning';
	constructor(meaningKind: string = 'action1') {
		this.action = meaningKind;
	}
	/** convert from a JSON string to a Meaning. */
	static fromJson(source: string): Meaning {
		try {
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- JSON.parse returns any
			let meaning: Meaning = plainToInstance(Meaning, JSON.parse(source), { excludeExtraneousValues: true });
			// if (meaning.meaningKind == '') meaning.meaningKind = 'action1';
			meaning.afterLoad();
			return meaning;
		} catch (error) {
			console.error("error parsing meaning: ", error, "reading:", shorten(source));
			throw error;
		}
	}
	/** do this after a Meaning has been deserialised */
	afterLoad() {
		if (this.action == '') this.action = 'action1';
	}
	/** convert  a Meaning to a JSON string */
	toJson(): string {
		this.beforeUnload();
		return JSON.stringify(instanceToPlain(this));
	}
	/** do this before a Meaning is serialised */
	beforeUnload() {
	}

	/** describe the meaning in plain text */
	asText(tables: Tables): string {
		return `${this.result1}/${this.result2}`;
	}
	/** create HTML for display */
	asHtml(elt: HTMLElement) {
		elt.createSpan({ text: `(meaning) ` });
		let descElt = elt.createEl('i');
		descElt.createEl('b', { text: `${this.description}:` });
		elt.createSpan({ text: ` ${this.result1}` });
		elt.createEl('b', { text: ` ${this.result2}` });
	}
	/** create HTML for display from block */
	static toHtml(source: string, el: HTMLElement, _ctx: MarkdownPostProcessorContext) {
		// assertDefined(tables);
		let divElt: HTMLDivElement = el.createDiv({ cls: 'mythic-meaning' });
		try {
			mTrace('meaning', "rendering meaning", source);
			const meaning: Meaning = Meaning.fromJson(source);
			meaning.asHtml(divElt);
			// divElt.createSpan({ text: `(meaning) ` });
			// let descElt = divElt.createEl('i');
			// descElt.createEl('b', { text: `${meaning.description}:` });
			// divElt.createSpan({ text: ` ${meaning.result1}` });
			// divElt.createEl('b', { text: ` ${meaning.result2}` });
		} catch (error) {
			const msg = `error when parsing meaning: ${error as Error}`;
			console.error(msg);
			divElt.createSpan({ text: msg, cls: 'mythic-error' });
		}
	}
	makeRandom(tables: Tables) {
		mTrace('meaning', "making random");
		const tabSiz = this.tableSizes(tables);
		this.throwDice(tabSiz);
		this.explain(tables);
	}
	/** This throws the dice. */
	throwDice(max: number[]) {
		for (let d = 0; d < 2; d++) this.randoms[d] = mythicDice(max[d] ?? 100);
		mTrace('meaning', "meaning result is", this.randoms.toString());
	};
	/** sets `this.result to a textual description of the randomly chosen meaning. */
	explain(tables: Tables) {
		const tab = tables.oracles.get(this.action);
		if (tab === undefined) {
			this.result1 = `unknown ${this.action}`;
			this.result2 = "";
			console.warn("cannot explain", this.action);
			return;
		}
		const meanings = Meaning.meanings(tables, this.randoms, this.action);
		this.result1 = `(${tab.meta.displayName ?? tab.meta.description})`;
		this.result2 = `${meanings}`;
		mTrace('meaning', `${this.action} meaning explained as ${this.result1}: ${this.result2}`);
	}
	/** this selects a meaning. */
	static meaning1(tables: Tables, meaningKind: string): string {
		return meaningKind;
	}
	/** this selects another meaning. This is different from `meaning1` if the `alt` flag is et. */
	static meaning2(tables: Tables, meaningKind: string): string {
		if (meaningKind == '') return '';
		// for (const [k, _v] of tables.meaning) mTrace('meaning', "meaning table", k);
		const tab = tables.oracles.get(meaningKind);
		if (tab !== undefined && tab instanceof Oracle) {
			if (tab.meta.noAlt) return "";
			if (tab.meta.alt) return tab.meta.alt;
			return meaningKind;
		} else {
			const err = `unknown '${meaningKind}'`;
			console.error("in meaning2, ", err, "for", meaningKind);
			if (tab !== undefined)
				console.warn("found ", tab);
			// for (const k of tables.oracles.keys()) mTrace('meaning oracles', k);
			return err;
		}
	}
	/** this gets the selected tables */
	static selectedTables(tables: Tables, meaningKind: string): [string[], string[]] {
		const m1 = Meaning.meaning1(tables, meaningKind);
		const m2 = Meaning.meaning2(tables, meaningKind);
		const ms1 = tables.oracles.get(m1)?.texts() ?? [];
		const ms2 = tables.oracles.get(m2)?.texts() ?? [];
		return [ms1, ms2];
	}
	/** This returns a string containing a pair of meanings. */
	static meanings(tables: Tables, event_meaning: Array<number> = [0, 0], meaningKind: string): string {
		const q1: number = event_meaning[0] ?? 0;
		const q2: number = event_meaning[1] ?? 0;
		const [m1t, m2t] = Meaning.selectedTables(tables, meaningKind);
		const m1 = m1t[q1 - 1] ?? "";
		const m2 = m2t[q2 - 1] ?? "";
		return `${m1}/${m2} (${q1}/${q2})`;
	}
	/** this returns the sizes of the selected tables. */
	tableSizes(tables: Tables): Array<number> {
		assertDefined(tables, 'meaning');
		// if (this.meaningKind == 'none') console.warn("no meaning kind in tableSizes");
		let ts = new Array<number>;
		const tabs = Meaning.selectedTables(tables, this.action);
		for (const t of tabs)
			ts.push(t.length ?? 0);
		mTrace('meaning', "table sizes are", ts.toString());
		return ts;
	}
}
