import { ArcRotateCamera, Axis, Animation, Color3, CreateGreasedLine, GlowLayer, GreasedLineBaseMesh, GreasedLineMesh, GreasedLineMeshColorDistribution, GreasedLineMeshColorDistributionType, GreasedLineMeshMaterialType, GreasedLineTools, InstancedMesh, int, Mesh, PointerEventTypes, PointerInfo, Quaternion, Scene, Vector3, SineEase, Vector2, Scalar, Plane, Ray, Nullable } from "@babylonjs/core";
import WebApi from "./web-api";
import { getScriptByClassForObject, IScript, visibleAsColor3, visibleAsEntity, visibleAsNumber } from "babylonjs-editor-tools";
import { GamePlayer, GameState, RoomDetails } from "./web-api/server-game";
import { setKeys } from "./functions/animations";
import { AdvancedDynamicTexture, Rectangle, TextBlock } from "@babylonjs/gui";
import { omitDuplicateWrapper } from "./functions/greased-line-tools";

export default class Game implements IScript {
	public static readonly	NONE_MODE:	int = 0;
	public static readonly	LOBBY_MODE:	int = 1;
	public static readonly	GAME_MODE:	int = 2;

	private static readonly	_rectRot:	Quaternion = Quaternion.RotationAxis(Axis.Z, Math.PI);
	private static readonly	_colors:	Array<Color3> = [
		new Color3(230 / 255, 25 / 255, 75 / 255), new Color3(60 / 255, 180 / 255, 75 / 255), new Color3(255 / 255, 225 / 255, 25 / 255),
		new Color3(0 / 255, 130 / 255, 200 / 255), new Color3(245 / 255, 130 / 255, 48 / 255), new Color3(145 / 255, 30 / 255, 180 / 255),
		new Color3(70 / 255, 240 / 255, 240 / 255), new Color3(240 / 255, 50 / 255, 230 / 255), new Color3(210 / 255, 245 / 255, 60 / 255),
		new Color3(0 / 255, 128 / 255, 128 / 255), new Color3(220 / 255, 190 / 255, 255 / 255),
		new Color3(170 / 255, 110 / 255, 40 / 255), new Color3(255 / 255, 250 / 255, 200 / 255), new Color3(128 / 255, 0 / 255, 0 / 255),
		new Color3(170 / 255, 255 / 255, 195 / 255), new Color3(128 / 255, 128 / 255, 0 / 255), new Color3(255 / 255, 215 / 255, 180 / 255),
		new Color3(0 / 255, 0 / 255, 128 / 255), new Color3(128 / 255, 128 / 255, 128 / 255)];

	private readonly	_namesTexture:	AdvancedDynamicTexture;

	// game parameters
	@visibleAsNumber("max players", {min: 2, max: 20, step: 1})
	public readonly	maxPlayers:	int = 10;
	@visibleAsNumber("min fee", {min: 0.0001})
	public readonly	minFee:	number = 1;
	@visibleAsNumber("max fee", {min: 0.0001})
	public readonly	maxFee:	number = 1000;
	@visibleAsNumber("countdown time", {min: 0, max: 10, step: 1})
	public readonly	countdownTime:	int = 3;

	@visibleAsNumber("distance from camera", {min: 0})
	private readonly	_distance:	number = 500;
	@visibleAsNumber("padding", {min: 0, max: 1})
	private readonly	_padding:	number = 0.1;
	@visibleAsColor3("wall color")
	private readonly	_wallColor:	Color3 = new Color3(0.4, 0.4, 0.4);
	@visibleAsNumber("racket size", {description: "percentage of wall size", min: 1, max: 100})
	private readonly	_racketSize:	number = 20;
	@visibleAsNumber("ball size", {description: "percentage of wall size", min: 1, max: 100})
	private readonly	_ballSize:	number = 1.6;
	@visibleAsNumber("rectangle ratio", {min: 1})
	private readonly	_rectangleRatio:	number = 2.2;
	@visibleAsNumber("nickname offset", {min: 0, max: 100, step: 1})
	private readonly	_nicknameOffset:	number = 70;
	@visibleAsNumber("nickname width", {min: 0, max: 100, step: 1})
	private readonly	_nicknameWidth:	number = 10;
	@visibleAsNumber("nickname height", {min: 0, max: 100, step: 1})
	private readonly	_nicknameHeight:	number = 4;

