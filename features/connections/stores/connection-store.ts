import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { type ConnectionListItem } from '../data'

interface ConnectionState {
  connections: ConnectionListItem[]
  setConnections: (list: ConnectionListItem[]) => void
  addConnection: (item: ConnectionListItem) => void
  updateConnection: (item: ConnectionListItem) => void
  removeConnection: (id: string) => void
}

export const useConnectionStore = create<ConnectionState>()(
  devtools((set) => ({
    connections: [],
    setConnections: (list) => set({ connections: list }),
    addConnection: (item) =>
      set((state) => ({ connections: [...state.connections, item] })),
    updateConnection: (item) =>
      set((state) => ({
        connections: state.connections.map((c) =>
          c.id === item.id ? item : c
        ),
      })),
    removeConnection: (id) =>
      set((state) => ({
        connections: state.connections.filter((c) => c.id !== id),
      })),
  }))
)
