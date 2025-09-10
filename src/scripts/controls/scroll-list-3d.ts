import { AbstractMesh, EventState, InstancedMesh, int, Mesh, PBRMaterial, Plane, PointerEventTypes, PointerInfo, Scene, Tools, Vector3 } from "@babylonjs/core";
import { AdvancedStackPanel3D } from "./advanced-stack-panel-3d";
import { Control3D } from "@babylonjs/gui";
import { Control3DClone, JSONArray, JSONObject } from "../functions/typing-utils";
import { parentClones } from "../functions/cloning";

export default class ScrollList3D extends AdvancedStackPanel3D {
	private	_firstPos:			number = 0;
	private	_lastPos:			number = 0;
	private	_scrollSum:			number = 0;
	private	_rollControls:		Array<Control3D> = [];
	private	_extendSize:		Vector3 = Vector3.Zero();
	private	_extendSizeKeys:	Array<int> = [];
	private	_index:				int = 0;
	private	_entries?:			JSONArray;
	private	_initialized:		boolean = false;

	private readonly	_callback: (info: PointerInfo, state: EventState) => void;

	constructor(isVertical: boolean, private readonly pageSize: int, private readonly fillerFunc: (entry: JSONObject, control: Control3D) => void, private readonly scene: Scene) {
		super(isVertical);
		this._callback = this._scrollCallback.bind(this);
		if (pageSize < 0)
			throw RangeError("page size must be greater than 0");
		scene.onPointerObservable.add(this._callback, PointerEventTypes.POINTERWHEEL);
	}

	public	fillList(entries: JSONArray):	void {
		const	bl:	boolean = this.blockLayout;
		if (!this._initialized) {
			this.blockLayout = true;
				for (let i = 0; i < this.pageSize; i += 1) {
					const	clones:	Control3DClone = (<AdvancedStackPanel3D>this.children[0]).clone();
					super.addControl(clones.root);
					parentClones(clones);
				}
				if (this.isVertical)
					this.children.push(this.children.shift()!);
			this.blockLayout = bl;
		}
		this._entries = entries;
		let	i:	number;
		let	lastPos:	int = Math.min(entries.length, this.children.length);
		if (this.isVertical) {
			let	j:	number = 0;
			lastPos = this.children.length - lastPos - 1;
			for (i = this.children.length - 1; i > lastPos; i -= 1, j += 1) {
				this.fillerFunc(entries[j], this.children[i]);
				this.children[i].isVisible = true;
			}
			for (; i >= 0; i -= 1)
				this.children[i].isVisible = false;
		} else {
			for (i = 0; i < lastPos; i += 1) {
				this.fillerFunc(entries[i], this.children[i]);
				this.children[i].isVisible = true;
			}
			for (; i < this.children.length; i += 1)
				this.children[i].isVisible = false;
		}
		if (!bl)
			this._arrangeChildren();
	}

	public override	addControl(control: AdvancedStackPanel3D):	ScrollList3D {
		if (this.children.length == 0) {
			super.addControl(control);
		}
		return this;
	}

	public override get	isVisible():	boolean {
		return this._isVisible;
	}
	
	public override set	isVisible(value: boolean) {
		if (this._isVisible != value) {
			Object.getOwnPropertyDescriptor(AdvancedStackPanel3D.prototype, "isVisible")!.set!.call(this, value);
			if (value) {
				this.scene.onPointerObservable.add(this._callback, PointerEventTypes.POINTERWHEEL);
				const	entLen:	int = Math.min(this._entries ? this._entries.length : 0, this.children.length);
				const	len:	int = this.children.length - entLen;
				for (let i = 0; i < len; i += 1)
					this.children[i].isVisible = false;
			} else
				this.scene.onPointerObservable.removeCallback(this._callback);
		}
	}