	private	_webApi!:	WebApi;

	private				_fields!:		Array<GreasedLineMesh>;
	private readonly	_racketNames:	Map<InstancedMesh, Rectangle> = new Map<InstancedMesh, Rectangle>();
	private readonly	_playerColors:	Map<string, Color3> = new Map<string, Color3>();
	private readonly	_colorWalls:	Map<Color3, int> = new Map<Color3, int>();
	private readonly	_wallReadiness:	Map<int, boolean> = new Map<int, boolean>();
	private readonly	_playerRackets:	Map<string, InstancedMesh> = new Map<string, InstancedMesh>();
	private				_namePool!:		Array<Rectangle>;
	private				_racketPool!:	Array<InstancedMesh>;
	private				_colorPool!:	Array<Color3>;

	private	_ball!:		GreasedLineBaseMesh;

	private	_z:					number = 0;
	private	_y:					number = 0;
	private	_ry:				number = 0;
	private	_ey:				number = 0;
	private	_shift:				int = 0;
	private	_racketMeshScales!:	Array<Vector3>;
	private	_ballMeshScales!:	Array<Vector3>;
	private	_wallSizes!:		Array<number>;
	private	_heights!:			Array<number>;
	private	_betaSins!:			Array<Array<number>>;
	private	_betaCoss!:			Array<Array<number>>;
	private	_rotations!:		Array<Array<Quaternion>>;

	private	_lastPlayers!:		GamePlayer[];
	private	_lastBallPosition!:	[number, number];

	private readonly	_camera:				ArcRotateCamera;
	private readonly	_cameraAlpha:			number;
	private readonly	_cameraBeta:			number;
	private readonly	_cameraRadius:			number;
	private readonly	_cameraAlphaAnimation:	Animation;
	private readonly	_cameraBetaAnimation:	Animation;
	private readonly	_cameraRadiusAnimation:	Animation;

	private readonly	_fieldPlane:	Plane;
	private readonly	_tangentPlane:	Plane;
	private readonly	_binormalPlane:	Plane;

	@visibleAsEntity("node", "racket mesh")
	private readonly	_racketMesh!:	Mesh;
	@visibleAsEntity("node", "ball mesh")
	private readonly	_ballMesh!:	Mesh;

	private	_mode:			int = 0;
	private	_playerCount:	int = 2;

	private readonly	_glow:	GlowLayer;

	private	_drag:	number = 0;

