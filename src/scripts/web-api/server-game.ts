import { int, Observable } from "@babylonjs/core";

type LobbyConnect =
{
	rooms:			RoomInfo[];
	currentRoomId:	string;
}

type StartGame =
{
	success:	boolean;
	message:	string;
}

type GameInit =
{
	type:	string;
	roomId:	string;
}

type GameState =
{
	state:				"countdown" | "finished" | "playing";
	players:			GamePlayer[];
	ballPosition:		[number, number];
	countdownSeconds:	number | undefined;
}

type GamePlayer =
{
	id:				string;
	username:		string;
	position:		number;
}

type GameResult =
{
	gameResult:
	{
		players:	Array<
		{
			id:				string;
			score:			number;
			place:			string;
			username:		string;
			isActive:		boolean;
			playersKicked:	number;
		}>;
		fee:		number
		state:		'finished' | 'aborted';
	}
}

type RoomState = "waiting" | "ready";

type CreateRoom =
{
	roomId:		string;
	success:	boolean;
}

type JoinRoom = CreateRoom;

type LeaveRoom = 
{
	success:	boolean;
	room:		RoomInfo;
}

type RoomStateChanged =
{
	roomStateChanged:
	{
		roomId:		string;
		// newState:	string;
		room:		RoomInfo;
	}
}

type RoomPlayer =
{
	id:			string;
	isReady:	boolean;
	username:	string;
};

interface RoomInfo
{
	id:			string;
	name:		string;
	count:		number;
	state:		RoomState;
	entryFee:	number;
	maxPlayers:	number;
}

interface RoomDetails
{
	players:	Set<RoomPlayer>;
	creator:	RoomPlayer;
	createdAt:	Date;
}

export class ServerGame
{
	private readonly	_roomsMap:					Map<string, RoomInfo> = new Map();
	private				_rooms?:					RoomInfo[];
	private				_gameWs?:					WebSocket;
	private				_lobbyWs?:					WebSocket;
	private				_gameState?:				GameState;
	private				_sessionId?:				string;
	private				_currentRoomId?:			string;
	public				onRoomsUpdatedObservable:	Observable<RoomInfo[]>;

	constructor()
	{
		this.onRoomsUpdatedObservable = new Observable<RoomInfo[]>();
		this.lobbyWs();
		// this.handleClientEvent();
		// this.requestSessionIdFromParent();
	}

	public lobbyWs() : void
	{
		this._lobbyWs = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/lobby?sId=${this._sessionId}`);

		this._lobbyWs.onopen = () =>
		{
			console.log("Connected to Lobby WebSocket ");
		};

		this._lobbyWs.onmessage = (event: MessageEvent) =>
		{
			try
			{
				const data: LobbyConnect = JSON.parse(event.data);
				this._currentRoomId = data.currentRoomId;
				this._rooms = data.rooms;
				this._roomsMap.clear();
				for (const room of this._rooms)
					this._roomsMap.set(room.id, room);
				this.onRoomsUpdatedObservable.notifyObservers(this._rooms);
			}
			catch (error)
			{
				console.error('Error parsing lobby message:', error);
			}
		};

		this._lobbyWs.onclose = () =>
		{
			console.log("Disconnected Lobby WebSocket");
		};

		this._lobbyWs.onerror = (error) =>
		{
			console.log("Lobby WebSocket error: ", error);
		};
	}

	public getRoomDetails(): Promise<RoomDetails>
	{
		const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/${this._currentRoomId}/details?sId=${this._sessionId}`);

