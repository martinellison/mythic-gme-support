import { Type, plainToInstance, instanceToPlain, Expose } from 'class-transformer';
import { Modal, App, Setting, MarkdownPostProcessorContext, } from 'obsidian';
import { CodeBlock } from './codeblock.js';
import { Tables } from './tables/tables.js';
import { mTrace, shorten } from './utils.js';
import { Metadata } from './metadata.js';
import MythicSupportPlugin from './main.js';
import { ChaosProvider, FateData } from './fateData/fatedata.js';
import { FateDataModal } from './fateData/fateDataModal.js';
const NONIDENT = /[^a-zA-Z0-9]+/g;
/** fate check modifier line in a table. */
export class QuestionOdds {
	display: string;
	ident: string;
	fate_check_modifier: number;
	constructor(
		ident: string,
		display: string,
		mod: number) {
		this.display = display;
		this.ident = ident.trim() == "" ? this.display.trim().replaceAll(NONIDENT, '_') : ident;
		this.fate_check_modifier = mod;
	}
}
/** implements an fate question block. MGME book pp17-31. Question text should come after a question block. */
export class Question implements ChaosProvider {
	chaosValue(): number {
		mTrace('question', `chaos factor is: ${this.chaosFactor}`);
		return this.chaosFactor;
	}
	setChaos(chaos: number): void {
		this.chaosFactor = chaos;
	}
	static readonly TAG = "mythic-question";
	@Type(() => FateData)
	@Expose() fateData: FateData = new FateData(this);
	@Expose() chaosFactor: number = 5;
	constructor(description: string) {
		this.fateData = new FateData(this);
		this.chaosFactor = 5;
	}
	/** convert from a JSON string */
	static fromJson(source: string): Question {
		try {
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- JSON.parse returns any
			let question: Question = plainToInstance(Question, JSON.parse(source), { excludeExtraneousValues: true });
			if (question.fateData === undefined) question.fateData = new FateData(question);
			question.fateData.chaosProvider = question;
			question.fateData.afterLoad();
			return question;
		} catch (error) {
			console.error("error parsing object: ", error, "reading:", shorten(source));
			throw error;
		}
	}
	/** convert to a JSON string */
	toJson(): string {
		// if (this.fateData !== undefined)
		this.fateData.beforeUnload();
		return JSON.stringify(instanceToPlain(this));
	}
	/** describe the scene in plain text */
	asText(tables: Tables): string {
		return this.fateData.asText(tables);
	}
	/** create HTML for display */
	static toHtml(source: string, el: HTMLElement, _ctx: MarkdownPostProcessorContext, tables: Tables) {
		let divElt: HTMLDivElement = el.createDiv({ cls: 'mythic-question' });
		try {
			const question: Question = Question.fromJson(source);
			question.fateData.afterLoad();
			divElt.createSpan({ text: "(question) " });
			// if (question.fateData !== undefined)
			question.fateData.asHtml(divElt, tables);
		} catch (error) {
			const msg = `error when parsing question: ${error as Error}`;
			console.error(msg);
			divElt.createSpan({ text: msg, cls: 'mythic-error' });
		}
	}

}
/** create a Modal for the user interface to a Question. 
 
main controls are:	
	fate data (multiple controls, controlled by FateDataModal, which see)
*/
export class QuestionModal extends Modal {
	question: Question;
	meaningSetting?: Setting;
	// questionDataModal: QuestionDataModal;
	constructor(app: App, question: Question, block: CodeBlock, tables: Tables, plugin: MythicSupportPlugin, metadata: Metadata) {
		super(app);
		this.question = question;
		this.setTitle('Question');
		let fateDataModal = new FateDataModal(this.contentEl, tables, metadata, (isRandom) => {
			// this.question.makeRandomEvent(isRandom, tables, metadata);
			// this.setRandom(isRandom, tables);
			/* TODO iff is random, create a random event i.e. focus and question */
		});
		fateDataModal.setVisibility(true, "Q");
		fateDataModal.setData(question.fateData, tables);

		new Setting(this.contentEl)
			.addButton((btn) => btn
				.setButtonText('Cancel')
				.setCta()
				.onClick(() => {
					this.close();
				}))
			.addButton((btn) => btn
				.setButtonText("Save")
				.setCta()
				.onClick(async (): Promise<void> => {
					this.close();
					mTrace('', "saving question");
					const json = question.toJson();
					let editor = app.workspace.activeEditor?.editor;
					if (editor !== undefined)
						block.replaceContents(Question.TAG, json, editor);
				}));
		// this.setRandom(this.hasRandom, tables);
	}
	// /** returns the text for a save button. */
	// static buttonText(kind: QuestionButtonKind): string {
	// 	switch (kind) {
	// 		case QuestionButtonKind.Save:
	// 			return "Save";
	// 		case QuestionButtonKind.ThrowDice:
	// 			return "Throw dice and save";
	// 		default:
	// 			return "?";
	// 	}
	// }
	// checkAndShow() {
	// 	// const status = this.question.checkStatus();
	// }
}
// const enum QuestionButtonKind {
// 	ThrowDice, Save,
// }
