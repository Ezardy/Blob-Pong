import { AbstractMesh, Axis, Mesh, Nullable, Quaternion, Scene, Vector3 } from "@babylonjs/core";
import { AbstractButton3D, Container3D, Control3D, GUI3DManager, InputTextArea, MeshButton3D } from "@babylonjs/gui";
import { getScriptByClassForObject, IScript, visibleAsEntity } from "babylonjs-editor-tools";
import InputField3D from "./input-field";
import TextBlockDrawer from "./text-block";
import { ISelectable } from "./interfaces/iselectable";
import { AdvancedStackPanel3D } from "./controls/advanced-stack-panel-3d";
import ScrollRaioList3D from "./controls/scroll-radio-list";
import SwitchButton3D from "./controls/switch-button";
import ButtonWithDescription from "./controls/button-with-description";
import MeshControl from "./controls/mesh-control";
import { ServerGame } from "./web-api/server-game";
import { JSONArray } from "./functions/typing-utils";
import { throws } from "assert";

export default class Ui implements IScript {
	private readonly	_manager:	GUI3DManager;

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
	private readonly	_gameListScroll:					ScrollRaioList3D;
	private readonly	_gameListLayout:					AdvancedStackPanel3D;

	// game creation layout elements
	@visibleAsEntity("node", "game creation header mesh")
	private readonly	_gameCreationHeaderMesh!:	Mesh;
	@visibleAsEntity("node", "game creation previous button mesh")
	private readonly	_gameCreationPreviousButtonMesh!:	Mesh;
	@visibleAsEntity("node", "game creation game name input mesh")
	private readonly	_gameCreationGameNameInputMesh!:	Mesh;
	@visibleAsEntity("node", "game creation player count input mesh")
	private readonly	_gameCreationPlayerCountInputMesh!:	Mesh;
	@visibleAsEntity("node", "game creation entrance fee input mesh")
	private readonly	_gameCreationEntranceFeeInputMesh!:	Mesh;
	@visibleAsEntity("node", "create button mesh")
	private readonly	_createButtonMesh!:	Mesh;

	private				_gameCreationGameNameInput!:				InputTextArea;
	private				_gameCreationEntranceFeeInput!:			InputTextArea;
	private				_gameCreationPlayerCountInput!:			InputTextArea;

	private readonly	_gameCreationLayout:					AdvancedStackPanel3D;
	private readonly	_gameCreationPreviousButtonHeaderPanel:	AdvancedStackPanel3D;
	private readonly	_gameCreationPlayerCountInputPanel:		AdvancedStackPanel3D;
	private readonly	_gameCreationEntranceFeeInputPanel:		AdvancedStackPanel3D;
	private readonly	_createPanel:							AdvancedStackPanel3D;

	private _serverGame:	ServerGame;

	public constructor(public scene: Scene) {
		this._manager = new GUI3DManager(scene);

		// main layout initialization
		this._mainLayout = new AdvancedStackPanel3D(true, AdvancedStackPanel3D.CENTER_ALIGNMENT);

		// game list layout initialization
		this._gameListLayout = new AdvancedStackPanel3D(true, AdvancedStackPanel3D.START_ALIGNMENT);
		this._gameListControlPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._gameListPreviousButtonHeaderPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._playerCountOrderButtonInputPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._entranceFeeOrderButtonInputPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._entryPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._gameListScroll = new ScrollRaioList3D(true, 5, (entry, control) => {
			const	meshes:	AbstractMesh[] = control.node!.getChildMeshes(true);
			const	playerCountDrawer:	TextBlockDrawer = getScriptByClassForObject(meshes.find((value) => value.name == "instance of player count entry mesh" || value.name == "player count entry mesh"), TextBlockDrawer)!;
			const	playerCount = (entry.players as JSONArray).length;
			playerCountDrawer.frontTextBlock.text = playerCount + '/' + entry.maxPlayers;
			const	entranceFeeDrawer:	TextBlockDrawer = getScriptByClassForObject(meshes.find((value) => value.name == "instance of entrance fee entry mesh" || value.name == "entrance fee entry mesh"), TextBlockDrawer)!;
			entranceFeeDrawer.frontTextBlock.text = "" + entry.entryFee;
			const	gameNameDrawer:	TextBlockDrawer = getScriptByClassForObject(meshes.find((value) => value.name == "instance of name entry mesh transform" || value.name == "name entry mesh transform")?.getChildMeshes()[0], TextBlockDrawer)!;
			gameNameDrawer.frontTextBlock.text = "" + entry.id;
		}, Ui._gameControlSelector, scene);

		// game creation layout initialization
		this._gameCreationLayout = new AdvancedStackPanel3D(true, AdvancedStackPanel3D.START_ALIGNMENT);
		this._gameCreationPreviousButtonHeaderPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._gameCreationPlayerCountInputPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._gameCreationEntranceFeeInputPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._createPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.END_ALIGNMENT);

