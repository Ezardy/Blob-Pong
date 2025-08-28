import { EventState, int, PointerEventTypes, PointerInfo, Vector3 } from "@babylonjs/core";
import { AdvancedStackPanel3D } from "./advanced-stack-panel-3d";
import { Container3D, Control3D } from "@babylonjs/gui";
import { Control3DClone, JSONArray, JSONObject } from "./typing-utils";
import { parentClones } from "./clonning";

export default class ScrollList3D extends AdvancedStackPanel3D {
	private	_firstPos:		number = 0;
	private	_lastPos:		number = 0;
	private	_extendSize:	Vector3 = Vector3.Zero();
	private	_topIndex:		int = 0;
	private	_entries?:		JSONArray;
	private	_initialized:	boolean = false;

	constructor(isVertical: boolean, private readonly pageSize: int) {
		super(isVertical);
		if (pageSize < 0)
			throw RangeError("page size must be greater than 0");
		this.node?.getScene().onPointerObservable.add(this._scrollCallback);
	}

	public	fillList(entries: JSONArray, fillerFunc: (entry: JSONObject, control: Control3D) => void):	void {
		if (!this._initialized) {
			this._initialized = true;
			this.blockLayout = true;
				for (let i = 0; i < this.pageSize; i += 1) {
					const	clones:	Control3DClone = (<AdvancedStackPanel3D>this.children[0]).clone();
					super.addControl(clones.root);
					parentClones(clones);
				}
			this.blockLayout = false;
		}
		this._entries = entries;
		const	len:	int = Math.min(entries.length, this.children.length)
		let i;
		for (i = 0; i < len; i += 1) {
			fillerFunc(entries[i], this.children[i]);
			this.children[i].isVisible = true;
		}
		for (; i < this.children.length; i += 1)
			this.children[i].isVisible = false;
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
				this.node?.getScene().onPointerObservable.add(this._scrollCallback);
				for (let i = (this._entries ? this._entries.length : 0); i < this.children.length; i += 1)
					this.children[i].isVisible = false;
			} else
				this.node?.getScene().onPointerObservable.removeCallback(this._scrollCallback);
		}
	}

	private	_scrollCallback(info: PointerInfo, state: EventState) {
		if (info.type == PointerEventTypes.POINTERWHEEL) {
		}
	}
}
