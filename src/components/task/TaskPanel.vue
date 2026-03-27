<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTaskStore } from '@/stores/task'
import type { TaskColor } from '@/types'
import ColorPicker from '@/components/common/ColorPicker.vue'
import TimeInput from '@/components/common/TimeInput.vue'
import { X, Trash2 } from 'lucide-vue-next'
import dayjs from 'dayjs'

const taskStore = useTaskStore()

// 表单数据
const title = ref('')
const color = ref<TaskColor>('blue')
const startTime = ref('09:00')
const endTime = ref('10:00')
const note = ref('')

// 是否编辑模式
const isEditing = computed(() => !!taskStore.editingTask)

// 面板标题
const panelTitle = computed(() => isEditing.value ? '编辑任务' : '新建任务')

// 监听编辑任务变化
watch(
  () => taskStore.editingTask,
  (task) => {
    if (task) {
      title.value = task.title
      color.value = task.color
      startTime.value = task.startTime
      endTime.value = task.endTime
      note.value = task.note || ''
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// 重置表单
function resetForm() {
  title.value = ''
  color.value = 'blue'
  startTime.value = '09:00'
  endTime.value = '10:00'
  note.value = ''
}

// 关闭面板
function closePanel() {
  taskStore.closePanel()
}

// 保存任务
function handleSave() {
  if (!title.value.trim()) return
  
  const dateStr = dayjs(taskStore.selectedDate).format('YYYY-MM-DD')
  
  if (isEditing.value && taskStore.editingTask) {
    taskStore.updateTask({
      id: taskStore.editingTask.id,
      title: title.value,
      color: color.value,
      startTime: startTime.value,
      endTime: endTime.value,
      note: note.value,
    })
  } else {
    taskStore.createTask({
      title: title.value,
      color: color.value,
      startDate: dateStr,
      endDate: dateStr,
      startTime: startTime.value,
      endTime: endTime.value,
      note: note.value,
    })
  }
}

// 删除任务
function handleDelete() {
  if (taskStore.editingTask && confirm('确定要删除这个任务吗？')) {
    taskStore.deleteTask(taskStore.editingTask.id)
  }
}
</script>

<template>
  <!-- 遮罩层（移动端） -->
  <div
    class="fixed inset-0 bg-black/50 z-40 md:hidden panel-mask-enter"
    @click="closePanel"
  />

  <!-- 面板 - 磨砂玻璃效果 -->
  <div class="fixed md:relative right-0 top-0 bottom-0 w-full md:w-96 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl md:border-l md:border-gray-200/50 dark:md:border-gray-700/50 z-50 flex flex-col panel-enter">
    <!-- 头部 -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ panelTitle }}</h2>
      <button
        @click="closePanel"
        class="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors btn-apple"
      >
        <X class="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </button>
    </div>

    <!-- 表单内容 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- 标题 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">任务标题</label>
        <input
          v-model="title"
          type="text"
          placeholder="输入任务标题"
          class="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
        />
      </div>

      <!-- 时间 -->
      <div class="grid grid-cols-2 gap-4">
        <TimeInput v-model="startTime" label="开始时间" />
        <TimeInput v-model="endTime" label="结束时间" />
      </div>

      <!-- 颜色 -->
      <ColorPicker v-model="color" />

      <!-- 备注 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">备注</label>
        <textarea
          v-model="note"
          placeholder="添加备注..."
          rows="3"
          class="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all duration-200"
        />
      </div>
    </div>

    <!-- 底部按钮 - 苹果风格 -->
    <div class="p-4 border-t border-gray-200/50 dark:border-gray-700/50 flex gap-3">
      <button
        v-if="isEditing"
        @click="handleDelete"
        class="flex items-center gap-2 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors btn-apple"
      >
        <Trash2 class="w-4 h-4" />
        删除
      </button>
      <div class="flex-1" />
      <button
        @click="closePanel"
        class="px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors btn-apple-secondary"
      >
        取消
      </button>
      <button
        @click="handleSave"
        :disabled="!title.trim()"
        class="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-light hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 btn-apple disabled:opacity-50 disabled:cursor-not-allowed"
      >
        保存
      </button>
    </div>
  </div>
</template>
