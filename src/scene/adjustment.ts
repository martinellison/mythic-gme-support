import { assertDefined, mythicDice } from "../main.js";

/** the different ways that a Scene cab be *adjusted*. */
export const enum SceneAdjustment {
	ReduceRemoveActivity = 'reduce/remove activity',
	IncreaseActivity = 'increase activity',
	RemoveCharacter = 'remove character',
	AddCharacter = 'add character',
}
/** support for SceneAdjustment */
export class AdjustmentSupport {
	/** do a scene adjustment. */
	static addSceneAdjustment(adjustments: Array<SceneAdjustment>) {
		const sceneAdjustOracle = mythicDice(10); // MGME p70
		assertDefined(adjustments, 'scene');
		switch (sceneAdjustOracle) {
			case 1: adjustments.push(SceneAdjustment.RemoveCharacter); break;
			case 2: adjustments.push(SceneAdjustment.AddCharacter); break;
			case 3: adjustments.push(SceneAdjustment.ReduceRemoveActivity); break;
			case 4: adjustments.push(SceneAdjustment.IncreaseActivity); break;
			case 5: adjustments.push(SceneAdjustment.RemoveCharacter); break;
			case 6: adjustments.push(SceneAdjustment.AddCharacter); break;
			default:
				if (adjustments.length < 2)
					AdjustmentSupport.addSceneAdjustment(adjustments);
				if (adjustments.length < 2)
					AdjustmentSupport.addSceneAdjustment(adjustments);
		}
	}
}
