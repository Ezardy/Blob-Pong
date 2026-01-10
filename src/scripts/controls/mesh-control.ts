import { Scene, Nullable, TransformNode, AbstractMesh } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Control, Control3D, InputText } from "@babylonjs/gui";
import { IClonableControl3D } from "../interfaces/iclonablecontrol3d";
import { updateBoundingBoxRecursively } from "../functions/bounding-box";
import { Control3DClone } from "../functions/typing-utils";
import { cloneNodeWithScripts } from "../functions/cloning";

export default class MeshControl extends Control3D implements IClonableControl3D {
	public constructor(private meshToUse: AbstractMesh, name: string, private content?:	Control) {
		super(name);
		updateBoundingBoxRecursively(meshToUse);
		this.onPointerUpObservable.add(() => content?.focus());
		if (content instanceof InputText) {
			this.onPointerEnterObservable.add(() => document.body.style.cursor = 'text');
			this.onPointerOutObservable.add(() => document.body.style.cursor = '');
		}
	}

	protected override _createNode(scene: Scene): Nullable<TransformNode> {
		const meshes = this.meshToUse.getChildMeshes();

		for (const mesh of meshes) {
			this._injectGUI3DReservedDataStore(mesh).control = this;
		}

		return this.meshToUse;
	}

	protected override _affectMaterial(mesh: AbstractMesh): void {
		
	}

	public	clone():	Control3DClone {
		return {root: new MeshControl(cloneNodeWithScripts(this.meshToUse) as Mesh, this.name + " clone", this.content), children: []};
	}
}
