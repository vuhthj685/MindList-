<template>
  <div
    class="checklistCard"
    :style="{
      background: cardBackground,
      color: themeTextColor
    }"
  >
    <!-- 卡片头部 -->
    <div class="cardHeader" :style="{ borderColor: 'rgba(0,0,0,0.06)' }">
      <input
        v-if="isEditingTitle"
        ref="titleInput"
        v-model="titleText"
        class="titleInput"
        @blur="finishTitleEdit"
        @keyup.enter="finishTitleEdit"
        @keyup.esc="cancelTitleEdit"
        @click.stop
      />
      <div v-else class="cardTitle" :style="{ color: themeTextColor }" @dblclick.stop="startTitleEdit">
        {{ file.name }}
      </div>

      <div class="cardActions">
        <span class="actionBtn editBtn" title="在思维导图中编辑" @click.stop="openEditor">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="5" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="16" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="16" cy="10" r="2" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="16" cy="16" r="2" stroke="currentColor" stroke-width="1.5"/>
            <line x1="8" y1="9" x2="14" y2="5" stroke="currentColor" stroke-width="1.5"/>
            <line x1="8" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="1.5"/>
            <line x1="8" y1="11" x2="14" y2="15" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </span>
        <span class="actionBtn deleteBtn" title="删除" @click.stop="confirmDelete">
          <i class="el-icon-delete"></i>
        </span>
      </div>
    </div>

    <!-- 完成进度 -->
    <div class="progressBar">
      <div class="progressInfo">
        <span class="progressLabel" :style="{ color: subTextColor }">完成进度</span>
        <span class="progressPercent" :style="{ color: progressColor }">{{ progressPercent }}%</span>
      </div>
      <div class="progressTrack" :style="{ background: trackBg }">
        <div class="progressFill" :style="{ width: progressPercent + '%', background: progressColor }"></div>
      </div>
    </div>

    <!-- 节点清单 -->
    <div class="nodeList">
      <div class="nodeListScroll">
        <!-- 问题3：最多20级（maxLevel=19，0-based） -->
        <NodeItem
          v-for="(child, idx) in rootChildren"
          :key="child._id || idx"
          :node="child"
          :level="0"
          :maxLevel="19"
          :themeTextColor="themeTextColor"
          @change="onNodeChange"
          @addChild="onAddChild"
        />

        <!-- 新建二级节点 -->
        <div class="addRootNodeRow">
          <div v-if="isAddingRoot" class="addNodeInputRow">
            <input
              ref="rootInput"
              v-model="newRootText"
              class="addNodeInput"
              placeholder="输入节点名称，回车确认"
              @keyup.enter="confirmAddRoot"
              @keyup.esc="cancelAddRoot"
              @blur="confirmAddRoot"
              @click.stop
            />
          </div>
          <div v-else class="addRootBtn" :style="{ color: subTextColor }" @click.stop="startAddRoot">
            <span class="addIcon">+</span>
            <span class="addText">新建二级节点</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NodeItem from './NodeItem.vue'
import { countNodes } from '@/api/mindMapFiles'

let _idCounter = Date.now()
function genId() { return 'n_' + (++_idCounter).toString(36) }

function ensureIds(node) {
  if (!node._id) node._id = genId()
  if (node.children) node.children.forEach(c => ensureIds(c))
}

