// import { plainToInstance, instanceToPlain, Expose } from 'class-transformer';
import { mythicDice } from './utils.js';

const DIGIT_EXPRESSION: RegExp = /^\d$/;
const isDigit = (character: string): boolean => {
	return DIGIT_EXPRESSION.test(character);
};
/** represents a dice expression like `2d6`. Generates a random number */
export class DiceRandom {
	items: Array<DiceItem> = [];
	ok: boolean = true;
	constructor(s: string) {
		let pos = 0;
		let remChars = s.length;
		let currChar = () => { return remChars == 0 ? ';' : s.charAt(pos); };
		const eatChar = () => { if (remChars > 0) { ++pos; --remChars; } };
		const eatSpaces = () => { while (currChar() == ' ') eatChar(); };
		while (remChars > 0) {
			eatSpaces();
			let sign = ' ';
			if (currChar() == '+' || currChar() == '-') {
				sign = currChar(); eatChar(); eatSpaces();
			}
			let numDice = 1;
			if (isDigit(currChar())) {
				numDice = 0;
				while (isDigit(currChar())) { numDice = numDice * 10 + (s.charCodeAt(pos) - '0'.charCodeAt(0)); eatChar(); }
			}
			eatSpaces();
			let die = 0;
			if (currChar() == 'd' || currChar() == 'D') {
				eatChar(); eatSpaces();
				while (isDigit(currChar())) { die = die * 10 + (s.charCodeAt(pos) - '0'.charCodeAt(0)); eatChar(); }
				eatSpaces();
			}
			this.items.push(new DiceItem(sign, numDice, die));
		}
		this.ok = remChars == 0;
	}
	/** returns the smallest number that the dice can throw */
	min(): number {
		let m = 0;
		this.items.forEach((item) => {
			m += item.min();
		});
		return m;
	}
	/** returns the largest number that the dice can throw */
	max(): number {
		let m = 0;
		this.items.forEach((item) => {
			m += item.max();
		});
		return m;
	}
	/** This actually throws the dice, and returns the total and a text breakdown. */
	throwActual(): [number, string] {
		let total = 0;
		let explains = new Array<string>;
		this.items.forEach((item) => {
			const [part, exp] = item.throw();
			total += part;
			explains.push(exp);
		});
		return [total, explains.join("")];
	}
	static throw(text: string): [number, string] {
		const d = new DiceRandom(text);
		if (!d.ok) {
			const msg = `badly formatted dice expression '${text}'`;
			console.warn("(dice)", msg);
			return [0, msg];
		}
		return d.throwActual();
	}
}
/** part of a random */
export class DiceItem {
	sign: string = "+";
	numDice: number = 1;
	die: number = 1; // 0 means constant value
	constructor(sign: string = "+", numDice: number = 1, die: number = 1) {
		this.sign = sign;
		this.numDice = numDice;
		this.die = die;
	}
	/** returns the smallest number that the dice can throw */
	min(): number {
		return this.die == 0 ? (this.sign == "-" ? - this.numDice : this.numDice) : (this.numDice * (this.sign == "-" ? - this.die : 1));
	}
	/** returns the largest number that the dice can throw */
	max(): number {
		return this.die == 0 ? (this.sign == "-" ? - this.numDice : this.numDice) : (this.numDice * (this.sign == "-" ? -1 : this.die));
	}
	/** explain the sign to the player */
	signExplain(): string {
		switch (this.sign) {
			case ' ':
			case '+':
				return '+';
			case '-':
				return '-';
			default:
				return '?';
		}
	}
	throw(): [number, string] {
		let part = 0;
		let explains = new Array<string>;
		if (this.die == 0) {
			part = this.numDice;
			explains.push(`${this.signExplain()}${part}`);
		} else {
			for (let i = 0; i < this.numDice; i++) {
				const thrown = mythicDice(this.die);
				part += thrown;
				explains.push(`${this.signExplain()}${thrown}`);
			}
		}
		if (this.sign == "-")
			part = -part;
		return [part, explains.join("")];
	}
}
