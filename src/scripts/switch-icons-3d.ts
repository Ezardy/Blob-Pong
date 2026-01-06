import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { IRenderOnStart } from "./interfaces/irenderonstart";
import { IScript, visibleAsEntity, visibleAsNumber, visibleAsString, visibleAsVector3 } from "babylonjs-editor-tools";
import { MeshButton3D } from "@babylonjs/gui";
import { AbstractMesh, int, Animation, Animatable, Vector3, Quaternion, QuarticEase, AnimationKeyInterpolation, Nullable, Axis, Scene } from "@babylonjs/core";
import { updateBoundingBoxRecursively } from "./functions/bounding-box";
import { setKeys } from "./functions/animations";

export default class SwitchIcons3D extends MeshButton3D implements IScript, IRenderOnStart {
	@visibleAsEntity("node", "icon 1")
	private readonly	_icon1?:	AbstractMesh;
	@visibleAsString("icon1 descritpion", {multiline: true})
	private readonly	_desc1:		string = "";
	@visibleAsEntity("node", "icon 2")
	private readonly	_icon2?:	AbstractMesh;
	@visibleAsString("icon2 descritpion", {multiline: true})
	private readonly	_desc2:		string = "";
	@visibleAsEntity("node", "icon 3")
	private readonly	_icon3?:	AbstractMesh;
	@visibleAsString("icon3 descritpion", {multiline: true})
	private readonly	_desc3:		string = "";

	@visibleAsNumber("on pointer enter scale", {min: 1, max: 4})
	private readonly	_scale:	number = 1.3;
	@visibleAsVector3("on pointer enter offset")
	private readonly	_offset:	Vector3 = new Vector3(0, 0, -10);
	
	private				_isRendered:			boolean = false;
	private readonly	_icons:					Array<AbstractMesh> = [];
	private				_state:					int = 0;
	private				_onEnterAnimatable:		Nullable<Animatable> = null;
	private				_ready:					boolean = true;

	public constructor(private m: Mesh) {
		updateBoundingBoxRecursively(m);
		super(m, m.name);
	}

	public get	isRendered():	boolean {
		return this._isRendered;
	}

	public set	isRendered(value: boolean) { }

	public get	renderOnStart():	boolean {
		return true;
	}
	public set	renderOnStart(value: boolean) { }

	public get	state() {
		return this._state;
	}

	public get	maxState():	int {
		return this._icons.length;
	}
	
	public	render():	void {
		if (!this._isRendered) {
		const	icons:	Array<AbstractMesh | undefined> = [this._icon1, this._icon2, this._icon3];
		icons.forEach((i) => {
			if (i && i.parent == this.m) {
				this._icons.push(i);
				i.scaling.setAll(0.001);
				if (!i.rotationQuaternion)
					i.rotationQuaternion = Quaternion.FromEulerVector(i.rotation);
			}
		});
		if (this._icons.length)
			this._icons[0]?.scaling.setAll(1);
		if (!this.m.rotationQuaternion)
			this.m.rotationQuaternion = Quaternion.FromEulerVector(this.m.rotation);
			this._isRendered = true;
			const	scaleAnim:	Animation = new Animation(this.m.name + " scale anim", "scaling", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
			const	offsetAnim:	Animation = new Animation(this.m.name + " offset anim", "position", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
			const	pitch1Anim:	Animation = new Animation(this.m.name + " pitch1 anim", "rotationQuaternion", 30, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
			const	yaw1Anim:	Animation = new Animation(this.m.name + " yaw1 anim", "rotationQuaternion", 30, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
			const	pitch2Anim:	Animation = new Animation(this.m.name + " pitch2 anim", "rotationQuaternion", 30, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
			const	yaw2Anim:	Animation = new Animation(this.m.name + " yaw2 anim", "rotationQuaternion", 30, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
			const	vis1Anim:	Animation = new Animation(this.m.name + " vis1 anim", "scaling", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
			const	vis2Anim:	Animation = new Animation(this.m.name + " vis2 anim", "scaling", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
			setKeys(scaleAnim, this.m.scaling, this.m.scaling.scale(this._scale), 5);
			setKeys(offsetAnim, this.m.position, this.m.position.add(this._offset), 5);
			setKeys(pitch1Anim, Quaternion.Identity(), Quaternion.RotationAxis(Axis.X, Math.PI), 15);
			setKeys(pitch2Anim, Quaternion.RotationAxis(Axis.X, -Math.PI), Quaternion.Identity(), 15);
			setKeys(yaw1Anim, Quaternion.Identity(), Quaternion.RotationAxis(Axis.Y, Math.PI), 15);
			setKeys(yaw2Anim, Quaternion.RotationAxis(Axis.Y, -Math.PI), Quaternion.Identity(), 15);
			vis1Anim.setKeys([{
				frame: 0,
				value: Vector3.One(),
				interpolation: AnimationKeyInterpolation.STEP
			}, {
				frame: 8,
				value: new Vector3(0.001, 0.001, 0.001),
				interpolation: AnimationKeyInterpolation.STEP
			}]);
			vis2Anim.setKeys([{
				frame: 0,
				value: new Vector3(0.001, 0.001, 0.001),
				interpolation: AnimationKeyInterpolation.STEP
			},{
				frame: 7,
				value: Vector3.One(),
				interpolation: AnimationKeyInterpolation.STEP
			}]);
			const	easeFunc:	QuarticEase = new QuarticEase();
			easeFunc.setEasingMode(QuarticEase.EASINGMODE_EASEINOUT);
			pitch1Anim.setEasingFunction(easeFunc);
			pitch2Anim.setEasingFunction(easeFunc);
			const	scene:	Scene = this.m.getScene();
			this.pointerEnterAnimation = () => {
				let	frame:	number = 0;
				if (this._onEnterAnimatable) {
					frame = this._onEnterAnimatable.masterFrame;
					this._onEnterAnimatable.stop();
				}
				this._onEnterAnimatable = scene.beginDirectAnimation(this.m, [scaleAnim, offsetAnim], frame, 5, false, 1, () => this._onEnterAnimatable = null);
			};
			this.pointerOutAnimation = () => {
				let	frame:	number = 5;
				if (this._onEnterAnimatable) {
					frame = this._onEnterAnimatable.masterFrame;
					this._onEnterAnimatable.stop();
				}
				this._onEnterAnimatable = scene.beginDirectAnimation(this.m, [scaleAnim, offsetAnim], frame, 0, false, 1, () => this._onEnterAnimatable = null);
			};
			const	oldAnim:	() => void = this.pointerUpAnimation.bind(this);
			this.pointerUpAnimation = () => {
				oldAnim();
				if (this._ready) {
					this._ready = false;
					const	target1:	AbstractMesh = this._icons[this._state];
					this._state = (this._state + 1) % this.maxState;
					const	target2:	AbstractMesh = this._icons[this._state];
					scene.beginDirectAnimation(target1, [pitch1Anim, vis1Anim], 0, 15);
					scene.beginDirectAnimation(target1.getChildTransformNodes(true)[0], [yaw1Anim], 0, 15);
					scene.beginDirectAnimation(target2, [pitch2Anim, vis2Anim], 0, 15);
					scene.beginDirectAnimation(target2.getChildTransformNodes(true)[0], [yaw2Anim], 0, 15, false, 1, () => this._ready = true);
				}
			};
		}
	}

	public	onStart():	void {
		this.render();
	}
}