	public constructor(public scene: Scene) {
		// Rendering
		this._namesTexture = AdvancedDynamicTexture.CreateFullscreenUI("names");
		this._glow = new GlowLayer("glow", scene, {blurKernelSize: 128});
		this._glow.intensity = 1.2;
		this._camera = this.scene.activeCamera as ArcRotateCamera;
		this._cameraAlpha = this._camera.alpha;
		this._cameraBeta = this._camera.beta;
		this._cameraRadius = this._camera.radius;
		this._cameraAlphaAnimation = new Animation("camera alpha", "alpha", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
		this._cameraBetaAnimation = new Animation("camera beta", "beta", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
		this._cameraRadiusAnimation = new Animation("camera radius", "radius", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT, false);
		const	easeFunc = new SineEase();
		easeFunc.setEasingMode(SineEase.EASINGMODE_EASEINOUT);
		this._cameraAlphaAnimation.setEasingFunction(easeFunc);
		this._cameraBetaAnimation.setEasingFunction(easeFunc);
		this._cameraRadiusAnimation.setEasingFunction(easeFunc);
		this._fieldPlane = Plane.FromPositionAndNormal(this._camera.target, Vector3.Backward());
		this._tangentPlane = Plane.FromPositionAndNormal(new Vector3(0, 1000, 0), Vector3.Down());
		this._binormalPlane = Plane.FromPositionAndNormal(new Vector3(1000, 0, 0), Vector3.Left());
	}

	public onStart(): void {
		this._camera.detachControl();
		// Initialization
		this._namePool = new Array<Rectangle>(this.maxPlayers - 1);
		this._fields = new Array<GreasedLineMesh>(this.maxPlayers - 1);
		this._racketPool = new Array<InstancedMesh>(this.maxPlayers - 1);
		this._colorPool = new Array<Color3>(this.maxPlayers - 1);
		this._betaSins = new Array<Array<number>>(this.maxPlayers - 1);
		this._betaCoss = new Array<Array<number>>(this.maxPlayers - 1);
		this._rotations = new Array<Array<Quaternion>>(this.maxPlayers - 1);
		for (let i = 0; i < this._betaSins.length; i += 1) {
			this._betaSins[i] = new Array<number>(i + 2);
			this._betaCoss[i] = new Array<number>(i + 2);
			this._rotations[i] = new Array<Quaternion>(i + 2);
		}
		this._wallSizes = new Array<number>(this.maxPlayers - 1);
		this._heights = new Array<number>(this.maxPlayers - 1);
		this._racketMeshScales = new Array<Vector3>(this.maxPlayers - 1);
		this._ballMeshScales = new Array<Vector3>(this.maxPlayers - 1);
		// Web
		this._webApi = getScriptByClassForObject(this.scene, WebApi)!;
		this._webApi.onServerGameReady.addOnce(() => this._webApi.serverGame.reconnectToTopics());
		// Rendering
		this._z = this._camera.globalPosition.z + this._distance;
		this._y = this._distance * Math.tan(this._camera.fov / 2);
		const	rect = this.scene.getEngine().getRenderingCanvasClientRect()!;
		let		initHeight:	number = this._y * (1 - this._padding) * rect.width / rect.height;
		this._ry = initHeight / this._rectangleRatio;
		if (this._ry > this._y) {
			this._ry = this._y;
			initHeight = this._y * this._rectangleRatio;
		}
		if (rect.width < rect.height)
			this._y *= rect.width / rect.height;
		this._ey = this._y * (1 - this._padding);
		const	initWallSize:	number = 2 * this._ry;
		this._heights[0] = initHeight;
		this._wallSizes[0] = initWallSize;
		const	wallWorldSize:	number = this._racketMesh.getBoundingInfo().boundingBox.extendSizeWorld.x * 2;
		this._racketMeshScales[0] = this._racketMesh.scaling.scale(initWallSize * this._racketSize / 100 / wallWorldSize);
		this._rotations[0][0] = Quaternion.RotationAxis(Axis.Z, -Math.PI / 2);
		this._rotations[0][1] = Quaternion.RotationAxis(Axis.Z, Math.PI / 2);
		const	lines:	Vector3[][] = GreasedLineTools.MeshesToLines([this._ballMesh], omitDuplicateWrapper);
		for (let i = 1; i < this._wallSizes.length; i += 2)
			this._wallSizes[i] = 2 * this._y * Math.cos(Math.PI / 2 - Math.PI / (i + 2));
		for (let i = 2; i < this._wallSizes.length; i += 2)
			this._wallSizes[i] = 2 * this._ey * Math.cos(Math.PI / 2 - Math.PI / (i + 2));
		for (let i = 1; i < this._heights.length; i += 1) {
			const	playerCount:	int = i + 2;
			this._heights[i] = this._wallSizes[i] / 2 / Math.tan(Math.PI/ playerCount);
			for (let j = 0; j < playerCount; j += 1) {
				const	beta:	number = j * 2 * Math.PI / playerCount;
				this._betaSins[i][j] = Math.sin(beta);
				this._betaCoss[i][j] = Math.cos(beta);
				this._rotations[i][j] = Quaternion.RotationAxis(Axis.Z, beta);
			}
		}
		// meshes creation
		for (let i = 0; i < this._namePool.length; i += 1) {
			const	rect:	Rectangle = new Rectangle();
			this._namesTexture.addControl(rect)
			const	text:	TextBlock = new TextBlock("nickname " + i);
			text.isEnabled = false;
			text.disabledColor = "#00000000";
			rect.addControl(text);
			rect.width = `${this._nicknameWidth}%`;
			rect.height = `${this._nicknameHeight}%`;
			rect.cornerRadius = 20;
			rect.thickness = 0;
			rect.background = "rgba(0, 0, 0, 0.2)";
			this._namePool[i] = rect;
			rect.isVisible = false;
		}
		const	start:	Vector3 = new Vector3(initHeight, this._ry, this._z);
		this._fields[0] = this._createField([
				start, new Vector3(initHeight, -this._ry, this._z), new Vector3(-initHeight, -this._ry, this._z),
				new Vector3(-initHeight, this._ry, this._z), start], false);
		for (let i = 2; i < this._fields.length; i += 2)
			this._fields[i] = this._createField(GreasedLineTools.GetCircleLinePoints(this._ey, i + 2, this._z), true);
		for (let i = 1; i < this._fields.length; i += 2)
			this._fields[i] = this._createField(GreasedLineTools.GetCircleLinePoints(this._y, i + 2, this._z), true);
		this._ball = CreateGreasedLine("ball", {points: lines}, {
			color: Color3.White(),
			sizeAttenuation: true,
			width: 2,
			materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE
		});
		const	ballWorldSize:	number = this._ball.getBoundingInfo().boundingSphere.radiusWorld * 2;
		this._ballMeshScales[0] = this._ball.scaling.scale(initWallSize / 100 * this._ballSize / ballWorldSize);
		for (let i = 1; i < this._heights.length; i += 1) {
			const	wallSize:	number = this._wallSizes[i];
			this._racketMeshScales[i] = this._racketMesh.scaling.scale(wallSize * this._racketSize / 100 / wallWorldSize);
			this._ballMeshScales[i] = this._ball.scaling.scale(wallSize * this._ballSize / 100 / ballWorldSize);
		}
		this._racketMesh.registerInstancedBuffer("instanceColor", 3);
		this._racketMesh.instancedBuffers.instanceColor = Color3.Random();
		this._racketMesh.isVisible = false;
		for (let i = 0; i < this.maxPlayers; i += 1) {
			const inst:	InstancedMesh = this._racketMesh.createInstance("racket " + i);
			inst.isVisible = false;
			this._racketPool[i] = inst;
		}
		this._glow.addIncludedOnlyMesh(this._ball);
		this._glow.referenceMeshToUseItsOwnMaterial(this._ball);
		this._ballMesh.isVisible = false;
		this._ball.isVisible = false;
		this._ball.rotationQuaternion = Quaternion.Identity();
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
			this._ball.rotationQuaternion?.multiplyInPlace(deltaRotation);
			if (this._playerCount > 2)
				this._fields[this._playerCount - 2].greasedLineMaterial!.dashOffset += 0.001;
			else
				this._fields[0].greasedLineMaterial!.dashOffset += 0.001;
		});
		this._resetColors();
		this.scene.getEngine().onResizeObservable.add(this._resizeCallback, undefined, false, this, false);
	}

