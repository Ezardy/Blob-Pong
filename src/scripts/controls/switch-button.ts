import { int, Mesh, Quaternion, Vector3, AbstractMesh, Animation, Color3 } from "@babylonjs/core";
import { IClonableControl3D } from "../interfaces/iclonablecontrol3d";
import { ISelectable } from "../interfaces/iselectable";
import { drawBoundingBox, updateBoundingBoxRecursively } from "../functions/bounding-box";
import { Control3DClone } from "../functions/typing-utils";
import { cloneNodeWithScripts } from "../functions/cloning";
import MeshButton3DDisablable from "./mesh-button-3d-disablable";

export default class SwitchButton3D extends MeshButton3DDisablable implements IClonableControl3D, ISelectable {
	public get	state() {
		return this._state;
	}
	
	private				_state:		int = 0;
	private readonly	_maxState:	int;

	public constructor(mesh: AbstractMesh, name: string,
		private state1DescriptionRotation: Quaternion,
		private state2Rotation: Quaternion, private state2DescriptionRotation: Quaternion,
		private pivot: Vector3 = Vector3.Zero(), private offset: Vector3 = Vector3.Zero(),
		private scaleOnEnter: number = 1,
		private state3Rotation?: Quaternion, private state3DescriptionRotation?: Quaternion) {
		const	dummy:	Mesh = new Mesh(mesh.name + " transform", mesh.getScene(), {parent: mesh.parent});
		dummy.position = mesh.position.clone();
		mesh.parent = dummy;
		mesh.position.setAll(0);
		updateBoundingBoxRecursively(mesh);
		updateBoundingBoxRecursively(dummy);
		super(dummy, name);

		mesh.setPivotPoint(pivot);

		if (!mesh.rotationQuaternion)
			mesh.rotationQuaternion = Quaternion.FromEulerVector(mesh.rotation);
		const	ir:		Quaternion = mesh.rotationQuaternion!.clone();
		const	d1r:	Quaternion = ir.multiply(state1DescriptionRotation);
		const	s2r:	Quaternion = ir.multiply(state2Rotation);
		const	d2r:	Quaternion = ir.multiply(state2DescriptionRotation);
		const	s3r:	Quaternion = ir.clone();
		const	d3r:	Quaternion = d1r.clone();
		const	scIn:	Vector3 = mesh.scaling.scale(scaleOnEnter);
		const	scOut:	Vector3 = mesh.scaling.clone();
		const	oIn:	Vector3 = mesh.position.add(offset);
		const	oOut:	Vector3 = mesh.position.clone();

		const	s1Anim:		Animation = new Animation(mesh.name + " s1", "rotationQuaternion", 30, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT);
		const	s2Anim:		Animation = new Animation(mesh.name + " s2", "rotationQuaternion", 30, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT);
		const	s3Anim:		Animation = new Animation(mesh.name + " s3", "rotationQuaternion", 30, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT);
		const	d1Anim:		Animation = new Animation(mesh.name + " d1", "rotationQuaternion", 30, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT);
		const	d2Anim:		Animation = new Animation(mesh.name + " d2", "rotationQuaternion", 30, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT);
		const	d3Anim:		Animation = new Animation(mesh.name + " d3", "rotationQuaternion", 30, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT);
		const	scInAnim:	Animation = new Animation(mesh.name + " scale", "scaling", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
		const	scOutAnim:	Animation = new Animation(mesh.name + " scale", "scaling", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
		const	oInAnim:	Animation = new Animation(mesh.name + " offsetting", "position", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
		const	oOutAnim:	Animation = new Animation(mesh.name + " offsetting", "position", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);

		if (state3Rotation && state3DescriptionRotation) {
			s3r.copyFrom(ir.multiply(state3Rotation));
			d3r.copyFrom(ir.multiply(state3DescriptionRotation));
			this._maxState = 3;
		} else
			this._maxState = 2;
		this.pointerEnterAnimation = () => {
			SwitchButton3D._setKeys(scInAnim, mesh.scaling, scIn);
			SwitchButton3D._setKeys(oInAnim, mesh.position, oIn);
			switch (this._state) {
				case 0:
					SwitchButton3D._setKeys(d1Anim, mesh.rotationQuaternion, d1r);
					mesh.getScene().beginDirectAnimation(mesh, [d1Anim, scInAnim, oInAnim], 0, 5);
					break;
				case 1:
					SwitchButton3D._setKeys(d2Anim, mesh.rotationQuaternion, d2r);
					mesh.getScene().beginDirectAnimation(mesh, [d2Anim, scInAnim, oInAnim], 0, 5);
					break;
				default:
					SwitchButton3D._setKeys(d3Anim, mesh.rotationQuaternion, d3r);
					mesh.getScene().beginDirectAnimation(mesh, [d3Anim, scInAnim, oInAnim], 0, 5);
					break;
			}
		};
		this.pointerOutAnimation = () => {
			SwitchButton3D._setKeys(oOutAnim, mesh.position, oOut);
			SwitchButton3D._setKeys(scOutAnim, mesh.scaling, scOut);
			switch (this._state) {
				case 0:
					SwitchButton3D._setKeys(s1Anim, mesh.rotationQuaternion, ir);
					mesh.getScene().beginDirectAnimation(mesh, [s1Anim, scOutAnim, oOutAnim], 0, 5);
					break;
				case 1:
					SwitchButton3D._setKeys(s2Anim, mesh.rotationQuaternion, s2r);
					mesh.getScene().beginDirectAnimation(mesh, [s2Anim, scOutAnim, oOutAnim], 0, 5);
					break;
				default:
					SwitchButton3D._setKeys(s3Anim, mesh.rotationQuaternion, s3r);
					mesh.getScene().beginDirectAnimation(mesh, [s3Anim, scOutAnim, oOutAnim], 0, 5);
					break;
			}
		};
		const	oldPointerDownAnimation = this.pointerDownAnimation.bind(this);
		this.pointerDownAnimation = () => {
			oldPointerDownAnimation();
		};
		const	oldPointerUpAnimation = this.pointerUpAnimation.bind(this);
		this.pointerUpAnimation = () => {
			SwitchButton3D._setKeys(oInAnim, mesh.position, oIn);
			SwitchButton3D._setKeys(scInAnim, mesh.scaling, scIn);
			switch (this._state) {
				case 0:
					SwitchButton3D._setKeys(d2Anim, mesh.rotationQuaternion, d2r);
					mesh.getScene().beginDirectAnimation(mesh, [d2Anim, scInAnim, oInAnim], 0, 5);
					break;
				case 1:
					SwitchButton3D._setKeys(d3Anim, mesh.rotationQuaternion, d3r);
					mesh.getScene().beginDirectAnimation(mesh, [d3Anim, scInAnim, oInAnim], 0, 5);
					break;
				default:
					SwitchButton3D._setKeys(d1Anim, mesh.rotationQuaternion, d1r);
					mesh.getScene().beginDirectAnimation(mesh, [d1Anim, scInAnim, oInAnim], 0, 5);
					break;
			}
			oldPointerUpAnimation();
			this._state = (this._state + 1) % this._maxState;
		};
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

	public	clone():	Control3DClone {
		const	dummyMesh:	Mesh = this.mesh as Mesh;
		const	actualMesh:	AbstractMesh = dummyMesh.getChildMeshes()[0] as AbstractMesh;
		actualMesh.position.set(dummyMesh.position.x, dummyMesh.position.y, dummyMesh.position.z);
		const	c:	SwitchButton3D = new SwitchButton3D(cloneNodeWithScripts(actualMesh) as Mesh, actualMesh.name, this.state1DescriptionRotation, this.state2Rotation, this.state2DescriptionRotation, this.pivot, this.offset, this.scaleOnEnter, this.state3Rotation, this.state3DescriptionRotation);
		actualMesh.position.setAll(0);
		return {root: c, children: []};
	}

	public	select():	void {
		if (this.state == 0) {
			this.pointerEnterAnimation();
			this.pointerDownAnimation();
			this.pointerUpAnimation();
			this.pointerOutAnimation();
		}
	}

	public	deselect():	void {
		while (this.state) {
			this.pointerEnterAnimation();
			this.pointerDownAnimation();
			this.pointerUpAnimation();
			this.pointerOutAnimation();
		}
	}
}
