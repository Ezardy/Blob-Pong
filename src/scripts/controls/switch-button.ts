import { int, Mesh, Quaternion, Vector3, AbstractMesh, Animation, Observer } from "@babylonjs/core";
import { IClonableControl3D } from "../interfaces/iclonablecontrol3d";
import { ISelectable } from "../interfaces/iselectable";
import { updateBoundingBoxRecursively } from "../functions/bounding-box";
import { Control3DClone } from "../functions/typing-utils";
import { cloneNodeWithScripts } from "../functions/cloning";
import MeshButton3DDisablable from "./mesh-button-3d-disablable";
import { setKeys } from "../functions/animations";
import { Vector3WithInfo } from "@babylonjs/gui";

export default class SwitchButton3D extends MeshButton3DDisablable implements IClonableControl3D, ISelectable {
	private static readonly	_dummyInfo:	Vector3WithInfo = new Vector3WithInfo(Vector3.Zero());

	public get	state() {
		return this._state;
	}

	public set	state(value: int) {
		while (this._state != value) {
			this._pointerEnterFunc();
			this._pointerDownFunc();
			this.onPointerUpObservable.notifyObserver(this._selectObserver, SwitchButton3D._dummyInfo);
			this._pointerUpFunc();
			this._pointerOutFunc();
		}
	}
	
	private				_state:		int = 0;
	private readonly	_maxState:	int;

	private readonly	_pointerEnterFunc: () => void;
	private readonly	_pointerOutFunc: () => void;
	private readonly	_pointerDownFunc: () => void;
	private readonly	_pointerUpFunc: () => void;
	private readonly	_selectObserver:	Observer<Vector3WithInfo>;

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
		this._pointerEnterFunc = () => {
			setKeys(scInAnim, mesh.scaling, scIn, 5);
			setKeys(oInAnim, mesh.position, oIn, 5);
			switch (this._state) {
				case 0:
					setKeys(d1Anim, mesh.rotationQuaternion, d1r, 5);
					mesh.getScene().beginDirectAnimation(mesh, [d1Anim, scInAnim, oInAnim], 0, 5);
					break;
				case 1:
					setKeys(d2Anim, mesh.rotationQuaternion, d2r, 5);
					mesh.getScene().beginDirectAnimation(mesh, [d2Anim, scInAnim, oInAnim], 0, 5);
					break;
				default:
					setKeys(d3Anim, mesh.rotationQuaternion, d3r, 5);
					mesh.getScene().beginDirectAnimation(mesh, [d3Anim, scInAnim, oInAnim], 0, 5);
					break;
			}
		};
		this.pointerEnterAnimation = this._pointerEnterFunc;
		this._pointerOutFunc = () => {
			setKeys(oOutAnim, mesh.position, oOut, 5);
			setKeys(scOutAnim, mesh.scaling, scOut, 5);
			switch (this._state) {
				case 0:
					setKeys(s1Anim, mesh.rotationQuaternion, ir, 5);
					mesh.getScene().beginDirectAnimation(mesh, [s1Anim, scOutAnim, oOutAnim], 0, 5);
					break;
				case 1:
					setKeys(s2Anim, mesh.rotationQuaternion, s2r, 5);
					mesh.getScene().beginDirectAnimation(mesh, [s2Anim, scOutAnim, oOutAnim], 0, 5);
					break;
				default:
					setKeys(s3Anim, mesh.rotationQuaternion, s3r, 5);
					mesh.getScene().beginDirectAnimation(mesh, [s3Anim, scOutAnim, oOutAnim], 0, 5);
					break;
			}
		};
		this.pointerOutAnimation = this._pointerOutFunc;
		this._pointerDownFunc = this.pointerDownAnimation.bind(this);
		this.pointerDownAnimation = this._pointerDownFunc;
		const	oldPointerUpAnimation = this.pointerUpAnimation.bind(this);
		this._selectObserver = this.onPointerUpObservable.add(() => this._state = (this._state + 1) % this._maxState);
		this._pointerUpFunc = () => {
			setKeys(oInAnim, mesh.position, oIn, 5);
			setKeys(scInAnim, mesh.scaling, scIn, 5);
			switch (this._state) {
				case 1:
					setKeys(d2Anim, mesh.rotationQuaternion, d2r, 5);
					mesh.getScene().beginDirectAnimation(mesh, [d2Anim, scInAnim, oInAnim], 0, 5);
					break;
				case 2:
					setKeys(d3Anim, mesh.rotationQuaternion, d3r, 5);
					mesh.getScene().beginDirectAnimation(mesh, [d3Anim, scInAnim, oInAnim], 0, 5);
					break;
				default:
					setKeys(d1Anim, mesh.rotationQuaternion, d1r, 5);
					mesh.getScene().beginDirectAnimation(mesh, [d1Anim, scInAnim, oInAnim], 0, 5);
					break;
			}
			oldPointerUpAnimation();
		};
		this.pointerUpAnimation = this._pointerUpFunc;
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
		this.state = 1;
	}

	public	deselect():	void {
		this.state = 0;
	}
}