	private	_sendDrag():	void {
		if (Math.abs(this._drag ) > 0.01) {
			console.log(this._drag);
			this._webApi.serverGame.sendDragToServer(this._drag);
			this._drag = 0;
		}
	}

	private	_mouseCallback(info: PointerInfo) {
		const	racket:	InstancedMesh | undefined = this._playerRackets.get(this._webApi.clientInfo!.id);
		if (racket) {
			if (info.type == PointerEventTypes.POINTERMOVE) {
				const	plane:	Plane = Plane.FromPositionAndNormal(this._camera.target, Vector3.Backward());
				const	ray:	Ray = this.scene.createPickingRay(info.event.clientX, info.event.clientY, null, this._camera);
				let		dist:	Nullable<number> = ray.intersectsPlane(plane);
				if (this._playerCount <= 2) {
					if (!dist)
						dist = ray.intersectsPlane(this._binormalPlane)!;
					this._drag = (racket.position.y - ray.origin.add(ray.direction.scale(dist)).y) / this._wallSizes[0] / 2;
				} else {
					if (!dist)
						dist = ray.intersectsPlane(this._tangentPlane)!;
					this._drag = (ray.origin.add(ray.direction.scale(dist)).x - racket.position.x) / this._wallSizes[this._playerCount - 2] / 2;
				}
			}
		}
	}

