import { int, Observable } from "@babylonjs/core";

type LobbyConnect =
{
	rooms:			RoomInfo[];
	// currentRoomId:	string;
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

export type GameState =
{
	state:				"countdown" | "finished" | "playing";
	players:			GamePlayer[];
	ballPosition:		[number, number];
	countdownSeconds:	number | undefined;
}

export type GamePlayer =
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
	createRoom:
	{
		roomId:		string;
		success:	boolean;
	}
}

type JoinRoom =
{
	joinRoom:
	{
		roomId:		string;
		success:	boolean;
	}
}

type LeaveRoom = 
{
	leaveRoom:
	{
		success:	boolean;
	}
}

type RoomStateChanged =
{
	roomStateChanged:
	{
		roomId:		string;
	}
}

export type RoomPlayer =
{
	id:			string;
	isReady:	boolean;
	username:	string;
};

export interface RoomInfo
{
	id:			string;
	name:		string;
	count:		number;
	state:		RoomState;
	entryFee:	number;
	maxPlayers:	number;
}

export interface RoomDetails
{
	players:	Set<RoomPlayer>;
	creator:	RoomPlayer;
	createdAt:	Date;
}

export class ServerGame
{
	private _lobbyWs?:						WebSocket;
	private _gameState?:					GameState;
	private _sessionId?:					string;
	private _currentRoomId?:				string;
	public onRoomsUpdatedObservable:		Observable<RoomInfo[]>;
	public onRoomDetailsUpdatedObservable:	Observable<RoomDetails>;

	constructor()
	{
		this.onRoomsUpdatedObservable = new Observable<RoomInfo[]>();
		this.onRoomDetailsUpdatedObservable = new Observable<RoomDetails>();
		this.lobbyWs();

		// Resubscription logic
		// this.resubscribeToRoom();
		// this.resubscribeToGame();

		// this.handleClientEvent();
		// this.requestSessionIdFromParent();
	}

	public	lobbyWs() : void {
		this._lobbyWs = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/lobby?sId=${this._sessionId}`);

		this._lobbyWs.onopen = () => {
			console.log("Connected to Lobby WebSocket ");
		};

		this._lobbyWs.onmessage = (event: MessageEvent) =>
		{
			try
			{
				// figure out what event was sent from the server
				const data: LobbyConnect | CreateRoom | JoinRoom | LeaveRoom | RoomDetails | RoomStateChanged | GameState | GameResult
					= JSON.parse(event.data);

				console.log(`got the data: ${data}`);
				if ("rooms" in data) // LobbyConnect
				{
					this.onRoomsUpdatedObservable.notifyObservers(data.rooms);
				}
				else if ("createRoom" in data) // CreateRoom
				{
					this._currentRoomId = data.createRoom.roomId;
				}
				else if ("joinRoom" in data) // JoinRoom
				{
					this._currentRoomId = data.joinRoom.roomId;
				}
				else if ("createRoom" in data)
				{
					this._currentRoomId = undefined;
				}
				else if ("creator" in data) // RoomDetails
				{
					this.onRoomDetailsUpdatedObservable.notifyObservers(data);
				}
				else if ("roomStateChanged" in data) // RoomStateChanged
				{
					data.roomStateChanged.roomId
				}
				else if ("ballPosition" in data) // GameState
				{
					this._gameState = data;
				}
				else if ("gameResult" in data) // GameResult
				{
					data.gameResult.state
				}
			}
			catch (error)
			{
				console.error('Error parsing lobby message:', error);
			}
		};

		this._lobbyWs.onclose = () => {
			console.log("Disconnected Lobby WebSocket");
		};

		this._lobbyWs.onerror = (error) => {
			console.log("Lobby WebSocket error: ", error);
		};
	}

	public getRooms() : void
	{
		const type = "GET_ROOMS";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type }));
	}

	public getRoomDetails() : void
	{
		const type = "GET_ROOM";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }));
	}

	public createRoom(
		name: string,
		entryFee: int,
		maxPlayers: int
	) : void
	{
		const type = "CREATE_ROOM";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, maxPlayers, entryFee, name }));
	}

	public joinRoom(roomId: string) : void
	{
		const type = "JOIN_ROOM";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId }));
	}

	public leaveRoom() : void
	{
		const type = "LEAVE_ROOM";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }));
	}

	public markRoomPlayerReady(roomId: string) : void
	{
		const type = "READY";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId }));
	}

	public markRoomPlayerWaiting(roomId: string) : void
	{
		const type = "WAITING";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId }));
	}

	public startGame() : void
	{
		const type = "START_GAME";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }));
	}

	public subscribeToRoom() : void
	{
		const type = "SUBSCRIBE_ROOM";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }))
	}

	public subscribeToGame() : void
	{
		const type = "SUBSCRIBE_GAME";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }))
	}

	public usubscribeFromRoom()
	{
		const type = "UNSUBSCRIBE_ROOM";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }))
	}

	public unsubscribeFromGame()
	{
		const type = "UNSUBSCRIBE_GAME";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }))
	}

	public subscribeToLobby()
	{
		const type = "SUBSCRIBE_LOBBY";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type }));
	}
	
	public unsubscribeFromLobby()
	{
		const type = "UNSUBSCRIBE_LOBBY";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type }));
	}

	// public sendDragToServer(dragValue: number)
	// {
	// 	const type = "GAME_DATA";

	// 	if (this.isWebSocketOpen(this._gameWs) && this._gameState!.players.length == 2)
	// 		this._gameWs!.send((dragValue * 1000).toString());
	// 	else if (this.isWebSocketOpen(this._gameWs) && this._gameState!.players.length > 2)
	// 		this._gameWs!.send((dragValue * 500).toString());
	// }

	// public roomDetails(roomId: string): void
	// {
	// 	const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/${roomId}/details?sId=${this._sessionId}`);

