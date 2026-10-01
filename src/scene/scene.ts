import { Type, plainToInstance, instanceToPlain, Expose } from 'class-transformer';
import { MarkdownPostProcessorContext, } from 'obsidian';
import { Tables } from '../tables/tables.js';
import { EventFocus, } from '../eventfocus.js';
import MythicSupportPlugin, { assertDefined, mTrace, mythicDice, shorten } from '../main.js';
// import { Question, QuestionModal } from './question.js';
import { FateData, ChaosProvider } from '../fatedata.js';
import { Meaning, } from '../meaning.js';
import { SceneType, SceneTypeSupport } from './sceneType.js';
import { AlterationKind } from './alteration.js';
import { AdjustmentSupport, SceneAdjustment } from './adjustment.js';

/** checking status of a scene. Keep the order. */
export enum SceneStatus {
	NeedsExpected, NeedsRandom, NeedsAlterationKind, NeedsFate, NeedsMeaning, NeedsAlteration, OK,
};
/** implements a Scene block. MGME book pp59-120. Scene text should come after a scene block */
export class Scene implements ChaosProvider {
	/** get the chaos level (implements ChaosProvider). */
	chaosValue(): number { return this.chaos; }
	static readonly TAG = 'mythic-scene';
	@Expose() ident: string = "";
	@Expose() chaos: number = 5;
	@Expose() sceneType: SceneType = SceneType.Initial;
	@Expose() kind: AlterationKind = AlterationKind.Expected;
	@Expose() expected: string = '';
	@Expose() alteration?: string;
	@Expose() adjustment?: Array<SceneAdjustment>;
	@Type(() => FateData)
	@Expose() fate?: FateData;
	@Type(() => EventFocus)
	@Expose() focus?: EventFocus;
	@Type(() => Meaning)
	@Expose() meaning?: Meaning;
	@Expose() hasRandom?: boolean; // does this do anything??
	@Expose() includeProtected?: boolean;
	constructor(num?: string) {
		this.ident = num ?? "0";
	}
	/** checks whether the scene has a valid value and can be saved. */
	check(): SceneStatus {
		if (this.expected.trim() == "") return SceneStatus.NeedsExpected;
		switch (this.sceneType) {
			case SceneType.Initial:
				return SceneStatus.NeedsRandom;
			case SceneType.Altered:
				switch (this.kind) {
					case AlterationKind.Expected:
						return SceneStatus.NeedsAlterationKind;
					case AlterationKind.FateQuestion:
						if (this.fate !== undefined && this.fate.description.trim() == "")
							return SceneStatus.NeedsFate;
						break;
					case AlterationKind.Meaning:
						if (this.meaning === undefined)
							return SceneStatus.NeedsMeaning;
						break;
					default:
				}
				break;
			case SceneType.Interrupt:
				if (this.kind == AlterationKind.Meaning && this.meaning == undefined)
					return SceneStatus.NeedsMeaning;
				break;
			case SceneType.Expected:
				break;
		}
		if (this.sceneType != SceneType.Expected && (this.alteration === undefined || this.alteration.trim() == ""))
			return SceneStatus.NeedsAlteration;
		return SceneStatus.OK;
	}
	/** generate randomness. The table for the scene type test is hard coded. */
	setRandom(tables: Tables, plugin: MythicSupportPlugin): void {
		// mTrace('scene', "Setting random");
		const sceneTestOracle = mythicDice(10);
		if (sceneTestOracle > this.chaos) {
			SceneTypeSupport.setSceneType(this, SceneType.Expected);
		}
		else if (sceneTestOracle % 2 == 1) {
			SceneTypeSupport.setSceneType(this, SceneType.Altered);
		}
		else {
			SceneTypeSupport.setSceneType(this, SceneType.Interrupt);
		}
		SceneTypeSupport.useSceneType(this);
		switch (this.sceneType) {
			case SceneType.Initial:
			case SceneType.Expected:
				break;
			case SceneType.Altered:
				switch (this.kind) {
					case AlterationKind.Adjustment:
						this.adjustment = new Array<SceneAdjustment>;
						AdjustmentSupport.addSceneAdjustment(this.adjustment);
						break;
					case AlterationKind.Expected:
						break;
					case AlterationKind.Next:
					case AlterationKind.Tweak:
						break;
					case AlterationKind.FateQuestion:
						if (this.fate === undefined)
							this.fate = new FateData(this);
						break;
					case AlterationKind.Meaning:
						if (this.meaning === undefined)
							this.meaning = new Meaning;
						break;
					default:
						console.warn("unknown kind", this.kind);
				}
				break;
			case SceneType.Interrupt:
				if (this.focus === undefined)
					this.focus = new EventFocus;
				if (this.meaning === undefined)
					this.meaning = new Meaning;
				break;
		}
		if (this.fate !== undefined) {
			this.fate.throwDice();
			// mTrace('scene', "fate on", this.fate);
		}
		if (this.focus !== undefined) {
			this.focus.throwDice(tables);
			let ent = this.focus.focusDescr(tables);
			// mTrace('scene', "focus on", ent.text);
			this.focus.defineSelectedObject(plugin.metadata, ent.interpretation, this.includeProtected ?? false);
		}
		if (this.meaning !== undefined) { // TODO the permitted kinds of adjustment are different for interrupts
			const tabSiz = this.meaning.tableSizes(tables);
			this.meaning.throwDice(tabSiz);
			this.meaning.explain(tables);
		}
		// mTrace('scene set random', this.fate === undefined ? "haven't fate" : "have fate");
	}

