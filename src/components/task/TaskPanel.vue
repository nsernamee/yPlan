<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTaskStore } from '@/stores/task'
import type { TaskColor } from '@/types'
import ColorPicker from '@/components/common/ColorPicker.vue'
import TimeInput from '@/components/common/TimeInput.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { X, Trash2, Calendar } from 'lucide-vue-next'
import dayjs from 'dayjs'

const taskStore = useTaskStore()

// 表单数据
const title = ref('')
const color = ref<TaskColor>('blue')
const startTime = ref('')
const endTime = ref('')
const note = ref('')
const scheduleDate = ref('')

// 确认对话框
const showDeleteConfirm = ref(false)
// 删除类型：'task' | 'schedule'
const deleteType = ref<'task' | 'schedule'>('task')

// 是否编辑模式
const isEditing = computed(() => !!taskStore.editingTask)

// 是否正在编辑日程（有 schedule 说明从日历点击进入）
const isEditingSchedule = computed(() => !!taskStore.editingSchedule)

// 面板标题
const panelTitle = computed(() => {
  if (!isEditing.value) return '新建任务'
  if (isEditingSchedule.value) return '编辑日程'
  return '编辑任务'
})

// 监听编辑任务和日程变化
watch(
  [() => taskStore.editingTask, () => taskStore.editingSchedule],
  ([task, schedule]) => {
    if (task) {
      title.value = task.title
      color.value = task.color
      note.value = task.note || ''
      
      if (schedule) {
        // 有日程：显示日程的时间和日期
        startTime.value = schedule.startTime
        endTime.value = schedule.endTime
        scheduleDate.value = schedule.date
      } else {
        // 无日程：清空时间
        startTime.value = '09:00'
        endTime.value = '10:00'
        scheduleDate.value = dayjs(taskStore.selectedDate).format('YYYY-MM-DD')
      }
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
  scheduleDate.value = dayjs(taskStore.selectedDate).format('YYYY-MM-DD')
}

// 关闭面板
function closePanel() {
  taskStore.closePanel()
}

// 保存任务
function handleSave() {
  if (!title.value.trim()) return
  
  if (isEditing.value && taskStore.editingTask) {
    // 编辑模式：更新任务属性
    taskStore.updateTask({
      id: taskStore.editingTask.id,
      title: title.value,
      color: color.value,
      note: note.value,
    })
    
    // 如果有日程，也更新日程时间
    if (taskStore.editingSchedule && startTime.value && endTime.value) {
      taskStore.updateSchedule({
        id: taskStore.editingSchedule.id,
        startTime: startTime.value,
        endTime: endTime.value,
      })
    }
    
    closePanel()  // 保存后关闭面板
  } else {
    // 创建模式：创建任务
    taskStore.createTask({
      title: title.value,
      color: color.value,
      note: note.value,
    })
    
    closePanel()  // 保存后关闭面板
  }
}

// 删除日程实例
function handleDeleteSchedule() {
  deleteType.value = 'schedule'
  showDeleteConfirm.value = true
}

// 删除任务
function handleDeleteTask() {
  deleteType.value = 'task'
  showDeleteConfirm.value = true
}

// 确认删除
function confirmDelete() {
  if (deleteType.value === 'schedule' && taskStore.editingSchedule) {
    // 删除日程实例（任务保留）
    taskStore.removeSchedule(taskStore.editingSchedule.id)
    closePanel()  // 关闭编辑窗口
  } else if (deleteType.value === 'task' && taskStore.editingTask) {
    // 删除任务（级联删除所有日程）
    taskStore.deleteTask(taskStore.editingTask.id)
    closePanel()  // 关闭编辑窗口
  }
  showDeleteConfirm.value = false
}

// 获取任务的日程数量
const scheduleCount = computed(() => {
  if (!taskStore.editingTask) return 0
  return taskStore.getTaskSchedules(taskStore.editingTask.id).length
})

// 危险按钮颜色磨砂玻璃样式
const deleteBtnStyle = computed(() => ({
  removeSchedule: {
    backgroundColor: 'rgba(237, 123, 47, 0.13)',
  },
  deleteTask: {
    backgroundColor: 'rgba(227, 77, 89, 0.13)',
  },
}))
</script>

<template>
  <!-- 遮罩层（移动端） -->
  <div
    class="fixed inset-0 bg-black/50 z-[60] md:hidden panel-mask-enter"
    @click="closePanel"
  />

  <!-- 面板 - 磨砂玻璃效果 -->
  <div class="fixed right-0 top-0 bottom-0 w-[min(384px,calc(100vw-32px))] md:w-96 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl md:border-l md:border-gray-200/50 dark:md:border-gray-700/50 z-[70] flex flex-col panel-enter shadow-2xl">
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

      <!-- 时间（仅编辑日程时显示） -->
      <div v-if="isEditingSchedule">
        <div class="flex items-center gap-2 mb-2">
          <Calendar class="w-4 h-4 text-gray-500" />
          <span class="text-sm text-gray-500">{{ scheduleDate }}</span>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <TimeInput v-model="startTime" label="开始时间" />
          <TimeInput v-model="endTime" label="结束时间" />
        </div>
        <p class="text-xs text-gray-400 mt-2">
          修改时间仅影响该日程实例，其他日期的日程不受影响
        </p>
      </div>

      <!-- 日程数量提示（仅编辑任务时显示） -->
      <div v-if="isEditing && !isEditingSchedule && scheduleCount > 0" class="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p class="text-xs text-blue-700 dark:text-blue-300">
          该任务已在 {{ scheduleCount }} 天安排日程
        </p>
      </div>

      <!-- 提示（新建任务） -->
      <div v-if="!isEditing" class="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p class="text-xs text-blue-700 dark:text-blue-300">
          新建的任务默认为"未计划"状态，可稍后从任务列表拖入日历安排时间
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

    <!-- 底部按钮 -->
    <div class="p-4 border-t border-gray-200/50 dark:border-gray-700/50 flex flex-col gap-3">
      <!-- 第一行：危险操作 -->
      <div class="flex items-center gap-3">
        <!-- 编辑日程时：两个按钮均分一行 -->
        <template v-if="isEditingSchedule">
          <button
            @click="handleDeleteSchedule"
            :style="deleteBtnStyle.removeSchedule"
            class="group relative flex-1 flex items-center justify-center gap-2 py-3 backdrop-blur-xl rounded-2xl text-orange-600 dark:text-orange-400 text-sm font-medium shadow-sm hover:shadow-md hover:bg-orange-500/10 active:scale-[0.97] transition-all duration-200"
          >
            <Trash2 class="w-4 h-4 transition-transform group-hover:scale-110" />
            移除日程
          </button>
          <button
            @click="handleDeleteTask"
            :style="deleteBtnStyle.deleteTask"
            class="group relative flex-1 flex items-center justify-center gap-2 py-3 backdrop-blur-xl rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium shadow-sm hover:shadow-md hover:shadow-red-500/10 hover:bg-red-500/10 active:scale-[0.97] transition-all duration-200"
          >
            <Trash2 class="w-4 h-4 transition-transform group-hover:scale-110" />
            删除任务
          </button>
        </template>
        
        <!-- 仅编辑任务时：独占整行 -->
        <button
          v-else-if="isEditing"
          @click="handleDeleteTask"
          :style="deleteBtnStyle.deleteTask"
          class="group relative w-full flex items-center justify-center gap-2 py-3 backdrop-blur-xl rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium shadow-sm hover:shadow-md hover:shadow-red-500/10 hover:bg-red-500/10 active:scale-[0.97] transition-all duration-200"
        >
          <Trash2 class="w-4 h-4 transition-transform group-hover:scale-110" />
          删除
        </button>
      </div>

      <!-- 第二行：主操作（均分整行） -->
      <div class="flex gap-3">
        <button
          @click="closePanel"
          class="flex-1 py-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/40 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-2xl shadow-sm hover:shadow-md hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-gray-300/70 dark:hover:border-gray-600/50 active:scale-[0.97] transition-all duration-200"
        >
          取消
        </button>
        <button
          @click="handleSave"
          :disabled="!title.trim()"
          class="flex-1 py-3 bg-primary/90 backdrop-blur-xl text-white text-sm font-medium rounded-2xl shadow-md shadow-primary/20 hover:bg-primary hover:shadow-lg hover:shadow-primary/30 active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md disabled:active:scale-100"
        >
          保存
        </button>
      </div>
    </div>
  </div>

    <!-- 删除确认对话框 -->
    <ConfirmDialog
    v-model="showDeleteConfirm"
    :title="deleteType === 'schedule' ? '移除日程' : '删除任务'"
    :message="deleteType === 'schedule' 
      ? '确定要移除该日程吗？任务本身不会被删除。' 
      : '确定要删除这个任务吗？所有关联的日程也会被删除，此操作无法撤销。'"
    confirm-text="确认"
    cancel-text="取消"
    :danger="deleteType === 'task'"
    @confirm="confirmDelete"
  />
</template>
