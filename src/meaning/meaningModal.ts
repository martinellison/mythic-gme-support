import { plainToInstance, instanceToPlain, Expose } from 'class-transformer';
import { Modal, App, Setting, MarkdownPostProcessorContext } from 'obsidian';
import { CodeBlock } from '../codeblock.js';
import { assertDefined, mTrace, mythicDice, shorten } from '../utils.js';
import { Oracle, Tables } from '../tables/tables.js';
import { MeaningPartModal } from './meaningPartModal.js';
import { Meaning } from './meaning.js';

/** dialog to edit a Meaning. This for a stand-alone Meaning code block. */
export class MeaningModal extends Modal {
	partModal: MeaningPartModal;
	meaning: Meaning;
	dropdownSetting?: Setting;
	constructor(app: App, meaning: Meaning, block: CodeBlock, tables: Tables) {
		super(app);
		assertDefined(tables, 'meaning');
		assertDefined(meaning, 'meaning');
		this.meaning = meaning;
		this.setTitle('Meaning');
		new Setting(this.contentEl)
			.setName('Description')
			.addTextArea((text) => {
				text.setValue(this.meaning.description);
				text.onChange((value) => {
					this.meaning.description = value;
				});
			});
		this.partModal = new MeaningPartModal(meaning, this.contentEl, tables);
		// this.dropdownSetting = partModal.make(this.contentEl, tables, (meaningKind: string) => {
		// 	if (meaning !== undefined) {
		// 		this.meaning.meaningKind = meaningKind;
		// 		this.meaning.explain(tables);
		// 	}
		// }, this.meaning);
		new Setting(this.contentEl)
			.addButton((btn) => btn
				.setButtonText("Save")
				.setCta()
				.onClick(() => {
					this.close();
					// meaning.throwDice(meaning.tableSizes(tables));
					// meaning.explain(tables);
					const json = this.meaning.toJson();
					mTrace('meaning', "save as", json);
					let editor = app.workspace.activeEditor?.editor;
					if (editor !== undefined)
						block.replaceContents(Meaning.TAG, json, editor);
				}))
			.addButton((btn) => btn
				.setButtonText('Cancel')
				.setCta()
				.onClick(() => {
					this.close();
				}));
	}
}