	private	_updateGame(gs: GameState):	void {
		this._lastPlayers = gs.players;
		this._lastBallPosition = gs.ballPosition;
		if (gs.players.length) {
			if (this._playerColors.size > gs.players.length) {
				if (gs.players.length === 2)
					this.resetCamera();
				this._syncGame(gs.players);
			}
			if (gs.players.length <= 2 && this._shift)
				gs.players.push(gs.players.shift()!);
			this._drawBall(gs.players.length, gs.ballPosition);
			this._drawPlayers(gs.players);
			if (gs.players.find((p) => p.id === this._webApi.clientInfo!.id))
				this._sendDrag();
		}
	}

	private	_drawBall(playerCount: int, pos: [number, number]):	void {
		const	index:		int = playerCount - 2;
		const	wallSize:	number = this._wallSizes[index];
		const	ballPos:	Vector3 = new Vector3(pos[0] * wallSize, pos[1] * wallSize, this._z);
		if (playerCount <= 2) {
			if (this._shift) {
				ballPos.applyRotationQuaternionInPlace(Game._rectRot);
			}
		} else
			ballPos.applyRotationQuaternionInPlace(this._rotations[index][(playerCount - this._shift) % playerCount]);
		this._ball.position.copyFrom(ballPos);
	}

	private	_updateRoom(d: RoomDetails):	void {
		const	gamePlayers:	GamePlayer[] = [];
		d.players.forEach(v => {
			const	gamePlayer:	GamePlayer = {
				id: v.id,
				username: v.username,
				position: 0.5,
			}
			gamePlayers.push(gamePlayer);
		});
		this._lastPlayers = gamePlayers;
		this._setCameraLimits();
		this._syncRoomPlayers(gamePlayers);
		d.players.forEach((player) => this._wallReadiness.set(this._colorWalls.get(this._playerColors.get(player.id)!)!, player.isReady));
		this._colorizeField();
		this._drawPlayers(gamePlayers);
	}

	private	_drawPlayers(players: GamePlayer[]):	void {
		if (this._playerCount > 2) {
			for (const player of players) {
				const	color:		Color3 = this._playerColors.get(player.id)!;
				const	wall:		int = this._colorWalls.get(color)!;
				const	racket:		InstancedMesh = this._playerRackets.get(player.id)!;
				const	index:		int = this._playerCount - 2;
				const	wallSize:	number = this._wallSizes[index];
				const	height:		number = this._heights[index];
				const	sin:		number = this._betaSins[index][wall];
				const	cos:		number = this._betaCoss[index][wall];
				racket.position.set(height * sin + wallSize * (player.position - 0.5) * cos,
									-height * cos + wallSize * (player.position - 0.5) * sin,
									this._z);
				racket.rotationQuaternion = this._rotations[index][wall].multiply(Game._rectRot);
			}
		} else {
			const	color1:		Color3 = this._playerColors.get(players[0].id)!;
			const	wall1:		int = this._colorWalls.get(color1)!;
			const	racket1:	InstancedMesh = this._playerRackets.get(players[0].id)!;
			const	wallSize:	number = this._wallSizes[0];
			const	height:		number = this._heights[0];
			if (players.length > 1) {
				const	color2:		Color3 = this._playerColors.get(players[1].id)!;
				const	wall2:		int = this._colorWalls.get(color2)!;
				const	racket2:	InstancedMesh = this._playerRackets.get(players[1].id)!;
				racket2.position.set(height, (players[1].position - 0.5) * wallSize, this._z);
				racket2.rotationQuaternion = this._rotations[0][1 - wall2];
			}
			racket1.position.set(-height, (0.5 - players[0].position) * wallSize, this._z);
			racket1.rotationQuaternion = this._rotations[0][1 - wall1];
		}
	}

	private	_syncGame(players: GamePlayer[]):	void {
		this._playerCount = players.length;
		if (this._playerColors.size && players.length > 1)
			this._fields[this._playerColors.size - 2].isVisible = false;
		this._setCameraLimits();
		this._syncRoomPlayers(players);
		if (players.length > 1)
			this._fields[players.length - 2].isVisible = true;
		this._colorizeField();
		this._scaleMeshes();
	}

