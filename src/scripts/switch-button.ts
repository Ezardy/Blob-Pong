import { int, Mesh, Quaternion, Animation as BAnimation } from "@babylonjs/core";
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
		state3Rotation?: Quaternion, state3DescriptionRotation?: Quaternion) {
		super(mesh, name);

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
					mesh.getScene().beginDirectAnimation(mesh, [d1Anim], 0, 5);
					break;
				case 1:
					mesh.getScene().beginDirectAnimation(mesh, [d2Anim], 0, 5);
					break;
				default:
					mesh.getScene().beginDirectAnimation(mesh, [d3Anim], 0, 5);
					break;
			}
		};
		this.pointerOutAnimation = () => {
			switch (this._state) {
				case 0:
					mesh.getScene().beginDirectAnimation(mesh, [d1Anim], 5, 0);
					break;
				case 1:
					mesh.getScene().beginDirectAnimation(mesh, [d2Anim], 5, 0);
					break;
				default:
					mesh.getScene().beginDirectAnimation(mesh, [d3Anim], 5, 0);
					break;
			}
		};
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
			this._state = (this._state + 1) % this._maxState;
		};
		this.pointerDownAnimation = () => {return;};
	}
}
