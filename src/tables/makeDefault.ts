import { format, Document, Node, Value } from 'kdljs';
export class TablesMakeDefault {
}
export class DDItem {
	name: string;
	text?: string;
	properties: Map<string, string>;
	children: Array<DDItem>;
	constructor(
		name: string,
		text?: string,
		properties?: object,
		children?: Array<DDItem>) {
		this.name = name;
		this.text = text;
		this.properties = new Map<string, string>(Object.entries(properties ?? {}));
		this.children = children ?? [];
	}
	static simple(
		name: string,
		text?: string,
		properties?: object,
		childNames?: Array<string>): DDItem {
		const children = (childNames ?? []).map((childText) => { return new DDItem("-", childText, {}, []); });
		return new DDItem(name, text, properties ?? {}, children);
	}
	asNode(): Node {
		return {
			name: this.name,
			values: this.text ? [this.text] : [],
			properties: Object.fromEntries(this.properties),
			children: this.children.map(
				(child) => { return child.asNode(); }),
			tags: { name: undefined, values: [], properties: {} }
		};
	}
}
export class DefaultData {
	items: Array<DDItem>;
	constructor(items: Array<DDItem>) { this.items = items; }
	asDocument(): Document {
		return this.items.map((item) => { return item.asNode(); });
	}
}
