import { Scene, Nullable, TransformNode, AbstractMesh } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Control, Control3D } from "@babylonjs/gui";
import { cloneNodeWithScripts, IClonableControl3D } from "./clonning";
import { Control3DClone } from "./typing-utils";

export default class MeshControl extends Control3D implements IClonableControl3D {
	public constructor(private meshToUse: Mesh, name: string, private content?:	Control) {
		super(name);
		this.onPointerUpObservable.add(() => content?.focus());
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
