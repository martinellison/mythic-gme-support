import { EditorPosition } from 'obsidian';
import { mTrace, shorten } from './utils.js';
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
	static nonBlock(start: number): CodeBlock {
		return new CodeBlock(start, start, '', false);
	}
	/** check and return a non-empty string if there is an error found */
	check(): string {
		if (this.isInBlock) {
			if (this.start > this.end) return `in block AND start ${this.start} > end ${this.end}`;
		} else {
			if (this.start != this.end) return `NOT in block AND start ${this.start} ≠ end ${this.end}`;
		}
		return '';
	}
	/** find whether the cursor is in a code block and if so find the extent */
	static getBlock(editor: EditorLike): CodeBlock {
		const lineCount = editor.lineCount();
		let cursor = editor.getCursor();
		let lineNumber = cursor.line; // zero based
		mTrace('code block', `line count ${lineCount}, looking forwards from ${lineNumber}`);
		// let charPos = cursor.ch;
		let line = '';
		let lastLine = lineNumber;
		for (; ;) {
			if (lastLine >= lineCount) { mTrace('code block', `already at end ${lastLine}`); break; }
			line = editor.getLine(lastLine).trim();
			lastLine++;
			if (line == CodeBlock.DELIM) { mTrace('code block', `at end ${lastLine}`); break; }
		}
		if (line != CodeBlock.DELIM) {
			mTrace('code block', `last line (${lastLine}: '${editor.getLine(lastLine)}') not in block`);
			return CodeBlock.nonBlock(lastLine);
		}
		if (line.length > CodeBlock.DELIM.length) {
			console.warn("last line '%s' too long", line);
		}
		let firstLine = lineNumber;
		mTrace('code block', `looking backwards from ${firstLine}`);
		for (; ;) {
			if (firstLine < 0) { mTrace('code block', `already before start ${firstLine}`); break; }
			line = editor.getLine(firstLine).trim();
			if (firstLine == 0 || (line.substring(0, 3) == CodeBlock.DELIM && line.length > CodeBlock.DELIM.length)) { mTrace('code block', `at start ${firstLine}`); break; }
			firstLine--;
		}
		if (line.substring(0, CodeBlock.DELIM.length) != CodeBlock.DELIM) {
			mTrace('code block', `first line (${firstLine} '${line}') not in block`);
			return CodeBlock.nonBlock(lastLine);
		}
		if (line.length <= CodeBlock.DELIM.length) {
			console.warn("first line '%s' not long enough", line);
		}
		let tag = line.substring(3);
		const prevBlock = editor.getRange(
			{ line: firstLine, ch: 0 },
			{ line: lastLine, ch: 0 },
		);
		mTrace('code block', `start ${firstLine} end ${lastLine} tag '${tag}' text '${prevBlock}'`);
		return new CodeBlock(firstLine, lastLine, tag, true);
	}
	/** (try to) get an empty block so we can insert a new block. Find somewhere we can put a block, start where the user's cursor is, but skip over any existing block */
	static getEmptyBlock(editor: EditorLike): CodeBlock {
		let block = CodeBlock.getBlock(editor);
		mTrace('code block', block.isInBlock ? 'in' : 'not in', "block");
		block.dump(editor, "looking for empty");
		if (!block.isInBlock) return block;
		return new CodeBlock(block.end + 1, block.end + 1, '', false);
	}
	/** find the contents of the CodeBlock, do not include header and footer */
	contents(editor: EditorLike): string {
		if (!this.isInBlock) return '';
		return editor.getRange(
			{ line: this.start + 1, ch: 0 },
			{ line: this.start + 2, ch: 0 },
		);
	}
	/** replace the block by the `json_text` and include header and footer for MarkDown */
	replaceContents(tag: string, json_text: string, editor: EditorLike) {
		const previousLine = editor.getLine(this.start - 1).trim();
		const prevBlock = editor.getRange(
			{ line: this.start, ch: 0 },
			{ line: this.end, ch: 0 },
		);
		mTrace('code block', `block was <${prevBlock}>, previous line was <${previousLine}>`);
		mTrace('code block', `replacing block with '${tag}': ${this.start}..${this.end}`);
		const block = (previousLine == '' ? '' : '\n') + `\`\`\`${tag}\n${json_text}\n\`\`\`\n`;
		editor.replaceRange(
			block,
			{ line: this.start, ch: 0 },
			{ line: this.end, ch: 0 },
		);
	}
	/** check and return a non-empty string if there is an error found */
	static checkAll(editor: EditorLike): string {
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
		if (isInBlock) return "block not terminated";
		return '';
	}
	/** dump the code block to the trace */
	dump(editor: EditorLike, narr?: string) {
		mTrace('code block' + ' ' + (narr ?? '/'), JSON.stringify(this), shorten(this.contents(editor)));

	}
}
enum LineKind {
	Header = '[',
	Footer = ']',
	// Block = '-',
	Other = 'X',
}
/** classifies the line */
export function lineKind(line: string): LineKind {
	const lineLength = line.length;
	if (lineLength == CodeBlock.DELIM.length && line == CodeBlock.DELIM) return LineKind.Footer;
	if (lineLength > CodeBlock.DELIM.length && line.substring(0, CodeBlock.DELIM.length) == CodeBlock.DELIM) return LineKind.Header;
	return LineKind.Other;
}
