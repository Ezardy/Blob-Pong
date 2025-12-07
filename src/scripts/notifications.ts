import { AbstractMesh, Scene } from "@babylonjs/core";
import { visibleAsEntity } from "babylonjs-editor-tools";

export default class MyScriptComponent {
	@visibleAsEntity("node", "description mesh")
	private readonly	_descriptionMesh!:	AbstractMesh;
	@visibleAsEntity("node", "accept mesh")
	private readonly	_acceptMesh!:	AbstractMesh;
	@visibleAsEntity("node", "decline mesh")
	private readonly	_declineMesh!:	AbstractMesh;

	public constructor(public scene: Scene) { }

	public onStart(): void {
	}
}
