import { Mesh, Quaternion, Animation, Vector3, Space } from "@babylonjs/core";
import { IClonableControl3D } from "../interfaces/iclonablecontrol3d";
import { IDisablable } from "../interfaces/idisablable";
import { updateBoundingBoxRecursively } from "../functions/bounding-box";
import { Control3DClone } from "../functions/typing-utils";
import { cloneNodeWithScripts } from "../functions/cloning";
import MeshButton3DDisablable from "./mesh-button-3d-disablable";
import { Control } from "@babylonjs/gui";

export default class ButtonWithDescription extends MeshButton3DDisablable implements IClonableControl3D, IDisablable {
	private readonly	_disAnim:			Animation;
	private readonly	_disabledRotation:	Quaternion;
	private readonly	_descOutAnim:		Animation;
	private readonly	_initialRotation:	Quaternion;

	public override get	isEnabled():	boolean {
		return this._isEnabled;
	}

	public override set	isEnabled(enable: boolean) {
		if (this._isEnabled != enable) {
			Object.getOwnPropertyDescriptor(MeshButton3DDisablable.prototype, "isEnabled")!.set!.call(this, enable);
			if (enable) {
				ButtonWithDescription._setKeys(this._descOutAnim, this._currentMesh.rotationQuaternion, this._initialRotation);
				this._currentMesh.getScene().beginDirectAnimation(this._currentMesh, [this._descOutAnim], 0, 5);
			} else {
				ButtonWithDescription._setKeys(this._disAnim, this._currentMesh.rotationQuaternion, this._disabledRotation);
				this._currentMesh.getScene().beginDirectAnimation(this._currentMesh, [this._disAnim], 0, 5);
			}
		}
	}

	public constructor(mesh: Mesh, name: string, private descriptionRelativeRotation: Quaternion,
		private scaleOnEnter: number = 1, private pivot: Vector3 = Vector3.Zero(),
		private disabledRelativeRotation?: Quaternion, description?: Control) {
		super(mesh, name);
		description && (description.isVisible = false);
		updateBoundingBoxRecursively(mesh);
		mesh.setPivotPoint(pivot, Space.LOCAL);
		this._initialRotation = mesh.rotationQuaternion ? mesh.rotationQuaternion.clone() : Quaternion.FromEulerVector(mesh.rotation);
		if (!disabledRelativeRotation)
			disabledRelativeRotation = this._initialRotation;
		this._disabledRotation = this._initialRotation.multiply(disabledRelativeRotation);
		const	endRotation:			Quaternion = this._initialRotation.multiply(descriptionRelativeRotation);
		const	initialScale:			Vector3 = mesh.scaling.clone();
		const	descScale:				Vector3 = initialScale.scale(scaleOnEnter);

		const	descInAnim:	Animation = new Animation(name + " desc in rot", "rotationQuaternion", 30, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
		this._descOutAnim = new Animation(name + " desc out rot", "rotationQuaternion", 30, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
		const	scInAnim:	Animation = new Animation(name + " sc in", "scaling", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
		const	scOutAnim:	Animation = new Animation(name + " sc out", "scaling", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
		this._disAnim = new Animation(name + " disabling", "rotationQuaternion", 30, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT, false);

		this.pointerEnterAnimation = () =>  {
			description && (description.isVisible = true);
			ButtonWithDescription._setKeys(descInAnim, mesh.rotationQuaternion, endRotation);
			ButtonWithDescription._setKeys(scInAnim, mesh.scaling, descScale);
			this._currentMesh.getScene().beginDirectAnimation(this._currentMesh, [descInAnim, scInAnim], 0, 5);
		};
		this.pointerOutAnimation = () => {
			ButtonWithDescription._setKeys(this._descOutAnim, mesh.rotationQuaternion, this._initialRotation);
			ButtonWithDescription._setKeys(scOutAnim, mesh.scaling, initialScale);
			this._currentMesh.getScene().beginDirectAnimation(this._currentMesh, [this._descOutAnim, scOutAnim], 0, 5).onAnimationEndObservable.addOnce(() => description && (description.isVisible = false));
		};
		description && (description.isVisible = false);
	}

	public	clone():	Control3DClone {
		return {root: new ButtonWithDescription(cloneNodeWithScripts(this.mesh as Mesh) as Mesh, this.name + " clone", this.descriptionRelativeRotation, this.scaleOnEnter, this.pivot, this.disabledRelativeRotation), children: []};
	}

	private static	_setKeys(anim: Animation, start: any, end: any) {
		anim.setKeys([{
			frame: 0,
			value: start
		}, {
			frame: 5,
			value: end
		}]);
	}
}
