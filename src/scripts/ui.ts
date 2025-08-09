import { Mesh, Node, Nullable, Quaternion } from "@babylonjs/core";
import { Container3D, GUI3DManager, MeshButton3D, StackPanel3D } from "@babylonjs/gui";
import { getScriptByClassForObject, IScript, visibleAsEntity } from "babylonjs-editor-tools";
import MeshControl from "./mesh-control";
import IconDrawer from "./icon-drawer";
import ButtonWithDescription from "./button-with-description";

export default class Ui implements IScript {
	// main layout elements
	@visibleAsEntity("node", "Join public game button mesh")
	private readonly	_joinPublicGameButtonMesh!:	Mesh;
	@visibleAsEntity("node", "Join private game button mesh")
	private readonly	_joinPrivateGameButtonMesh!:	Mesh;
	@visibleAsEntity("node", "Create game button mesh")
	private readonly	_createGameButtonMesh!:	Mesh;

	private readonly	_mainLayout:	StackPanel3D;

	// game list layout elements
	@visibleAsEntity("node", "game list previous button mesh")
	private readonly	_gameListPreviousButtonMesh!:		Mesh;
	@visibleAsEntity("node", "game list header mesh")
	private readonly	_gameListHeaderMesh!:			Mesh;
	@visibleAsEntity("node", "player count order button mesh")
	private readonly	_playerCountOrderButtonMesh!:	Mesh;
	@visibleAsEntity("node", "player count input mesh")
	private readonly	_playerCountInputMesh!:			Mesh;
	@visibleAsEntity("node", "entrance fee order button mesh")
	private readonly	_entranceFeeOrderButtonMesh!:	Mesh;
	@visibleAsEntity("node", "entrance fee input mesh")
	private readonly	_entranceFeeInputMesh!:			Mesh;
	@visibleAsEntity("node", "refresh button mesh")
	private readonly	_refreshButtonMesh!:			Mesh;
	@visibleAsEntity("node", "play button mesh")
	private readonly	_playButtonMesh!:				Mesh;
	@visibleAsEntity("node", "game name entry mesh")
	private readonly	_gameNameEntryMesh!:			Mesh;
	@visibleAsEntity("node", "player count entry mesh")
	private readonly	_playerCountEntryMesh!:			Mesh;
	@visibleAsEntity("node", "entrance fee entry mesh")
	private readonly	_entranceFeeEntryMesh!:			Mesh;

	private readonly	_gameListPreviousButtonHeaderPanel:	StackPanel3D;
	private readonly	_playerCountOrderButtonInputPanel:	StackPanel3D;
	private readonly	_entranceFeeOrderButtonInputPanel:	StackPanel3D;
	private readonly	_refreshPlayButtonPanel:			StackPanel3D;
	private readonly	_entryPanel:						StackPanel3D;
	private readonly	_gameListPanel:						StackPanel3D;
	private readonly	_gameListLayout:					StackPanel3D;

	private readonly	_manager:	GUI3DManager;

	public constructor(public node: Node) {
		this._manager = new GUI3DManager(this.node.getScene());

		// main layout initialization
		this._mainLayout = new StackPanel3D(true);

		// game list layout initialization
		this._gameListLayout = new StackPanel3D(true);
		this._gameListPreviousButtonHeaderPanel = new StackPanel3D(false);
		this._playerCountOrderButtonInputPanel = new StackPanel3D(false);
		this._entranceFeeOrderButtonInputPanel = new StackPanel3D(false);
		this._refreshPlayButtonPanel = new StackPanel3D(false);
		this._entryPanel = new StackPanel3D(false);
		this._gameListPanel = new StackPanel3D(true);
	}

	public onStart(): void {
		this._setMainLayout();
		this._setGameListLayout();

		this._setContainerVisibility(this._gameListLayout, false);
	}

	private	_setMainLayout():	void {
		this._manager.addControl(this._mainLayout);
		this._mainLayout.margin = 0.05;

		const	joinPublicGameButton:	MeshButton3D = new MeshButton3D(this._joinPublicGameButtonMesh, "joinPublicButton");
		const	joinPrivateGameButton:	MeshButton3D = new MeshButton3D(this._joinPrivateGameButtonMesh, "joinPrivateButton");
		const	createGameButton:		MeshButton3D = new MeshButton3D(this._createGameButtonMesh, "createGameButton");

		joinPublicGameButton.onPointerUpObservable.add(() => {
			this._setContainerVisibility(this._mainLayout, false);
			this._setContainerVisibility(this._gameListLayout, true);
		});
		
		this._mainLayout.blockLayout = true;
		this._mainLayout.addControl(createGameButton);
		this._mainLayout.addControl(joinPrivateGameButton);
		this._mainLayout.addControl(joinPublicGameButton);
		this._mainLayout.blockLayout = false;
	}

	private	_setGameListLayout():	void {
		this._manager.addControl(this._gameListLayout);
		this._gameListLayout.margin = 20;

		this._gameListLayout.blockLayout = true;
			this._gameListLayout.addControl(this._gameListPreviousButtonHeaderPanel);
			this._gameListPreviousButtonHeaderPanel.margin = 50;
			this._gameListPreviousButtonHeaderPanel.blockLayout = true;
				const	gameListPreviousButton:	ButtonWithDescription = new ButtonWithDescription(this._gameListPreviousButtonMesh, "game_list_previous_button", Quaternion.RotationYawPitchRoll(Math.PI / 4, 0 ,0));
				gameListPreviousButton.onPointerUpObservable.add(() => {
					this._setContainerVisibility(this._gameListLayout, false);
					this._setContainerVisibility(this._mainLayout, true);
				});
				this._gameListPreviousButtonHeaderPanel.addControl(gameListPreviousButton)
				this._gameListPreviousButtonHeaderPanel.addControl(new MeshControl(this._gameListHeaderMesh, "game_list_header"));
			this._gameListPreviousButtonHeaderPanel.blockLayout = false;
			this._gameListLayout.addControl(this._gameListPanel);
			this._gameListPanel.blockLayout = true;

			this._gameListPanel.blockLayout = false;
		this._gameListLayout.blockLayout = false;
	}

	private	_setContainerVisibility(container: Container3D, isVisible: boolean):	void {
		container.isVisible = isVisible
		for (const control of container.children) {
			control.isVisible = isVisible;
			if (control instanceof Container3D)
				this._setContainerVisibility(control, isVisible);
			else if (isVisible) {
				const	drawer:	Nullable<IconDrawer> = getScriptByClassForObject(control.mesh, IconDrawer);
				if (drawer != null)
					drawer.draw();
			}
		}
	}
}
