<script setup lang="ts">
import { ref, watch } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const isVisible = ref(false)

watch(() => props.modelValue, (val) => {
  if (val) {
    // 延迟显示以触发动画
    setTimeout(() => {
      isVisible.value = true
    }, 10)
  } else {
    isVisible.value = false
  }
})

function handleConfirm() {
  emit('confirm')
  emit('update:modelValue', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:modelValue', false)
}

function handleMaskClick() {
  handleCancel()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        @click.self="handleMaskClick"
      >
        <!-- 遮罩层 -->
        <Transition name="mask">
          <div
            v-if="isVisible"
            class="absolute inset-0 bg-black/20 dark:bg-black/40"
          />
        </Transition>
        
        <!-- 对话框 -->
        <Transition name="modal">
          <div
            v-if="isVisible"
            :class="[
              'relative w-full max-w-sm rounded-2xl overflow-hidden',
              'bg-white/80 dark:bg-gray-900/80',
              'backdrop-blur-xl',
              'border border-gray-200/50 dark:border-gray-700/50',
              'shadow-2xl'
            ]"
          >
            <!-- 图标和内容 -->
            <div class="p-6 text-center">
              <!-- 图标 -->
              <div
                :class="[
                  'mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4',
                  danger 
                    ? 'bg-red-100 dark:bg-red-900/30' 
                    : 'bg-primary/10 dark:bg-primary/20'
                ]"
              >
                <AlertTriangle
                  :class="[
                    'w-6 h-6',
                    danger 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-primary dark:text-primary-light'
                  ]"
                />
              </div>
              
              <!-- 标题 -->
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {{ title }}
              </h3>
              
              <!-- 消息 -->
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {{ message }}
              </p>
              
              <!-- 按钮 -->
              <div class="flex gap-3">
                <button
                  @click="handleCancel"
                  class="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 btn-apple"
                >
                  {{ cancelText || '取消' }}
                </button>
                <button
                  @click="handleConfirm"
                  :class="[
                    'flex-1 px-4 py-2.5 rounded-xl transition-all duration-200 btn-apple text-white',
                    danger
                      ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-600/25'
                      : 'bg-primary hover:bg-primary-light hover:shadow-primary/25'
                  ]"
                >
                  {{ confirmText || '确认' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 遮罩层动画 */
.mask-enter-active {
  transition: opacity 0.25s ease-out;
}

.mask-leave-active {
  transition: opacity 0.2s ease-in;
}

.mask-enter-from,
.mask-leave-to {
  opacity: 0;
}

.mask-enter-to,
.mask-leave-from {
  opacity: 1;
}

/* 对话框动画 */
.modal-enter-active {
  transition: all 0.25s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.modal-leave-active {
  transition: all 0.2s ease-in;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}

.modal-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.modal-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}

/* 容器动画 */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0s;
}
</style>
