import { Axis, Mesh, Node, Quaternion, Vector3 } from "@babylonjs/core";
import { Container3D, GUI3DManager, MeshButton3D } from "@babylonjs/gui";
import { getScriptByClassForObject, IScript, visibleAsEntity } from "babylonjs-editor-tools";
import MeshControl from "./mesh-control";
import IconDrawer from "./icon-drawer";
import ButtonWithDescription from "./button-with-description";
import SwitchButton3D from "./switch-button";
import { AdvancedStackPanel3D } from "./advanced-stack-panel-3d";
import InputField3D from "./input-field";
import TextBlockDrawer from "./text-block";

export default class Ui implements IScript {
	// main layout elements
	@visibleAsEntity("node", "Join public game button mesh")
	private readonly	_joinPublicGameButtonMesh!:	Mesh;
	@visibleAsEntity("node", "Join private game button mesh")
	private readonly	_joinPrivateGameButtonMesh!:	Mesh;
	@visibleAsEntity("node", "Create game button mesh")
	private readonly	_createGameButtonMesh!:	Mesh;

	private readonly	_mainLayout:	AdvancedStackPanel3D;

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

	private readonly	_gameListPreviousButtonHeaderPanel:	AdvancedStackPanel3D;
	private readonly	_playerCountOrderButtonInputPanel:	AdvancedStackPanel3D;
	private readonly	_entranceFeeOrderButtonInputPanel:	AdvancedStackPanel3D;
	private readonly	_entryPanel:						AdvancedStackPanel3D;
	private readonly	_gameListControlPanel:				AdvancedStackPanel3D;
	private readonly	_gameListPanel:						AdvancedStackPanel3D;
	private readonly	_gameListLayout:					AdvancedStackPanel3D;

	private readonly	_manager:	GUI3DManager;

	public constructor(public node: Node) {
		this._manager = new GUI3DManager(this.node.getScene());

		// main layout initialization
		this._mainLayout = new AdvancedStackPanel3D(true, AdvancedStackPanel3D.CENTER_ALIGNMENT);

		// game list layout initialization
		this._gameListLayout = new AdvancedStackPanel3D(true, AdvancedStackPanel3D.START_ALIGNMENT);
		this._gameListControlPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._gameListPreviousButtonHeaderPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._playerCountOrderButtonInputPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._entranceFeeOrderButtonInputPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._entryPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._gameListPanel = new AdvancedStackPanel3D(true, AdvancedStackPanel3D.CENTER_ALIGNMENT);
	}

	public onStart(): void {
		this._setMainLayout();
		this._setGameListLayout();
		this._gameListLayout.isVisible = false;
	}

