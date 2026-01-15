import { AbstractMesh, Axis, Color3, GroundMesh, InputBlock, int, Mesh, NodeMaterial, Nullable, Quaternion, Scene, Vector3, Animation, Tools, GreasedLineTools, GreasedLineMesh, CreateGreasedLine, GreasedLineMeshMaterialType, Scalar } from "@babylonjs/core";
import { AbstractButton3D, Container3D, Control3D, GUI3DManager, InputTextArea, MeshButton3D, TextBlock } from "@babylonjs/gui";
import { getScriptByClassForObject, IScript, visibleAsColor3, visibleAsEntity } from "babylonjs-editor-tools";
import InputField3D from "./input-field";
import TextBlockDrawer from "./text-block";
import { ISelectable } from "./interfaces/iselectable";
import { AdvancedStackPanel3D } from "./controls/advanced-stack-panel-3d";
import ScrollRadioList3D from "./controls/scroll-radio-list";
import SwitchBox3D from "./controls/switch-box-3d";
import ButtonWithDescription from "./controls/button-with-description";
import MeshControl from "./controls/mesh-control";
import WebApi from "./web-api";
import Game from "./game";
import { setKeys } from "./functions/animations";
import { RoomFilter, RoomPlayer } from "./web-api/server-game";
import ScrollList3D from "./controls/scroll-list-3d";
import SwitchIcons3D from "./switch-icons-3d";
import { ButtonStrings } from "./constants/strings";
import { omitDuplicateWrapper } from "./functions/greased-line-tools";
import { updateBoundingBoxRecursively } from "./functions/bounding-box";

export default class Ui implements IScript {
	private static readonly	_dummyRot:	Quaternion = Quaternion.Identity();

	private readonly	_manager:	GUI3DManager;

	// background
	@visibleAsEntity("node", "background")
	private readonly	_background!:	GroundMesh;
	@visibleAsColor3("Main menu main color")
	private readonly	_mainMenuMainColor!:	Color3;
	@visibleAsColor3("Main menu depth color")
	private readonly	_mainMenuDepthColor!:	Color3;
	@visibleAsColor3("Join public main color")
	private readonly	_joinPublicMainColor!:	Color3;
	@visibleAsColor3("Join public depth color")
	private readonly	_joinPublicDepthColor!:	Color3;
	@visibleAsColor3("Create main color")
	private readonly	_createMainColor!:		Color3;
	@visibleAsColor3("Create depth color")
	private readonly	_createDepthColor!:		Color3;
	@visibleAsColor3("Game main color")
	private readonly	_gameMainColor!:		Color3;
	@visibleAsColor3("Game depth color")
	private readonly	_gameDepthColor!:		Color3;
	@visibleAsColor3("Lobby main color")
	private readonly	_lobbyMainColor!:		Color3;
	@visibleAsColor3("Lobby depth color")
	private readonly	_lobbyDepthColor!:		Color3;

	private	_backgroundMainColorBlock!:		InputBlock;
	private	_backgroundDepthColorBlock!:	InputBlock;

	private readonly	_backgroundMainAnim:	Animation;
	private readonly	_backgroundDepthAnim:	Animation;
	private readonly	_clearColorAnim:		Animation;

	// main layout elements
	@visibleAsEntity("node", "Join public game button mesh")
	private readonly	_joinPublicGameButtonMesh!:	AbstractMesh;
	@visibleAsEntity("node", "Create game button mesh")
	private readonly	_createGameButtonMesh!:	AbstractMesh;
	@visibleAsEntity("node", "ball mesh")
	private readonly	_ballMesh!:	AbstractMesh;

	private readonly	_mainLayout:	AdvancedStackPanel3D;

	// game list layout elements
	@visibleAsEntity("node", "game list previous button mesh")
	private readonly	_gameListPreviousButtonMesh!:	AbstractMesh;
	@visibleAsEntity("node", "game list header mesh")
	private readonly	_gameListHeaderMesh!:			AbstractMesh;
	@visibleAsEntity("node", "sort by switcher")
	private readonly	_sortBySwitcherMesh!:			AbstractMesh;
	@visibleAsEntity("node", "player count order button mesh")
	private readonly	_playerCountOrderButtonMesh!:	AbstractMesh;
	@visibleAsEntity("node", "player count input mesh")
	private readonly	_playerCountInputMesh!:			AbstractMesh;
	@visibleAsEntity("node", "entrance fee order button mesh")
	private readonly	_entranceFeeOrderButtonMesh!:	AbstractMesh;
	@visibleAsEntity("node", "entrance fee input mesh")
	private readonly	_entranceFeeInputMesh!:			AbstractMesh;
	@visibleAsEntity("node", "play button mesh")
	private readonly	_playButtonMesh!:				AbstractMesh;
	@visibleAsEntity("node", "game name entry mesh")
	private readonly	_gameNameEntryMesh!:			AbstractMesh;
	@visibleAsEntity("node", "player count entry mesh")
	private readonly	_playerCountEntryMesh!:			AbstractMesh;
	@visibleAsEntity("node", "entrance fee entry mesh")
	private readonly	_entranceFeeEntryMesh!:			AbstractMesh;

	private readonly	_gameListPreviousButtonHeaderPanel:	AdvancedStackPanel3D;
	private readonly	_playerCountOrderButtonInputPanel:	AdvancedStackPanel3D;
	private readonly	_entranceFeeOrderButtonInputPanel:	AdvancedStackPanel3D;
	private readonly	_entryPanel:						AdvancedStackPanel3D;
	private readonly	_gameListControlPanel:				AdvancedStackPanel3D;
	private readonly	_gameListScroll:					ScrollRadioList3D;
	private readonly	_gameListLayout:					AdvancedStackPanel3D;

	private readonly	_listFilters:	RoomFilter = {orderByBlob: {type: 'ASC', count: null}, orderByPlayers: {type: 'ASC', count: null}};
	private				_sortByPlayers:	boolean = true;