		return new Promise((resolve, reject) =>
		{
			ws.onopen = () =>
			{
				console.log("Connected to RoomDetails WebSocket");
				ws.send(JSON.stringify({ roomId : this._currentRoomId }));
			};

			ws.onmessage = (event: MessageEvent) =>
			{
				try
				{
					const data: RoomDetails = JSON.parse(event.data);
					ws.close();

					// Resolve the promise with the data
					resolve(data);
				}
				catch (error)
				{
					reject(error);
				}
			};

			ws.onerror = (error) =>
			{
				console.error("RoomDetails WebSocket error:", error);
				reject(error);
			};

			ws.onclose = () =>
			{
				console.log("RoomDetails ws has closed");
			};
		});
	}

	public createRoomWs(
		name: string,
		entryFee: int,
		maxPlayers: int,
	)
	{
		const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/create?sId=${this._sessionId}`);

		ws.onopen = () =>
		{
			console.log("Connected to CreateRoom WebSocket");
			if (!this._currentRoomId)
				ws.send(JSON.stringify({ maxPlayers, entryFee, name }));
			else
				ws.close();
		};

		ws.onmessage = (event: MessageEvent) =>
		{
			console.log(event.data);
			const data : CreateRoom = JSON.parse(event.data);
	
			if (data.success)
			{
				this._currentRoomId = data.roomId;

				this.gameWs();
			}

			// this.refreshRooms();
			ws.close();
		};

		ws.onclose = () =>
		{
			console.log("CreateWs has closed");
		};
	}

	public leaveRoomWs() : void
	{
		const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/leave?sId=${this._sessionId}`)

		ws.onopen = () =>
		{
			ws.send(JSON.stringify({ roomId: this._currentRoomId }));
			this._currentRoomId = undefined;
		};

		ws.onmessage = (event) =>
		{
			const data: LeaveRoom = JSON.parse(event.data);

			if (data.success)
			{
				this._currentRoomId = undefined;

				if (this._gameWs)
				{
					this._gameWs.close();
					this._gameWs = undefined;
				}
			}

			ws.close();
		};

	}

	public joinRoomWs(roomId: string) : void
	{
		const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/join?sId=${this._sessionId}`);

		ws.onopen = () =>
		{
			console.log("Connected to JoinRoom WebSocket");
			if (!this._currentRoomId)
				ws.send(JSON.stringify({ roomId }));
			else
				ws.close();
		};

		ws.onmessage = (event: MessageEvent) =>
		{
			const data : JoinRoom = JSON.parse(event.data);

			if (data.success)
			{
				this._currentRoomId = data.roomId;
				console.log("connecting to game ws");
				this.gameWs();
				this.refreshRooms();
			}

			ws.close();
		};

		ws.onclose = () =>
		{};
	}

	public markRoomPlayerWaitingWs() : void
	{
		const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/markWaiting?sId=${this._sessionId}`);
		
		ws.onopen = () =>
		{
			ws.send('mark room as waiting');
		};

		ws.onmessage = (event) =>
		{
			const data: RoomStateChanged = JSON.parse(event.data);

			if (data.roomStateChanged)
				this.refreshRooms();

			// console.log();
			ws.close();
		};

		ws.onclose = () =>
		{};
	}

	public markRoomPlayerReadyWs() : void
	{
		const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/markReady?sId=${this._sessionId}`);
		
		ws.onopen = () =>
		{
			ws.send('mark room as waiting');
		};

		ws.onmessage = (event) =>
		{
			const data: RoomStateChanged = JSON.parse(event.data);

			if (data.roomStateChanged)
				this.refreshRooms();

			// console.log();
			ws.close();
		};

		ws.onclose = () =>
		{};
	}

	public startGameWs() : void
	{
		const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/game/${this._currentRoomId}/start?sId=${this._sessionId}`);

		ws.onopen = () =>
		{
			ws.send('START GAME');
		};

		ws.onmessage = (event) =>
		{
			const data : StartGame = JSON.parse(event.data);
			console.log(data.message);
			// this.gameWs();
			ws.close();
		};

		ws.onclose = () =>
		{};
	}

	public gameWs() : void
	{
		if (!this._currentRoomId)
			return;

		this._gameWs = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/game?sId=${this._sessionId}`);

		this._gameWs.onopen = () =>
		{
			console.log("Connected to Game WebSocket");
		};

		this._gameWs.onmessage = (event: MessageEvent) =>
		{
			const data : GameState | GameResult = JSON.parse(event.data);

			if ("ballPosition" in data)
			{
				this._gameState = data;
			}
			else if ("gameResult" in data)
			{
				console.log("Received game result:", data.gameResult.state);
			}
		};
	
		this._gameWs.onclose = () =>
		{};
	}

	public sendDragToServer(dragValue: number)
	{
		if (this.isWebSocketOpen(this._gameWs) && this._gameState!.players.length == 2)
			this._gameWs!.send((dragValue * 1000).toString());
		else if (this.isWebSocketOpen(this._gameWs) && this._gameState!.players.length > 2)
			this._gameWs!.send((dragValue * 500).toString());
	}

	public refreshRooms() : void
	{
		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs!.send("PING");
	}

	// public handleClientEvent()
	// {
	// 	window.addEventListener("message", (event: MessageEvent) =>
	// 	{
	// 		switch (event.data.type)
	// 		{
	// 			case "SESSION_ID_RESPONSE":
	// 				this._sessionId = event.data.sessionId;
	// 				this.lobbyWs();
	// 				break;
	// 			default:
	// 				break;
	// 		}
	// 	});
	// }

	// public requestSessionIdFromParent()
	// {
	// 	const parentOrigin = window.location.ancestorOrigins 
	// 		? window.location.ancestorOrigins[0] 
	// 		: '*';

	// 	window.parent.postMessage(
	// 		{ type: 'REQUEST_SESSION' },
	// 		parentOrigin
	// 	);
	// }

	public get	inGame():	boolean {
		return this._gameState !== null;
	}

	public get	currentRoomInfo():	RoomInfo | undefined {
		return this._currentRoomId ? this._roomsMap.get(this._currentRoomId) : undefined;
	}

	public get rooms() : RoomInfo[]
	{
		return this._rooms!;
	}

	public get gameState() : GameState
	{
		return this._gameState!;
	}

	// private reconnectToGame(data: any)
	// {
	// 	if (this._currentRoomId)
	// 	{
	// 		const currentRoom = data.rooms.find((r: { isCurrentRoom: any; }) => r.isCurrentRoom);
	// 		if (currentRoom)
	// 		{
	// 			this._isCreator = currentRoom.isCreator;

	// 			if (!this.isWebSocketOpen(this._gameWs))
	// 			{
	// 				console.log('Auto-reconnecting to game after page refresh');
	// 				this.gameWs();
	// 			}
	// 		}
	// 	}
	// }

	private isWebSocketOpen(ws: WebSocket | undefined): boolean
	{
		if (ws)
			return ws.readyState === WebSocket.OPEN;

		return false;
	}
}