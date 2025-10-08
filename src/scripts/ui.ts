import { AbstractMesh, Axis, int, Mesh, Nullable, Quaternion, Scene, Vector3 } from "@babylonjs/core";
import { AbstractButton3D, Container3D, Control3D, GUI3DManager, InputTextArea, MeshButton3D, TextBlock } from "@babylonjs/gui";
import { getScriptByClassForObject, IScript, visibleAsEntity, visibleAsNumber } from "babylonjs-editor-tools";
import InputField3D from "./input-field";
import TextBlockDrawer from "./text-block";
import { ISelectable } from "./interfaces/iselectable";
import { AdvancedStackPanel3D } from "./controls/advanced-stack-panel-3d";
import ScrollRaioList3D from "./controls/scroll-radio-list";
import SwitchButton3D from "./controls/switch-button";
import ButtonWithDescription from "./controls/button-with-description";
import MeshControl from "./controls/mesh-control";
import WebApi from "./web-api";
import Game from "./game";

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
	private readonly	_gameListPreviousButtonMesh!:	Mesh;
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
	/*@visibleAsEntity("node", "refresh button mesh")
	private readonly	_refreshButtonMesh!:			Mesh;*/
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

	private	_gameCreationGameNameInput!:	InputTextArea;
	private	_gameCreationEntranceFeeInput!:	InputTextArea;
	private	_gameCreationPlayerCountInput!:	InputTextArea;
	private	_createButton!:					ButtonWithDescription;

	private readonly	_gameCreationLayout:					AdvancedStackPanel3D;
	private readonly	_gameCreationPreviousButtonHeaderPanel:	AdvancedStackPanel3D;
	private readonly	_gameCreationPlayerCountInputPanel:		AdvancedStackPanel3D;
	private readonly	_gameCreationEntranceFeeInputPanel:		AdvancedStackPanel3D;
	private readonly	_createPanel:							AdvancedStackPanel3D;

	// game lobby layout
	@visibleAsEntity("node", "exit button mesh")
	private readonly	_exitButtonMesh!:	Mesh;

	private readonly	_lobbyLayout:	AdvancedStackPanel3D;

	private	_currentLayout:	Container3D;
	private	_subscribedToLobby:	boolean = false;

	// game parameters
	@visibleAsNumber("max players", {min: 2, max: 20, step: 1})
	private readonly	_maxPlayers:	int = 10;
	@visibleAsNumber("min fee", {min: 0.0001})
	private readonly	_minFee:	number = 1;
	@visibleAsNumber("max fee", {min: 0.0001})
	private readonly	_maxFee:	number = 1000;

	private	_webApi!:	WebApi;
	private	_game!:		Game;

	public constructor(public scene: Scene) {
		this._manager = new GUI3DManager(scene);
		// main layout initialization
		this._mainLayout = new AdvancedStackPanel3D(true, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._currentLayout = this._mainLayout;

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
			const	playerCount = entry.count;
			playerCountDrawer.frontTextBlock.text = playerCount + '/' + entry.maxPlayers;
			const	entranceFeeDrawer:	TextBlockDrawer = getScriptByClassForObject(meshes.find((value) => value.name == "instance of entrance fee entry mesh" || value.name == "entrance fee entry mesh"), TextBlockDrawer)!;
			entranceFeeDrawer.frontTextBlock.text = "" + entry.entryFee;
			const	gameNameDrawer:	TextBlockDrawer = getScriptByClassForObject(meshes.find((value) => value.name == "instance of name entry mesh transform" || value.name == "name entry mesh transform")?.getChildMeshes()[0], TextBlockDrawer)!;
			gameNameDrawer.frontTextBlock.text = "" + entry.name;
		}, Ui._gameControlSelector, scene);

		// game creation layout initialization
		this._gameCreationLayout = new AdvancedStackPanel3D(true, AdvancedStackPanel3D.START_ALIGNMENT);
		this._gameCreationPreviousButtonHeaderPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._gameCreationPlayerCountInputPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._gameCreationEntranceFeeInputPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._createPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.END_ALIGNMENT);

		// lobby layout initialization
		this._lobbyLayout = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.START_ALIGNMENT);
	}

	private static	_gameControlSelector(control: Control3D):	AbstractButton3D & ISelectable {
		return <SwitchButton3D>(<Container3D>control).children[2];
	}

	public onStart(): void {
		// ServerGame creation
		this._webApi = getScriptByClassForObject(this.scene, WebApi)!;
		this._game = getScriptByClassForObject(this.scene, Game)!;
		this._webApi.serverGame.onRoomsUpdatedObservable.add((list) => {
			this._gameListScroll.fillList(JSON.parse(JSON.stringify(list)));
			this._gameListLayout.updateLayout();
			this._gameListScroll.setClipped(true);
		});
		this._webApi.serverGame.onRoomDetailsUpdatedObservable.add(() => {
			console.log("first details");
			if (this._game.mode === 0) {
				this._unsubscribeFromLobby();
				this._switchLayout(this._currentLayout, this._lobbyLayout);
				this._game.mode = 1;
			}
		}, undefined, true);
		this._webApi.serverGame.onWebSocketOpenedObservable.add(() => {this._webApi.serverGame.subscribeToRoom(); console.log("subscribed")});
		if (this._webApi.serverGame.isWebSocketOpen()) {
			this._webApi.serverGame.subscribeToRoom();
			console.log("force subscribe");
		}
		this._setMainLayout();
		this._setGameListLayout();
		this._setGameCreationLayout();
		this._setLobbyLayout();
	}

	private	_setLobbyLayout():	void {
		this._manager.addControl(this._lobbyLayout);
		this._lobbyLayout.blockLayout = true;
		this._lobbyLayout.shift = -0.4;
		const	textBlock:	TextBlock = getScriptByClassForObject(this._exitButtonMesh, TextBlockDrawer)!.rightTextBlock;
		const	button:		ButtonWithDescription = new ButtonWithDescription(this._exitButtonMesh, "exit lobby", Quaternion.RotationAxis(Axis.Y, -Math.PI / 6), 1.5, undefined, undefined, textBlock);
		button.onPointerUpObservable.add(() => {
			this._game.mode = 0;
			this._webApi.serverGame.leaveRoom();
			this._switchLayout(this._lobbyLayout, this._mainLayout);
		});
		this._lobbyLayout.addControl(button);
		this._lobbyLayout.blockLayout = false;
		this._lobbyLayout.isVisible = false;
	}

	private	_setMainLayout():	void {
		this._manager.addControl(this._mainLayout);
		this._mainLayout.margin = 0.05;

		const	joinPublicGameButton:	MeshButton3D = new MeshButton3D(this._joinPublicGameButtonMesh, "joinPublicButton");
		const	joinPrivateGameButton:	MeshButton3D = new MeshButton3D(this._joinPrivateGameButtonMesh, "joinPrivateButton");
		const	createGameButton:		MeshButton3D = new MeshButton3D(this._createGameButtonMesh, "createGameButton");

		joinPublicGameButton.onPointerUpObservable.add(() => {
			this._switchLayout(this._mainLayout, this._gameListLayout);
			this._subscribeToLobby();
		});

		createGameButton.onPointerUpObservable.add(() => this._switchLayout(this._mainLayout, this._gameCreationLayout));
		
		this._mainLayout.blockLayout = true;
		this._mainLayout.addControl(createGameButton);
		this._mainLayout.addControl(joinPrivateGameButton);
		this._mainLayout.addControl(joinPublicGameButton);
		this._mainLayout.blockLayout = false;
	}

	private	_setGameListLayout():	void {
		this._manager.addControl(this._gameListLayout);
		this._gameListLayout.margin = 10;
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
			this._gameCreationGameNameInput.onTextChangedObservable.add(() => this._enableCreateButton());
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
		this._createButton = new ButtonWithDescription(this._createButtonMesh, "create button", Quaternion.RotationAxis(Axis.Y, Math.PI / 3), 1.5, Vector3.Zero(), Quaternion.RotationYawPitchRoll(Math.PI / 4, Math.PI / 4, Math.PI / 4));
		this._createButton.onPointerUpObservable.add(() => {
			this._game.maxPlayers = Number.parseInt(this._gameCreationPlayerCountInput.text);
			this._webApi.serverGame.createRoom(
				this._gameCreationGameNameInput.text,
				Number.parseFloat(this._gameCreationEntranceFeeInput.text),
				Number.parseInt(this._gameCreationPlayerCountInput.text)
			);
		})
		this._createPanel.addControl(this._createButton);
		this._createButton.isEnabled = false;
		this._createPanel.blockLayout = false;
	}

	private	_setGameCreationEntranceFeeInputPanel():	void {
		this._gameCreationLayout.addControl(this._gameCreationEntranceFeeInputPanel);
		this._gameCreationEntranceFeeInputPanel.margin = 10;
		this._gameCreationEntranceFeeInputPanel.blockLayout = true;
			const	input:	InputField3D = getScriptByClassForObject(this._gameCreationEntranceFeeInputMesh, InputField3D)!;
			this._gameCreationEntranceFeeInput = input.inputTextArea;
			this._gameCreationEntranceFeeInput.onTextChangedObservable.add(() => this._enableCreateButton());
			input.parser = (input: string) => {
				const	n:	number = Number.parseFloat(input);
				return (n > this._maxFee ? this._maxFee : (n < this._minFee ? this._minFee : n)).toString();
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
			this._gameCreationPlayerCountInput = input.inputTextArea;
			this._gameCreationPlayerCountInput.onTextChangedObservable.add(() => this._enableCreateButton());
			input.parser = (input: string) => {
				const	n:	number = Number.parseInt(input);
				return (n > this._maxPlayers ? this._maxPlayers : (n < 2 ? 2 : n)).toString();
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
			button.onPointerUpObservable.add(() => this._switchLayout(this._gameCreationLayout, this._mainLayout));
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
			this._switchLayout(this._gameListLayout, this._mainLayout);
			this._unsubscribeFromLobby();
		});
		this._gameListPreviousButtonHeaderPanel.addControl(gameListPreviousButton)
		this._gameListPreviousButtonHeaderPanel.addControl(new MeshControl(this._gameListHeaderMesh, "game list header"));
		this._gameListPreviousButtonHeaderPanel.blockLayout = false;
	}

	private	_setGameListControlPanel():	void {
		getScriptByClassForObject(this._playButtonMesh, TextBlockDrawer)?.render();
		this._gameListLayout.addControl(this._gameListControlPanel);
		this._gameListControlPanel.margin = 70;
		this._gameListControlPanel.blockLayout = true;
		this._setPlayerCountOrderButtonInputPanel();
		this._setEntranceFeeOrderButtonInputPanel();

		const	playButton:		ButtonWithDescription = new ButtonWithDescription(this._playButtonMesh, "play button", Quaternion.RotationAxis(Axis.Y, Math.PI / 4), 1.5, Vector3.Zero(), Quaternion.RotationYawPitchRoll(Math.PI / 4, Math.PI / 4, Math.PI / 4));
		playButton.onPointerUpObservable.add(() => {
			this._webApi.serverGame.joinRoom(this._gameListScroll.selectedEntry.id as string);
			this._game.maxPlayers = this._gameListScroll.selectedEntry.maxPlayers as number;
			this._webApi.serverGame.subscribeToRoom();
		});
		playButton.isEnabled = false;
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
		this._gameListScroll.blockLayout = false;
		this._gameListScroll.initialize();
	}

	// Utilities
	private	_switchLayout(oldLayout: Container3D, newLayout: Container3D):	void {
		if (oldLayout != newLayout) {
			oldLayout.isVisible = false;
			newLayout.isVisible = true;
			this._currentLayout = newLayout;
		}
	}

	private	_subscribeToLobby():	void {
		if (!this._subscribedToLobby) {
			this._webApi.serverGame.subscribeToLobby();
			this._subscribedToLobby = true;
		}
	}

	private	_unsubscribeFromLobby():	void {
		if (this._subscribedToLobby) {
			this._webApi.serverGame.unsubscribeFromLobby();
			this._subscribedToLobby = false;
		}
	}

	// Observers' functions
	private	_enableCreateButton():	void {
		if (this._gameCreationGameNameInput.text.length > 0 && this._gameCreationPlayerCountInput.text.length > 0 && this._gameCreationEntranceFeeInput.text.length > 0) {
			const	playerCount = Number.parseInt(this._gameCreationPlayerCountInput.text);
			const	fee = Number.parseFloat(this._gameCreationEntranceFeeInput.text);
			this._createButton.isEnabled = playerCount > 1 && playerCount <= this._maxPlayers && fee >= this._minFee && fee <= this._maxFee;
		} else
			this._createButton.isEnabled = false;
	}
}