	// 	ws.onopen = () =>
	// 	{
	// 		console.log("Connected to RoomDetails WebSocket");
	// 		ws.send(JSON.stringify({ roomId }));
	// 	};

	// 	ws.onmessage = (event: MessageEvent) =>
	// 	{
	// 		try
	// 		{
	// 			const data: RoomDetails = JSON.parse(event.data);
	// 			ws.close();

	// 			// Notify observers with the new details
	// 			this.onRoomDetailsUpdatedObservable.notifyObservers(data);
	// 		}
	// 		catch (error)
	// 		{
	// 			console.error("Error parsing room details:", error);
	// 		}
	// 	};

	// 	ws.onerror = (error) =>
	// 	{
	// 		console.error("RoomDetails WebSocket error:", error);
	// 	};

	// 	ws.onclose = () =>
	// 	{
	// 		console.log("RoomDetails ws has closed");
	// 	};
	// }


	// public createRoomWs(
	// 	name: string,
	// 	entryFee: int,
	// 	maxPlayers: int,
	// )
	// {
	// 	const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/create?sId=${this._sessionId}`);

	// 	ws.onopen = () =>
	// 	{
	// 		console.log("Connected to CreateRoom WebSocket");
	// 		if (!this._currentRoomId)
	// 			ws.send(JSON.stringify({ maxPlayers, entryFee, name }));
	// 		else
	// 			ws.close();
	// 	};

	// 	ws.onmessage = (event: MessageEvent) =>
	// 	{
	// 		console.log(event.data);
	// 		const data : CreateRoom = JSON.parse(event.data);
	
	// 		if (data.success)
	// 		{
	// 			this._currentRoomId = data.roomId;

	// 			// this.gameWs();
	// 			this.refreshRooms();
	// 		}

	// 		ws.close();
	// 	};

	// 	ws.onclose = () =>
	// 	{
	// 		console.log("CreateWs has closed");
	// 	};
	// }

	// public leaveRoomWs() : void
	// {
	// 	const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/leave?sId=${this._sessionId}`)

	// 	ws.onopen = () =>
	// 	{
	// 		ws.send(JSON.stringify({ roomId: this._currentRoomId }));
	// 		this._currentRoomId = undefined;
	// 	};

	// 	ws.onmessage = (event) =>
	// 	{
	// 		const data: LeaveRoom = JSON.parse(event.data);

	// 		if (data.success)
	// 		{
	// 			this.refreshRoom();

	// 			this._currentRoomId = undefined;
	// 			if (this._gameWs)
	// 			{
	// 				this._gameWs.close();
	// 				this._gameWs = undefined;
	// 			}
	// 		}

	// 		ws.close();
	// 	};

	// }

	// public joinRoomWs(roomId: string) : void
	// {
	// 	const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/join?sId=${this._sessionId}`);

	// 	ws.onopen = () =>
	// 	{
	// 		console.log("Connected to JoinRoom WebSocket");
	// 		if (!this._currentRoomId)
	// 			ws.send(JSON.stringify({ roomId }));
	// 		else
	// 			ws.close();
	// 	};

	// 	ws.onmessage = (event: MessageEvent) =>
	// 	{
	// 		const data : JoinRoom = JSON.parse(event.data);

	// 		if (data.success)
	// 		{
	// 			this._currentRoomId = data.roomId;
	// 			console.log("connecting to game ws");
	// 			this.gameWs();
	// 			// Maybe it's meaningless to update all rooms when someone joins one?
	// 			this.refreshRooms();
	// 			// this.refreshRoom();
	// 		}

	// 		ws.close();
	// 	};

