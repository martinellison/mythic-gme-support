import { plainToInstance, instanceToPlain, Expose } from 'class-transformer';
import { Modal, App, Setting, MarkdownPostProcessorContext } from 'obsidian';
import { CodeBlock } from './codeblock.js';
import { mTrace, shorten } from './utils.js';
import { DiceRandom } from './dice-utils.js';
/**  implements an dice block. a block that just throws some dice. */
export class Dice {
	@Expose() text: string;
	@Expose() result: number = 0;
	@Expose() explain: string = "";
	@Expose() description: string = "";
	static readonly TAG = 'mythic-dice';

	constructor(text: string) {
		this.text = text;
	}
	/** convert Dice from a JSON string */
	static fromJson(source: string): Dice {
		try {
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- JSON.parse returns any
			let dice: Dice = plainToInstance(Dice, JSON.parse(source), { excludeExtraneousValues: true });
			return dice;
		} catch (error) {
			console.error("error parsing dice: ", error, "reading:", shorten(source));
			// return new MythicObject("", "", "", "", false);
			throw error;
		}
	}
	/** convert Dice to a JSON string */
	toJson(): string {
		return JSON.stringify(instanceToPlain(this));
	}
	/** create HTML for display */
	static toHtml(source: string, el: HTMLElement, _ctx: MarkdownPostProcessorContext) {
		// mTrace('dice', "rendering dice", source);
		let divElt: HTMLDivElement = el.createDiv({ cls: 'mythic-dice' });
		try {
			const dice: Dice = Dice.fromJson(source);
			divElt.createSpan({ text: `(dice) ${dice.description}:` });
			divElt.createEl('i', { text: ` ${dice.text} =` });
			divElt.createEl('b', { text: ` ${dice.result}` });
			divElt.createSpan({ text: ` (${dice.explain})` });
		} catch (error) {
			divElt.createSpan({ text: `error in parsing dice: ${error as Error}`, cls: 'mythic-error' });
		}
	}
}
/** display a Dice for editing */
export class DiceModal extends Modal {
	dice: Dice;
	constructor(app: App, dice: Dice, block: CodeBlock) {
		super(app);
		this.dice = dice;
		this.setTitle('Dice'); new Setting(this.contentEl)
			.setName('Description')
			.addText((text) => {
				text.setValue(this.dice.description);
				text.onChange((value) => {
					this.dice.description = value;
				});
			});
		new Setting(this.contentEl)
			.setName('Dice')
			.addText((text) => {
				text.setValue(this.dice.text);
				text.onChange((value) => {
					if (new DiceRandom(value).ok)
						this.dice.text = value;
				});
			});
		new Setting(this.contentEl)
			.addButton((btn) => btn
				.setButtonText("Throw dice and save")
				.setCta()
				.onClick(async (): Promise<void> => {
					this.close();
					mTrace('dice', "saving dice", dice.text);
					let diceRandom = new DiceRandom(dice.text);
					const [result, explain] = diceRandom.throwActual();
					dice.result = result;
					dice.explain = explain;
					const json = dice.toJson();
					let editor = app.workspace.activeEditor?.editor;
					if (editor !== undefined)
						block.replaceContents(Dice.TAG, json, editor);
				}))
			.addButton((btn) => btn
				.setButtonText('Cancel')
				.setCta()
				.onClick(() => {
					this.close();
				}));
	}
}
