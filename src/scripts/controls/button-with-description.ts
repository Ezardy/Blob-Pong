import { Mesh, Quaternion, Animation as BAnimation, Observer, Vector3, Space } from "@babylonjs/core";
import { IClonableControl3D } from "../interfaces/iclonablecontrol3d";
import { IDisablable } from "../interfaces/idisablable";
import { updateBoundingBoxRecursively } from "../functions/bounding-box";
import { Control3DClone } from "../functions/typing-utils";
import { cloneNodeWithScripts } from "../functions/cloning";
import MeshButton3DDisablable from "./mesh-button-3d-disablable";

export default class ButtonWithDescription extends MeshButton3DDisablable implements IClonableControl3D, IDisablable {
	private readonly	_descRotAnim:			BAnimation;
	private readonly	_descScaleAnim:			BAnimation;
	private readonly	_disabledAnim:			BAnimation;

	public override get	isEnabled():	boolean {
		return this._isEnabled;
	}

	public override set	isEnabled(enable: boolean) {
		if (this._isEnabled != enable) {
			Object.getOwnPropertyDescriptor(MeshButton3DDisablable.prototype, "isEnabled")!.set!.call(this, enable);
			if (enable)
				this._currentMesh.getScene().beginDirectAnimation(this._currentMesh, [this._disabledAnim], 5, 0);
			else
				this._currentMesh.getScene().beginDirectAnimation(this._currentMesh, [this._disabledAnim], 0, 5);
		}
	}

	public constructor(mesh: Mesh, name: string, private descriptionRelativeRotation: Quaternion,
		private scaleOnEnter: number = 1, private pivot: Vector3 = Vector3.Zero(),
		private disabledRelativeRotation?: Quaternion) {
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
		this.pointerEnterAnimation = () => this._currentMesh.getScene().beginDirectAnimation(this._currentMesh, [this._descRotAnim, this._descScaleAnim], 0, 5);
		this.pointerOutAnimation = () => this._currentMesh.getScene().beginDirectAnimation(this._currentMesh, [this._descRotAnim, this._descScaleAnim], 5, 0);
	}

	public	clone():	Control3DClone {
		return {root: new ButtonWithDescription(cloneNodeWithScripts(this.mesh as Mesh) as Mesh, this.name + " clone", this.descriptionRelativeRotation, this.scaleOnEnter, this.pivot, this.disabledRelativeRotation), children: []};
	}
}