	private	_setCameraLimits():	void {
		if (this._playerCount > 2) {
			const	alpha:	number = 3 * Math.PI / 2;
			this._camera.upperAlphaLimit = alpha;
			this._camera.lowerAlphaLimit = alpha;
			this._camera.lowerBetaLimit = Math.PI / 2;
			this._camera.upperBetaLimit = Math.PI - 0.01;
		} else {
			const	beta:	number = Math.PI / 2;
			this._camera.lowerBetaLimit = beta;
			this._camera.upperBetaLimit = beta;
			this._camera.lowerAlphaLimit = Math.PI + 0.01;
			this._camera.upperAlphaLimit = 3 * Math.PI / 2;
		}
	}

	private	_syncRoomPlayers(players: GamePlayer[]):	void {
		const	playerColors:	Map<string, Color3> = new Map(this._playerColors);
		this._colorWalls.clear();
		let	j:	int;
		for (j = 0; j < players.length && players[0].id !== this._webApi.clientInfo!.id; j += 1, players.push(players.shift()!), this._colorPool.unshift(this._colorPool.pop()!));
		this._shift = j % players.length;
		const	func:	(index: int, wall: int, takeColor:	() => Color3 | undefined) => void = (index, wall, takeColor) => {
			const	player:	GamePlayer = players[index];
			if (this._playerColors.has(player.id)) {
				this._colorWalls.set(this._playerColors.get(player.id)!, wall);
				(this._racketNames.get(this._playerRackets.get(player.id)!)!.children[0] as TextBlock).text = player.username;
				playerColors.delete(player.id);
			} else {
				const	color:		Color3 = takeColor()!;
				const	racket:		InstancedMesh = this._racketPool.pop()!;
				const	nameRect:	Rectangle = this._namePool.pop()!;
				const	text:		TextBlock = (nameRect.children[0] as TextBlock);
				text.text = player.username;
				text.color = Color3.Lerp(color, Color3.White(), 0.5).toHexString();
				racket.isVisible = true;
				nameRect.isVisible = true;
				nameRect.color = color.toHexString();
				nameRect.linkWithMesh(racket);
				racket.instancedBuffers.instanceColor = color;
				this._colorWalls.set(color, wall);
				this._playerRackets.set(player.id, racket);
				this._playerColors.set(player.id, color);
				this._racketNames.set(racket, nameRect);
			}
		};
		j = players.length - this._shift;
		for (let i = 0; i < j; i += 1)
			func(i, i, () => this._colorPool.pop());
		let	k:	int = this._playerCount - this._shift;
		for (let i = j; i < players.length; i += 1, k += 1)
			func(i, k, () => this._colorPool.shift());
		playerColors.forEach((color, id) => {
			const	racket:	InstancedMesh = this._playerRackets.get(id)!;
			const	name:	Rectangle = this._racketNames.get(racket)!;
			name.isVisible = false;
			racket.isVisible = false;
			this._racketNames.delete(racket);
			this._playerRackets.delete(id);
			this._playerColors.delete(id);
			this._namePool.unshift(name);
			this._racketPool.unshift(racket);
			this._colorPool.unshift(color);
		});
		this._drawNames();
	}

	private	_drawNames():	void {
		for (const pc of this._playerColors) {
			const	wall:	int = this._colorWalls.get(pc[1])!;
			const	racket:	InstancedMesh = this._playerRackets.get(pc[0])!;
			const	name:	Rectangle = this._racketNames.get(racket)!;
			const	localAngle:	number = this._playerCount > 2 ? 2 * Math.PI / this._playerCount * wall : -Math.PI / 2 + Math.PI * wall;
			const	dir:	Vector3 = Vector3.Right().applyRotationQuaternionInPlace(Quaternion.RotationAxis(Axis.Z, localAngle));
			const	viewDir:	Vector3 = Vector3.TransformNormal(dir, this._camera.getViewMatrix());
			let		angle:	number = Math.f16round(Vector3.GetAngleBetweenVectorsOnPlane(Vector3.Right(), viewDir, Vector3.Forward()));
			if (angle < 0)
				angle += 2 * Math.PI;
			const	radius:	number = this._cameraRadius / this._camera.radius;
			name.width = `${this._nicknameWidth * radius}%`;
			name.height = `${this._nicknameHeight * radius}%`;
			const	offset:	Vector2 = new Vector2(0, -this._nicknameOffset).rotate(angle).scaleInPlace(radius);
			name.rotation = (angle >= 0 && angle <= Math.PI / 2) || (angle >= 3 * Math.PI / 2 && angle < 2 * Math.PI) ? - angle : -angle + Math.PI;
			name.linkOffsetX = offset.x.toFixed();
			name.linkOffsetY = -offset.y.toFixed();
		}
	}

