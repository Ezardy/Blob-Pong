import { int, Mesh, Quaternion, Animation as BAnimation, Vector3, TmpVectors, AbstractMesh, InstancedMesh, BoundingInfo } from "@babylonjs/core";
import { Control3D, MeshButton3D } from "@babylonjs/gui";
import { cloneNodeWithScripts, IClonableControl3D } from "./clonning";
import { Control3DClone } from "./typing-utils";
import { updateBoundingBoxRecursively } from "./bounding-box";

export default class SwitchButton3D extends MeshButton3D implements IClonableControl3D {
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

		const	ir:		Quaternion = mesh.rotationQuaternion ? mesh.rotationQuaternion : Quaternion.FromEulerVector(mesh.rotation);
		const	d1r:	Quaternion = ir.multiply(state1DescriptionRotation);
		const	s2r:	Quaternion = ir.multiply(state2Rotation);
		const	d2r:	Quaternion = ir.multiply(state2DescriptionRotation);
		const	s3r:	Quaternion = ir;
		const	d3r:	Quaternion = ir;

		const	s1Anim:	BAnimation = new BAnimation(mesh.name + " s1", "rotationQuaternion", 30, BAnimation.ANIMATIONTYPE_QUATERNION, BAnimation.ANIMATIONLOOPMODE_CONSTANT);
		const	s2Anim:	BAnimation = new BAnimation(mesh.name + " s2", "rotationQuaternion", 30, BAnimation.ANIMATIONTYPE_QUATERNION, BAnimation.ANIMATIONLOOPMODE_CONSTANT);
		const	s3Anim:	BAnimation = new BAnimation(mesh.name + " s3", "rotationQuaternion", 30, BAnimation.ANIMATIONTYPE_QUATERNION, BAnimation.ANIMATIONLOOPMODE_CONSTANT);
		const	d1Anim:	BAnimation = new BAnimation(mesh.name + " d1", "rotationQuaternion", 30, BAnimation.ANIMATIONTYPE_QUATERNION, BAnimation.ANIMATIONLOOPMODE_CONSTANT);
		const	d2Anim:	BAnimation = new BAnimation(mesh.name + " d2", "rotationQuaternion", 30, BAnimation.ANIMATIONTYPE_QUATERNION, BAnimation.ANIMATIONLOOPMODE_CONSTANT);
		const	d3Anim:	BAnimation = new BAnimation(mesh.name + " d3", "rotationQuaternion", 30, BAnimation.ANIMATIONTYPE_QUATERNION, BAnimation.ANIMATIONLOOPMODE_CONSTANT);
		const	sAnim:	BAnimation = new BAnimation(mesh.name + " scale", "scaling", 30, BAnimation.ANIMATIONTYPE_VECTOR3, BAnimation.ANIMATIONLOOPMODE_CONSTANT);
		const	oAnim:	BAnimation = new BAnimation(mesh.name + " offsetting", "position", 30, BAnimation.ANIMATIONTYPE_VECTOR3, BAnimation.ANIMATIONLOOPMODE_CONSTANT);

		s1Anim.setKeys([{
			frame: 0,
			value: d1r
		}, {
			frame: 5,
			value: d2r
		}]);
		d1Anim.setKeys([{
			frame: 0,
			value: ir
		}, {
			frame: 5,
			value: d1r
		}]);
		d2Anim.setKeys([{
			frame: 0,
			value: s2r
		}, {
			frame: 5,
			value: d2r
		}]);
		d3Anim.setKeys([{
			frame: 0,
			value: s3r
		}, {
			frame: 5,
			value: d3r
		}]);
		sAnim.setKeys([{
			frame: 0,
			value: mesh.scaling
		}, {
			frame: 5,
			value: mesh.scaling.scale(scaleOnEnter)
		}]);
		oAnim.setKeys([{
			frame: 0,
			value: mesh.position
		}, {
			frame: 5,
			value: mesh.position.add(offset)
		}]);
		if (state3Rotation && state3DescriptionRotation) {
			this._maxState = 3;
			s3r.copyFrom(ir.multiply(state3Rotation));
			d3r.copyFrom(ir.multiply(state3DescriptionRotation));
			s2Anim.setKeys([{
				frame: 0,
				value: d2r
			}, {
				frame: 5,
				value: d3r
			}]);
			s3Anim.setKeys([{
				frame: 0,
				value: d3r
			}, {
				frame: 5,
				value: d1r
			}]);
		} else {
			this._maxState = 2;
			s2Anim.setKeys([{
				frame: 0,
				value: d2r
			}, {
				frame: 5,
				value: d1r
			}]);
		}
		this.pointerEnterAnimation = () => {
			switch (this._state) {
				case 0:
					mesh.getScene().beginDirectAnimation(mesh, [d1Anim, sAnim, oAnim], 0, 5);
					break;
				case 1:
					mesh.getScene().beginDirectAnimation(mesh, [d2Anim, sAnim, oAnim], 0, 5);
					break;
				default:
					mesh.getScene().beginDirectAnimation(mesh, [d3Anim, sAnim, oAnim], 0, 5);
					break;
			}
		};
		this.pointerOutAnimation = () => {
			switch (this._state) {
				case 0:
					mesh.getScene().beginDirectAnimation(mesh, [d1Anim, sAnim, oAnim], 5, 0);
					break;
				case 1:
					mesh.getScene().beginDirectAnimation(mesh, [d2Anim, sAnim, oAnim], 5, 0);
					break;
				default:
					mesh.getScene().beginDirectAnimation(mesh, [d3Anim, sAnim, oAnim], 5, 0);
					break;
			}
		};
		const	oldPointerDownAnimation = this.pointerDownAnimation.bind(this);
		this.pointerDownAnimation = () => {
			oldPointerDownAnimation();
		};
		const	oldPointerUpAnimation = this.pointerUpAnimation.bind(this);
		this.pointerUpAnimation = () => {
			switch (this._state) {
				case 0:
					mesh.getScene().beginDirectAnimation(mesh, [s1Anim], 0, 5);
					break;
				case 1:
					mesh.getScene().beginDirectAnimation(mesh, [s2Anim], 0, 5);
					break;
				default:
					mesh.getScene().beginDirectAnimation(mesh, [s1Anim], 0, 5);
					break;
			}
			oldPointerUpAnimation();
			this._state = (this._state + 1) % this._maxState;
		};
	}

	public	clone():	Control3DClone {
		const	dummyMesh:	Mesh = this.mesh as Mesh;
		const	actualMesh:	Mesh = dummyMesh.getChildMeshes()[0] as Mesh;
		actualMesh.position.set(dummyMesh.position.x, dummyMesh.position.y, dummyMesh.position.z);
		const	c:	SwitchButton3D = new SwitchButton3D(cloneNodeWithScripts(actualMesh) as Mesh, actualMesh.name, this.state1DescriptionRotation, this.state2Rotation, this.state2DescriptionRotation, this.pivot, this.offset, this.scaleOnEnter, this.state3Rotation, this.state3DescriptionRotation);
		actualMesh.position.setAll(0);
		return {root: c, children: []};
	}
}