	// game creation layout elements
	@visibleAsEntity("node", "game creation header mesh")
	private readonly	_gameCreationHeaderMesh!:	AbstractMesh;
	@visibleAsEntity("node", "game creation previous button mesh")
	private readonly	_gameCreationPreviousButtonMesh!:	AbstractMesh;
	@visibleAsEntity("node", "game privacy button mesh")
	private readonly	_gamePrivacyButtonMesh!:	AbstractMesh;
	@visibleAsEntity("node", "game creation game name input mesh")
	private readonly	_gameCreationGameNameInputMesh!:	AbstractMesh;
	@visibleAsEntity("node", "player icon")
	private readonly	_playerIconMesh!:	AbstractMesh;
	@visibleAsEntity("node", "game creation player count input mesh")
	private readonly	_gameCreationPlayerCountInputMesh!:	AbstractMesh;
	@visibleAsEntity("node", "coin icon mesh")
	private readonly	_coinIconMesh!:	AbstractMesh;
	@visibleAsEntity("node", "game creation entrance fee input mesh")
	private readonly	_gameCreationEntranceFeeInputMesh!:	AbstractMesh;
	@visibleAsEntity("node", "create button mesh")
	private readonly	_createButtonMesh!:	AbstractMesh;

	private	_gameCreationGameNameInput!:	InputTextArea;
	private	_gameCreationEntranceFeeInput!:	InputTextArea;
	private	_gameCreationPlayerCountInput!:	InputTextArea;
	private	_createButton!:					ButtonWithDescription;

	private readonly	_gameCreationLayout:					AdvancedStackPanel3D;
	private readonly	_gameCreationPreviousButtonHeaderPanel:	AdvancedStackPanel3D;
	private readonly	_privacyNamePanel:						AdvancedStackPanel3D;
	private readonly	_gameCreationNumberInputsPanel:			AdvancedStackPanel3D;
	private readonly	_gameCreationPlayerCountInputPanel:		AdvancedStackPanel3D;
	private readonly	_gameCreationEntranceFeeInputPanel:		AdvancedStackPanel3D;
	private readonly	_createPanel:							AdvancedStackPanel3D;

	private	_isPrivate:	boolean = false;

	// game lobby layout
	@visibleAsEntity("node", "exit button mesh")
	private readonly	_exitButtonMesh!:	AbstractMesh;
	@visibleAsEntity("node", "ready button mesh")
	private readonly	_readyButtonMesh!:	AbstractMesh;
	@visibleAsEntity("node", "countdown mesh")
	private readonly	_countdownMesh!:	AbstractMesh;

	private readonly	_lobbyLayout:		AdvancedStackPanel3D;
	private readonly	_gameLayout:		AdvancedStackPanel3D;
	private readonly	_exitPanel:			AdvancedStackPanel3D;
	private				_countdown!:		SwitchBox3D;
	private				_readyButton!:		SwitchBox3D;

	// result layout
	@visibleAsEntity("node", "kicked players icon mesh")
	private readonly	_kickedPlayersIconMesh!:	AbstractMesh;
	@visibleAsEntity("node", "kicked description mesh")
	private readonly	_kickedDescriptionMesh!:	AbstractMesh;
	@visibleAsEntity("node", "place icon mesh")
	private readonly	_placeIconMesh!:	AbstractMesh;
	@visibleAsEntity("node", "place description mesh")
	private readonly	_placeDescriptionMesh!:	AbstractMesh;
	@visibleAsEntity("node", "earned icon mesh")
	private readonly	_earnedIconMesh!:	AbstractMesh;
	@visibleAsEntity("node", "earned description mesh")
	private readonly	_earnedDescriptionMesh!:	AbstractMesh;
	@visibleAsEntity("node", "result player name")
	private readonly	_resultPlayerNameMesh!:	AbstractMesh;
	@visibleAsEntity("node", "skip result mesh")
	private readonly	_skipResultMesh!:	AbstractMesh;

	private readonly	_resultLayout:				AdvancedStackPanel3D;
	private readonly	_resultListPanel:			AdvancedStackPanel3D;
	private readonly	_resultDescriptionsPanel:	AdvancedStackPanel3D;
	private readonly	_resultEntryPanel:			AdvancedStackPanel3D;
	private readonly	_resultScrollList:			ScrollList3D;

	private				_currentLayout:			Container3D;
	private				_subscribedToLobby:		boolean = false;
	private readonly	_updateLayoutCallback:	() => void;
	private readonly	_countdownCallback:		() => void;
	private				_isLayoutUpdatable:		boolean = true;

	private	_currentTimeout:	Nullable<NodeJS.Timeout> = null;
	private	_isGameFinished:	boolean = false;

	private	_webApi!:	WebApi;
	private	_game!:		Game;

