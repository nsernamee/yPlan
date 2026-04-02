<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTaskStore } from '@/stores/task'
import type { TaskColor } from '@/types'
import { isPlannedTask } from '@/types'
import ColorPicker from '@/components/common/ColorPicker.vue'
import TimeInput from '@/components/common/TimeInput.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { X, Trash2 } from 'lucide-vue-next'
import dayjs from 'dayjs'

const taskStore = useTaskStore()

// 表单数据
const title = ref('')
const color = ref<TaskColor>('blue')
const startTime = ref('')
const endTime = ref('')
const note = ref('')

// 是否设置时间
const hasTime = ref(true)

// 确认对话框
const showDeleteConfirm = ref(false)

// 是否编辑模式
const isEditing = computed(() => {
  const result = !!taskStore.editingTask
  console.log('TaskPanel isEditing computed', {
    editingTask: taskStore.editingTask,
    result
  })
  return result
})

// 面板标题
const panelTitle = computed(() => {
  const title = isEditing.value ? '编辑任务' : '新建任务'
  console.log('TaskPanel panelTitle computed', {
    isEditing: isEditing.value,
    title
  })
  return title
})

// 监听编辑任务变化
watch(
  () => taskStore.editingTask,
  (task) => {
    console.log('TaskPanel watch editingTask', { task })
    if (task) {
      title.value = task.title
      color.value = task.color
      startTime.value = task.startTime || ''
      endTime.value = task.endTime || ''
      note.value = task.note || ''
      hasTime.value = isPlannedTask(task)
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
  hasTime.value = true
}

// 关闭面板
function closePanel() {
  taskStore.closePanel()
}

// 保存任务
function handleSave() {
  if (!title.value.trim()) return
  
  // 判断是否设置时间
  const shouldSetTime = hasTime.value && startTime.value && endTime.value
  
  if (isEditing.value && taskStore.editingTask) {
    // 编辑模式
    if (shouldSetTime) {
      // 有时间，更新时间和日期
      const dateStr = taskStore.editingTask.startDate || dayjs(taskStore.selectedDate).format('YYYY-MM-DD')
      taskStore.updateTask({
        id: taskStore.editingTask.id,
        title: title.value,
        color: color.value,
        startDate: dateStr,
        endDate: dateStr,
        startTime: startTime.value,
        endTime: endTime.value,
        note: note.value,
      })
    } else {
      // 无时间，只更新基本信息
      taskStore.updateTask({
        id: taskStore.editingTask.id,
        title: title.value,
        color: color.value,
        startDate: undefined,
        endDate: undefined,
        startTime: undefined,
        endTime: undefined,
        note: note.value,
      })
    }
  } else {
    // 创建模式
    if (shouldSetTime) {
      // 有时间，创建带时间的任务
      const dateStr = dayjs(taskStore.selectedDate).format('YYYY-MM-DD')
      taskStore.createTask({
        title: title.value,
        color: color.value,
        startDate: dateStr,
        endDate: dateStr,
        startTime: startTime.value,
        endTime: endTime.value,
        note: note.value,
      })
    } else {
      // 无时间，创建未计划任务
      taskStore.createTask({
        title: title.value,
        color: color.value,
        note: note.value,
      })
    }
  }
}

// 删除任务
function handleDelete() {
  showDeleteConfirm.value = true
}

// 确认删除
function confirmDelete() {
  if (taskStore.editingTask) {
    taskStore.deleteTask(taskStore.editingTask.id)
  }
  showDeleteConfirm.value = false
}
</script>

<template>
  <!-- 遮罩层（移动端） -->
  <div
    class="fixed inset-0 bg-black/50 z-[60] md:hidden panel-mask-enter"
    @click="closePanel"
  />

  <!-- 面板 - 磨砂玻璃效果 -->
  <div class="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl md:border-l md:border-gray-200/50 dark:md:border-gray-700/50 z-[70] flex flex-col panel-enter shadow-2xl">
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

      <!-- 时间设置开关 -->
      <div class="flex items-center gap-3">
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            v-model="hasTime"
            type="checkbox"
            class="sr-only peer"
          />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
        </label>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          设置时间
        </span>
      </div>

      <!-- 时间 -->
      <div v-if="hasTime" class="grid grid-cols-2 gap-4">
        <TimeInput v-model="startTime" label="开始时间" />
        <TimeInput v-model="endTime" label="结束时间" />
      </div>

      <!-- 提示 -->
      <div v-if="!hasTime" class="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p class="text-xs text-blue-700 dark:text-blue-300">
          未设置时间的任务将显示为"未计划"，可稍后拖入日历安排时间
        </p>
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

  <!-- 删除确认对话框 -->
  <ConfirmDialog
    v-model="showDeleteConfirm"
    title="删除任务"
    message="确定要删除这个任务吗？此操作无法撤销。"
    confirm-text="删除"
    cancel-text="取消"
    :danger="true"
    @confirm="confirmDelete"
  />
</template>
