import { int, Mesh, Quaternion, Animation as BAnimation, Vector3, Axis, MeshBuilder, BoundingInfo } from "@babylonjs/core";
import { MeshButton3D } from "@babylonjs/gui";

export default class SwitchButton3D extends MeshButton3D {
	public get	state() {
		return this._state;
	}
	
	private				_state:		int = 0;
	private readonly	_maxState:	int;

	public constructor(mesh: Mesh, name: string,
		state1DescriptionRotation: Quaternion,
		state2Rotation: Quaternion, state2DescriptionRotation: Quaternion,
		pivot: Vector3 = Vector3.Zero(), offset: Vector3 = Vector3.Zero(),
		scaleOnEnter: number = 1,
		state3Rotation?: Quaternion, state3DescriptionRotation?: Quaternion) {
		const	dummy:	Mesh = new Mesh(mesh.name + " transform", mesh.getScene(), {parent: mesh.parent});
		dummy.position = mesh.position.clone();
		dummy.setBoundingInfo(new BoundingInfo(mesh.getBoundingInfo().boundingBox.minimumWorld, mesh.getBoundingInfo().boundingBox.maximumWorld));
		mesh.setParent(dummy);
		mesh.position.setAll(0);
		super(dummy, name);

		mesh.setPivotPoint(pivot);

		const	ir:		Quaternion = mesh.rotationQuaternion!;
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
}
