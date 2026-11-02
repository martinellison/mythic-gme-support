import { FateData } from "../fateData/fatedata.js";
import { mTrace } from "../utils.js";
import { Meaning } from "../meaning/meaning.js";
import { SceneAdjustment } from "./adjustment.js";
import { Scene } from "./scene.js";

/** the different ways that a Scene cab be *altered*. */
export const enum AlterationKind {
	Expected = 'expected',
	Next = 'next',
	Tweak = 'tweak',
	FateQuestion = 'fatequestion',
	Meaning = 'meaning',
	Adjustment = 'adjustment',
}
/** support for AlterationKind */
export class AlterationSupport {
	/** set this scene to alteration */
	static setAlterationKind(scene: Scene, kind: AlterationKind) {
		if (kind == scene.kind) {
			return;
		}
		if (kind != AlterationKind.Expected && scene.kind != kind) scene.alteration = "";
		scene.kind = kind;
		switch (scene.kind) {
			case AlterationKind.Expected:
				break;
			case AlterationKind.Next:
			case AlterationKind.Tweak:
				break;
			case AlterationKind.FateQuestion:
				scene.fate = new FateData(scene);
				break;
			case AlterationKind.Adjustment:
				scene.adjustment = new Array<SceneAdjustment>;
				break;
			case AlterationKind.Meaning:
				if (scene.fate !== undefined)
					scene.fate.meaning = new Meaning;
				break;
		}
	}
	/** this scene is an alteration scene, so remove any unnecessary data. */
	static useAlterationKind(scene: Scene) {
		mTrace("scene alteration", "kind is", scene.kind);
		switch (scene.kind) {
			case AlterationKind.Expected:
				scene.alteration = undefined;
				scene.adjustment = undefined;
				scene.fate = undefined;
				break;
			case AlterationKind.Next:
			case AlterationKind.Tweak:
				scene.adjustment = undefined;
				scene.fate = undefined;
				break;
			case AlterationKind.FateQuestion:
				scene.adjustment = undefined;
				if (scene.fate === undefined)
					scene.fate = new FateData(scene);
				break;
			case AlterationKind.Adjustment:
				scene.fate = undefined;
				if (scene.adjustment === undefined)
					scene.adjustment = new Array<SceneAdjustment>;
				break;
			case AlterationKind.Meaning:
				scene.adjustment = undefined;
				scene.fate = undefined;
				break;
		}
	}
}
