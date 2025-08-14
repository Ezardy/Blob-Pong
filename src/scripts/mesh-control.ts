import { Scene, Nullable, TransformNode, AbstractMesh, UtilityLayerRenderer, ActionManager, SetValueAction, ValueCondition, ExecuteCodeAction } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Control3D } from "@babylonjs/gui";

export default class MeshControl extends Control3D {
	private	_triggered:	boolean = false;

	public constructor(private meshToUse: Mesh, name: string, layer?: Nullable<UtilityLayerRenderer>) {
		super(name);
		if (layer) {
			this.onPointerEnterObservable.add(() =>  {
				layer.pickingEnabled = false;
				setTimeout(() => {
					if (!this._triggered)
						layer.pickingEnabled = true;
				}, 500);
			});
			meshToUse.actionManager = new ActionManager(meshToUse.getScene());
			meshToUse.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOverTrigger, this, "_triggered", true));
			meshToUse.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
				this._triggered = false;
				setTimeout(() => {
					if (!this._triggered)
						layer.pickingEnabled = true;
				}, 500);
			}));
			for (const mesh of meshToUse.getChildMeshes()) {
				mesh.actionManager = new ActionManager(mesh.getScene());
				mesh.actionManager.registerAction(new SetValueAction(ActionManager.OnPointerOverTrigger, this, "_triggered", true));
				mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
					this._triggered = false;
					setTimeout(() => {
						if (!this._triggered)
							layer.pickingEnabled = true;
					}, 500);
				}));
			}
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
}