	public get	playerCount():	int {
		return this._playerCount;
	}

	public set	playerCount(value: int) {
		if (!this._mode && value > 1 && value <= this.maxPlayers) {
			this._playerCount = value;
		}
	}

	public get	mode():	int {
		return this._mode;
	}

	public set	mode(value: int) {
		if (value != this._mode && (value > this._mode || value == Game.NONE_MODE)) {
			switch (value) {
				case Game.NONE_MODE:
					this._camera.detachControl();
					this.resetCamera();
					this.scene.onPointerObservable.removeCallback(this._mouseCallback, this);
					this._camera.onViewMatrixChangedObservable.removeCallback(this._drawNames, this);
					this._webApi.serverGame.onRoomDetailsUpdatedObservable.removeCallback(this._updateRoom, this);
					this._webApi.serverGame.onGameStateUpdatedObservable.removeCallback(this._updateGame, this);
					this._ball.isVisible = false;
					this._colorWalls.clear();
					this._playerColors.forEach((_, id) => {
						const	racket:	InstancedMesh = this._playerRackets.get(id)!;
						const	name:	Rectangle = this._racketNames.get(racket)!;
						name.isVisible = false;
						racket.isVisible = false;
						this._racketPool.push(racket);
						this._namePool.push(name);
					});
					this._playerColors.clear();
					this._playerRackets.clear();
					this._racketNames.clear();
					if (this._playerCount > 2)
						this._fields[this._playerCount - 2].isVisible = false;
					else
						this._fields[0].isVisible = false;
					break;
				case Game.LOBBY_MODE:
					this._camera.attachControl();
					this._webApi.serverGame.onRoomDetailsUpdatedObservable.add(this._updateRoom, undefined, false, this);
					this._camera.onViewMatrixChangedObservable.add(this._drawNames, undefined, false, this);
					this._resetColors();
					this._scaleMeshes();
					this._fields[this._playerCount - 2].isVisible = true;
					break;
				default:
					this._camera.attachControl();
					if (!this._camera.onViewMatrixChangedObservable.hasObservers())
						this._camera.onViewMatrixChangedObservable.add(this._drawNames, undefined, false, this);
					this.scene.onPointerObservable.add(this._mouseCallback, undefined, false, this);
					this._ball.isVisible = true;
					this._webApi.serverGame.onGameStateUpdatedObservable.add((gs) => {
						if (this._playerCount > 2)
							this._fields[this._playerCount - 2].isVisible = false;
						else
							this._fields[0].isVisible = false;
						this._syncGame(gs.players);
					}, undefined, false, undefined, true);
					this._webApi.serverGame.onGameStateUpdatedObservable.add(this._updateGame, undefined, false, this);
					break;
			}
			this._mode = value;
		}
	}

	private	_scaleMeshes():	void {
		if (this._playerCount > 1) {
			const	index:			int = this._playerCount - 2;
			const	racketScale:	Vector3 = this._racketMeshScales[index];
			this._ball.scaling = this._ballMeshScales[index];
			this._playerRackets.forEach(racket => racket.scaling = racketScale);
			this._racketPool.forEach(racket => racket.scaling = racketScale);
		}
	}

	private	_createField(points: Vector3[], rotate: boolean):	GreasedLineMesh {
		const	len = points.length - 1;
		const	colors:	Array<Color3> = new Array<Color3>(len);
		for (let i = 0; i < len; i += 1)
			colors[i] = this._wallColor;
		const	field:	GreasedLineMesh = CreateGreasedLine("field " + len, {
				points: points
			}, {
				useColors: true,
				colors: colors,
				useDash: true,
				width: 2,
				dashCount: 50,
				materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE,
				sizeAttenuation: false,
				colorDistributionType: GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_SEGMENT,
				colorDistribution: GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_NONE
				}) as GreasedLineMesh;
		if (rotate)
			field.rotate(Axis.Z, 3 * Math.PI / 2 - Math.PI / len);
		this._glow.addIncludedOnlyMesh(field);
		this._glow.referenceMeshToUseItsOwnMaterial(field);
		field.isVisible = false;
		return field;
	}

