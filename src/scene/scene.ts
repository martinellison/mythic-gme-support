import { Type, plainToInstance, instanceToPlain, Expose } from 'class-transformer';
import { MarkdownPostProcessorContext, } from 'obsidian';
import { Tables } from '../tables/tables.js';
import { EventFocus, } from '../eventFocus/eventfocus.js';
import { assertDefined, mTrace, mythicDice, shorten } from '../utils.js';
import { FateData, ChaosProvider } from '../fateData/fatedata.js';
import { Meaning, } from '../meaning/meaning.js';
import { SceneType, SceneTypeSupport } from './sceneType.js';
import { AlterationKind } from './alteration.js';
import { AdjustmentSupport, SceneAdjustment } from './adjustment.js';
import MythicSupportPlugin from '../main.js';

/** checking status of a scene. Keep the order. */
export enum SceneStatus {
	NeedsExpected, NeedsRandom, NeedsAlterationKind, NeedsFate, NeedsMeaning, NeedsAlteration, OK,
};
/** implements a Scene block. MGME book pp59-120. Scene text should come after a scene block */
export class Scene implements ChaosProvider {
	/** get the chaos level (implements ChaosProvider). */
	chaosValue(): number { return this.chaos; }
	setChaos(chaos: number): void {
		this.chaos = chaos;
	}
	static readonly TAG = 'mythic-scene';
	@Expose() ident: string = "";
	@Expose() chaos: number = 5;
	@Expose() sceneType: SceneType = SceneType.Initial;
	@Expose() kind: AlterationKind = AlterationKind.Expected;
	@Expose() expected: string = '';
	@Expose() alteration?: string;
	@Expose() where?: string;
	@Expose() when?: string;
	@Expose() adjustment?: Array<SceneAdjustment>;
	@Type(() => FateData)
	@Expose() fate?: FateData;
	constructor(num?: string) {
		this.ident = num ?? "0";
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
						// just use the meaning
						if (this.fate === undefined)
							this.fate = new FateData(this);
						break;
					case AlterationKind.Meaning:
						if (this.fate !== undefined) {
							if (this.fate?.meaning === undefined)
								this.fate.meaning = new Meaning;
							this.fate.meaning.makeRandom(tables);
						}// TODO check
						break;
					default:
						console.warn("unknown kind", this.kind);
				}
				break;
			case SceneType.Interrupt:
				if (this.fate === undefined) this.fate = new FateData(this);
				if (this.fate.focus === undefined)
					this.fate.focus = new EventFocus;
				if (this.fate.meaning === undefined)
					this.fate.meaning = new Meaning;
				break;
		}
		if (this.fate !== undefined) {
			mTrace('scene', "creating fate");
			this.fate.throwDice();
			// mTrace('scene', "fate on", this.fate);
		}
		if (this.fate?.focus !== undefined) {
			this.fate?.focus.makeRandom(tables, plugin.metadata);
		}
		if (this.fate?.meaning !== undefined) { // TODO the permitted kinds of adjustment are different for interrupts
			const tabSiz = this.fate?.meaning.tableSizes(tables);
			mTrace('scene', "creating meaning", `(table count ${tabSiz.length})`);
			this.fate?.meaning.throwDice(tabSiz);
			this.fate?.meaning.explain(tables);
		}
		// mTrace('scene set random', this.fate === undefined ? "haven't fate" : "have fate");
	}
	/** checks whether the scene has a valid value and can be saved. */
	checkStatus(): SceneStatus {
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
						if (this.fate?.meaning === undefined)
							return SceneStatus.NeedsMeaning;
						break;
					default:
						break;
				}
				break;
			case SceneType.Interrupt:
				if (this.kind == AlterationKind.Meaning && this.fate?.meaning === undefined)
					return SceneStatus.NeedsMeaning;
				break;
			case SceneType.Expected:
				break;
		}
		if (this.sceneType != SceneType.Expected && (this.alteration === undefined || this.alteration.trim() == ""))
			return SceneStatus.NeedsAlteration;
		return SceneStatus.OK;
	}

	/** convert from a JSON string */
	static fromJson(source: string): Scene {
		try {
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- JSON.parse returns any
			let scene: Scene = plainToInstance(Scene, JSON.parse(source), { excludeExtraneousValues: true });
			if (scene.fate !== undefined)
				scene.fate.chaosProvider = scene;
			scene.afterLoad();
			SceneTypeSupport.useSceneType(scene);
			// if (scene.includeProtected == undefined) scene.includeProtected = false;
			return scene;
		} catch (error) {
			console.error("error parsing scene: ", error, "reading:", shorten(source));
			throw error;
		}
	}/** do this after a scene has been deserialised */
	afterLoad() {
		if (this.fate !== undefined)
			this.fate?.afterLoad();
		if (this.where === undefined) this.where = "";
		if (this.when === undefined) this.when = "";
	}
	/** convert to JSON. */
	toJson(): string {
		SceneTypeSupport.useSceneType(this);
		// if (!this.hasRandom) this.hasRandom = undefined;
		// if (this.includeProtected == false) this.includeProtected = undefined;
		this.beforeUnload();
		return JSON.stringify(instanceToPlain(this));
	}
	/** do this before a scene is serialised */
	beforeUnload() {
		this.fate?.beforeUnload();
	}
	/** describe the scene in plain text */
	asText(tables: Tables): string {
		let descrs = new Array<string>;
		// if (this.when) descrs.push(` Time: ${this.when}`);
		// if (this.where) descrs.push(` Place: ${this.where}`);
		switch (this.sceneType) {
			case SceneType.Initial:
				break;
			case SceneType.Expected:
				descrs.push("The scene is as expected.");
				break;
			case SceneType.Altered:
				descrs.push("The scene has been altered. ");
				switch (this.kind) {
					case AlterationKind.Expected: break;
					// descrs.push("(not complete)"); break;
					case AlterationKind.Next: descrs.push("Next"); break;
					case AlterationKind.Tweak: descrs.push("Tweak"); break;
					case AlterationKind.FateQuestion: descrs.push("Fate"); break;
					case AlterationKind.Meaning: descrs.push("[meaning] "); break;
					case AlterationKind.Adjustment: descrs.push(`Adjustment: ${this.adjustment?.join(" + ")}`); break;
				}
				break;
			case SceneType.Interrupt:
				descrs.push("The scene has been interrupted and replaced.");
				if (this.alteration !== undefined)
					descrs.push(this.alteration); // also used for interrupts
				// if (this.kind == AlterationKind.Meaning)
				// 	descrs.push("Meaning: ");
				break;
		}
		return descrs.join(' ');
	}
	/** create HTML for display */
	static toHtml(source: string, el: HTMLElement, _ctx: MarkdownPostProcessorContext, tables: Tables) {
		let divElt: HTMLDivElement = el.createDiv({ cls: 'mythic-scene' });
		try {
			assertDefined(tables, 'scene');
			const scene: Scene = Scene.fromJson(source);
			scene.fate?.afterLoad();
			divElt.createSpan({ text: `(scene) ${scene.ident} chaos ${scene.chaos} ` });
			if (scene.when) divElt.createSpan({ text: ` Time: ${scene.when}` });
			if (scene.where) divElt.createSpan({ text: ` Place: ${scene.where}` });
			switch (scene.sceneType) {
				case SceneType.Expected:
					divElt.createSpan({ text: ` (expected) ` });
					divElt.createEl('b', { text: ` ${scene.expected} ` });
					break;
				case SceneType.Altered:
					divElt.createSpan({ text: ` (altered by ${scene.kind}) ` });
					switch (scene.kind) {
						case AlterationKind.Meaning:
							divElt.createEl('i', { text: " meaning " });
							break;
						case AlterationKind.Adjustment:
							if (scene.adjustment !== undefined) {
								const adjs = scene.adjustment.join(", ");
								divElt.createSpan({ text: ` adjustments: ${adjs}  ` });
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
							divElt.createEl('i', { text: " fate question " });
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
						divElt.createEl('b', { text: ` ${scene.alteration} ` }); // also used for interrupts

					break;
			}
			if ((scene.kind != AlterationKind.Expected) && (scene.alteration == "")) {
				divElt.createEl('b', { text: " needs alteration! " });
				divElt.createSpan({ text: ' edit this scene to provide the adjusted scene!' });
			}

			if (scene.fate !== undefined) {
				scene.fate.asHtml(divElt, tables);
			}
		} catch (error) {
			const msg = `error when parsing scene: ${error as Error}`;
			console.error(msg);
			divElt.createSpan({ text: msg, cls: 'mythic-error' });
		}
	}
}
