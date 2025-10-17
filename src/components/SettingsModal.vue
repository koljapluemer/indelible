<template>
  <div v-if="isVisible" class="modal modal-open">
    <div class="modal-box max-w-md">
      <h3 class="font-bold text-lg mb-4">Settings & Sync</h3>

      <!-- Sync Status Display -->
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-sm font-semibold">Sync Status:</span>
          <span class="text-sm" :class="syncStatusClass">{{ cloudSync.syncStatus.value }}</span>
        </div>
      </div>

      <!-- Not Logged In State -->
      <div v-if="!cloudSync.isLoggedIn.value && !userInteractionData" class="space-y-4">
        <div class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="text-sm">Sign in to sync your canvases across devices</span>
        </div>
        <button class="btn btn-primary w-full" @click="handleLogin">
          Sign In to Sync
        </button>
      </div>

      <!-- User Interaction Handler (Email/OTP Input) -->
      <div v-else-if="userInteractionData" class="space-y-4">
        <!-- Title -->
        <div v-if="userInteractionData.title" class="text-sm font-semibold">
          {{ userInteractionData.title }}
        </div>

        <!-- Alerts -->
        <div v-if="userInteractionData.alerts && userInteractionData.alerts.length > 0">
          <div
            v-for="(alert, index) in userInteractionData.alerts"
            :key="index"
            class="alert mb-2"
            :class="{
              'alert-info': alert.type === 'info',
              'alert-warning': alert.type === 'warning',
              'alert-error': alert.type === 'error'
            }"
          >
            <svg v-if="alert.type === 'info'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span class="text-sm">{{ formatAlertMessage(alert) }}</span>
          </div>
        </div>

        <!-- Input Fields -->
        <div v-if="userInteractionData.fields" class="space-y-3">
          <div
            v-for="(field, key) in userInteractionData.fields"
            :key="key"
            class="form-control w-full"
          >
            <label class="label">
              <span class="label-text">{{ field.label }}</span>
            </label>
            <input
              v-model="interactionInputs[key]"
              :type="field.type || 'text'"
              :placeholder="field.placeholder || ''"
              class="input input-bordered w-full"
              @keyup.enter="handleSubmitInteraction"
            />
          </div>
        </div>

        <!-- Message Alert (no fields, just a message) -->
        <div v-else-if="userInteractionData.type === 'message-alert'" class="alert">
          <span>{{ userInteractionData.title }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="modal-action">
          <button
            v-if="userInteractionData.cancelLabel"
            class="btn btn-ghost"
            @click="handleCancelInteraction"
          >
            {{ userInteractionData.cancelLabel || 'Cancel' }}
          </button>
          <button
            v-if="userInteractionData.submitLabel"
            class="btn btn-primary"
            @click="handleSubmitInteraction"
          >
            {{ userInteractionData.submitLabel || 'Submit' }}
          </button>
        </div>
      </div>

      <!-- Logged In State -->
      <div v-else-if="cloudSync.isLoggedIn.value" class="space-y-4">
        <div class="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex flex-col">
            <span class="font-semibold">Synced</span>
            <span class="text-sm opacity-80">{{ currentUserData?.email }}</span>
          </div>
        </div>

        <button class="btn btn-error btn-outline w-full" @click="handleLogout">
          Sign Out
        </button>
      </div>

      <!-- Close Button -->
      <div class="modal-action mt-6">
        <button class="btn" @click="$emit('close')">
          Close
        </button>
      </div>
    </div>
    <div class="modal-backdrop" @click="$emit('close')"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCloudSync } from '@/composables/useCloudSync'

interface SettingsModalProps {
  isVisible: boolean
}

interface SettingsModalEmits {
  close: []
}

defineProps<SettingsModalProps>()
defineEmits<SettingsModalEmits>()

const cloudSync = useCloudSync()
const interactionInputs = ref<Record<string, string>>({})

// Reset inputs when interaction changes
watch(() => cloudSync.userInteraction.value, (interaction) => {
  const interactionData = interaction as any
  if (interactionData?.fields) {
    interactionInputs.value = {}
  }
})

const syncStatusClass = computed(() => {
  const status = cloudSync.syncStatus.value
  if (status.includes('Syncing') || status.includes('Connecting')) {
    return 'text-info'
  }
  if (status.includes('Connected')) {
    return 'text-success'
  }
  if (status.includes('Error')) {
    return 'text-error'
  }
  return 'text-base-content'
})

// Helper computed properties for template
const currentUserData = computed(() => cloudSync.currentUser.value as any)
const userInteractionData = computed(() => cloudSync.userInteraction.value as any)

const handleLogin = async () => {
  try {
    await cloudSync.login()
  } catch (error) {
    console.error('Login failed:', error)
  }
}

const handleLogout = async () => {
  try {
    await cloudSync.logout()
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const handleSubmitInteraction = () => {
  cloudSync.submitInteraction(interactionInputs.value)
  interactionInputs.value = {}
}

const handleCancelInteraction = () => {
  cloudSync.cancelInteraction()
  interactionInputs.value = {}
}

const formatAlertMessage = (alert: any) => {
  let message = alert.message || ''
  // Replace message parameters like {email} with actual values
  if (alert.messageParams) {
    Object.keys(alert.messageParams).forEach(key => {
      message = message.replace(`{${key}}`, alert.messageParams[key])
    })
  }
  return message
}
</script>
