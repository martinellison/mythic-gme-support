import {
	Editor,
	MarkdownView,
	MarkdownFileInfo,
	Plugin,
	App,
	Modal,
	Setting,
	EditorPosition,
} from 'obsidian';
/** @document summary.md */
import { DEFAULT_SETTINGS, MythicSettingTab, MythicSupportPluginSettings } from './settings.js';
import { CodeBlock } from './codeblock.js';
import 'reflect-metadata';
import { Scene, } from './scene/scene.js';
import { SceneModal } from './scene/sceneModal.js';
import { Adventure, AdventureModal } from './adventure.js';
import { MythicObject, MythicObjectModal } from './object.js';
import { Question, QuestionModal } from './question.js';
import { MythicObjectMeta, Oracle, Tables } from './tables/tables.js';
import { Metadata } from './metadata.js';
import { Dice, DiceModal } from './dice.js';
import { Meaning, MeaningModal } from './meaning.js';
import { SceneTypeSupport } from './scene/sceneType.js';
import { KdlTables } from './tables/kdl.js';
import { assertDefined, mTrace } from './utils.js';
/** the plugin */
export default class MythicSupportPlugin extends Plugin {
	settings!: MythicSupportPluginSettings;
	tables: Tables = new Tables();
	metadata: Metadata = new Metadata(this);

