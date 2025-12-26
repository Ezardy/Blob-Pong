import { AbstractMesh, EventState, InstancedMesh, int, Plane, PointerEventTypes, PointerInfo, Scene, Tools, TransformNode, Vector3 } from "@babylonjs/core";
import { AdvancedStackPanel3D } from "./advanced-stack-panel-3d";
import { Control3D } from "@babylonjs/gui";
import { Control3DClone, JSONArray, JSONObject } from "../functions/typing-utils";
import { parentClones } from "../functions/cloning";
import { getScriptByClassForObject } from "babylonjs-editor-tools";
import IconDrawer from "../icon-drawer";

export default class ScrollList3D extends AdvancedStackPanel3D {
	private	_preFirstPos:		number = 0;
	private	_lastPos:			number = 0;
	private	_extendSize:		Vector3 = Vector3.Zero();
	private	_extendSizeKeys:	Array<int> = [];

	protected	_initialized:		boolean = false;
	protected	_entries?:		JSONArray;
	protected	_index:			int = 0;
	protected	_rollControls:	Array<Control3D> = [];

	private readonly	_callback: (info: PointerInfo, state: EventState) => void;

	constructor(isVertical: boolean, protected readonly pageSize: int, private readonly fillerFunc: (entry: JSONObject, control: Control3D) => void, protected readonly scene: Scene) {
		super(isVertical);
		this._callback = this._scrollCallback.bind(this);
		if (pageSize < 0)
			throw RangeError("page size must be greater than 0");
		scene.onPointerObservable.add(this._callback, PointerEventTypes.POINTERWHEEL);
	}

	public	initialize():	void {
		const	bl:	boolean = this.blockLayout;
		if (!this._initialized) {
			this._initialized = true;
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
	}

	public	fillList(entries: JSONArray):	void {
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
		this._arrangeChildren();
		this._index = 0;
		this._extendSizeKeys = Array.from(this._extendSizes.keys());
		while (this._rollControls.length) this._rollControls.pop();
		const	s:	int = Math.min(entries.length, this.pageSize + 1);
		for (let i = 0; i < s; i += 1)
			this._rollControls.push(this.children[this._extendSizeKeys[i]]);
		this._extendSize.copyFrom(this._extendSizes.get(this._extendSizeKeys[0])!);
		if (this.isVertical) {
			this._preFirstPos = this._rollControls[this._rollControls.length - 1].position.y + this._extendSize.y * 2 + this.margin;
			this._lastPos = this._rollControls[0].position.y;
		} else {
			this._preFirstPos = this._rollControls[0].position.x - this._extendSize.x * 2 - this.margin;
			this._lastPos = this._rollControls[this._rollControls.length - 1].position.x;
		}
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
			this._isVisible = value;
			if (value) {
				this.scene.onPointerObservable.add(this._callback, PointerEventTypes.POINTERWHEEL);
				const	entLen:	int = Math.min(this._entries ? this._entries.length : 0, this.children.length);
				const	len:	int = (this.isVertical ? this.children.length - entLen : 0) - 1;
				for (let i = (this.isVertical ? this.children.length : entLen) - 1; i > len; i -= 1) {
					const	child:	Control3D = this.children[i];
					child.isVisible = true;
					if (child.mesh) {
						Tools.SetImmediate(() => getScriptByClassForObject(child.mesh, IconDrawer)?.render());
						for (const childOfChild of child.mesh.getChildMeshes())
							Tools.SetImmediate(() => getScriptByClassForObject(childOfChild, IconDrawer)?.render());
					}
				}
			} else {
				this.scene.onPointerObservable.removeCallback(this._callback);
				for (const child of this.children)
					child.isVisible = false;
			}
		}
	}

	public	setClipped(value: boolean):	void {
		if (value) {
			const	lastControlNode:	TransformNode = this.isVertical ? this._rollControls[0].node! : this._rollControls[this._rollControls.length - 1].node!;
			const	vv:					{min: Vector3, max: Vector3} = this._entries && this._entries.length > this.pageSize ? this.node!.getHierarchyBoundingVectors(true, m => !m.isDescendantOf(lastControlNode)) : this.node!.getHierarchyBoundingVectors();
			let		startPlane:			Plane;
			let		endPlane:			Plane;
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
		} else {
			for (const mesh of this.node!.getChildMeshes(false, n => n instanceof AbstractMesh && n.material != null)) {
				if (mesh instanceof InstancedMesh) {
					mesh.sourceMesh.material!.clipPlane = null;
					mesh.sourceMesh.material!.clipPlane2 = null;
				} else {
					mesh.material!.clipPlane = null;
					mesh.material!.clipPlane2 = null;
				}
			}
		}
	}

	private	_scrollCallback(info: PointerInfo, state: EventState):	void {
		const	ev:	WheelEvent = info.event as WheelEvent
		const	speed:	number = 15;
		const	lastIndex:	int = this._rollControls.length - 1;
		if (this._entries && this._entries.length > this.pageSize) {
			if (this.isVertical) {
				if (ev.deltaY > 0) {
					if (this._rollControls[lastIndex].position.y + speed <= this._preFirstPos) {
						for (const controlIndex of this._extendSizeKeys)
							this.children[controlIndex].position.y += speed;
					} else if (this._index + this.pageSize < this._entries.length - 1) {
						for (const controlIndex of this._extendSizeKeys)
							this.children[controlIndex].position.y += speed;
						this._rollControls[lastIndex].position.y = this._rollControls[0].position.y - this._extendSize.y * 2 - this.margin;
						this._rollControls.unshift(this._rollControls.pop()!);
						this.fillerFunc(this._entries[++this._index + this.pageSize], this._rollControls[0]);
					}
				} else {
					if (this._rollControls[0].position.y - speed >= this._lastPos) {
						for (const controlIndex of this._extendSizeKeys)
							this.children[controlIndex].position.y -= speed;
					} else if (this._index > 0) {
						for (const controlIndex of this._extendSizeKeys)
							this.children[controlIndex].position.y -= speed;
						this._rollControls[0].position.y = this._rollControls[lastIndex].position.y + this._extendSize.y * 2 + this.margin;
						this._rollControls.push(this._rollControls.shift()!);
						this.fillerFunc(this._entries[--this._index], this._rollControls[lastIndex]);
					}
				}
			} else {
				if (ev.deltaY > 0) {
					if (this._rollControls[0].position.x - speed >= this._preFirstPos) {
						for (const controlIndex of this._extendSizeKeys)
							this.children[controlIndex].position.x -= speed;
					} else if (this._index + this.pageSize < this._entries.length - 1) {
						for (const controlIndex of this._extendSizeKeys)
							this.children[controlIndex].position.x -= speed;
						this._rollControls[0].position.x = this._rollControls[lastIndex].position.x + this._extendSize.x * 2 + this.margin;
						this._rollControls.push(this._rollControls.shift()!);
						this.fillerFunc(this._entries[++this._index + this.pageSize], this._rollControls[lastIndex]);
					}
				} else {
					if (this._rollControls[lastIndex].position.x + speed <= this._lastPos) {
						for (const controlIndex of this._extendSizeKeys)
							this.children[controlIndex].position.x += speed;
					} else if (this._index > 0) {
						for (const controlIndex of this._extendSizeKeys)
							this.children[controlIndex].position.x += speed;
						this._rollControls[lastIndex].position.x = this._rollControls[0].position.x - this._extendSize.x * 2 + this.margin;
						this._rollControls.unshift(this._rollControls.pop()!);
						this.fillerFunc(this._entries[--this._index], this._rollControls[0]);
					}
				}
			}
		}
	}
}
