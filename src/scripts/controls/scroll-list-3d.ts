import { EventState, int, PointerEventTypes, PointerInfo, Vector3 } from "@babylonjs/core";
import { AdvancedStackPanel3D } from "./advanced-stack-panel-3d";
import { Control3D } from "@babylonjs/gui";
import { Control3DClone, JSONArray, JSONObject } from "../functions/typing-utils";
import { parentClones } from "../functions/cloning";

export default class ScrollList3D extends AdvancedStackPanel3D {
	private	_firstPos:		number = 0;
	private	_lastPos:		number = 0;
	private	_extendSize:	Vector3 = Vector3.Zero();
	private	_entries?:		JSONArray;
	private	_initialized:	boolean = false;

	private readonly	_callback: (info: PointerInfo, state: EventState) => void;

	constructor(isVertical: boolean, private readonly pageSize: int, private readonly fillerFunc: (entry: JSONObject, control: Control3D) => void) {
		super(isVertical);
		this._callback = this._scrollCallback.bind(this);
		if (!isVertical)
			throw Error("ScrollList3D horizontal mode is not implemented");
		if (pageSize < 0)
			throw RangeError("page size must be greater than 0");
		this.node?.getScene().onPointerObservable.add(this._callback, PointerEventTypes.POINTERWHEEL);
	}

	public	fillList(entries: JSONArray):	void {
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
		this._entries = entries;
		const	lastPos:	int = this.children.length - Math.min(entries.length, this.children.length) - 1;
		let	i:	number;
		let	j:	number = 0;
		for (i = this.children.length - 1; i > lastPos; i -= 1, j += 1) {
			this.fillerFunc(entries[j], this.children[i]);
			this.children[i].isVisible = true;
		}
		for (; i >= 0; i -= 1) {
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
				this.node?.getScene().onPointerObservable.add(this._callback, PointerEventTypes.POINTERWHEEL);
				const	entLen:	int = Math.min(this._entries ? this._entries.length : 0, this.children.length);
				const	len:	int = this.children.length - entLen;
				for (let i = 0; i < len; i += 1)
					this.children[i].isVisible = false;
			} else {
				this.node?.getScene().onPointerObservable.removeCallback(this._callback);
			}
		}
	}

	private	_scrollCallback(info: PointerInfo, state: EventState):	void {
		for (const control of this.children) {
			control.node?.position.addInPlaceFromFloats(0, 5, 0);
		}
	}
}
