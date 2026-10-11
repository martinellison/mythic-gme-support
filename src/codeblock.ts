import { Editor, EditorPosition } from 'obsidian';
import { mTrace } from './utils.js';
interface EditorLike {
	lineCount(): number;
	getCursor(): EditorPosition;
	getLine(lineNumber: number): string;
	getRange(start: EditorPosition, end: EditorPosition): string;
	replaceRange(s: string, start: EditorPosition, end: EditorPosition,): void;
}
/** This implements a MarkDown code block. This is how the data is stored. */
export class CodeBlock {
	start: number = 0;
	end: number = 0;
	kind: string = '';
	isInBlock: boolean = true;
	static DELIM = '```';
	constructor(
		start: number = 0,
		end: number = 0,
		kind: string = '',
		isInBlock: boolean = true,
	) {
		this.start = start;
		this.end = end;
		this.kind = kind;
		this.isInBlock = isInBlock;
	}
	static nonBlock(): CodeBlock {
		return new CodeBlock(0, 0, '', false);
	}
	/** find whether the cursor is in a code block and if so find the extent */
	static get(editor: EditorLike): CodeBlock {
		const lineCount = editor.lineCount();
		mTrace('code block', `line count ${lineCount}`);
		let cursor = editor.getCursor();
		let lineNumber = cursor.line; // zero based
		// let charPos = cursor.ch;
		let line = '';
		let lastLine = lineNumber;
		for (; ;) {
			line = editor.getLine(lastLine).trim();
			if (lastLine >= lineCount - 1 || line == CodeBlock.DELIM) { mTrace('code block', `at end ${lastLine}`); break; }
			lastLine++;
		}
		if (line != CodeBlock.DELIM) {
			console.warn(
				"bad last line (%d: '%s')",
				lastLine,
				editor.getLine(lastLine),
			);
			return CodeBlock.nonBlock();
		}
		if (line.length > CodeBlock.DELIM.length) {
			console.warn("last line '%s' too long", line);
		}
		let firstLine = lineNumber;
		for (; ;) {
			line = editor.getLine(firstLine).trim();
			if (firstLine <= 0 || line.substring(0, 3) == CodeBlock.DELIM) { mTrace('code block', `at start ${firstLine}`); break; }
			firstLine--;
		}
		if (line.substring(0, CodeBlock.DELIM.length) != CodeBlock.DELIM) {
			console.warn(
				"bad first line (%d '%s')",
				firstLine,
				editor.getLine(firstLine),
			);
			return CodeBlock.nonBlock();
		}
		if (line.length <= CodeBlock.DELIM.length) {
			console.warn("first line '%s' not long enough", line);
		}
		let tag = line.substring(3);
		mTrace('code block', `start ${firstLine} end ${lastLine} tag '${tag}'`);
		return new CodeBlock(firstLine, lastLine, tag, true);
	}
	/** find the contents of the CodeBlock, do not include header and footer */
	contents(editor: EditorLike): string {
		if (!this.isInBlock) return '';
		return editor.getRange(
			{ line: this.start + 1, ch: 0 },
			{ line: this.end, ch: 0 },
		);
	}
	/** replace the block by the `json_text` and include header and footer for MarkDown */
	replaceContents(tag: string, json_text: string, editor: EditorLike) {
		const block = `\`\`\`${tag}\n${json_text}\n\`\`\`\n`;
		editor.replaceRange(
			block,
			{ line: this.start, ch: 0 },
			{ line: this.end + 1, ch: 0 }, // TODO maybe still a problem here
		);
	}

	/** check and return a non-empty string if there is an error found */
	static check(editor: EditorLike): string {
		const lineCount = editor.lineCount();
		let isInBlock = false;
		for (let lineNum = 0; lineNum < editor.lineCount(); ++lineNum) {
			const line = editor.getLine(lineNum);
			const kind = lineKind(line);
			switch (kind) {
				case LineKind.Footer:
					if (!isInBlock) return "block not terminated correctly";
					isInBlock = false;
					break;
				case LineKind.Header:
					if (isInBlock) return "block not started correctly";
					isInBlock = true;
					break;
				case LineKind.Other:
					break;
			}
		}
		return '';
	}
}
enum LineKind {
	Header = '[',
	Footer = ']',
	// Block = '-',
	Other = 'X',
}
function lineKind(line: string): LineKind {
	const lineLength = line.length;
	if (lineLength == CodeBlock.DELIM.length && line == CodeBlock.DELIM) return LineKind.Footer;
	if (lineLength > CodeBlock.DELIM.length && line.substring(0, CodeBlock.DELIM.length) != CodeBlock.DELIM) return LineKind.Header;
	return LineKind.Other;
}