	private	_setMainLayout():	void {
		this._manager.addControl(this._mainLayout);
		this._mainLayout.margin = 0.05;

		const	joinPublicGameButton:	MeshButton3D = new MeshButton3D(this._joinPublicGameButtonMesh, "joinPublicButton");
		const	joinPrivateGameButton:	MeshButton3D = new MeshButton3D(this._joinPrivateGameButtonMesh, "joinPrivateButton");
		const	createGameButton:		MeshButton3D = new MeshButton3D(this._createGameButtonMesh, "createGameButton");

		joinPublicGameButton.onPointerUpObservable.add(() => {
			this._mainLayout.isVisible = false;
			this._gameListLayout.isVisible = true;
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
		this._gameListLayout.offset = 0;
		this._gameListLayout.blockLayout = true;
			this._setGameListPanel();
			this._setGameListControlPanel();
			this._setGameListPreviousButtonHeaderPanel();
		this._gameListLayout.blockLayout = false;
	}

	private	_setGameListPreviousButtonHeaderPanel():	void {
		getScriptByClassForObject(this._gameListHeaderMesh, TextBlockDrawer)?.draw();
		getScriptByClassForObject(this._gameListPreviousButtonMesh, TextBlockDrawer)?.draw();
		this._gameListLayout.addControl(this._gameListPreviousButtonHeaderPanel);
		this._gameListPreviousButtonHeaderPanel.margin = 5;
		this._gameListPreviousButtonHeaderPanel.blockLayout = true;
		const	prevBtnExtS:	Vector3 = this._gameListPreviousButtonMesh.getBoundingInfo().boundingBox.extendSize;
		const	gameListPreviousButton:	ButtonWithDescription = new ButtonWithDescription(this._gameListPreviousButtonMesh, "game_list_previous_button", Quaternion.RotationYawPitchRoll(-Math.PI / 4, 0 ,0), 1.5, new Vector3(prevBtnExtS.x, 0, -prevBtnExtS.z));
		gameListPreviousButton.onPointerUpObservable.add(() => {
			this._setContainerVisibility(this._gameListLayout, false);
			this._setContainerVisibility(this._mainLayout, true);
		});
		this._gameListPreviousButtonHeaderPanel.addControl(gameListPreviousButton)
		this._gameListPreviousButtonHeaderPanel.addControl(new MeshControl(this._gameListHeaderMesh, "game list header"));
		this._gameListPreviousButtonHeaderPanel.blockLayout = false;
	}

	private	_setGameListControlPanel():	void {
		getScriptByClassForObject(this._refreshButtonMesh, TextBlockDrawer)?.draw();
		getScriptByClassForObject(this._playButtonMesh, TextBlockDrawer)?.draw();
		this._gameListLayout.addControl(this._gameListControlPanel);
		this._gameListControlPanel.margin = 70;
		this._gameListControlPanel.blockLayout = true;
			this._setPlayerCountOrderButtonInputPanel();
			this._setEntranceFeeOrderButtonInputPanel();
			const	refreshButton:	ButtonWithDescription = new ButtonWithDescription(this._refreshButtonMesh, "refresh button", Quaternion.RotationAxis(Axis.Y, Math.PI / 4), 1.5);
			const	playButton:		ButtonWithDescription = new ButtonWithDescription(this._playButtonMesh, "play button", Quaternion.RotationAxis(Axis.Y, Math.PI / 4), 1.5, Vector3.Zero(), Quaternion.RotationYawPitchRoll(Math.PI / 4, Math.PI / 4, Math.PI / 4), false);
			this._gameListControlPanel.addControl(refreshButton);
			this._gameListControlPanel.addControl(playButton);
		this._gameListControlPanel.blockLayout = false;
	}

	private	_setPlayerCountOrderButtonInputPanel():	void {
		getScriptByClassForObject(this._playerCountOrderButtonMesh, TextBlockDrawer)?.draw();
		this._gameListControlPanel.addControl(this._playerCountOrderButtonInputPanel);
		this._playerCountOrderButtonInputPanel.margin = 0;
		this._playerCountOrderButtonInputPanel.blockLayout = true;
			const	playerCountOrderBtnExtS:	Vector3 = this._playerCountOrderButtonMesh.getBoundingInfo().boundingBox.extendSizeWorld.scale(1.5);
			const	playerCountOrderButton:	SwitchButton3D = new SwitchButton3D(this._playerCountOrderButtonMesh, "player count order button",
				Quaternion.RotationAxis(Axis.Y, -Math.PI / 4),
				Quaternion.RotationAxis(Axis.X, Math.PI), Quaternion.RotationYawPitchRoll(Math.PI / 3, Math.PI, 0),
				Vector3.Zero(), new Vector3(-playerCountOrderBtnExtS.x, 0, playerCountOrderBtnExtS.z), 1.5);
			this._playerCountOrderButtonInputPanel.addControl(playerCountOrderButton);
			const	input:				InputField3D = getScriptByClassForObject(this._playerCountInputMesh, InputField3D)!;
			input.draw();
			const	playerCountInput:	MeshControl = new MeshControl(this._playerCountInputMesh, "player count input", input.inputTextArea);
			input.parser = (s: string) => Number.parseFloat(s).toString();
			this._playerCountOrderButtonInputPanel.addControl(playerCountInput);
		this._playerCountOrderButtonInputPanel.blockLayout = false;
	}

	private	_setEntranceFeeOrderButtonInputPanel():	void {
		getScriptByClassForObject(this._entranceFeeOrderButtonMesh, TextBlockDrawer)?.draw();
		this._gameListControlPanel.addControl(this._entranceFeeOrderButtonInputPanel);
		this._entranceFeeOrderButtonInputPanel.margin = 1;
		this._entranceFeeOrderButtonInputPanel.blockLayout = true;
			const	entranceFeeOrderBtnExtS:	Vector3 = this._entranceFeeOrderButtonMesh.getBoundingInfo().boundingBox.extendSizeWorld.scale(1.5);
			const	entranceFeeOrderButton:	SwitchButton3D = new SwitchButton3D(this._entranceFeeOrderButtonMesh, "entrance fee order button",
				Quaternion.RotationAxis(Axis.Y, -Math.PI / 3.5),
				Quaternion.RotationAxis(Axis.Z, Math.PI), Quaternion.RotationYawPitchRoll(-Math.PI / 3.5, 0, Math.PI),
				Vector3.Zero(), new Vector3(-entranceFeeOrderBtnExtS.x, 0, entranceFeeOrderBtnExtS.z), 1.5,
			);
			this._entranceFeeOrderButtonInputPanel.addControl(entranceFeeOrderButton);
			const	input:				InputField3D = getScriptByClassForObject(this._entranceFeeInputMesh, InputField3D)!;
			input.draw();
			const	entranceFeeInput:	MeshControl = new MeshControl(this._entranceFeeInputMesh, "entrance fee input", input.inputTextArea);
			input.parser = (s: string) => Number.parseFloat(s).toString();
			this._entranceFeeOrderButtonInputPanel.addControl(entranceFeeInput);
		this._entranceFeeOrderButtonInputPanel.blockLayout = false;
	}

	private	_setGameListPanel():	void {
		this._gameListLayout.addControl(this._gameListPanel);
		this._gameListPanel.margin = 1;
		this._gameListPanel.blockLayout = true;

		this._gameListPanel.blockLayout = false;
	}

	private	_setContainerVisibility(container: Container3D, isVisible: boolean):	void {
		container.isVisible = isVisible
		for (const control of container.children) {
			control.isVisible = isVisible;
			if (control instanceof Container3D)
				this._setContainerVisibility(control, isVisible);
			else if (isVisible && control.mesh) {
				getScriptByClassForObject(control.mesh, IconDrawer)?.draw();
				for (const mesh of control.mesh.getChildMeshes(false)) {
					getScriptByClassForObject(mesh, IconDrawer)?.draw();
				}
			}
		}
	}
}