// 将 hex 颜色 + opacity 转为 rgba
function hexToRgba(hex, opacity) {
  if (!hex || !hex.startsWith('#')) return `rgba(255,255,255,${opacity / 100})`
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${opacity / 100})`
}

// 判断颜色是否为深色（用于暗黑主题自动适配）
function isDarkColor(hex) {
  if (!hex || !hex.startsWith('#')) return false
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}

export default {
  name: 'ChecklistCard',
  components: { NodeItem },
  props: {
    file: { type: Object, required: true },
    data: { type: Object, default: null },
    // 主题卡片背景色（hex）
    themeCardBg: { type: String, default: '#ffffff' },
    // 卡片透明度 0-100
    cardOpacity: { type: Number, default: 100 },
    // 主题文字色
    themeTextColor: { type: String, default: '#1a1a1a' }
  },
  data() {
    return {
      isEditingTitle: false,
      titleText: '',
      isAddingRoot: false,
      newRootText: ''
    }
  },
  computed: {
    // 带透明度的卡片背景
    cardBackground() {
      return hexToRgba(this.themeCardBg, this.cardOpacity)
    },
    // 辅助文字色（稍淡）
    subTextColor() {
      return isDarkColor(this.themeCardBg)
        ? 'rgba(255,255,255,0.5)'
        : 'rgba(0,0,0,0.4)'
    },
    // 进度条底色
    trackBg() {
      return isDarkColor(this.themeCardBg)
        ? 'rgba(255,255,255,0.15)'
        : 'rgba(0,0,0,0.06)'
    },
    rootChildren() {
      const children = this.data && this.data.root && this.data.root.children
        ? this.data.root.children : []
      children.forEach(c => ensureIds(c))
      return children
    },
    progressStats() {
      if (!this.data || !this.data.root) return { total: 0, checked: 0 }
      return countNodes(this.data.root)
    },
    progressPercent() {
      const { total, checked } = this.progressStats
      return total === 0 ? 0 : Math.round((checked / total) * 100)
    },
    progressColor() {
      const p = this.progressPercent
      return p === 100 ? '#67c23a' : p >= 60 ? '#e6a23c' : '#409eff'
    }
  },
  methods: {
    openEditor() {
      this.$router.push({ path: '/edit', query: { id: this.file.id } })
    },
    onNodeChange() {
      this.$emit('change', this.file.id, this.data)
    },
    onAddChild(parentNode) {
      if (!parentNode.children) this.$set(parentNode, 'children', [])
      parentNode.children.push({ _id: genId(), data: { text: '', checked: false }, children: [] })
      this.onNodeChange()
    },
    startAddRoot() {
      this.isAddingRoot = true
      this.newRootText = ''
      this.$nextTick(() => { this.$refs.rootInput && this.$refs.rootInput.focus() })
    },
    confirmAddRoot() {
      const text = this.newRootText.trim()
      if (text) {
        if (!this.data || !this.data.root) return
        if (!this.data.root.children) this.$set(this.data.root, 'children', [])
        this.data.root.children.push({ _id: genId(), data: { text, checked: false }, children: [] })
        this.onNodeChange()
      }
      this.isAddingRoot = false
      this.newRootText = ''
    },
    cancelAddRoot() { this.isAddingRoot = false; this.newRootText = '' },
    startTitleEdit() {
      this.titleText = this.file.name
      this.isEditingTitle = true
      this.$nextTick(() => { this.$refs.titleInput && this.$refs.titleInput.focus() })
    },
    finishTitleEdit() {
      const name = this.titleText.trim()
      if (name) this.$emit('rename', this.file.id, name)
      this.isEditingTitle = false
    },
    cancelTitleEdit() { this.isEditingTitle = false },
    confirmDelete() {
      this.$confirm('确认删除这个清单吗？删除后无法恢复。', '提示', {
        confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
      }).then(() => { this.$emit('delete', this.file.id) }).catch(() => {})
    }
  }
}
</script>

<style lang="less" scoped>
.checklistCard {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s, background 0.3s;
  display: flex;
  flex-direction: column;
  min-height: 280px;
  max-height: 440px;
  backdrop-filter: blur(4px); /* 透明时磨砂效果 */

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
}

.cardHeader {
  padding: 14px 14px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.cardTitle {
  font-size: 15px;
  font-weight: 600;
  cursor: text;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.titleInput {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  border: 1px solid #409eff;
  border-radius: 4px;
  padding: 2px 6px;
  outline: none;
  background: transparent;
}

.cardActions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  flex-shrink: 0;
}

.actionBtn {
  width: 32px;
  height: 32px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 17px;
  opacity: 0.6;
  transition: all 0.15s;

  &:hover {
    background: rgba(64, 158, 255, 0.1);
    color: #409eff !important;
    opacity: 1;
  }
  &.deleteBtn:hover { color: #f56c6c !important; }
  &.editBtn svg { display: block; }
}

.progressBar { padding: 8px 14px; flex-shrink: 0; }
.progressInfo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.progressLabel { font-size: 12px; }
.progressPercent { font-size: 13px; font-weight: 600; }
.progressTrack { height: 4px; border-radius: 2px; overflow: hidden; }
.progressFill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }

.nodeList { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

.nodeListScroll {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 2px; }
}

.addRootNodeRow {
  flex-shrink: 0;
  border-top: 1px dashed rgba(0,0,0,0.08);
}

.addRootBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;

  &:hover { background: rgba(64,158,255,0.06); color: #409eff !important; }

  .addIcon { font-size: 16px; font-weight: 300; }
  .addText { font-size: 12px; }
}

.addNodeInputRow { padding: 6px 10px; }
.addNodeInput {
  width: 100%;
  border: 1px solid #409eff;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  background: rgba(255,255,255,0.8);
  color: #333;
}
</style>