	/** convert from a JSON string */
	static fromJson(source: string): Scene {
		try {
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- JSON.parse returns any
			let scene: Scene = plainToInstance(Scene, JSON.parse(source), { excludeExtraneousValues: true });
			if (scene.hasRandom === undefined) scene.hasRandom = false;
			// mTrace('scene', "scene from json", scene, scene.fate === undefined ? "haven't fate" : "have fate");
			if (scene.fate !== undefined)
				scene.fate.chaosProvider = scene;
			SceneTypeSupport.useSceneType(scene);
			if (scene.includeProtected == undefined) scene.includeProtected = false;
			return scene;
		} catch (error) {
			console.error("error parsing scene: ", error, "reading:", shorten(source));
			throw error;
		}
	}
	/** convert to JSON. */
	toJson(): string {
		SceneTypeSupport.useSceneType(this);
		if (!this.hasRandom) this.hasRandom = undefined;
		if (this.includeProtected == false) this.includeProtected = undefined;
		return JSON.stringify(instanceToPlain(this));
	}
	/** describe the scene in plain text */
	toText(tables: Tables): [string, string, string] {
		let desc1 = "";
		let descrs = new Array<string>;
		let desc3 = "";
		switch (this.sceneType) {
			case SceneType.Initial:
				desc1 = "(not complete)";
				break;
			case SceneType.Expected:
				desc1 = "The scene is as expected.";
				break;
			case SceneType.Altered:
				desc1 = "The scene has been altered.";
				switch (this.kind) {
					case AlterationKind.Expected: descrs.push("(not complete)"); break;
					case AlterationKind.Next: descrs.push("Next"); break;
					case AlterationKind.Tweak: descrs.push("Tweak"); break;
					case AlterationKind.FateQuestion: descrs.push("Fate"); break;
					case AlterationKind.Meaning: descrs.push("Meaning: "); break;
					case AlterationKind.Adjustment: descrs.push(`Adjustment: ${this.adjustment?.join(" + ")}`); break;
				}
				break;
			case SceneType.Interrupt:
				desc1 = "The scene has been interrupted and replaced.";
				// if (this.kind == AlterationKind.Meaning)
				// 	descrs.push("Meaning: ");
				break;
		}
		// if (this.fate !== undefined) {
		// 	descrs.push(`${this.fate.toText(tables)}`);
		// }	
		if (this.hasRandom) {
			descrs.push("Random event ");
		}
		if (this.includeProtected) descrs.push(", include protected");
		if (this.focus !== undefined) {
			descrs.push(`${this.focus.toText(tables)}`);
		}
		if (this.meaning !== undefined) {
			if (this.meaning.result1.trim() == "")
				console.warn("unexplained meaning", this.meaning);
			else desc3 = `${this.meaning.result1}: ${this.meaning.result2}`;
		}
		// mTrace('scene', desc1, descrs.join(' '));
		return [desc1, descrs.map((s) => shorten(s)).join(' '), desc3];
	}
	/** create HTML for display */
	static toHtml(source: string, el: HTMLElement, _ctx: MarkdownPostProcessorContext, tables: Tables) {
		let divElt: HTMLDivElement = el.createDiv({ cls: 'mythic-scene' });
		try {
			assertDefined(tables, 'scene');
			// mTrace('', "rendering scene", source);
			const scene: Scene = Scene.fromJson(source);
			divElt.createSpan({ text: `(scene) ${scene.ident} chaos ${scene.chaos} ` });
			switch (scene.sceneType) {
				case SceneType.Expected:
					divElt.createSpan({ text: ` (expected) ` });
					divElt.createEl('b', { text: ` ${scene.expected} ` });
					break;
				case SceneType.Altered:
					divElt.createSpan({ text: ` (altered by ${scene.kind}) ` });
					switch (scene.kind) {
						case AlterationKind.Meaning:
							if (scene.meaning !== undefined) {
								scene.meaning.explain(tables);
								// divElt.createSpan({
								// 	text: scene.meaning.result
								// });
							} else {
								console.error("invalid meaning", scene.meaning);
								divElt.createEl('b', { text: " no meaning! " });
							}
							break;
						case AlterationKind.Adjustment:
							if (scene.adjustment !== undefined) {
								const adjs = scene.adjustment.join(", ");
								divElt.createSpan({ text: ` [ ${adjs} ] ` });
							}
							break;
						case AlterationKind.Expected:
							divElt.createSpan({ text: " select an appropriate alteration kind!" });
							break;
						case AlterationKind.Next:
						case AlterationKind.Tweak:
							divElt.createEl('i', { text: ` other alteration: ${scene.kind} ` });
							break;
						case AlterationKind.FateQuestion:
							break;
					}
					divElt.createEl('s', { text: ` (expected) ${scene.expected} ` });
					// divElt.createEl('i', { text: ` (altered ${scene.kind}) ` });
					if (scene.alteration !== undefined)
						divElt.createEl('b', { text: ` ${scene.alteration} ` });
					break;
				case SceneType.Interrupt:
					divElt.createSpan({ text: ` (interrupt) ` });
					divElt.createEl('s', { text: ` (expected) ${scene.expected} ` });
					if (scene.alteration !== undefined)
						divElt.createEl('b', { text: ` ${scene.alteration} ` });
					break;
			}
			if ((scene.kind != AlterationKind.Expected) && (scene.alteration == "")) {
				divElt.createEl('b', { text: " needs alteration! " });
				divElt.createSpan({ text: ' edit this scene to provide the adjusted scene!' });
			}

			if (scene.fate !== undefined) {
				scene.fate.toHtml(divElt, tables);
			}
			if (scene.focus !== undefined) {
				scene.focus.toHtml(divElt, tables);
				// el.createDiv({ text: ` ${scene.focus.toText(tables)} `, cls: 'mythic-random' });
			}
			if (scene.includeProtected) divElt.createSpan({ text: " include protected" });
			if (scene.meaning !== undefined) {
				el.createDiv({ text: ` ${scene.meaning.result1} `, cls: 'mythic-random' });
				el.createEl('b', { text: ` ${scene.meaning.result2} `, cls: 'mythic-random' });
			}
		} catch (error) {
			const msg = `error when parsing scene: ${error as Error}`;
			console.error(msg);
			divElt.createSpan({ text: msg, cls: 'mythic-error' });
		}
	}
}