	/** displays a message to the user, for example if a user error has been detected. `async` version. */
	public static async displayMessage(app: App, msg: string) {
		const modal = new Modal(app);
		modal.contentEl.appendText(`error: ${msg}`);
		modal.open();
		await Promise.resolve();
	}
	async onCreate() {
		try {
			mTrace('main', "starting plugin create");
			await this.metadata.load(this.app.metadataCache, this.app.vault, this);
			await this.metadata.scanAllFiles(this.app.metadataCache, this.app.vault, this);
			mTrace('main', "plugin create ended");
		} catch (error) {
			const msg = `error on create: ${error as Error}`;
			console.error(msg);
		}
	}
	async onload() {
		try {
			mTrace('main', 'loading MythicSupportPlugin');
			await this.loadSettings();
			this.app.workspace.onLayoutReady(async () => {
				mTrace('main', "layout ready");
				this.tables = await KdlTables.load(this.app.vault, this.settings);
				await this.onCreate();
				mTrace("plugin", "tables loaded", JSON.stringify(this.tables));
				if (this.tables.result.trim() != "") {
					console.error("could not load KDL:", this.tables.result);
					await MythicSupportPlugin.displayMessage(this.app, `${this.tables.result}`);
				}
			});

			/** Command to create a new Mythic object */
			this.addCommand({
				id: 'mythic-create',
				name: 'Create a Mythic object',
				editorCheckCallback: (
					checking: boolean,
					editor: Editor,
					view: MarkdownView | MarkdownFileInfo,
				): boolean => {
					if (checking) {
						return (
							this.app.workspace.getActiveViewOfType(MarkdownView) !=
							null
						);
					}
					// LATER check whether this block is inside the adventure folder
					// LATER also, refactor the calling sequence 
					// find somewhere we can put a block, start where the user's cursor is, but skip over any existing block
					const startBlock = CodeBlock.getEmptyBlock(editor);
					mTrace('main', "creating block at", JSON.stringify(startBlock));
					if (startBlock.isInBlock) {
						mTrace('main create', `cannot create a new block inside an existing block (${startBlock.start}-${startBlock.end} '${startBlock.kind}')`);
					}

					new CreateModal(this.app, this.tables, (kind: MythicObjectKind, objectKind: string, selection: boolean) => {
						// let cursor: EditorPosition = editor.getCursor();
						// let startLine = startBlock.isInBlock ? startBlock.end + 1 : cursor.line;
						const startLine = startBlock.end;
						mTrace('main create', `start line ${startLine}`);
						switch (kind) {
							case MythicObjectKind.Scene: {
								let scene = new Scene();
								let block = new CodeBlock(
									startLine,
									startLine,
									'scene',
								);
								new SceneModal(true, this.app, scene, block, this.tables, this).open();
								break;
							}
							case MythicObjectKind.Question: {
								let question = new Question('');
								let block = new CodeBlock(
									startLine,
									startLine,
									'question',
								);
								assertDefined(this.metadata, 'main');
								new QuestionModal(this.app, question, block, this.tables, this, this.metadata).open();
								break;
							}
							case MythicObjectKind.MythicObject: {
								const meta = this.tables.meta(objectKind);
								if (meta === undefined) mTrace('main/object/create', "tables not loaded");
								mTrace('main', "meta for", objectKind);
								assertDefined(meta, 'main');
								let object = new MythicObject(objectKind, "", "", "", selection);
								let block = new CodeBlock(
									startLine,
									startLine,
									selection ? 'selection' : 'object',
								);
								new MythicObjectModal(this.app, this, object, block, this.tables, meta).open();
								break;
							}
							case MythicObjectKind.Dice: {
								let dice = new Dice('');
								let block = new CodeBlock(
									startLine,
									startLine,
									'dice',
								);
								new DiceModal(this.app, dice, block).open();
								break;
							}
							case MythicObjectKind.Meaning: {
								let meaning = new Meaning('action1');
								let block = new CodeBlock(
									startLine,
									startLine,
									'meaning',
								);
								new MeaningModal(this.app, meaning, block, this.tables).open();
								break;
							}
							case MythicObjectKind.Adventure: {
								let adventure = new Adventure('');
								let block = new CodeBlock(
									startLine,
									startLine,
									'adventure',
								);
								new AdventureModal(this.app, this, adventure, block).open();
								break;
							}
							default:
								console.error('unknown object kind', kind);
						}
					}).open();
					return true;
				},
			});

			this.addCommand({
				id: 'mythic-edit',
				name: 'Edit selected',
				editorCheckCallback: (
					checking: boolean,
					editor: Editor,
					view: MarkdownView | MarkdownFileInfo,
				): boolean => {
					if (checking) {
						return (
							this.app.workspace.getActiveViewOfType(MarkdownView) !=
							null
						);
					}
					try {
						// LATER check whether this block is inside the adventure folder
						let block = CodeBlock.getBlock(editor);
						if (block.isInBlock) {
							const source = block.contents(editor);
							mTrace('main', "source is", source);
							switch (block.kind) {
								case Scene.TAG:
									{
										let scene = Scene.fromJson(source);
										SceneTypeSupport.useSceneType(scene);
										new SceneModal(false, this.app, scene, block, this.tables, this).open();
									}
									break;
								case Question.TAG:
									{
										let question = Question.fromJson(source);
										assertDefined(this.metadata, 'main');
										new QuestionModal(this.app, question, block, this.tables, this, this.metadata).open();
									}
									break;
								case Dice.TAG:
									{
										let dice = Dice.fromJson(source);
										new DiceModal(this.app, dice, block).open();
									}
									break;
								case Meaning.TAG:
									{
										let meaning = Meaning.fromJson(source);
										new MeaningModal(this.app, meaning, block, this.tables).open();
									}
									break;
								case MythicObject.TAG:
									{
										let object = MythicObject.fromJson(source);
										const meta = this.tables.meta(object.kind);
										if (meta === undefined) mTrace('main/object/edit', "tables not loaded");
										assertDefined(meta, 'main');
										new MythicObjectModal(this.app, this, object, block, this.tables, meta).open();
									}
									break;
								case Adventure.TAG:
									{
										let adventure = Adventure.fromJson(source);
										new AdventureModal(this.app, this, adventure, block).open();
									}
									break;
								default:
									console.warn("unknown block type '%s'", block.kind);
							}
						} else {
							console.warn('not a block');
						}
					} catch (error) {
						const msg = `error editing block: ${error as Error}`;
						console.error(msg);
					}
					return true;
				},
			});

			this.registerMarkdownCodeBlockProcessor(
				Scene.TAG,
				(source, el, ctx) => {
					// mTrace('main', "generation scene html");
					Scene.toHtml(source, el, ctx, this.tables);
				},
			);
			this.registerMarkdownCodeBlockProcessor(
				Question.TAG,
				(source, el, ctx) => {
					Question.toHtml(source, el, ctx, this.tables);
				},
			);
			this.registerMarkdownCodeBlockProcessor(
				Dice.TAG,
				(source, el, ctx) => {
					Dice.toHtml(source, el, ctx);
				},
			);
			this.registerMarkdownCodeBlockProcessor(
				Meaning.TAG,
				(source, el, ctx) => {
					Meaning.toHtml(source, el, ctx);
				},
			);
			this.registerMarkdownCodeBlockProcessor(
				MythicObject.TAG,
				(source, el, ctx,) => {
					MythicObject.toHtml(source, el, ctx, this.tables);
				},
			);
			this.registerMarkdownCodeBlockProcessor(
				Adventure.TAG,
				(source, el, ctx) => {
					// mTrace('main', "generation adventure html");
					Adventure.toHtml(source, el, ctx, this.metadata, this.tables);
				},
			);
			this.addSettingTab(new MythicSettingTab(this.app, this));
			mTrace('main', "MythicSupportPlugin plugin loaded");
		} catch (error) {
			const msg = `error on load: ${error as Error}`;
			console.error(msg);
		}
	}

