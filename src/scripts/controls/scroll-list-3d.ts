import { EventState, int, PointerEventTypes, PointerInfo, Scene, Vector3 } from "@babylonjs/core";
import { AdvancedStackPanel3D } from "./advanced-stack-panel-3d";
import { Control3D } from "@babylonjs/gui";
import { Control3DClone, JSONArray, JSONObject } from "../functions/typing-utils";
import { parentClones } from "../functions/cloning";

export default class ScrollList3D extends AdvancedStackPanel3D {
	private	_firstPos:		number = 0;
	private	_lastPos:		number = 0;
	private	_entries?:		JSONArray;
	private	_initialized:	boolean = false;

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
			const	minKey:	int = Math.min(this._extendSizes.keys().reduce((a, b) => Math.min(a, b)));
			const	maxKey:	int = Math.min(this._extendSizes.keys().reduce((a, b) => Math.max(a, b)));
			const	extendSize:	Vector3 = this._extendSizes.get(minKey)!;
			if (this.isVertical) {
				this._firstPos = this.children[maxKey].node!.position.y + extendSize.y;
				this._lastPos = this.children[minKey].node!.position.y - extendSize.y;
			} else {
				this._firstPos = this.children[minKey].node!.position.x - extendSize.x;
				this._lastPos = this.children[maxKey].node!.position.x + extendSize.x;
			}
			// Clip planes setting
		}
	}

	private	_scrollCallback(info: PointerInfo, state: EventState):	void {
		const	ev:	WheelEvent = info.event as WheelEvent
		const	speed:	number = 0.1;
		for (const control of this.children) {
			control.node?.position.addInPlaceFromFloats(0, ev.deltaY * speed, 0);
		}
	}
}
