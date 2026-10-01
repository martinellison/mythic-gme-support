
import { Modal, App, Setting, DisplayValueComponent, ButtonComponent, TextAreaComponent, DropdownComponent } from 'obsidian';
import { CodeBlock } from '../codeblock.js';
import { Tables } from '../tables/tables.js';
import MythicSupportPlugin, { assertDefined, mTrace, } from '../main.js';
// import { Question, QuestionModal } from './question.js';
import { FateDataModal as FateDataModal } from '../fatedata.js';
import { MeaningModal } from '../meaning.js';
import { Scene, SceneStatus } from './scene.js';
import { SceneType } from './sceneType.js';
import { AlterationKind, AlterationSupport } from './alteration.js';
import { AdjustmentSupport } from './adjustment.js';

/** create a Modal for the user interface to a Scene. */
export class SceneModal extends Modal {
	scene: Scene;
	action: string = "Save";
	mandDisplay?: DisplayValueComponent;
	saveButton?: ButtonComponent;
	randomButton?: ButtonComponent;
	alterationDropdown?: DropdownComponent;
	alterationText?: TextAreaComponent;
	fateDataModal?: FateDataModal;
	meaningDropdown?: DropdownComponent;
	infoDisplay1?: DisplayValueComponent;
	infoDisplay2?: DisplayValueComponent;
	infoDisplay3?: DisplayValueComponent;
	hasRandom: boolean = false;
	constructor(creating: boolean, app: App, scene: Scene, block: CodeBlock, tables: Tables, plugin: MythicSupportPlugin) {
		super(app);
		this.scene = scene;
		this.action = creating ? "Create" : "Update";
		this.setTitle(this.action + ' Scene');
		new Setting(this.contentEl).addDisplayValue(disp => {
			this.mandDisplay = disp;
		});
		new Setting(this.contentEl).setName('Ident')
			.setDesc("Identifier for this scene")
			.addText((text) => {
				text.setValue(this.scene.ident);
				text.onChange((value) => {
					if (parseInt(value) !== undefined)
						this.scene.ident = value;
					this.checkAndShow(tables, "ident");
				});
			});
		new Setting(this.contentEl).setName('Chaos')
			.setDesc("The current Chaos Factor").addSlider((slider) => {
				slider.setLimits(1, 9, 1).setInstant(true).setValue(this.scene.chaos).onChange((value) => {
					this.scene.chaos = value;
					this.checkAndShow(tables, "chaos");
				});
			});
		new Setting(this.contentEl)
			.setDesc("Describe what is expected to happen.").setName('Expected').addTextArea((text) => {
				text.setPlaceholder("What is expected to happen");
				text.setValue(this.scene.expected);
				text.onChange((value) => {
					this.scene.expected = value;
					this.checkAndShow(tables, "exp");
				});
			});
		new Setting(this.contentEl)
			.setDesc("This makes the random change.").addButton((btn) => {
				this.randomButton = btn;
				btn
					.setButtonText("Throw the Dice")
					.setCta()
					.onClick(() => {
						this.scene.setRandom(tables, plugin);
						this.checkAndShow(tables, "dice");
					});
			});
		new Setting(this.contentEl)
			.setDesc("Decide how to alter the scene.").setName('Alteration kind').addDropdown((dropDown) => {
				this.alterationDropdown = dropDown;
				dropDown.addOptions({
					// expected: 'expected',
					next: 'next',
					tweak: 'tweak',
					fatequestion: 'fatequestion',
					meaning: 'meaning',
					adjustment: 'adjustment',
					table: 'table',
				});
				dropDown.setValue(this.scene.kind);
				dropDown.onChange((value) => {
					mTrace('', "alteration kind", value,);
					AlterationSupport.setAlterationKind(this.scene, value as AlterationKind);
					AlterationSupport.useAlterationKind(this.scene);
					// assertDefined(this.fateDataModal);
					// this.fateDataModal.data = this.scene.fate;
					// this.scene.setRandom(tables, plugin);
					this.showAlterationKind(tables);
					if (this.scene.fate !== undefined) {
						assertDefined(this.fateDataModal, 'scene');
						this.fateDataModal.setVisibility(true);
						this.fateDataModal.setData(this.scene.fate, tables);
					}
					if (this.scene.kind == AlterationKind.Adjustment && this.scene.adjustment !== undefined && this.scene.adjustment?.length == 0)
						AdjustmentSupport.addSceneAdjustment(this.scene.adjustment);
					this.checkAndShow(tables, "alter");
				});
			});
		if (this.fateDataModal === undefined)
			this.fateDataModal = new FateDataModal(this.contentEl, tables,
				(isRandom) => {
					this.setRandom(isRandom);
					/* TODO what if random? */
					this.checkAndShow(tables, "fate");
				});
		this.fateDataModal.setVisibility(this.scene.fate !== undefined, "CON");
		if (this.scene.fate !== undefined)
			this.fateDataModal.setData(this.scene.fate, tables);
		// if (this.scene.meaning !== undefined)
		MeaningModal.makeMeaning(this.contentEl, this.meaningDropdown, tables,
			(meaningKind: string) => {
				if (this.scene.meaning !== undefined) {
					this.scene.meaning.meaningKind = meaningKind;
					this.scene.meaning.explain(tables);
					// mTrace('scene', "after meaning, meaning is", this.scene.meaning);
				}
				this.checkAndShow(tables, "mean");
			}, this.scene.meaning);
		new Setting(this.contentEl).setName('Include protected')
			.setDesc("include protected objects in any random selection")
			.addToggle((toggle) => {
				toggle.setValue(this.scene.includeProtected ?? false)
					.onChange((value) => { this.scene.includeProtected = value; });
			});
		new Setting(this.contentEl).addDisplayValue(disp => {
			this.infoDisplay1 = disp;
		});
		new Setting(this.contentEl).addDisplayValue(disp => {
			this.infoDisplay2 = disp;
		});
		new Setting(this.contentEl).addDisplayValue(disp => {
			this.infoDisplay3 = disp;
		});
		new Setting(this.contentEl)
			.setDesc("Describe the scene as altered (or the interrupt scene).")
			.setName('Alteration/Interruption')
			.addTextArea((text) => {
				this.alterationText = text;
				text.setPlaceholder("What actually happens");
				text.setValue(this.scene.alteration ?? "");
				text.onChange((value) => {
					this.scene.alteration = value;
					// mTrace('scene', "setting alteration to", this.scene.alteration);
					this.checkAndShow(tables, "res");
				});
			});
		new Setting(this.contentEl)
			.setDesc("This saves the scene.").addButton((btn) => {
				this.saveButton = btn;
				btn
					.setButtonText(this.action + " the Scene")
					.setCta()
					.onClick(() => {
						this.close();
						const json = scene.toJson();
						// mTrace('scene', "setting scene to", json);
						let editor = app.workspace.activeEditor?.editor;
						if (editor !== undefined)
							block.replaceContents(Scene.TAG, json, editor);
					});
			})
			.addButton((btn) =>
				btn
					.setButtonText('Cancel')
					.setCta()
					.onClick(() => {
						this.close();
					}),
			);
		this.checkAndShow(tables, "start");
	}
	/** set the SceneModal after throwing the 'dice' to randomise away from the expected scene. */
	setRandom(hasRandom: boolean) {
		this.hasRandom = hasRandom;
		this.scene.hasRandom = hasRandom;
	}
	/** display the alteration kind. */
	showAlterationKind(tables: Tables) {
		switch (this.scene.kind) {
			case AlterationKind.Expected: break;
			case AlterationKind.Next: break;
			case AlterationKind.Tweak: break;
			case AlterationKind.FateQuestion:
				assertDefined(this.fateDataModal, 'scene');
				if (this.fateDataModal.fateData == undefined) {
					assertDefined(this.scene.fate, 'scene');
					this.fateDataModal.setData(this.scene.fate, tables);
				}
				break;
			case AlterationKind.Meaning: break;
			case AlterationKind.Adjustment: break;
		}
	}
	/** check the Scene and display its current status in the SceneModal. */
	checkAndShow(tables: Tables, narr?: string): void {
		assertDefined(this.mandDisplay, 'scene');
		assertDefined(this.saveButton, 'scene');
		assertDefined(this.randomButton, 'scene');
		assertDefined(this.alterationDropdown, 'scene');
		assertDefined(this.alterationText, 'scene');
		// assertDefined(this.meaningDropdown);
		assertDefined(this.infoDisplay1, 'scene');
		assertDefined(this.infoDisplay2, 'scene');
		assertDefined(this.infoDisplay3, 'scene');
		const status = this.scene.check();
		// mTrace("scene status checked as", SceneStatus[status], this.scene.fate === undefined ? "haven't fate," : "have fate,", narr ?? "other");
		switch (status) {
			case SceneStatus.NeedsExpected:
				this.mandDisplay.setValue("Enter the Expected scene description.");
				break;
			case SceneStatus.NeedsRandom:
				this.mandDisplay.setValue("Throw the Dice.");
				break;
			case SceneStatus.NeedsAlterationKind:
				this.mandDisplay.setValue("Select the Alteration Kind.");
				break;
			case SceneStatus.NeedsAlteration:
				this.mandDisplay.setValue("Enter the Altered scene description.");
				break;
			case SceneStatus.NeedsFate:
				this.mandDisplay.setValue("Enter the Fate Question.");
				break;
			case SceneStatus.NeedsMeaning:
				this.mandDisplay.setValue("Select a Meaning Oracle.");
				break;
			case SceneStatus.OK:
				this.mandDisplay.setValue(`${this.action} the Scene.`);
				break;
			default: console.warn("unknown scene status", status);

		};
		this.mandDisplay.setStatus(status < SceneStatus.OK ? 'warning' : null);
		this.saveButton.setDisabled(status < SceneStatus.OK);
		this.randomButton.setDisabled(status < SceneStatus.NeedsRandom);
		this.alterationDropdown.setDisabled(status < SceneStatus.NeedsAlterationKind || this.scene.sceneType != SceneType.Altered);
		const cannotEditAlteration = status < SceneStatus.NeedsAlteration || this.scene.sceneType == SceneType.Expected;
		this.alterationText.setDisabled(cannotEditAlteration);
		const showFate = this.scene.fate !== undefined;
		if (status == SceneStatus.NeedsFate && this.scene.fate === undefined) console.warn("fate needed but missing!");
		if (showFate) {
			if (this.scene.fate === undefined) console.warn("want to show fate but missing!");
			assertDefined(this.fateDataModal, 'scene');
			if (this.fateDataModal.fateData === undefined)
				console.warn("fate modal has no data");
		}
		if (this.fateDataModal !== undefined) this.fateDataModal.setVisibility(showFate, "CAS");
		const cannotSetMeaning = status < SceneStatus.NeedsMeaning
			|| this.scene.sceneType == SceneType.Expected;
		if (this.meaningDropdown !== undefined)
			this.meaningDropdown.setDisabled(cannotSetMeaning);
		const [d1, d2, d3] = this.scene.toText(tables);
		this.infoDisplay1.setValue(d1);
		this.infoDisplay2.setValue(d2);
		this.infoDisplay3.setValue(d3);
		mTrace('scene', cannotEditAlteration ? "no alter," : "", cannotSetMeaning ? "no mean," : "", showFate ? "see fate," : "not see fate,", this.scene.fate === undefined ? "haven't fate," : "have fate,", this.scene.meaning === undefined ? "haven't meaning," : "have meaning: " + this.scene.meaning.meaningKind, ", type:", this.scene.sceneType, ", kind:", this.scene.kind, SceneStatus[status]);
	}
}
