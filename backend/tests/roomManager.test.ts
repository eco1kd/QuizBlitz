import { describe, it, expect, beforeEach } from 'vitest'
import { RoomManager } from '../src/engine/roomManager.js'

describe('RoomManager', () => {
  let manager: RoomManager

  beforeEach(() => {
    manager = new RoomManager()
  })

  it('generates 6-digit numeric unique codes', () => {
    const code = manager.generateUniqueCode()
    expect(code).toMatch(/^\d{6}$/)

    const set = new Set<string>()
    for (let i = 0; i < 50; i++) {
      set.add(manager.generateUniqueCode())
    }
    expect(set.size).toBe(50)
  })

  it('creates and tracks rooms', () => {
    const room = manager.createRoom({
      topic: 'Космос',
      questionCount: 5,
      difficulty: 'hard'
    })

    expect(room.code).toMatch(/^\d{6}$/)
    expect(room.topic).toBe('Космос')
    expect(manager.getActiveRoomCount()).toBe(1)

    const foundByCode = manager.getRoomByCode(room.code)
    expect(foundByCode?.roomId).toBe(room.roomId)

    const foundById = manager.getRoomById(room.roomId)
    expect(foundById?.code).toBe(room.code)
  })

  it('associates socket IDs with rooms', () => {
    const room = manager.createRoom({ topic: 'IT' })
    manager.associateSocket('sock-101', room.code)

    expect(manager.getRoomBySocketId('sock-101')?.code).toBe(room.code)

    manager.disassociateSocket('sock-101')
    expect(manager.getRoomBySocketId('sock-101')).toBeUndefined()
  })

  it('deletes rooms cleanly', () => {
    const room = manager.createRoom({ topic: 'История' })
    manager.associateSocket('sock-host', room.code)

    const deleted = manager.deleteRoom(room.code)
    expect(deleted).toBe(true)
    expect(manager.getRoomByCode(room.code)).toBeUndefined()
    expect(manager.getRoomBySocketId('sock-host')).toBeUndefined()
    expect(manager.getActiveRoomCount()).toBe(0)
  })
})