		// ServerGame creation
		this._serverGame = new ServerGame();
	}

	private static	_gameControlSelector(control: Control3D):	AbstractButton3D & ISelectable {
		return <SwitchButton3D>(<Container3D>control).children[2];
	}

	public onStart(): void {
		this._serverGame.init();
		this._setMainLayout();
		this._setGameListLayout();
		this._setGameCreationLayout();
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

		createGameButton.onPointerUpObservable.add(() => {
			this._mainLayout.isVisible = false;
			this._gameCreationLayout.isVisible = true;
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
		this._gameListLayout.padding = 0.05;
		this._gameListLayout.blockLayout = true;
			this._setGameListPanel();
			this._setGameListControlPanel();
			this._setGameListPreviousButtonHeaderPanel();
		this._gameListLayout.blockLayout = false;
		this._gameListLayout.isVisible = false;
	}

	private	_setGameCreationLayout():	void {
		this._manager.addControl(this._gameCreationLayout);
		this._gameCreationLayout.margin = 20;
		this._gameCreationLayout.padding = 0.05;
		this._gameCreationLayout.blockLayout = true;
			this._setCreatePanel();
			this._setGameCreationEntranceFeeInputPanel();
			this._setGameCreationPlayerCountInputPanel();
			const	gameNameInput:			InputField3D = getScriptByClassForObject(this._gameCreationGameNameInputMesh, InputField3D)!;
			this._gameCreationGameNameInput = gameNameInput.inputTextArea;
			const	gameNameInputControl:	MeshControl = new MeshControl(this._gameCreationGameNameInputMesh, "game creation game name input", gameNameInput.inputTextArea);
			gameNameInput.parser = (input: string) => input.length > 15 ? input.slice(0, 15) : input;
			this._gameCreationLayout.addControl(gameNameInputControl);
			this._setGameCreationPreviousButtonHeaderPanel();
		this._gameCreationLayout.blockLayout = false;
		this._gameCreationLayout.isVisible = false;
	}

	private	_setCreatePanel():	void {
		this._gameCreationLayout.addControl(this._createPanel);
		this._createPanel.padding = 0;
		this._createPanel.padding = 0.01;
		this._createPanel.blockLayout = true;

		getScriptByClassForObject(this._createButtonMesh, TextBlockDrawer)?.render();
		const	createButton:	ButtonWithDescription = new ButtonWithDescription(this._createButtonMesh, "play button", Quaternion.RotationAxis(Axis.Y, Math.PI / 4), 1.5, Vector3.Zero(), Quaternion.RotationYawPitchRoll(Math.PI / 4, Math.PI / 4, Math.PI / 4));
		createButton.onPointerUpObservable.add(() =>
		{
			this._serverGame.createRoomWs(
				this._gameCreationGameNameInput.text,
				Number.parseFloat(this._gameCreationEntranceFeeInput.text),
				Number.parseInt(this._gameCreationPlayerCountInput.text)
			);
		})
		this._createPanel.addControl(createButton);
		createButton.isEnabled = false;
		this._createPanel.blockLayout = false;
	}

	private	_setGameCreationEntranceFeeInputPanel():	void {
		this._gameCreationLayout.addControl(this._gameCreationEntranceFeeInputPanel);
		this._gameCreationEntranceFeeInputPanel.margin = 10;
		this._gameCreationEntranceFeeInputPanel.blockLayout = true;
			const	input:			InputField3D = getScriptByClassForObject(this._gameCreationEntranceFeeInputMesh, InputField3D)!;
			this._gameCreationPlayerCountInput = input.inputTextArea;
			input.parser = (input: string) => {
				const	n:	number = Number.parseFloat(input);
				return (n > 1000 ? 1000 : (n < 1 ? 1 : n)).toString();
			}
			const	inputControl:	MeshControl = new MeshControl(this._gameCreationEntranceFeeInputMesh, "game creation entrance fee input", input.inputTextArea);
			this._gameCreationEntranceFeeInputPanel.addControl(inputControl);
		this._gameCreationEntranceFeeInputPanel.blockLayout = false;
	}

	private	_setGameCreationPlayerCountInputPanel():	void {
		this._gameCreationLayout.addControl(this._gameCreationPlayerCountInputPanel);
		this._gameCreationPlayerCountInputPanel.margin = 10;
		this._gameCreationPlayerCountInputPanel.blockLayout = true;
			const	input:			InputField3D = getScriptByClassForObject(this._gameCreationPlayerCountInputMesh, InputField3D)!;
			this._gameCreationEntranceFeeInput = input.inputTextArea;
			input.parser = (input: string) => {
				const	n:	number = Number.parseInt(input);
				return (n > 10 ? 10 : (n < 2 ? 2 : n)).toString();
			}
			const	inputControl:	MeshControl = new MeshControl(this._gameCreationPlayerCountInputMesh, "game creation entrance fee input", input.inputTextArea);
			this._gameCreationPlayerCountInputPanel.addControl(inputControl);
		this._gameCreationPlayerCountInputPanel.blockLayout = false;
	}

	private	_setGameCreationPreviousButtonHeaderPanel():	void {
		this._gameCreationLayout.addControl(this._gameCreationPreviousButtonHeaderPanel);
		this._gameCreationPreviousButtonHeaderPanel.margin = 0;
		this._gameCreationPreviousButtonHeaderPanel.blockLayout = true;
			getScriptByClassForObject(this._gameCreationPreviousButtonMesh, TextBlockDrawer)?.render();
			const	prevBtnExtS:	Vector3 = this._gameListPreviousButtonMesh.getBoundingInfo().boundingBox.extendSize;
			const	button:	ButtonWithDescription = new ButtonWithDescription(this._gameCreationPreviousButtonMesh, "game_list_previous_button", Quaternion.RotationYawPitchRoll(-Math.PI / 4, 0 ,0), 1.5, new Vector3(prevBtnExtS.x, 0, -prevBtnExtS.z));
			button.onPointerUpObservable.add(() => {
				this._gameCreationLayout.isVisible = false;
				this._mainLayout.isVisible = true;
			});
			this._gameCreationPreviousButtonHeaderPanel.addControl(button);
			getScriptByClassForObject(this._gameCreationHeaderMesh, TextBlockDrawer)?.render();
			const	headerControl:	MeshControl = new MeshControl(this._gameCreationHeaderMesh, "game creation header");
			this._gameCreationPreviousButtonHeaderPanel.addControl(headerControl);
		this._gameCreationPreviousButtonHeaderPanel.blockLayout = false;
	}

	private	_setGameListPreviousButtonHeaderPanel():	void {
		getScriptByClassForObject(this._gameListHeaderMesh, TextBlockDrawer)?.render();
		getScriptByClassForObject(this._gameListPreviousButtonMesh, TextBlockDrawer)?.render();
		this._gameListLayout.addControl(this._gameListPreviousButtonHeaderPanel);
		this._gameListPreviousButtonHeaderPanel.margin = 0;
		this._gameListPreviousButtonHeaderPanel.blockLayout = true;
		const	prevBtnExtS:	Vector3 = this._gameListPreviousButtonMesh.getBoundingInfo().boundingBox.extendSize;
		const	gameListPreviousButton:	ButtonWithDescription = new ButtonWithDescription(this._gameListPreviousButtonMesh, "game_list_previous_button", Quaternion.RotationYawPitchRoll(-Math.PI / 4, 0 ,0), 1.5, new Vector3(prevBtnExtS.x, 0, -prevBtnExtS.z));
		gameListPreviousButton.onPointerUpObservable.add(() => {
			this._gameListLayout.isVisible = false;
			this._mainLayout.isVisible = true;
		});
		this._gameListPreviousButtonHeaderPanel.addControl(gameListPreviousButton)
		this._gameListPreviousButtonHeaderPanel.addControl(new MeshControl(this._gameListHeaderMesh, "game list header"));
		this._gameListPreviousButtonHeaderPanel.blockLayout = false;
	}

	private	_setGameListControlPanel():	void {
		getScriptByClassForObject(this._refreshButtonMesh, TextBlockDrawer)?.render();
		getScriptByClassForObject(this._playButtonMesh, TextBlockDrawer)?.render();
		this._gameListLayout.addControl(this._gameListControlPanel);
		this._gameListControlPanel.margin = 70;
		this._gameListControlPanel.blockLayout = true;
			this._setPlayerCountOrderButtonInputPanel();
			this._setEntranceFeeOrderButtonInputPanel();
			const	refreshButton:	ButtonWithDescription = new ButtonWithDescription(this._refreshButtonMesh, "refresh button", Quaternion.RotationAxis(Axis.Y, Math.PI / 4), 1.5);

			refreshButton.onPointerUpObservable.add(() =>
			{
				this._serverGame.refreshRooms();
			});

			const	playButton:		ButtonWithDescription = new ButtonWithDescription(this._playButtonMesh, "play button", Quaternion.RotationAxis(Axis.Y, Math.PI / 4), 1.5, Vector3.Zero(), Quaternion.RotationYawPitchRoll(Math.PI / 4, Math.PI / 4, Math.PI / 4));
			playButton.isEnabled = false;
			this._gameListControlPanel.addControl(refreshButton);
			this._gameListControlPanel.addControl(playButton);
		this._gameListControlPanel.blockLayout = false;

		this._gameListScroll.onSelectObservable.add((c: Nullable<Control3D>) => playButton.isEnabled = c != null);
	}

	private	_setPlayerCountOrderButtonInputPanel():	void {
		getScriptByClassForObject(this._playerCountOrderButtonMesh, TextBlockDrawer)?.render();
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
		getScriptByClassForObject(this._entranceFeeOrderButtonMesh, TextBlockDrawer)?.render();
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
			input.parser = (s: string) => Math.abs(Number.parseFloat(s)).toString();
			this._entranceFeeOrderButtonInputPanel.addControl(entranceFeeInput);
		this._entranceFeeOrderButtonInputPanel.blockLayout = false;
	}

	private	_setGameListPanel():	void {
		this._gameListLayout.addControl(this._gameListScroll);
		this._gameListScroll.blockLayout = true;
		this._gameListScroll.addControl(this._entryPanel);
		this._entryPanel.margin = 10;
		this._entryPanel.blockLayout = true;
			getScriptByClassForObject(this._playerCountEntryMesh, TextBlockDrawer)?.render();
			getScriptByClassForObject(this._entranceFeeEntryMesh, TextBlockDrawer)?.render();
			getScriptByClassForObject(this._gameNameEntryMesh, TextBlockDrawer)?.render();
			this._entryPanel.addControl(new MeshControl(this._playerCountEntryMesh, "player count entry"));
			this._entryPanel.addControl(new MeshControl(this._entranceFeeEntryMesh, "entrance fee entry"));
			const	rot2:	Quaternion = Quaternion.RotationAxis(Axis.X, -Math.PI / 3);
			this._entryPanel.addControl(new SwitchButton3D(this._gameNameEntryMesh, "game name entry", Quaternion.Identity(), rot2, rot2, new Vector3(0), new Vector3(0, 0, -10), 1.2));
		this._entryPanel.blockLayout = false;
		this._gameListScroll.margin = 10;

		this._serverGame.refreshRooms();
		console.log(this._serverGame.getRooms);
		if (this._serverGame.getRooms && this._serverGame.getRooms.length > 0)
			this._gameListScroll.fillList(JSON.parse(JSON.stringify(this._serverGame.getRooms)) ?? []);
		// else
		// 	this._gameListScroll.fillList([]);
		this._gameListScroll.blockLayout = false;
	}
}
