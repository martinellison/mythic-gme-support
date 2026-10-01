import { AlterationSupport } from './alteration.js';
import { Scene } from './scene.js';
/** the different ways that a scene can be changed from the expected scene. */
export const enum SceneType {
	Initial = 'need dice',
	Expected = 'expected',
	Altered = 'altered',
	Interrupt = 'interrupt',
}
/** support for SceneType */
export class SceneTypeSupport {
	/** set scene type. Call `useSceneType` after this. */
	static setSceneType(scene: Scene, sceneType: SceneType) {
		scene.sceneType = sceneType;
		if (scene.sceneType != SceneType.Expected && scene.alteration === undefined)
			scene.alteration = "";
		switch (scene.sceneType) {
			default:
		}
	}
	/** use the scene type */
	static useSceneType(scene: Scene,) {
		// mTrace("scene type is", this.sceneType);
		switch (scene.sceneType) {
			case SceneType.Initial:
			case SceneType.Expected:
				scene.alteration = undefined;
				scene.adjustment = undefined;
				// this.randomEvent = undefined;
				scene.fate = undefined;
				scene.focus = undefined;
				scene.meaning = undefined;
				break;
			case SceneType.Altered:
				AlterationSupport.useAlterationKind(scene);
				break;
			case SceneType.Interrupt:
				scene.adjustment = undefined;
				break;
		}
		// mTrace('scene use type', this.fate === undefined ? "haven't fate" : "have fate");
	}
}
