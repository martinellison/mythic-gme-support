import { plainToInstance, instanceToPlain, Expose, Type } from 'class-transformer';
import { Modal, App, Setting, MarkdownPostProcessorContext } from 'obsidian';
import { CodeBlock } from './codeblock.js';
import { mTrace, shorten } from './utils.js';
// import { DiceRandom } from './dice-utils.js';
import { CheckTable, CheckTableEntry } from './tables/checkTable.js';
import { ListHelper, ModalList, ModalListHelper } from './settingsList.js';
/**  implements an quick oracle block. a block that creates an oracle and resolves it directly. */
export class QuickOracle {
	@Expose() text: string;
	@Expose() result: number = 0;
	// @Expose() explain: string = "";
	@Expose() description: string = "";
	@Type(() => CheckTable)
	@Expose() checkTable: CheckTable = new CheckTable;
	static readonly TAG = 'mythic-quick-oracle';
	constructor(text: string) {
		this.text = text;
	}
	/** convert quick oracle from a JSON string */
	static fromJson(source: string): QuickOracle {
		try {
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- JSON.parse returns any
			let quickOracle: QuickOracle = plainToInstance(QuickOracle, JSON.parse(source), { excludeExtraneousValues: true });
			return quickOracle;
		} catch (error) {
			console.error("error parsing quick oracle: ", error, "reading:", shorten(source));
			throw error;
		}
	}
	/** convert quick oracle to a JSON string */
	toJson(): string {
		return JSON.stringify(instanceToPlain(this));
	}
	/** create HTML for display */
	static toHtml(source: string, el: HTMLElement, _ctx: MarkdownPostProcessorContext) {
		// mTrace('quick oracle', "rendering quick oracle", source);
		let divElt: HTMLDivElement = el.createDiv({ cls: 'mythic-quick-oracle' });
		try {
			const quickOracle: QuickOracle = QuickOracle.fromJson(source);
			divElt.createSpan({ text: `(quick oracle) ${quickOracle.description}: ` });
			const entriesDescrs = quickOracle.checkTable.entries.map((entry) => { return `${entry.text} (${entry.weight})`; }).join(", ");
			divElt.createSpan({ text: `(${entriesDescrs})` });
			divElt.createEl('b', { text: ` ${quickOracle.text}` });
		} catch (error) {
			divElt.createSpan({ text: `error in parsing quick oracle: ${error as Error}`, cls: 'mythic-error' });
		}
	}
	throwDice() {
		this.checkTable.fix();
		this.result = this.checkTable.throwDiceStandardised();
		const resolution = this.checkTable.resolve(this.result);
		this.text = resolution.text;
	}
}
/** display a quick oracle for editing */
export class QuickOracleModal extends Modal {
	quickOracle: QuickOracle;
	constructor(app: App, quickOracle: QuickOracle, block: CodeBlock) {
		super(app);
		this.quickOracle = quickOracle;
		this.setTitle('quick oracle');
		new Setting(this.contentEl)
			.setName('Description')
			.addText((text) => {
				text.setValue(this.quickOracle.description);
				text.onChange((value) => {
					this.quickOracle.description = value;
				});
			});
		let quickOracleListHelper = new QuickOracleListHelper(this.quickOracle.checkTable.entries);
		let modalQuickOracleListHelper = new ModalQuickOracleListHelper(quickOracleListHelper);
		let modalList = new ModalList<CheckTableEntry>(modalQuickOracleListHelper, "Items");
		modalList.create(this.contentEl.createDiv());
		modalList.render();
		new Setting(this.contentEl)
			.addButton((btn) => btn
				.setButtonText("Throw quick oracle and save")
				.setCta()
				.onClick(async (): Promise<void> => {
					this.close();
					mTrace('quick oracle', "saving quick oracle", quickOracle.text);
					this.quickOracle.throwDice();
					// let diceRandom = new DiceRandom(quickOracle.text);
					// const [result, explain] = diceRandom.throwActual();
					// quickOracle.result = result;
					// quickOracle.explain = explain;
					const json = quickOracle.toJson();
					let editor = app.workspace.activeEditor?.editor;
					if (editor !== undefined)
						block.replaceContents(QuickOracle.TAG, json, editor);
				}))
			.addButton((btn) => btn
				.setButtonText('Cancel')
				.setCta()
				.onClick(() => {
					this.close();
				}));
	}
}

/** helps a QuickOracle array,  */
export class QuickOracleListHelper implements ListHelper<CheckTableEntry> {
	data: Array<CheckTableEntry>;
	constructor(data: Array<CheckTableEntry>) { this.data = data; }
	updateItem(index: number, value: CheckTableEntry): void {
		this.data[index] = value;
	}
	deleteItem(index: number): void {
		this.data.splice(index, 1);
	}
	addItem(): void {
		this.data.push(new CheckTableEntry(1, ""));
	}
	items(): CheckTableEntry[] {
		return this.data;
	}
}
/** for QuickOracleListHelper */
export class ModalQuickOracleListHelper implements ModalListHelper<CheckTableEntry> {
	listHelper_: ListHelper<CheckTableEntry>;
	constructor(listHelper: ListHelper<CheckTableEntry>) { this.listHelper_ = listHelper; }
	renderItem(item: CheckTableEntry, index: number, setting: Setting): void {
		setting.addText((text) => {
			text.setValue(item.weight.toFixed())
				.setPlaceholder("enter weight")
				.onChange((value) => {
					let entry = item;
					const weight = parseInt(value);
					if (!isNaN(weight)) {
						entry.weight = weight;
						this.listHelper_.updateItem(index, entry);
					}
				});
		}).addText((text) => {
			text.setValue(item.text)
				.setPlaceholder("enter value")
				.onChange((value) => {
					let entry = item;
					entry.text = value;
					this.listHelper_.updateItem(index, entry);
				});
		});
	}
	listHelper(): ListHelper<CheckTableEntry> {
		return this.listHelper_;
	}
}
