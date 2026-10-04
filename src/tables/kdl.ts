import { parse, format, ParseResult, Value } from 'kdljs';
import { Vault } from "obsidian";
import { Type, plainToInstance, Expose } from 'class-transformer';
import { QuestionOdds } from '../question.js';
import { assertDefined, mTrace } from '../main.js';
import { MythicSupportPluginSettings, SettingsHelper } from '../settings.js';
import { CheckTable, CheckTableEntry, Interpretation } from './checkTable.js';
import { MythicObjectMeta, Oracle, Tables, ThingFamily } from './tables.js';
import { DefaultTablesData } from './kdl-gen.js';

/** Tables as loaded from KDL. If they don't exist, create from defaults.*/
export class KdlTables {
	static async load(vault: Vault, settings: MythicSupportPluginSettings): Promise<Tables> {
		mTrace('kdl', "start loading KDL");
		let table = new Tables;
		try { // FUTURE check the version pf the first tables file and delete it if it is out of date
			const tablesFile = SettingsHelper.ensureTablesFile(settings);
			mTrace('tables/kdl', `checking table file '${tablesFile}'`);
			mTrace('tables/kdl', "looking for", tablesFile);
			await KdlTables.ensureTablesFile(tablesFile, vault);
			const files = settings.tableFiles;
			for (let file of files) {
				mTrace('tables', "loading tables from", file);
				await KdlTables.loadFromFile(file, table, vault);
			}
			// mTrace('kdl', "tables", table);
		} catch (err) {
			console.error("error in loading tables", err);
			throw (err);
		}
		return table;
	}
	/** loads the kDL from a file , converts it to TypeScript, and interprets each table. */
	static async loadFromFile(file: string, tables: Tables, vault: Vault) {
		try {
			const kdl = await KdlTables.getKdl(file, tables, vault);
			if (kdl === undefined) {
				console.error("could not read KDL tables file", file);
				return;
			}
			let nodes: Array<KdlNode> = plainToInstance(Array<KdlNode>, kdl.output);
			// mTrace('', "tables as read from KDL", nodes);
			nodes.forEach((node: KdlNode) => {
				// mTrace('kdl', "node is", node);
				switch (node.name) {
					case 'tables':
						KdlTables.getVersion(node, file, tables);
						break;
					case 'questions':
						KdlTables.getQuestions(node.children, tables);
						break;
					case 'fate':
						KdlTables.getFate(node, tables);
						break;
					case 'eventFocus':
						KdlTables.getEventFocus(node, tables);
						break;
					case 'objects':
						KdlTables.getObjects(node, tables);
						break;
					case 'simples':
						KdlTables.getSimples(node, tables);
						break;
					case 'oracles':
						KdlTables.getOracles(node, tables);
						break;
					default:
						// mTrace('', "need to implement", node.name);
						console.error("unknown node type", node.name, "file:", file);
						if (tables.result == "") tables.result = `invalid table entry '${node.name}' in file ${file}.`;
				}
			});
		}
		catch (err) {
			console.error("error when trying to load tables:", err);
		}
	}
	/** gets all the KDL in a file and converts it to KDL parse result. */
	static async getKdl(file: string, table: Tables, vault: Vault): Promise<ParseResult | undefined> {
		const path = vault.getFileByPath(file);
		if (path == null) {
			console.warn("bad path for KDL", file, "resolved as", path);
			return;
		}
		const source = await vault.cachedRead(path);
		const kdl = parse(source);
		// mTrace('kdl', "KDL parse result", kdl);
		if (kdl.errors.length) {
			for (const e of kdl.errors) {
				console.warn("kdl error: ", e, "line", e.token.startLine, "in error", e.token.image);
				for (let i = 0; i < e.token.image.length; i++) console.warn("bad?", e.token.image.charCodeAt(i));
			}
			if (table.result == "") {
				const errTxt = kdl.errors.map(ex => `${ex} `).join("\n");
				table.result = `in parsing KDL: ${errTxt}`;
			}
			console.error("bad KDL", table.result);
		}
		return kdl;
	}
	/** gets the table version from the KDL */
	static getVersion(node: KdlNode, ident: string, table: Tables) {
		const props = new Map(Object.entries(node.properties));
		// const version: string = node.values[0]?.toString() ?? "??1";
		const version = props.get('version') as string;
		mTrace('tables', `version node: ${node.name}, version ${version}`);
		if (table.tableVersions.has(ident)) {
			const foundVersion = table.tableVersions.get(ident) ?? "??2";
			console.warn(`already have table ${ident} version '${foundVersion}' but found '${version}'`);
		} else {
			mTrace('tables', `setting ${ident} version to '${version}'`);
			table.tableVersions.set(ident, version);
		}
	}
	/** gets all the questions from the KDL */
	static getQuestions(children: KdlNode[], table: Tables) {
		children.forEach((odds: KdlNode) => {
			// mTrace('tables', "question odds", odds);
			const ident: string = odds.values[0] as string ?? "";
			const props = new Map(Object.entries(odds.properties));
			// mTrace('tables', "props is", props);
			assertDefined(props, 'tables');
			const display = props.get('display') as string;
			const mod = parseInt(props.get('mod') as string ?? "0") ?? 0;
			table.questionOdds.push(new QuestionOdds(ident, display, mod));
		});
	}
	/** gets all the fate types from the KDL */
	static getFate(node: KdlNode, table: Tables) {
		const props = new Map(Object.entries(node.properties));
		const diceType = props.get('dice') as string;
		// mTrace('', "num dice", diceType);
		let entries = new Array<CheckTableEntry>;
		node.children.forEach(odds => {
			// mTrace('', "odds", odds);
			const text = odds.values[0]?.toString() ?? "";
			const props = new Map(Object.entries(odds.properties));
			assertDefined(props, 'tables');
			// const interpretation = props.interpretation as string;
			// const min = parseInt(props.min as string) ?? 0;
			const weight = parseInt(props.get('weight') as string ?? "1") ?? 1;
			// const protect = props.get('protect') as boolean ?? false;
			// mTrace('', "fate", text, weight);
			entries.push(new CheckTableEntry(weight, text, Interpretation.None,));
		});
		table.fateCheckAnswers.fix(entries, diceType);
	}
	/** gets all the events from the KDL */
	static getEventFocus(node: KdlNode, table: Tables) {
		const props = new Map(Object.entries(node.properties));
		const diceType = props.get('dice') as string;
		let entries = new Array<CheckTableEntry>;
		node.children.forEach(chance => {
			// mTrace('', "chance", chance);
			const text = (chance.values[0] ?? "").toString();
			const props = new Map(Object.entries(chance.properties));
			assertDefined(props, 'tables');
			// const text = props.text as string;
			const interpretation = props.get('interpretation') as Interpretation;
			// const protect = props.get('protect') as boolean ?? false;
			// const min = parseInt(props.min as string) ?? 0;
			entries.push(new CheckTableEntry(parseInt(props.get('weight') as string ?? "1") ?? 1, text, interpretation,));
		});
		table.eventFocus.fix(entries, diceType);
	}
	/** gets all the   objects from the KDL */
	static getObjects(node: KdlNode, table: Tables) {
		node.children.forEach(kind => {
			// mTrace('', "object kind", kind);
			const ident = (kind.values[0] ?? "").toString();
			const props = new Map(Object.entries(kind.properties));
			assertDefined(props, 'tables');
			// const text = odds.text as string;
			const display = props.get('display') as string;
			const description = props.get('description') as string;
			const progress = props.get('progress') as boolean;
			// mTrace('', "object kind has", kind, description, display);
			table.objectKinds.set(ident, new MythicObjectMeta(ThingFamily.ThingObject, kind.name, description, display, "", false, progress));
		});
	}
	/** gets all the simple object types from the KDL */
	static getSimples(node: KdlNode, table: Tables) {
		node.children.forEach(itemNode => {
			const ident: string = (itemNode.values[0] ?? "").toString();
			const props = new Map(Object.entries(itemNode.properties));
			assertDefined(props, 'tables');
			const display = props.get('display') as string;
			const description = props.get('description') as string;
			const progress = false;
			table.simples.set(ident, new MythicObjectMeta(ThingFamily.SimpleText, ident, description, display, "", false, progress));
		});
	}
	/** gets all the oracles from the KDL */
	static getOracles(node: KdlNode, table: Tables) {
		node.children.forEach(tableNode => {
			const ident = (tableNode.values[0] ?? "").toString();
			const props = new Map(Object.entries(tableNode.properties));
			assertDefined(props, 'tables');
			const diceType = props.get('dice') as string;
			const description = props.get('description') as string;
			let alt = props.get('alt') as string;
			let noAlt = props.get('noAlt') as boolean;
			let display = props.get('display') as string ?? ident;
			let entries = new Array<CheckTableEntry>;
			// let items = new Array<string>;
			tableNode.children.forEach(itemNode => {
				const itemIdent = (itemNode.values[0] ?? "").toString();
				const itemProps = new Map(Object.entries(tableNode.properties));
				const itemWeight = parseInt(itemProps.get('weight') as string ?? "1") ?? 1;
				const interpretation = itemProps.get('interpretation') as Interpretation ?? Interpretation.None;
				let entry = new CheckTableEntry(itemWeight, itemIdent, interpretation,);
				// mTrace('table oracle', "entry", entry);
				entries.push(entry);
			});
			const progress = false;
			const meta = new MythicObjectMeta(ThingFamily.OracleResponse, ident, description, display, alt, noAlt, progress);
			let checkTable = new CheckTable;
			checkTable.fix(entries, diceType);
			table.oracles.set(ident, new Oracle(meta, checkTable, checkTable.diceMax));
		});
	}
	static async ensureTablesFile(fileName: string, vault: Vault) {
		if (!await vault.exists(fileName)) {
			mTrace('kdl tables', "file not in vault, creating", fileName);
			const document = DefaultTablesData.tableData().asDocument();
			const tableDef = format(document);
			mTrace('kdl tables', "saving file to vault");
			await vault.create(fileName, tableDef,);
		}
	}
}
/** Data loaded from a Node in the KDL files, as a TypeScript class. */
class KdlNode {
	@Expose() name: string = "";
	@Expose() properties: Map<string, Value> = new Map<string, Value>();
	@Expose() values: string[] = []; // not populated for unknown reason
	@Type(() => KdlNode)
	@Expose() children: Array<KdlNode> = [];
	@Type(() => KdlTags)
	@Expose() tags: KdlTags = new KdlTags;
}
/** the tags on a KDL Node, as a TypeScript class. */
class KdlTags {
	name: string = "";
	properties: Map<string, string> = new Map<string, string>();
	values: Array<string> = [];
};
