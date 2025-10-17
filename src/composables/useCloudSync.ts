import { ref, computed, onUnmounted } from 'vue'
import { db } from '@/stores/database'
import type { Subscription } from 'dexie'

// Use unknown for types and cast as needed to avoid strict type matching issues
type CloudUser = unknown
type UserInteractionType = unknown

export function useCloudSync() {
  const currentUser = ref<CloudUser>(null)
  const userInteraction = ref<UserInteractionType>(null)
  const syncStatus = ref<string>('not-connected')
  const subscriptions: Subscription[] = []

  // Computed properties
  const isLoggedIn = computed(() => {
    const user = currentUser.value as any
    return user?.isLoggedIn === true && !!user?.email
  })

  const displaySyncStatus = computed(() => {
    // Check if Dexie Cloud is configured
    if (!import.meta.env.VITE_DEXIE_CLOUD_URL) {
      return 'Not configured'
    }

    if (!db.cloud.syncState) return 'Not connected'

    const state = db.cloud.syncState.value as any
    if (!state) return 'Not connected'

    // If not logged in, don't show connected status
    const user = currentUser.value as any
    if (!user?.isLoggedIn) {
      return 'Not synced (local only)'
    }

    switch (state.status) {
      case 'connected':
        if (state.phase === 'pushing' || state.phase === 'pulling') {
          return 'Syncing...'
        }
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'disconnected':
        return 'Disconnected'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  })

  // Subscribe to authentication state
  const subscribeToAuth = () => {
    if (db.cloud.currentUser) {
      const userSub = db.cloud.currentUser.subscribe((user: unknown) => {
        currentUser.value = user ?? null
      })
      subscriptions.push(userSub)
    }

    if (db.cloud.userInteraction) {
      const interactionSub = db.cloud.userInteraction.subscribe((interaction: unknown) => {
        userInteraction.value = interaction ?? null
      })
      subscriptions.push(interactionSub)
    }

    if (db.cloud.syncState) {
      const syncSub = db.cloud.syncState.subscribe((state: unknown) => {
        syncStatus.value = (state as any)?.status ?? 'not-connected'
      })
      subscriptions.push(syncSub)
    }
  }

  // Authentication methods
  const login = async () => {
    try {
      await db.cloud.login()
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await db.cloud.logout()
      currentUser.value = null
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    }
  }

  // Handle user interaction submission
  const submitInteraction = (values: Record<string, string>) => {
    const interaction = userInteraction.value as any
    if (interaction?.onSubmit) {
      interaction.onSubmit(values)
    }
  }

  const cancelInteraction = () => {
    const interaction = userInteraction.value as any
    if (interaction?.onCancel) {
      interaction.onCancel()
    }
  }

  // Initialize subscriptions
  subscribeToAuth()

  // Cleanup on unmount
  onUnmounted(() => {
    subscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe()
      }
    })
  })

  return {
    currentUser,
    isLoggedIn,
    syncStatus: displaySyncStatus,
    userInteraction,
    login,
    logout,
    submitInteraction,
    cancelInteraction
  }
}
