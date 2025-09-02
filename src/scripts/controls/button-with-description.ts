import { Mesh, Quaternion, Animation as BAnimation, Observer, Vector3, Space } from "@babylonjs/core";
import { MeshButton3D, Vector3WithInfo } from "@babylonjs/gui";
import { IClonableControl3D } from "../interfaces/iclonablecontrol3d";
import { IDisablable } from "../interfaces/idisablable";
import { updateBoundingBoxRecursively } from "../functions/bounding-box";
import { Control3DClone } from "../functions/typing-utils";
import { cloneNodeWithScripts } from "../functions/cloning";

export default class ButtonWithDescription extends MeshButton3D implements IClonableControl3D, IDisablable {
	private readonly	_descRotAnim:			BAnimation;
	private readonly	_descScaleAnim:			BAnimation;
	private readonly	_disabledAnim:			BAnimation;
	private				_isEnabled:				boolean = true;
	private readonly	_onPointerUpObservers:	Observer<Vector3WithInfo>[] = [];

	public get	isEnabled():	boolean {
		return this._isEnabled;
	}

	public set	isEnabled(enable: boolean) {
		if (this._isEnabled != enable) {
			if (enable) {
				this.pointerEnterAnimation = this._beginPointerEnterAnimation;
				this.pointerOutAnimation = this._beginPointerOutAnimation;
				this.onPointerUpObservable.observers.push(...this._onPointerUpObservers);
				this._currentMesh.getScene().beginDirectAnimation(this._currentMesh, [this._disabledAnim], 5, 0);
			} else {
				this.pointerEnterAnimation = () => {};
				this.pointerOutAnimation = () => {};
				this._onPointerUpObservers.length = 0;
				this._onPointerUpObservers.push(...this.onPointerUpObservable.observers);
				this.onPointerUpObservable.clear();
				this._currentMesh.getScene().beginDirectAnimation(this._currentMesh, [this._disabledAnim], 0, 5);
			}
			this._isEnabled = enable;
		}
	}

	public constructor(mesh: Mesh, name: string, private descriptionRelativeRotation: Quaternion,
		private scaleOnEnter: number = 1, private pivot: Vector3 = Vector3.Zero(),
		private disabledRelativeRotation?: Quaternion, private enabledOnStart: boolean = true) {
		super(mesh, name);
		updateBoundingBoxRecursively(mesh);
		mesh.setPivotPoint(pivot, Space.LOCAL);
		const	initialRotation:		Quaternion = mesh.rotationQuaternion ? mesh.rotationQuaternion : Quaternion.FromEulerVector(mesh.rotation);
		if (!disabledRelativeRotation)
			disabledRelativeRotation = initialRotation;
		const	endRotation:			Quaternion = initialRotation.multiply(descriptionRelativeRotation);
		const	disabledRotation:		Quaternion = initialRotation.multiply(disabledRelativeRotation);
		this._descRotAnim = new BAnimation(name + " desc rot", "rotationQuaternion", 30, BAnimation.ANIMATIONTYPE_QUATERNION, BAnimation.ANIMATIONLOOPMODE_CONSTANT, false);
		this._descScaleAnim = new BAnimation(name + " desc scale", "scaling", 30, BAnimation.ANIMATIONTYPE_VECTOR3, BAnimation.ANIMATIONLOOPMODE_CONSTANT, false);
		this._disabledAnim = new BAnimation(name + " disabling", "rotationQuaternion", 30, BAnimation.ANIMATIONTYPE_QUATERNION, BAnimation.ANIMATIONLOOPMODE_CONSTANT, false);
		this._descRotAnim.setKeys([{
				frame:	0,
				value:	initialRotation
			}, {
				frame:	5,
				value:	endRotation
			}
		]);
		this._descScaleAnim.setKeys([{
			frame:	0,
			value:	mesh.scaling
		}, {
			frame:	5,
			value:	mesh.scaling.scale(scaleOnEnter)
		}]);
		this._disabledAnim.setKeys([{
			frame:	0,
			value:	initialRotation
		}, {
			frame:	5,
			value:	disabledRotation
		}]);
		this.pointerEnterAnimation = this._beginPointerEnterAnimation;
		this.pointerOutAnimation = this._beginPointerOutAnimation;
		this.isEnabled = enabledOnStart;
	}

	public	clone():	Control3DClone {
		return {root: new ButtonWithDescription(cloneNodeWithScripts(this.mesh as Mesh) as Mesh, this.name + " clone", this.descriptionRelativeRotation, this.scaleOnEnter, this.pivot, this.disabledRelativeRotation, this.enabledOnStart), children: []};
	}

	private	_beginPointerEnterAnimation():	void {
		this._currentMesh.getScene().beginDirectAnimation(this._currentMesh, [this._descRotAnim, this._descScaleAnim], 0, 5)
	}

	private	_beginPointerOutAnimation():	void {
		this._currentMesh.getScene().beginDirectAnimation(this._currentMesh, [this._descRotAnim, this._descScaleAnim], 5, 0);
	}
}