	public constructor(public scene: Scene) {
		this._backgroundMainAnim = new Animation("background main color", "value", 30, Animation.ANIMATIONTYPE_COLOR3, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
		this._backgroundDepthAnim = new Animation("background depth color", "value", 30, Animation.ANIMATIONTYPE_COLOR3, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
		this._clearColorAnim = new Animation("clear color", "clearColor", 30, Animation.ANIMATIONTYPE_COLOR4, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
		this._updateLayoutCallback = () => {
			if (this._isLayoutUpdatable) {
				this._updateLayoutRecursively();
				if (this._currentLayout == this._gameListLayout)
					this._gameListScroll.setClipped(true);
			}
		};
		this._countdownCallback = () => {
			this._readyButton.deselect();
			this._webApi.serverGame.markRoomPlayerWaiting();
			this._switchLayout(this._lobbyLayout, this._lobbyMainColor, this._lobbyDepthColor);
		};

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
		this._gameListScroll = new ScrollRadioList3D(true, 5, (entry, control) => {
			const	meshes:	AbstractMesh[] = control.node!.getChildMeshes(true);
			const	playerCountDrawer:	TextBlockDrawer = getScriptByClassForObject(meshes[0].getChildMeshes(true)[0], TextBlockDrawer)!;
			const	playerCount = entry.count;
			playerCountDrawer.frontTextBlock.text = playerCount + '/' + entry.maxPlayers;
			const	entranceFeeDrawer:	TextBlockDrawer = getScriptByClassForObject(meshes[1].getChildMeshes(true)[0], TextBlockDrawer)!;
			entranceFeeDrawer.frontTextBlock.text = "" + entry.entryFee;
			const	gameNameDrawer:	TextBlockDrawer = getScriptByClassForObject(meshes[2].getChildMeshes(true)[0].getChildMeshes(true)[1], TextBlockDrawer)!;
			gameNameDrawer.frontTextBlock.text = "" + entry.name;
		}, Ui._gameControlSelector, scene);
		// game creation layout initialization
		this._gameCreationLayout = new AdvancedStackPanel3D(true, AdvancedStackPanel3D.START_ALIGNMENT);
		this._gameCreationPreviousButtonHeaderPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._gameCreationNumberInputsPanel = new AdvancedStackPanel3D(true, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._gameCreationPlayerCountInputPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._gameCreationEntranceFeeInputPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._createPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.END_ALIGNMENT);
		this._privacyNamePanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		// lobby layout initialization
		this._lobbyLayout = new AdvancedStackPanel3D(true, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._exitPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.START_ALIGNMENT);
		// game layout initialization
		this._gameLayout = new AdvancedStackPanel3D(true, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		// result layout initialization
		this._resultLayout = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._resultListPanel = new AdvancedStackPanel3D(true, AdvancedStackPanel3D.START_ALIGNMENT);
		this._resultDescriptionsPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._resultEntryPanel = new AdvancedStackPanel3D(false, AdvancedStackPanel3D.CENTER_ALIGNMENT);
		this._resultScrollList = new ScrollList3D(true, 5, (entry, control) => {
			const	meshes:				AbstractMesh[] = control.node!.getChildMeshes(true);
			const	playerNameText:		TextBlock = getScriptByClassForObject(meshes[0], TextBlockDrawer)!.frontTextBlock;
			const	kickedPlayersText:	TextBlock = getScriptByClassForObject(meshes[1], TextBlockDrawer)!.frontTextBlock;
			const	placeText:			TextBlock = getScriptByClassForObject(meshes[2], TextBlockDrawer)!.frontTextBlock;
			const	earnedText:			TextBlock = getScriptByClassForObject(meshes[3], TextBlockDrawer)!.frontTextBlock;
			playerNameText.text = entry.username as string;
			kickedPlayersText.text = entry.playersKicked as string;
			placeText.text = entry.place as string;
			earnedText.text = ((<number>entry.score).toFixed(3)) as string;
		}, scene);
	}

	private static	_gameControlSelector(control: Control3D):	AbstractButton3D & ISelectable {
		return <SwitchBox3D>(<Container3D>control).children[2];
	}

	public onStart(): void {
		// Callbacks
		this._webApi = getScriptByClassForObject(this.scene, WebApi)!;
		this._game = getScriptByClassForObject(this.scene, Game)!;
		this._setOnRoomDetailsObservable();
		this._setOnGameStateUpdatedObservable();
		this._setOnGameResultObservable();
		// Background
		const	backgroundMaterial:	NodeMaterial = this._background.material as NodeMaterial;
		this._backgroundMainColorBlock = backgroundMaterial.getBlockByName("mainColor") as InputBlock;
		this._backgroundDepthColorBlock = backgroundMaterial.getBlockByName("depthColor") as InputBlock;
		this._backgroundMainColorBlock.value = this._mainMenuMainColor;
		this._backgroundDepthColorBlock.value = this._mainMenuDepthColor;
		// Layout
		this._setMainLayout();
		this._setGameListLayout();
		this._setGameCreationLayout();
		this._setLobbyLayout();
		this._setGameLayout();
		this._setResultLayout();
		this.scene.getEngine().onResizeObservable.add(this._updateLayoutCallback);
	}

	private	_setResultLayout():	void {
		this._manager.addControl(this._resultLayout);
		this._resultLayout.blockLayout = true;
			this._resultLayout.margin = 15;
			this._resultLayout.addControl(this._resultListPanel);
			const	okBtn:	ButtonWithDescription = new ButtonWithDescription(this._skipResultMesh as Mesh, "skip result", Quaternion.RotationAxis(Axis.Y, Math.PI / 6), 1.3, undefined, undefined, getScriptByClassForObject(this._skipResultMesh, TextBlockDrawer)!.frontTextBlock);
			okBtn.onPointerUpObservable.add(() => this._switchLayout(this._mainLayout, this._mainMenuMainColor, this._mainMenuDepthColor));
			this._resultLayout.addControl(okBtn);
			this._resultListPanel.blockLayout = true;
				this._resultListPanel.addControl(this._resultScrollList);
				this._resultListPanel.addControl(this._resultDescriptionsPanel);
				this._resultDescriptionsPanel.blockLayout = true;
				this._resultDescriptionsPanel.padding = 79;
					this._resultDescriptionsPanel.margin = 10;
					const	earnedDescription:			MeshControl = new MeshControl(this._earnedDescriptionMesh, "earned description");
					const	placeDescription:			MeshControl = new MeshControl(this._placeDescriptionMesh, "place description");
					const	kickedPlayersDescription:	MeshControl = new MeshControl(this._kickedDescriptionMesh, "kicked players description");
					this._resultDescriptionsPanel.addControl(kickedPlayersDescription);
					this._resultDescriptionsPanel.addControl(placeDescription);
					this._resultDescriptionsPanel.addControl(earnedDescription);
				this._resultDescriptionsPanel.blockLayout = false;
				this._resultScrollList.blockLayout = true;
					this._resultScrollList.margin = 5;
					this._resultScrollList.addControl(this._resultEntryPanel);
					this._resultEntryPanel.blockLayout = true;
						this._resultEntryPanel.margin = 27;
						const	playerName:			MeshControl = new MeshControl(this._resultPlayerNameMesh, "result player name entry");
						const	kickedPlayersIcon:	MeshControl = new MeshControl(this._kickedPlayersIconMesh, "kicked players icon");
						const	placeIcon:			MeshControl = new MeshControl(this._placeIconMesh, "place icon");
						const	earnedIcon:			MeshControl = new MeshControl(this._earnedIconMesh, "earned icon");
						this._resultEntryPanel.addControl(playerName);
						this._resultEntryPanel.addControl(kickedPlayersIcon);
						this._resultEntryPanel.addControl(placeIcon);
						this._resultEntryPanel.addControl(earnedIcon);
					this._resultEntryPanel.blockLayout = false;
				this._resultScrollList.blockLayout = false;
				this._resultScrollList.initialize();
			this._resultListPanel.blockLayout = false;
		this._resultLayout.blockLayout = false;
		this._resultLayout.isVisible = false;
	}

	private	_setGameLayout():	void {
		this._manager.addControl(this._gameLayout);
		this._gameLayout.blockLayout = true;
		const	rot2:		Quaternion = Quaternion.RotationAxis(Axis.X, -Math.PI / 2);
		const	rot3:		Quaternion = Quaternion.RotationAxis(Axis.X, Math.PI);
		this._countdown = new SwitchBox3D(this._countdownMesh, "countdown", Ui._dummyRot, rot2, rot2, undefined, undefined, 1.1, rot3, rot3);
		this._countdown.onPointerUpObservable.add(this._countdownCallback);
		this._gameLayout.addControl(this._countdown);
		this._gameLayout.blockLayout = false;
		this._gameLayout.isVisible = false;
	}

	private	_setLobbyLayout():	void {
		this._manager.addControl(this._lobbyLayout);
		this._lobbyLayout.blockLayout = true;
		const	rot:	Quaternion = Quaternion.RotationAxis(Axis.Y, Math.PI / 4);
		this._readyButton = new SwitchBox3D(this._readyButtonMesh, "ready button", Ui._dummyRot, rot, rot, undefined, undefined, 1.1);
		this._lobbyLayout.addControl(this._exitPanel);
		this._exitPanel.blockLayout = true;
		this._exitPanel.isArrangable = false;
		this._exitPanel.shift = -0.4;
		this._exitPanel.padding = 0.03;
		const	textBlock:	TextBlock = getScriptByClassForObject(this._exitButtonMesh, TextBlockDrawer)!.frontTextBlock;
		const	button:		ButtonWithDescription = new ButtonWithDescription(this._exitButtonMesh as Mesh, "exit lobby", Quaternion.RotationAxis(Axis.Y, -Math.PI / 6), 1.5, undefined, undefined, textBlock);
		button.onPointerUpObservable.add(() => {
			this._game.mode = 0;
			this._webApi.serverGame.leaveRoom();
			this._countdown.state = 0;
			this._readyButton.deselect();
			this._switchLayout(this._mainLayout, this._mainMenuMainColor, this._mainMenuDepthColor);
		});
		this._exitPanel.addControl(button);
		this._exitPanel.blockLayout = false;
		this._readyButton.onPointerUpObservable.add(() => {
			if (this._readyButton.state) {
				this._webApi.serverGame.markRoomPlayerReady();
			} else
				this._webApi.serverGame.markRoomPlayerWaiting();
		});
		this._lobbyLayout.addControl(this._readyButton)
		this._lobbyLayout.blockLayout = false;
		this._lobbyLayout.isVisible = false;
	}

	private	_setMainLayout():	void {
		this._manager.addControl(this._mainLayout);
		this._mainLayout.margin = 30;

		const	joinPublicGameButton:	MeshButton3D = new MeshButton3D(this._joinPublicGameButtonMesh as Mesh, "joinPublicButton");
		const	createGameButton:		MeshButton3D = new MeshButton3D(this._createGameButtonMesh as Mesh, "createGameButton");
		const	lines:					Vector3[][] = GreasedLineTools.MeshesToLines([this._ballMesh], omitDuplicateWrapper);
		const	ball:					GreasedLineMesh = CreateGreasedLine("ball", {points: lines}, {
			color: Color3.FromHexString("#d50303"),
			sizeAttenuation: true,
			width: 2,
			materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE
		}) as GreasedLineMesh;
		const	ballParent:	Mesh = new Mesh("ball parent", this.scene);
		ball.scaling.scaleInPlace(50);
		ball.parent = ballParent;
		ball.rotationQuaternion = Quaternion.Identity();
		ball.computeWorldMatrix(true);
		updateBoundingBoxRecursively(ballParent);
		const angularVelocity = new Vector3(
			Scalar.RandomRange(-1, 1),
			Scalar.RandomRange(-1, 1),
			Scalar.RandomRange(-1, 1)
		);
		this.scene.onBeforeRenderObservable.add(() => {
			const	deltaTime:	number = this.scene.getEngine().getDeltaTime() / 1000;
			const deltaRotation = Quaternion.RotationYawPitchRoll(
				angularVelocity.y * deltaTime,
				angularVelocity.x * deltaTime,
				angularVelocity.z * deltaTime
			);
			ball.rotationQuaternion?.multiplyInPlace(deltaRotation);
		});
		const	ballControl:	MeshControl = new MeshControl(ballParent, "deco ball");

		joinPublicGameButton.onPointerUpObservable.add(() => {
			this._switchLayout(this._gameListLayout, this._joinPublicMainColor, this._joinPublicDepthColor);
			this._subscribeToLobby();
		});

		createGameButton.onPointerUpObservable.add(() => this._switchLayout(this._gameCreationLayout, this._createMainColor, this._createDepthColor));
		
		this._mainLayout.blockLayout = true;
		this._mainLayout.addControl(createGameButton);
		this._mainLayout.addControl(ballControl);
		this._mainLayout.addControl(joinPublicGameButton);
		this._mainLayout.blockLayout = false;
	}

	private	_setGameListLayout():	void {
		this._manager.addControl(this._gameListLayout);
		this._gameListLayout.margin = 10;
		this._gameListLayout.padding = 0;
		this._gameListLayout.blockLayout = true;
			this._setGameListPanel();
			this._setGameListControlPanel();
			this._setGameListPreviousButtonHeaderPanel();
		this._gameListLayout.blockLayout = false;
		this._gameListLayout.isVisible = false;
	}

	private	_setGameCreationLayout():	void {
		this._manager.addControl(this._gameCreationLayout);
		this._gameCreationLayout.blockLayout = true;
			this._gameCreationNumberInputsPanel.blockLayout = true;
				this._gameCreationNumberInputsPanel.margin = 5;
				this._gameCreationLayout.margin = 40;
				this._gameCreationLayout.padding = 0;
				this._setCreatePanel();
				this._gameCreationLayout.addControl(this._gameCreationNumberInputsPanel);
				this._setGameCreationEntranceFeeInputPanel();
				this._setGameCreationPlayerCountInputPanel();
				this._setPrivacyNameLayout();
				this._setGameCreationPreviousButtonHeaderPanel();
			this._gameCreationNumberInputsPanel.blockLayout = true;
		this._gameCreationLayout.blockLayout = false;
		this._gameCreationLayout.isVisible = false;
	}

	private	_setPrivacyNameLayout():	void {
		this._gameCreationLayout.addControl(this._privacyNamePanel);
		this._privacyNamePanel.blockLayout = true;
		this._privacyNamePanel.margin = 20;
		const	state2Rot:	Quaternion = Quaternion.RotationAxis(Axis.X, Math.PI);
		const	privacy:	SwitchBox3D = new SwitchBox3D(this._gamePrivacyButtonMesh, "privacy", Quaternion.RotationAxis(Axis.X, Math.PI / 2.5), state2Rot, state2Rot, undefined, undefined, 1.2);
		privacy.onPointerUpObservable.add(() => this._isPrivate = privacy.state === 1);
		this._privacyNamePanel.addControl(privacy);
		const	gameNameInput:	InputField3D = getScriptByClassForObject(this._gameCreationGameNameInputMesh, InputField3D)!;
		this._gameCreationGameNameInput = gameNameInput.inputTextArea;
		this._gameCreationGameNameInput.onTextChangedObservable.add(() => this._enableCreateButton());
		const	gameNameInputControl:	MeshControl = new MeshControl(this._gameCreationGameNameInputMesh, "game creation game name input", gameNameInput.inputTextArea);
		gameNameInput.parser = (input: string) => input.length > 15 ? input.slice(0, 15) : input;
		this._privacyNamePanel.addControl(gameNameInputControl);
		this._privacyNamePanel.blockLayout = false;
	}

	private	_setCreatePanel():	void {
		this._gameCreationLayout.addControl(this._createPanel);
		this._createPanel.padding = 0;
		this._createPanel.padding = 0.1;
		this._createPanel.blockLayout = true;

		const	btnExtS:	Vector3 = this._createButtonMesh.getBoundingInfo().boundingBox.extendSize;
		this._createButton = new ButtonWithDescription(this._createButtonMesh as Mesh, "create button", Quaternion.RotationAxis(Axis.Y, Math.PI / 6), 1.5, new Vector3(-btnExtS.x, 0, 0), Quaternion.RotationYawPitchRoll(Math.PI, 0, 0));
		this._createButton.onPointerUpObservable.add(() => {
			this._webApi.serverGame.createRoom(
				this._gameCreationGameNameInput.text,
				Number.parseFloat(this._gameCreationEntranceFeeInput.text),
				Number.parseInt(this._gameCreationPlayerCountInput.text),
				this._isPrivate
			);
		})
		this._createPanel.addControl(this._createButton);
		this._createButton.isEnabled = false;
		this._createPanel.blockLayout = false;
	}

	private	_setGameCreationEntranceFeeInputPanel():	void {
		this._gameCreationNumberInputsPanel.addControl(this._gameCreationEntranceFeeInputPanel);
		this._gameCreationEntranceFeeInputPanel.margin = 15;
		this._gameCreationEntranceFeeInputPanel.blockLayout = true;
		const	input:	InputField3D = getScriptByClassForObject(this._gameCreationEntranceFeeInputMesh, InputField3D)!;
		this._gameCreationEntranceFeeInput = input.inputTextArea;
		this._gameCreationEntranceFeeInput.onTextChangedObservable.add(() => this._enableCreateButton());
		input.parser = (input: string) => {
			const	n:	number = Number.parseFloat(input);
			return (n > this._game.maxFee ? this._game.maxFee : (n < this._game.minFee ? this._game.minFee : n)).toString();
		}
		const	inputControl:	MeshControl = new MeshControl(this._gameCreationEntranceFeeInputMesh, "game creation entrance fee input", input.inputTextArea);
		this._gameCreationEntranceFeeInputPanel.addControl(inputControl);
		this._gameCreationEntranceFeeInputPanel.addControl(new MeshControl(this._coinIconMesh, "coin icon"));
		this._gameCreationEntranceFeeInputPanel.blockLayout = false;
	}

	private	_setGameCreationPlayerCountInputPanel():	void {
		this._gameCreationNumberInputsPanel.addControl(this._gameCreationPlayerCountInputPanel);
		this._gameCreationPlayerCountInputPanel.margin = 30;
		this._gameCreationPlayerCountInputPanel.blockLayout = true;
			this._gameCreationPlayerCountInputPanel.addControl(new MeshControl(this._playerIconMesh, "player icon"));
			const	input:	InputField3D = getScriptByClassForObject(this._gameCreationPlayerCountInputMesh, InputField3D)!;
			this._gameCreationPlayerCountInput = input.inputTextArea;
			this._gameCreationPlayerCountInput.onTextChangedObservable.add(() => this._enableCreateButton());
			input.parser = (input: string) => {
				const	n:	number = Number.parseInt(input);
				return (n > this._game.maxPlayers ? this._game.maxPlayers : (n < 2 ? 2 : n)).toString();
			}
			const	inputControl:	MeshControl = new MeshControl(this._gameCreationPlayerCountInputMesh, "game creation entrance fee input", input.inputTextArea);
			this._gameCreationPlayerCountInputPanel.addControl(inputControl);
		this._gameCreationPlayerCountInputPanel.blockLayout = false;
	}

	private	_setGameCreationPreviousButtonHeaderPanel():	void {
		this._gameCreationLayout.addControl(this._gameCreationPreviousButtonHeaderPanel);
		this._gameCreationPreviousButtonHeaderPanel.margin = 25;
		this._gameCreationPreviousButtonHeaderPanel.blockLayout = true;
			getScriptByClassForObject(this._gameCreationPreviousButtonMesh, TextBlockDrawer)?.render();
			const	prevBtnExtS:	Vector3 = this._gameCreationPreviousButtonMesh.getBoundingInfo().boundingBox.extendSize;
			const	button:	ButtonWithDescription = new ButtonWithDescription(this._gameCreationPreviousButtonMesh as Mesh, "game_list_previous_button", Quaternion.RotationYawPitchRoll(Math.PI / 6, 0 ,0), 1.5, new Vector3(prevBtnExtS.x, 0, -prevBtnExtS.z), undefined, getScriptByClassForObject(this._gameCreationPreviousButtonMesh, TextBlockDrawer)!.frontTextBlock);
			button.onPointerUpObservable.add(() => this._switchLayout(this._mainLayout, this._mainMenuMainColor, this._mainMenuDepthColor));
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
		this._gameListPreviousButtonHeaderPanel.margin = 25;
		this._gameListPreviousButtonHeaderPanel.blockLayout = true;
		const	prevBtnExtS:	Vector3 = this._gameListPreviousButtonMesh.getBoundingInfo().boundingBox.extendSize;
		const	gameListPreviousButton:	ButtonWithDescription = new ButtonWithDescription(this._gameListPreviousButtonMesh as Mesh, "game_list_previous_button", Quaternion.RotationYawPitchRoll(Math.PI / 6, 0 ,0), 1.5, new Vector3(prevBtnExtS.x, 0, -prevBtnExtS.z), undefined, getScriptByClassForObject(this._gameListPreviousButtonMesh, TextBlockDrawer)!.frontTextBlock);
		gameListPreviousButton.onPointerUpObservable.add(() => {
			this._switchLayout(this._mainLayout, this._mainMenuMainColor, this._mainMenuDepthColor);
			this._unsubscribeFromLobby();
			this._gameListScroll.deselect();
		});
		this._gameListPreviousButtonHeaderPanel.addControl(gameListPreviousButton)
		this._gameListPreviousButtonHeaderPanel.addControl(new MeshControl(this._gameListHeaderMesh, "game list header"));
		this._gameListPreviousButtonHeaderPanel.blockLayout = false;
	}

	private	_setGameListControlPanel():	void {
		getScriptByClassForObject(this._playButtonMesh, TextBlockDrawer)?.render();
		this._gameListLayout.addControl(this._gameListControlPanel);
		this._gameListControlPanel.margin = 75;
		this._gameListControlPanel.blockLayout = true;
		const	sortBySwitcher:	SwitchIcons3D = getScriptByClassForObject(this._sortBySwitcherMesh, SwitchIcons3D)!;
		const	playerSwitcherDesc:	TextBlockDrawer = getScriptByClassForObject(this._playerCountOrderButtonMesh, TextBlockDrawer)!;
		const	feeSwitcherDesc:	TextBlockDrawer = getScriptByClassForObject(this._entranceFeeOrderButtonMesh, TextBlockDrawer)!;
		sortBySwitcher.onPointerUpObservable.add(() => {
			if (sortBySwitcher.state) {
				playerSwitcherDesc.rightTextBlock.text = ButtonStrings.PLAYERS_SWITCHER_DESCENDING_ORDER;
				playerSwitcherDesc.leftTextBlock.text = ButtonStrings.PLAYERS_SWITCHER_ASCENDING_ORDER;
				feeSwitcherDesc.rightTextBlock.text = ButtonStrings.FEE_SWITCHER_TO;
				feeSwitcherDesc.leftTextBlock.text = ButtonStrings.FEE_SWITCHER_FROM;
				this._sortByPlayers = true;
			} else {
				playerSwitcherDesc.rightTextBlock.text = ButtonStrings.PLAYERS_SWITCHER_TO;
				playerSwitcherDesc.leftTextBlock.text = ButtonStrings.PLAYERS_SWITCHER_FROM;
				feeSwitcherDesc.rightTextBlock.text = ButtonStrings.PLAYERS_SWITCHER_DESCENDING_ORDER;
				feeSwitcherDesc.leftTextBlock.text = ButtonStrings.PLAYERS_SWITCHER_ASCENDING_ORDER;
				this._sortByPlayers = false;
			}
			this._setFilter();
		});
		this._gameListControlPanel.addControl(sortBySwitcher);
		this._setPlayerCountOrderButtonInputPanel();
		this._setEntranceFeeOrderButtonInputPanel();

		const	playButton:		ButtonWithDescription = new ButtonWithDescription(this._playButtonMesh as Mesh, "join button", Quaternion.RotationAxis(Axis.Y, Math.PI / 6), 1.5, Vector3.Zero(), Quaternion.RotationYawPitchRoll(Math.PI, 0, 0));
		playButton.onPointerUpObservable.add(() => {
			this._webApi.serverGame.joinRoom(this._gameListScroll.selectedEntry.id as string);
			this._gameListScroll.deselect();
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
			const	playerCountOrderButton:	SwitchBox3D = new SwitchBox3D(this._playerCountOrderButtonMesh, "player count order button",
				Quaternion.RotationAxis(Axis.Y, -Math.PI / 3),
				Quaternion.RotationAxis(Axis.X, Math.PI), Quaternion.RotationYawPitchRoll(Math.PI / 3, Math.PI, 0),
				Vector3.Zero(), new Vector3(-playerCountOrderBtnExtS.x, 0, playerCountOrderBtnExtS.z), 1.5);
			playerCountOrderButton.onPointerUpObservable.add(() => {
				this._listFilters.orderByPlayers!.type = playerCountOrderButton.state ? 'DESC' : 'ASC';
				this._setFilter();
			});
			this._playerCountOrderButtonInputPanel.addControl(playerCountOrderButton);
			const	input:	InputField3D = getScriptByClassForObject(this._playerCountInputMesh, InputField3D)!;
			input.draw();
			const	playerCountInput:	MeshControl = new MeshControl(this._playerCountInputMesh, "player count input", input.inputTextArea);
			input.parser = (s: string) => Number.parseInt(s).toString();
			input.inputTextArea.onBlurObservable.add(() => {
				const	count:	number = Number.parseInt(input.inputTextArea.text);
				if (input.inputTextArea.text.length) {
					if (Number.isInteger(count)) {
						this._listFilters.orderByPlayers!.count = count;
						this._setFilter();
					}
				} else {
					this._listFilters.orderByPlayers!.count = null;
					this._setFilter();
				}
			});
			this._playerCountOrderButtonInputPanel.addControl(playerCountInput);
		this._playerCountOrderButtonInputPanel.blockLayout = false;
	}

	private	_setEntranceFeeOrderButtonInputPanel():	void {
		getScriptByClassForObject(this._entranceFeeOrderButtonMesh, TextBlockDrawer)?.render();
		this._gameListControlPanel.addControl(this._entranceFeeOrderButtonInputPanel);
		this._entranceFeeOrderButtonInputPanel.margin = 1;
		this._entranceFeeOrderButtonInputPanel.blockLayout = true;
			const	entranceFeeOrderBtnExtS:	Vector3 = this._entranceFeeOrderButtonMesh.getBoundingInfo().boundingBox.extendSizeWorld.scale(1);
			const	entranceFeeOrderButton:	SwitchBox3D = new SwitchBox3D(this._entranceFeeOrderButtonMesh, "entrance fee order button",
				Quaternion.RotationAxis(Axis.Y, -Math.PI / 5),
				Quaternion.RotationAxis(Axis.Z, Math.PI), Quaternion.RotationYawPitchRoll(-Math.PI / 3, 0, Math.PI),
				Vector3.Zero(), new Vector3(-entranceFeeOrderBtnExtS.x, 0, entranceFeeOrderBtnExtS.z), 1.5);
			this._entranceFeeOrderButtonInputPanel.addControl(entranceFeeOrderButton);
			entranceFeeOrderButton.onPointerUpObservable.add(() => {
				this._listFilters.orderByBlob!.type = entranceFeeOrderButton.state ? 'DESC' : 'ASC';
				this._setFilter();
			});
			const	input:	InputField3D = getScriptByClassForObject(this._entranceFeeInputMesh, InputField3D)!;
			input.draw();
			const	entranceFeeInput:	MeshControl = new MeshControl(this._entranceFeeInputMesh, "entrance fee input", input.inputTextArea);
			input.parser = (s: string) => Math.abs(Number.parseFloat(s)).toString();
			input.inputTextArea.onBlurObservable.add(() => {
				const	fee:	number = Number.parseFloat(input.inputTextArea.text);
				if (input.inputTextArea.text.length) {
					if (Number.isFinite(fee)) {
						this._listFilters.orderByBlob!.count = fee;
						this._setFilter();
					}
				} else {
					this._listFilters.orderByBlob!.count = null;
					this._setFilter();
				}
			});
			this._entranceFeeOrderButtonInputPanel.addControl(entranceFeeInput);
		this._entranceFeeOrderButtonInputPanel.blockLayout = false;
	}

	private	_setGameListPanel():	void {
		this._gameListLayout.addControl(this._gameListScroll);
		this._gameListScroll.blockLayout = true;
		this._gameListScroll.addControl(this._entryPanel);
		this._entryPanel.margin = 5;
		this._entryPanel.blockLayout = true;
		getScriptByClassForObject(this._playerCountEntryMesh, TextBlockDrawer)?.render();
		getScriptByClassForObject(this._entranceFeeEntryMesh, TextBlockDrawer)?.render();
		getScriptByClassForObject(this._gameNameEntryMesh, TextBlockDrawer)?.render();
		this._entryPanel.addControl(new MeshControl(this._playerCountEntryMesh, "player count entry"));
		this._entryPanel.addControl(new MeshControl(this._entranceFeeEntryMesh, "entrance fee entry"));
		const	rot2:	Quaternion = Quaternion.RotationAxis(Axis.X, -Math.PI / 3);
		this._entryPanel.addControl(new SwitchBox3D(this._gameNameEntryMesh, "game name entry", Quaternion.Identity(), rot2, rot2, new Vector3(0), new Vector3(0, 0, -10), 1.2));
		this._entryPanel.blockLayout = false;
		this._gameListScroll.margin = 10;
		this._gameListScroll.blockLayout = false;
		this._gameListScroll.initialize();
	}

	// Utilities
	private	_changeBackgroundColor(mainColor: Color3, depthColor: Color3):	void {
		setKeys(this._clearColorAnim, this.scene.clearColor, depthColor.toColor4(), 30);
		setKeys(this._backgroundMainAnim, this._backgroundMainColorBlock.value, mainColor, 30);
		setKeys(this._backgroundDepthAnim, this._backgroundDepthColorBlock.value, depthColor, 30);
		this.scene.beginDirectAnimation(this._backgroundMainColorBlock, [this._backgroundMainAnim], 0, 30);
		this.scene.beginDirectAnimation(this._backgroundDepthColorBlock, [this._backgroundDepthAnim], 0, 30);
		this.scene.beginDirectAnimation(this.scene, [this._clearColorAnim], 0, 30);
	}

	private	_updateLayoutRecursively():	void {
		const	toUpdate:	Array<Container3D> = [this._currentLayout];
		let		count:		int = 1;
		let		length:		int;
		while (count) {
			length = toUpdate.length;
			let i = length - count;
			count = 0;
			for (; i < length; i += 1) {
				const	controls:	Control3D[] = toUpdate[i].children;
				for (const control of controls) {
					if (control instanceof Container3D) {
						count += 1;
						toUpdate.push(control);
					}
				}
			}
		}
		while (toUpdate.length)
			toUpdate.pop()!.updateLayout();
	}

	private	_switchLayout(newLayout: Container3D, mainColor?: Color3, depthColor?: Color3):	void {
		if (this._currentLayout != newLayout) {
			this._isLayoutUpdatable = false;
			this._currentLayout.isVisible = false;
			newLayout.isVisible = true;

			this._currentLayout = newLayout;
			setTimeout(() => {
				this._updateLayoutRecursively();
				this._isLayoutUpdatable = true, 2000
			});
			if (mainColor && depthColor)
				this._changeBackgroundColor(mainColor, depthColor);
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

	private	_setFilter():	void {
		if (this._sortByPlayers)
			this._webApi.serverGame.filterGames({orderByPlayers: this._listFilters.orderByPlayers, orderByBlob: null});
		else
			this._webApi.serverGame.filterGames({orderByPlayers: null, orderByBlob: this._listFilters.orderByBlob});
	}

	// Callback setting
	private	_setOnGameStateUpdatedObservable():	void {
		this._webApi.serverGame.onGameStateUpdatedObservable.add((gs) => {
			if (this._isGameFinished)
				this._isGameFinished = gs.state === "finished";
			else {
				switch (this._game.mode) {
					case Game.NONE_MODE:
						this._unsubscribeFromLobby();
						this._switchLayout(this._gameLayout, this._gameMainColor, this._gameDepthColor);
						this._game.mode = Game.GAME_MODE;
						break;
					case Game.LOBBY_MODE:
						this._switchLayout(this._gameLayout, this._gameMainColor, this._gameDepthColor);
						this._game.mode = Game.GAME_MODE;
						break;
					default:
						switch(gs.state) {
							case "countdown":
								this._countdown.isVisible = true;
								const	state:	int = this._game.countdownTime - gs.countdownSeconds!;
								this._countdown.state = state % this._countdown.maxState;
								break;
							case "finished":
								this._game.resetCamera();
								setTimeout(() => this._game.mode = 0, 1000);
								this._isGameFinished = true;
								this._countdown.deselect();
								this._countdown.onPointerUpObservable.add(this._countdownCallback);
								break;
							default:
								this._countdown.isVisible = false;
								break;
						}
						break;
				}
			}
		}, undefined, true);
	}

	private	_setOnRoomDetailsObservable():	void {
		this._webApi.serverGame.onRoomsUpdatedObservable.add((list) => {
			console.log(list);
			if (this._sortByPlayers) {
				if (this._listFilters.orderByBlob!.count) {
					if (this._listFilters.orderByBlob!.type == 'ASC')
						list = list.filter((v) => v.entryFee >= this._listFilters.orderByBlob!.count!);
					else
						list = list.filter((v) => v.entryFee <= this._listFilters.orderByBlob!.count!);
				}
			} else {
				if (this._listFilters.orderByPlayers!.count) {
					if (this._listFilters.orderByPlayers!.type == 'DESC')
						list = list.filter((v) => v.maxPlayers >= this._listFilters.orderByPlayers!.count!);
					else
						list = list.filter((v) => v.maxPlayers <= this._listFilters.orderByPlayers!.count!);
				}
			}
			this._gameListScroll.fillList(JSON.parse(JSON.stringify(list)));
			this._gameListLayout.updateLayout();
			Tools.SetImmediate(() => this._gameListScroll.setClipped(true));
		});
		this._webApi.serverGame.onRoomDetailsUpdatedObservable.add((details) => {
			if (this._game.mode === Game.NONE_MODE) {
				this._unsubscribeFromLobby();
				this._switchLayout(this._lobbyLayout, this._lobbyMainColor, this._lobbyDepthColor);
				const	player:	RoomPlayer | undefined = details.players.find((p) => p.id === this._webApi.clientInfo!.id);
				if (player && player.isReady)
					this._readyButton.select();
				this._game.playerCount = details.maxPlayers;
				this._game.mode = 1;
			} else if (this._game.mode === Game.LOBBY_MODE) {
				if (details.players.every((player) => player.isReady)) {
					if (this._currentTimeout === null && details.players.length > 1) {
						this._switchLayout(this._gameLayout, this._gameMainColor, this._gameDepthColor);
						this._currentTimeout = setTimeout(() => {
							this._countdown.state = 1;
							this._currentTimeout = setTimeout(() => {
								this._countdown.state = 2;
								this._currentTimeout = setTimeout(() => {
									this._countdown.state = 0;
									this._currentTimeout = null;
									this._readyButton.deselect();
									this._countdown.isEnabled = false;
									this._countdown.onPointerUpObservable.removeCallback(this._countdownCallback);
									this._webApi.serverGame.startGame();
								}, 1000);
							}, 1000);
						}, 1000);
					}
				} else if (this._currentTimeout !== null) {
					this._switchLayout(this._lobbyLayout, this._lobbyMainColor, this._lobbyDepthColor);
					clearTimeout(this._currentTimeout);
					this._currentTimeout = null;
					this._countdown.deselect();
				}
			}
		}, undefined, true);
	}

	private	_setOnGameResultObservable():	void {
		this._webApi.serverGame.onGameResultObservable.add((res) => {
			setTimeout(() => {
				this._switchLayout(this._resultLayout, this._gameMainColor, this._gameDepthColor);
				this._resultScrollList.fillList(res.gameResult.players.sort((a, b) => b.score - a.score));
				Tools.SetImmediate(() => this._resultScrollList.setClipped(true));
			}, 1010);
		});
	}
	// Observers' functions
	private	_enableCreateButton():	void {
		if (this._gameCreationGameNameInput.text.length > 0 && this._gameCreationPlayerCountInput.text.length > 0 && this._gameCreationEntranceFeeInput.text.length > 0) {
			const	playerCount = Number.parseInt(this._gameCreationPlayerCountInput.text);
			const	fee = Number.parseFloat(this._gameCreationEntranceFeeInput.text);
			this._createButton.isEnabled = playerCount > 1 && playerCount <= this._game.maxPlayers && fee >= this._game.minFee && fee <= this._game.maxFee;
		} else
			this._createButton.isEnabled = false;
	}
}
