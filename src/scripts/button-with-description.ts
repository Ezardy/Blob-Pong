import { Mesh, Vector3 } from "@babylonjs/core";
import { MeshButton3D } from "@babylonjs/gui";

export default class ButtonWithDescription extends MeshButton3D {
	public constructor(mesh: Mesh, name: string, descriptionRef: Vector3) {
		super(mesh, name);
	}
}