	onunload() {
		try {
			mTrace('main', 'unloading MythicSupportPlugin');
			this.metadata.unload(this.app.metadataCache);
		} catch (error) {
			const msg = `error on unload: ${error as Error}`;
			console.error(msg);
		}
	}

	async loadSettings() {
		try {
			mTrace('main', "loading settings");
			this.settings = Object.assign(
				{},
				DEFAULT_SETTINGS,
				(await this.loadData()) as Partial<MythicSupportPluginSettings>,
			);
			// mTrace('main', "settings loaded:", this.settings);
		} catch (error) {
			const msg = `error loading settings: ${error as Error}`;
			console.error(msg);
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
	// settings() : MythicSupportPluginSettings {
	// 	this.settings
	// }
}

export const enum MythicObjectKind {
	Scene = 'scene',
	Question = 'question',
	MythicObject = 'object',
	Dice = 'dice',
	Meaning = 'meaning',
	Adventure = 'adventure',
}
export class CreateModal extends Modal {
	constructor(app: App, tables: Tables, onCreate: (kind: MythicObjectKind, meta: string, selection: boolean) => void) {
		let kind: MythicObjectKind = MythicObjectKind.Scene;
		let meta: string = "";
		let selection = false;
		super(app);
		this.setTitle('Create object');
		new Setting(this.contentEl).setName('Kind').addDropdown((dropDown) => {
			dropDown.addOptions({ scene: 'Scene', question: 'Question', meaning: 'Meaning', adventure: 'Adventure', dice: 'Dice', });
			tables.objectKinds.forEach((kind: MythicObjectMeta, ident: string) => {
				dropDown.addOption(ident, kind.displayName);
			});
			tables.objectKinds.forEach((kind: MythicObjectMeta, ident: string) => {
				dropDown.addOption('*' + ident, `Select ${kind.displayName}`);
			});
			tables.simples.forEach((kind: MythicObjectMeta, ident: string) => {
				dropDown.addOption(ident, kind.displayName);
			});
			tables.oracles.forEach((oracle: Oracle, ident: string) => {
				if (!oracle.meta.noAlt)
					dropDown.addOption(ident, `${oracle.meta.displayName} oracle`);
			});
			dropDown.onChange((value) => {
				switch (value) {
					case 'scene': kind = MythicObjectKind.Scene; break;
					case 'question': kind = MythicObjectKind.Question; break;
					case 'dice': kind = MythicObjectKind.Dice; break;
					case 'meaning': kind = MythicObjectKind.Meaning; break;
					case 'adventure': kind = MythicObjectKind.Adventure; break;
					default:
						if (value.substring(0, 1) == '*') {
							kind = MythicObjectKind.MythicObject;
							meta = value.substring(1);
							selection = true;
						} else {
							kind = MythicObjectKind.MythicObject;
							meta = value;
							selection = false;
						}
				}
			});
		});
		new Setting(this.contentEl).addButton((btn) =>
			btn
				.setButtonText('Create')
				.setCta()
				.onClick(() => {
					this.close();
					onCreate(kind, meta, selection);
				}),
		).addButton((btn) =>
			btn
				.setButtonText('Cancel')
				.setCta()
				.onClick(() => {
					this.close();
				}),
		);
	}
}
