import { Room, type CreateRoomOptions } from './room.js'
import type { GameFinishedData } from '../types/game.js'

export class RoomManager {
  private roomsByCode: Map<string, Room> = new Map() // code -> Room
  private codeByRoomId: Map<string, string> = new Map() // roomId -> code
  private socketToRoomCode: Map<string, string> = new Map() // socketId -> code

  private onGameFinishedHook?: (room: Room, finishedData: GameFinishedData) => void | Promise<void>

  /**
   * Generates a 6-digit numeric room code guaranteed to be unique among active rooms.
   */
  public generateUniqueCode(): string {
    let attempts = 0
    while (attempts < 1000) {
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      if (!this.roomsByCode.has(code)) {
        return code
      }
      attempts++
    }
    // Fallback if very crowded
    return Date.now().toString().slice(-6)
  }

  public setOnGameFinishedHook(hook: (room: Room, finishedData: GameFinishedData) => void | Promise<void>): void {
    this.onGameFinishedHook = hook
    for (const room of this.roomsByCode.values()) {
      room.onGameFinishedHook = hook
    }
  }

  public createRoom(params: {
    topic: string
    questionCount?: number
    difficulty?: 'easy' | 'medium' | 'hard'
    hostNickname?: string
    hostSocketId?: string
    code?: string
    roomId?: string
  }): Room {
    const code = params.code || this.generateUniqueCode()
    const roomId = params.roomId || `room-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    const room = new Room({
      code,
      roomId,
      topic: params.topic,
      questionCount: params.questionCount || 5,
      difficulty: params.difficulty || 'medium',
      hostNickname: params.hostNickname,
      hostSocketId: params.hostSocketId
    })

    if (this.onGameFinishedHook) {
      room.onGameFinishedHook = this.onGameFinishedHook
    }

    this.roomsByCode.set(code, room)
    this.codeByRoomId.set(roomId, code)

    return room
  }

  public getRoomByCode(code: string): Room | undefined {
    return this.roomsByCode.get(code.trim())
  }

  public getRoomById(roomId: string): Room | undefined {
    const code = this.codeByRoomId.get(roomId)
    return code ? this.roomsByCode.get(code) : undefined
  }

  public associateSocket(socketId: string, roomCode: string): void {
    this.socketToRoomCode.set(socketId, roomCode)
  }

  public disassociateSocket(socketId: string): void {
    this.socketToRoomCode.delete(socketId)
  }

  public getRoomBySocketId(socketId: string): Room | undefined {
    const code = this.socketToRoomCode.get(socketId)
    return code ? this.roomsByCode.get(code) : undefined
  }

  public deleteRoom(code: string): boolean {
    const room = this.roomsByCode.get(code)
    if (!room) return false

    room.destroy()
    this.codeByRoomId.delete(room.roomId)
    this.roomsByCode.delete(code)

    // Remove any socket associations pointing to this room
    for (const [sId, rCode] of this.socketToRoomCode.entries()) {
      if (rCode === code) {
        this.socketToRoomCode.delete(sId)
      }
    }

    return true
  }

  public getAllRooms(): Room[] {
    return Array.from(this.roomsByCode.values())
  }

  public getActiveRoomCount(): number {
    return this.roomsByCode.size
  }

  public clear(): void {
    for (const code of Array.from(this.roomsByCode.keys())) {
      this.deleteRoom(code)
    }
  }
}

export const roomManager = new RoomManager()
