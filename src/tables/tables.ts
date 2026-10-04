
import { Type, plainToInstance, Expose } from 'class-transformer';
import { QuestionOdds } from '../question.js';
import { CheckTable } from './checkTable.js';
/** which kind of object */
export enum ThingFamily { ThingObject, OracleResponse, SimpleText };
/** describes some objects, including how to randomise them. Loaded in from the KDL tables. */
export class MythicObjectMeta {
	family: ThingFamily = ThingFamily.ThingObject;
	kind: string = 'object';
	description: string = "object";
	displayName: string = "MythicObject";
	alt: string = "";
	noAlt: boolean = false;
	progress: boolean = false;
	constructor(
		family: ThingFamily = ThingFamily.ThingObject,
		kind: string = 'object',
		description: string = "object",
		displayName: string = "MythicObject",
		alt: string = "",
		noAlt: boolean = false,
		progress: boolean = false,) {
		this.family = family;
		this.kind = kind;
		this.description = description;
		this.displayName = displayName;
		this.alt = alt;
		this.noAlt = noAlt;
		this.progress = progress;
	}
}
/** An Oracle.  Loaded in from the KDL tables. */
export class Oracle {
	meta: MythicObjectMeta;
	entries: CheckTable;
	max: number;
	constructor(meta: MythicObjectMeta,
		entries: CheckTable,
		max: number) {
		this.meta = meta;
		this.entries = entries;
		this.max = max;
	}
	texts(): Array<string> {
		return this.entries.entries.map((entry) => entry.text);
	}
}
/** this implements the tables found in the book. It doesn't implement any specific part of the MGME book.  Tables read from a KDL configuration file. */
export class Tables {
	@Expose() questionOdds: Array<QuestionOdds>;
	@Expose() fateCheckAnswers: CheckTable;
	@Type(() => Array<string>)
	@Expose() eventFocus: CheckTable;
	@Expose() oracles: Map<string, Oracle>;
	@Expose() simples: Map<string, MythicObjectMeta>;
	@Expose() objectKinds: Map<string, MythicObjectMeta>;
	@Expose() tableVersions: Map<string, string>;
	// meaning: Map<string, MeaningTable>;
	result: string = ""; // non-empty means error
	constructor() {
		this.questionOdds = [];
		this.fateCheckAnswers = new CheckTable;
		// this.meaning = new Map<string, MeaningTable>;
		this.eventFocus = new CheckTable;
		this.oracles = new Map<string, Oracle>;
		this.simples = new Map<string, MythicObjectMeta>;
		this.objectKinds = new Map<string, MythicObjectMeta>;
		this.tableVersions = new Map<string, string>;
		this.result = "";
	}
	/** convert from a JSON string */
	static async fromJson(source: string): Promise<Tables> {
		return plainToInstance(Tables, JSON.parse(source), { excludeExtraneousValues: true });
	}
	/** this finds the 'meta' for this object kind; it can return undefined if the tables are not loaded yet */
	meta(objectKind: string): MythicObjectMeta | undefined {
		const objectMeta = this.objectKinds.get(objectKind);
		if (objectMeta !== undefined) return objectMeta;
		const oracle = this.oracles.get(objectKind);
		if (oracle !== undefined) return oracle.meta;
		const simpleMeta = this.simples.get(objectKind);
		if (simpleMeta === undefined) {
			console.error(`(in tables) cannot find meta for '${objectKind}', have ${this.objectKinds.size}/${this.oracles.size}/${this.simples.size}`);
			for (let k of this.objectKinds) { console.warn("obj", k[0]); }
			for (let k of this.oracles) { console.warn("oracles", k[0]); }
			for (let k of this.simples) { console.warn("simples", k[0]); }
		}
		return simpleMeta;
	}

	getQuestionOdds(ident: string): QuestionOdds {
		// mTrace('', "finding odds", ident);
		for (let questOdds of this.questionOdds) {
			if (questOdds.ident == ident) return questOdds;
		}
		return this.questionOdds[0] ?? new QuestionOdds(ident, ident, 0);
	}
}
