import { Mesh, Node } from "@babylonjs/core";
import { GUI3DManager, MeshButton3D, StackPanel3D } from "@babylonjs/gui";
import { visibleAsEntity } from "babylonjs-editor-tools";

export default class Ui {
	@visibleAsEntity("node", "Join public game button mesh")
	private readonly	_joinPublicGameButtonMesh!:	Mesh;

	@visibleAsEntity("node", "Join private game button mesh")
	private readonly	_joinPrivateGameButtonMesh!:	Mesh;

	@visibleAsEntity("node", "Create game button mesh")
	private readonly	_createGameButtonMesh!:	Mesh;

	public constructor(public node: Node) {
	}

	public onStart(): void {
		const	manager:	GUI3DManager = new GUI3DManager(this.node.getScene());
		const	mainStack:	StackPanel3D = new StackPanel3D(true);
		manager.addControl(mainStack);
		mainStack.margin = 0.05

		const	joinPublicGameButton:	MeshButton3D = new MeshButton3D(this._joinPublicGameButtonMesh, "joinPublicButton");
		
		//for (const control of mainStack.children)
		//	control.isVisible = false;
		
		const	joinPrivateGameButton:	MeshButton3D = new MeshButton3D(this._joinPrivateGameButtonMesh, "joinPrivateButton");
		
		const	createGameButton:	MeshButton3D = new MeshButton3D(this._createGameButtonMesh, "createGameButton");
		
		mainStack.addControl(createGameButton);
		mainStack.addControl(joinPrivateGameButton);
		mainStack.addControl(joinPublicGameButton);
	}

	public onUpdate(): void {
	}
}
