import { Color3, CreateGreasedLine, GreasedLineBaseMesh, GreasedLineTools, int, Mesh, Nullable, Scene } from "@babylonjs/core";
import WebApi from "./web-api";
import { getScriptByClassForObject, IScript, visibleAsEntity } from "babylonjs-editor-tools";

export default class Game implements IScript {
	private readonly	_webApi:	WebApi;

	private				_playerCount:	int = -1;
	private readonly	_playerColors:	Map<string, Color3> = new Map();

	private	_field:	Nullable<GreasedLineBaseMesh> = null;

	@visibleAsEntity("node", "racket mesh")
	private readonly	_racketMesh:	Nullable<Mesh> = null;

	public constructor(public scene: Scene) {
		this._webApi = getScriptByClassForObject(scene, WebApi)!;
	}

	public onStart(): void {
		// Do something when the script is loaded
	}

	public onUpdate(): void {
		if (this._webApi.serverGame.inGame) {
			const	gameState = this._webApi.serverGame.gameState;
			const	players = gameState.players;
			if (this._playerColors.size === 0) {
				for (let i = 0; i < players.length; i += 1)
					this._playerColors.set(players[i].id, Color3.Random());
			}
			if (this._playerCount !== players.length) {
				const	keysIter:	MapIterator<string> = this._playerColors.keys();
				let	id = keysIter.next();
				
				this._playerCount = players.length;
				if (this._field)
					this._field.dispose();
				const	rect = this.scene.getEngine().getRenderingCanvasClientRect()!;
				const	diameter:	number = Math.min(rect.width, rect.height);
				this._field = CreateGreasedLine("field", {
						points: GreasedLineTools.GetCircleLinePoints(diameter / 2, players.length)
					}, {
						useColors: true,
						colors: this._playerColors,
						useDash: true,
						dashCount: 15,
					})
			}
		} else {
			if (this._field) {
				this._field.dispose();
				this._field = null;
			}
			this._playerCount = -1;
			if (this._playerColors.length)
				this._playerColors.pop();
		}
	}

	drawArena(ctx: any, canvas: any) {
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const radius = 300;

		// Check if we're in 2-player mode for square arena
		// if (this.gameState && this.gameState.players && this.gameState.players.length === 2) {
			// Draw square arena for 2-player mode
			ctx.strokeStyle = '#00ff00';
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.rect(centerX - radius, centerY - radius * 0.5, radius * 2, radius);
			ctx.stroke();
		// } else {
			// Draw circular arena for multi-player mode
			ctx.strokeStyle = '#00ff00';
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
			ctx.stroke();

		// Draw center dot
		ctx.fillStyle = '#00ff00';
		ctx.beginPath();
		ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
		ctx.fill();
	}

	drawBall(ctx: any, canvas: any, ballPos: any) {
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const radius = 300;

		const ballX = centerX + ballPos[0] * radius;
		const ballY = centerY + ballPos[1] * radius;

		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
		ctx.fill();
	}