	protected override	_arrangeChildren():	void {
		super._arrangeChildren();
		if (!this._initialized) {
			this._initialized = true;
			this._index = 0;
			this._extendSizeKeys = Array.from(this._extendSizes.keys());
			for (const i of this._extendSizeKeys)
				this._rollControls.push(this.children[i]);
			this._extendSize.copyFrom(this._extendSizes.get(this._extendSizeKeys[0])!);
			if (this.isVertical) {
				this._firstPos = this._rollControls[this._rollControls.length - 1].position.y + this._extendSize.y * 2 + this.margin;
				this._lastPos = this._rollControls[0].position.y - this._extendSize.y * 2 - this.margin;
			} else {
				this._firstPos = this._rollControls[0].position.x - this._extendSize.x * 2 - this.margin;
				this._lastPos = this._rollControls[this._rollControls.length - 1].position.x + this._extendSize.x * 2 + this.margin;
			}
			Tools.SetImmediate(() => {
				const	vv:			{min: Vector3, max: Vector3} = this.isVertical ? this.node!.getHierarchyBoundingVectors(true, m => !m.isDescendantOf(this._rollControls[0].node!)) : this.node!.getHierarchyBoundingVectors(true, m => !m.isDescendantOf(this._rollControls[this._rollControls.length - 1].node!));
				let		startPlane:	Plane;
				let		endPlane:	Plane;
				if (this.isVertical) {
					startPlane = new Plane(0, 1, 0, -vv.max.y);
					endPlane = new Plane(0, -1, 0, vv.min.y);
				} else {
					startPlane = new Plane(-1, 0, 0, vv.min.x);
					endPlane = new Plane(1, 0, 0, -vv.max.x);
				}
				for (const mesh of this.node!.getChildMeshes(false, n => n instanceof AbstractMesh && n.material != null)) {
					if (mesh instanceof InstancedMesh) {
						mesh.sourceMesh.material!.clipPlane = startPlane;
						mesh.sourceMesh.material!.clipPlane2 = endPlane;
					} else {
						mesh.material!.clipPlane = startPlane;
						mesh.material!.clipPlane2 = endPlane;
					}
				}
			});
		}
	}

	private	_scrollCallback(info: PointerInfo, state: EventState):	void {
		const	ev:	WheelEvent = info.event as WheelEvent
		const	speed:	number = 15;
		if (this._entries
			&& ((ev.deltaY > 0 && this._index + this.pageSize < this._entries.length)
				|| (ev.deltaY < 0 && (this._index || this._scrollSum > 0)))) {
			this._scrollSum += ev.deltaY;
			for (const controlIndex of Array.from(this._extendSizes.keys())) {
				const control = this.children[controlIndex];
				if (this.isVertical)
					control.position.addInPlaceFromFloats(0, Math.sign(ev.deltaY) * speed, 0);
				else
					control.position.addInPlaceFromFloats(-Math.sign(ev.deltaY) * speed, 0, 0);
			}
			const	lastIndex:	int = this._rollControls.length - 1;
			if (this.isVertical) {
				if (ev.deltaY > 0 && this._rollControls[lastIndex].position.y > this._firstPos) {
					this._rollControls[lastIndex].position.y = this._rollControls[0].position.y - this._extendSize.y * 2 - this.margin;
					this._rollControls.unshift(this._rollControls.pop()!);
					const	i:	int = ++this._index + this.pageSize;
					if (i < this._entries.length)
						this.fillerFunc(this._entries[i], this._rollControls[0]);
				} else if (ev.deltaY < 0 && this._rollControls[0].position.y < this._lastPos) {
					this._rollControls[0].position.y = this._rollControls[lastIndex].position.y + this._extendSize.y * 2 + this.margin;
					this._rollControls.push(this._rollControls.shift()!);
					this.fillerFunc(this._entries[--this._index], this._rollControls[lastIndex]);
				}
			} else {
				if (ev.deltaY > 0 && this._rollControls[0].position.x < this._firstPos) {
					this._rollControls[0].position.x = this._rollControls[lastIndex].position.x + this._extendSize.x * 2 + this.margin;
					this._rollControls.push(this._rollControls.shift()!);
					const	i:	int = ++this._index + this.pageSize;
					if (i < this._entries.length)
						this.fillerFunc(this._entries[i], this._rollControls[lastIndex]);
				} else if (ev.deltaY < 0 && this._rollControls[lastIndex].position.x > this._lastPos) {
					this._rollControls[lastIndex].position.x = this._rollControls[0].position.x - this._extendSize.x * 2 + this.margin;
					this._rollControls.unshift(this._rollControls.pop()!);
					this.fillerFunc(this._entries[--this._index], this._rollControls[0]);
				}
			}
		}
	}
}
