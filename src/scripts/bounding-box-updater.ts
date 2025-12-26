import { applyScriptOnObject, IScript } from "babylonjs-editor-tools";
import { IClonableScript } from "./interfaces/iclonablescript";
import { AbstractMesh, IParticleSystem, Node, Scene } from "@babylonjs/core";
import { updateBoundingBoxRecursively } from "./functions/bounding-box";

export default class BoundingBoxUpdater implements IScript, IClonableScript {
	public constructor(public mesh: AbstractMesh) {
		updateBoundingBoxRecursively(mesh);
	}

	public	onStart(): void { }

	public	clone(root: Node | IParticleSystem | Scene): IScript {
		if (!(root instanceof AbstractMesh))
			throw TypeError("AbstractMesh type was expected by BoundingBoxUpdater");
		return applyScriptOnObject(root, BoundingBoxUpdater);
	}
}