	drawPlayers(ctx: any, canvas: any, players: any) {
		if (!players || players.length === 0) {
			console.log('No players to draw');
			return;
		}

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const radius = 300;

		// Special case for 2 players - use left/right virtual positions (x = -1 and x = 1)
		if (players.length === 2) {
			const paddleWidth = 0.1;
			
			players.forEach((player: any, index: any) => {
				// Apply server-side logic: calculateTwoPlayersPositions
				const playerDist = player.position - 0.5;
				let virtualX, virtualY;
				
				if (index === 0) {
					// Left player
					virtualX = -1;
					virtualY = playerDist;
				} else {
					// Right player
					virtualX = 1;
					virtualY = playerDist;
				}

				// Map virtual coords to screen (paddle center)
				const screenX = centerX + virtualX * radius;
				const screenY = centerY + virtualY * radius;

				// Calculate paddle endpoints (vertical paddle)
				const paddleHalfLength = paddleWidth * radius;
				const leftX = screenX;
				const leftY = screenY - paddleHalfLength;
				const rightX = screenX;
				const rightY = screenY + paddleHalfLength;
				
				// Draw paddle using moveTo/lineTo pattern
				ctx.strokeStyle = player.isActive ? '#00ff00' : '#ff4444';
				ctx.lineWidth = 6;
				ctx.beginPath();
				ctx.moveTo(leftX, leftY);
				ctx.lineTo(rightX, rightY);
				ctx.stroke();

				// Draw player name
				ctx.fillStyle = player.isActive ? '#00ff00' : '#ff4444';
				ctx.font = '12px Courier New';
				ctx.textAlign = 'center';
				ctx.fillText(player.username, screenX, screenY - paddleHalfLength - 10);
			});
			return;
		}

		// Original multi-player circular arrangement
		const playerCount = players.length;
		const alpha = (Math.PI * 2) / playerCount;
		const height = 0.5 / Math.tan(alpha / 2);
		const paddleWidth = 0.1;

		players.forEach((player: any, index: number) => {
			const beta = alpha * index;
			const gamma = beta - (Math.PI / 2);

			// Calculate paddle position
			const distance = player.position - 0.5;
			const distance_x = distance * Math.cos(beta);
			const distance_y = distance * Math.sin(beta);
			const x_center = height * Math.cos(gamma);
			const y_center = height * Math.sin(gamma);
			const paddleX = x_center + distance_x;
			const paddleY = y_center + distance_y;

			// Draw paddle
			const screenX = centerX + paddleX * radius;
			const screenY = centerY + paddleY * radius;

			const leftX = screenX - paddleWidth * Math.cos(beta) * radius;
			const leftY = screenY - paddleWidth * Math.sin(beta) * radius;
			const rightX = screenX + paddleWidth * Math.cos(beta) * radius;
			const rightY = screenY + paddleWidth * Math.sin(beta) * radius;

			ctx.strokeStyle = player.isActive ? '#00ff00' : '#ff4444';
			ctx.lineWidth = 6;
			ctx.beginPath();
			ctx.moveTo(leftX, leftY);
			ctx.lineTo(rightX, rightY);
			ctx.stroke();

			// Draw player name
			ctx.fillStyle = player.isActive ? '#00ff00' : '#ff4444';
			ctx.font = '12px Courier New';
			ctx.textAlign = 'center';
			ctx.fillText(player.username, screenX, screenY - 20);
		});
	}

	/** mousemove event listener
	this.canvas.addEventListener('mousemove', (e) => {
		const rect = this.canvas.getBoundingClientRect();
		const newMouseX = (e.clientX - rect.left) / rect.width;

		// Calculate drag delta
		const dragDelta = newMouseX - this.mouseX;
		this.mouseX = newMouseX;

		// Only send input if game is in playing state
		if (!this.gameState || this.gameState.state !== 'playing') {
			return;
		}
	**/

	// 	// Only send if game WebSocket is ready and delta is meaningful
	// 	if (this.gameWs && this.gameWs.readyState === WebSocket.OPEN && Math.abs(dragDelta) > 0.001) {
	// 		// Send drag delta (scaled for sensitivity)
	// 		if (this.gameState.players.length == 2)
	// 			this.gameWs.send((dragDelta * 1000).toString());
	// 		else
	// 			this.gameWs.send((dragDelta * 500).toString());
	// 	}
	// });

	// renderGame() {
	// 	const ctx = this.ctx;
	// 	const canvas = this.canvas;
		
	// 	// Clear canvas
	// 	ctx.fillStyle = '#000';
	// 	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// 	if (!this.gameState) {
	// 		// Draw empty arena
	// 		this.drawArena(ctx, canvas);
	// 		return;
	// 	}

	// 	// Draw arena
	// 	this.drawArena(ctx, canvas);

	// 	// Draw ball
	// 	if (this.gameState.ballPosition) {
	// 		this.drawBall(ctx, canvas, this.gameState.ballPosition);
	// 	}

	// 	// Draw players
	// 	if (this.gameState.players) {
	// 		this.drawPlayers(ctx, canvas, this.gameState.players);
	// 	}
	// }
}


