import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Control3D, MeshButton3D, Vector3WithInfo } from "@babylonjs/gui";
import { IDisablable } from "../interfaces/idisablable";
import { Observer, Vector3 } from "@babylonjs/core";

export default class MeshButton3DDisablable extends MeshButton3D implements IDisablable {
	protected	_isEnabled:	boolean = true;

	private	_pointerEnterAnimation:	() => void;
	private	_pointerDownAnimation:	() => void;
	private	_pointerOutAnimation:	() => void;
	private	_pointerUpAnimation:	() => void;

	private static readonly	_dummyAnim:	() => void = () => {};

	private readonly	_onPointerUpObservers:	Observer<Vector3WithInfo>[] = [];
	private readonly	_onPointerDownObservers:	Observer<Vector3WithInfo>[] = [];
	private readonly	_onPointerEnterObservers:	Observer<Control3D>[] = [];
	private readonly	_onPointerOutObservers:	Observer<Control3D>[] = [];
	private readonly	_onPointerMoveObservers:	Observer<Vector3>[] = [];
	private readonly	_onPointerClickObservers:	Observer<Vector3WithInfo>[] = [];

	public constructor(mesh: Mesh, name?: string) {
		super(mesh, name);
		this._pointerEnterAnimation = this.pointerEnterAnimation;
		this._pointerDownAnimation = this.pointerDownAnimation;
		this._pointerOutAnimation = this.pointerOutAnimation;
		this._pointerUpAnimation = this.pointerUpAnimation;
	}

	public get	isEnabled():	boolean {
		return this._isEnabled;
	}

	public set	isEnabled(enable: boolean) {
		if (this._isEnabled != enable) {
			if (enable) {
				this.pointerEnterAnimation = this._pointerEnterAnimation;
				this.pointerOutAnimation = this._pointerOutAnimation;
				this.pointerDownAnimation = this._pointerDownAnimation;
				this.pointerUpAnimation = this._pointerUpAnimation;
				for (const obs of this._onPointerUpObservers)
					this.onPointerUpObservable.add(obs.callback, obs.mask, false, obs.scope, obs.unregisterOnNextCall);
				for (const obs of this._onPointerDownObservers)
					this.onPointerDownObservable.add(obs.callback, obs.mask, false, obs.scope, obs.unregisterOnNextCall);
				for (const obs of this._onPointerEnterObservers)
					this.onPointerEnterObservable.add(obs.callback, obs.mask, false, obs.scope, obs.unregisterOnNextCall);
				for (const obs of this._onPointerOutObservers)
					this.onPointerOutObservable.add(obs.callback, obs.mask, false, obs.scope, obs.unregisterOnNextCall);
				for (const obs of this._onPointerMoveObservers)
					this.onPointerMoveObservable.add(obs.callback, obs.mask, false, obs.scope, obs.unregisterOnNextCall);
				for (const obs of this._onPointerClickObservers)
					this.onPointerClickObservable.add(obs.callback, obs.mask, false, obs.scope, obs.unregisterOnNextCall);
			} else {
				this._pointerEnterAnimation = this.pointerEnterAnimation;
				this._pointerOutAnimation = this.pointerOutAnimation;
				this._pointerDownAnimation = this.pointerDownAnimation;
				this._pointerUpAnimation = this.pointerUpAnimation;
				this.pointerEnterAnimation = MeshButton3DDisablable._dummyAnim;
				this.pointerOutAnimation = MeshButton3DDisablable._dummyAnim;
				this.pointerDownAnimation = MeshButton3DDisablable._dummyAnim;
				this.pointerUpAnimation = MeshButton3DDisablable._dummyAnim;
				this._onPointerUpObservers.length = 0;
				this._onPointerUpObservers.push(...this.onPointerUpObservable.observers);
				this.onPointerUpObservable.clear();
				this._onPointerDownObservers.length = 0;
				this._onPointerDownObservers.push(...this.onPointerDownObservable.observers);
				this.onPointerDownObservable.clear();
				this._onPointerEnterObservers.length = 0;
				this._onPointerEnterObservers.push(...this.onPointerEnterObservable.observers);
				this.onPointerEnterObservable.clear();
				this._onPointerOutObservers.length = 0;
				this._onPointerOutObservers.push(...this.onPointerOutObservable.observers);
				this.onPointerOutObservable.clear();
				this._onPointerMoveObservers.length = 0;
				this._onPointerMoveObservers.push(...this.onPointerMoveObservable.observers);
				this.onPointerMoveObservable.clear();
				this._onPointerClickObservers.length = 0;
				this._onPointerClickObservers.push(...this.onPointerClickObservable.observers);
				this.onPointerClickObservable.clear();
			}
			this._isEnabled = enable;
		}
	}
}