	private	_colorizeField():	void {
		const	field:	GreasedLineMesh = this._playerCount > 2 ? this._fields[this._playerCount - 2] : this._fields[0];
		const	colors:	Array<Color3> = field.greasedLineMaterial!.colors!;
		for (let i = 0; i < colors.length; i += 1)
			colors[i] = this._wallColor;
		if (this._playerCount > 2) {
			this._colorWalls.forEach((wall, color) => {
				if (this._wallReadiness.get(wall)!)
					colors[wall] = color;
			});
		} else {
			const	iter:	MapIterator<Color3> = this._colorWalls.keys();
			const	color1:	Color3 = iter.next().value!;
			if (this._wallReadiness.get(0))
				colors[2] = color1;
			const	color2:	Color3 | undefined = iter.next().value;
			if (color2 && this._wallReadiness.get(1))
				colors[0] = color2;
		}
		field.greasedLineMaterial!.colors = colors;
	}

	private _resetColors():	void {
		for (let i = 0; i < this.maxPlayers; i += 1)
			this._colorPool[this.maxPlayers - i - 1] = Game._colors[i];
	}

	public resetCamera():	void {
		setKeys(this._cameraAlphaAnimation, this._camera.alpha, this._cameraAlpha, 20);
		setKeys(this._cameraBetaAnimation, this._camera.beta, this._cameraBeta, 20);
		setKeys(this._cameraRadiusAnimation, this._camera.radius, this._cameraRadius, 20);
		this.scene.beginDirectAnimation(this._camera, [this._cameraAlphaAnimation, this._cameraBetaAnimation, this._cameraRadiusAnimation], 0, 20);
	}

	private	_resizeCallback():	void {
		let		y:	number = this._distance * Math.tan(this._camera.fov / 2);
		const	rect = this.scene.getEngine().getRenderingCanvasClientRect()!;
		let		initHeight:	number = y * (1 - this._padding) * rect.width / rect.height;
		let		ry = initHeight / this._rectangleRatio;
		if (ry > y) {
			ry = y;
			initHeight = y * this._rectangleRatio;
		}
		if (rect.width < rect.height)
			y *= rect.width / rect.height;
		const	ey:		number = y * (1 - this._padding);
		const	yk:		number = y / this._y;
		const	eyk:	number = ey / this._ey;
		const	ihk:	number = initHeight / this._heights[0];
		const	iwsk:	number = 2 * ry / this._wallSizes[0];
		this._heights[0] *= ihk;
		this._wallSizes[0] *= iwsk;
		this._racketMeshScales[0].scaleInPlace(iwsk);
		const	field:	GreasedLineMesh = this._fields[0];
		const	scale:	Vector3 = field.scaling;
		this._fields[0].scaling.set(scale.x * ihk, scale.y * ihk, scale.z);
		this._ballMeshScales[0].scaleInPlace(iwsk);
		for (let i = 1; i < this._heights.length; i += 2)
			this._scaleSizes(i, yk);
		for (let i = 2; i < this._heights.length; i += 2)
			this._scaleSizes(i, eyk);
		this._scaleMeshes();
		switch (this._mode) {
			case Game.GAME_MODE:
				this._drawPlayers(this._lastPlayers);
				this._drawBall(this._lastPlayers.length, this._lastBallPosition);
				break;
			case Game.LOBBY_MODE:
				this._drawPlayers(this._lastPlayers);
				break;
			default: break;
		}
		this._y = y;
		this._ry = ry;
		this._ey = ey;
	}

	private	_scaleSizes(i: int, k: number):	void {
		this._heights[i] *= k;
		this._wallSizes[i] *= k;
		this._racketMeshScales[i].scaleInPlace(k);
		const	field:		GreasedLineMesh = this._fields[i];
		const	fieldScale:	Vector3 = field.scaling;
		field.scaling.set(fieldScale.x * k, fieldScale.y * k, fieldScale.z);
		this._ballMeshScales[i].scaleInPlace(k);
	}
}