	// 	ws.onclose = () =>
	// 	{};
	// }

	// public markRoomPlayerWaitingWs() : void
	// {
	// 	const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/markWaiting?sId=${this._sessionId}`);
		
	// 	ws.onopen = () =>
	// 	{
	// 		ws.send('mark room as waiting');
	// 	};

	// 	ws.onmessage = (event) =>
	// 	{
	// 		const data: RoomStateChanged = JSON.parse(event.data);

	// 		if (data.roomStateChanged)
	// 			this.refreshRoom();

	// 		// console.log();
	// 		ws.close();
	// 	};

	// 	ws.onclose = () =>
	// 	{};
	// }

	// public markRoomPlayerReadyWs() : void
	// {
	// 	const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/markReady?sId=${this._sessionId}`);
		
	// 	ws.onopen = () =>
	// 	{
	// 		ws.send('mark room as waiting');
	// 	};

	// 	ws.onmessage = (event) =>
	// 	{
	// 		const data: RoomStateChanged = JSON.parse(event.data);

	// 		if (data.roomStateChanged)
	// 			this.refreshRoom();

	// 		// console.log();
	// 		ws.close();
	// 	};

	// 	ws.onclose = () =>
	// 	{};
	// }

	// public startGameWs() : void
	// {
	// 	const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/game/${this._currentRoomId}/start?sId=${this._sessionId}`);

	// 	ws.onopen = () =>
	// 	{
	// 		ws.send('START GAME');
	// 	};

	// 	ws.onmessage = (event) =>
	// 	{
	// 		const data : StartGame = JSON.parse(event.data);
	// 		console.log(data.message);
	// 		// this.gameWs();
	// 		ws.close();
	// 	};

	// 	ws.onclose = () =>
	// 	{};
	// }

	// public gameWs() : void
	// {
	// 	if (!this._currentRoomId)
	// 		return;

	// 	this._gameWs = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/game?sId=${this._sessionId}`);

	// 	this._gameWs.onopen = () =>
	// 	{
	// 		console.log("Connected to Game WebSocket");
	// 	};

	// 	this._gameWs.onmessage = (event: MessageEvent) =>
	// 	{
	// 		const data : GameState | GameResult = JSON.parse(event.data);

	// 		if ("ballPosition" in data)
	// 		{
	// 			this._gameState = data;
	// 		}
	// 		else if ("gameResult" in data)
	// 		{
	// 			console.log("Received game result:", data.gameResult.state);
	// 		}
	// 	};
	
	// 	this._gameWs.onclose = () =>
	// 	{};
	// }

	// public refreshRooms() : void
	// {
	// 	if (this.isWebSocketOpen(this._lobbyWs))
	// 		this._lobbyWs!.send("PING");
	// }

	// public refreshRoom() : void
	// {
	// 	if (this._currentRoomId)
	// 		this.roomDetails(this._currentRoomId);
	// 	else
	// 		console.log("Not in a room");
	// }

	// // public handleClientEvent()
	// // {
	// // 	window.addEventListener("message", (event: MessageEvent) =>
	// // 	{
	// // 		switch (event.data.type)
	// // 		{
	// // 			case "SESSION_ID_RESPONSE":
	// // 				this._sessionId = event.data.sessionId;
	// // 				this.lobbyWs();
	// // 				break;
	// // 			default:
	// // 				break;
	// // 		}
	// // 	});
	// // }

	// // public requestSessionIdFromParent()
	// // {
	// // 	const parentOrigin = window.location.ancestorOrigins 
	// // 		? window.location.ancestorOrigins[0] 
	// // 		: '*';

	// // 	window.parent.postMessage(
	// // 		{ type: 'REQUEST_SESSION' },
	// // 		parentOrigin
	// // 	);
	// // }

	// public get rooms() : RoomInfo[]
	// {
	// 	return this._rooms!;
	// }

	// public get gameState() : GameState
	// {
	// 	return this._gameState!;
	// }

	// // private reconnectToGame(data: any)
	// // {
	// // 	if (this._currentRoomId)
	// // 	{
	// // 		const currentRoom = data.rooms.find((r: { isCurrentRoom: any; }) => r.isCurrentRoom);
	// // 		if (currentRoom)
	// // 		{
	// // 			this._isCreator = currentRoom.isCreator;

	// // 			if (!this.isWebSocketOpen(this._gameWs))
	// // 			{
	// // 				console.log('Auto-reconnecting to game after page refresh');
	// // 				this.gameWs();
	// // 			}
	// // 		}
	// // 	}
	// // }

	private isWebSocketOpen(ws: WebSocket | undefined): boolean
	{
		if (ws)
			return ws.readyState === WebSocket.OPEN;

		return false;
	}
}