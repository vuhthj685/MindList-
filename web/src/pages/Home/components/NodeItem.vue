<template>
  <div class="nodeItemWrap">
    <div
      class="nodeRow"
      :style="{ paddingLeft: level * 18 + 'px' }"
      :class="{ rowChecked: node.data.checked }"
    >
      <!-- ① 折叠按钮 -->
      <span class="collapseBtn" @click.stop="toggleCollapse">
        <template v-if="hasChildren">
          <span class="triangle" :class="{ collapsed: isCollapsed }">▼</span>
        </template>
        <template v-else>
          <span class="dot">·</span>
        </template>
      </span>

      <!-- ② 文字区域（双击编辑） -->
      <span class="nodeTextArea" @dblclick.stop="startEdit">
        <input
          v-if="isEditing"
          ref="editInput"
          v-model="editText"
          class="nodeEditInput"
          @blur="finishEdit"
          @keyup.enter="finishEdit"
          @keyup.esc="cancelEdit"
          @click.stop
        />
        <span
          v-else
          class="nodeText"
          :class="{ doneText: node.data.checked }"
          :style="{ color: node.data.checked ? undefined : themeTextColor }"
        >
          {{ displayText }}
          <!-- 问题5：特殊内容标记 -->
          <span v-if="contentTags" class="contentTags">{{ contentTags }}</span>
        </span>
      </span>

      <!-- ③ +号（悬停显示） -->
      <span
        v-if="level < maxLevel"
        class="addBtn"
        title="新建子节点"
        @click.stop="startAddChild"
      >+</span>

      <!-- ④ 复选框（最右） -->
      <span class="cbWrap" @click.stop="toggleCheck">
        <span class="cb" :class="{ cbChecked: node.data.checked }">
          <!-- 用 SVG path 画勾，避免文字字符渲染异常 -->
          <svg v-if="node.data.checked" width="10" height="10" viewBox="0 0 10 10">
            <path
              d="M 1.5,5.5 L 4,8 L 8.5,2"
              stroke="white"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            />
          </svg>
        </span>
      </span>
    </div>

    <!-- 子节点（递归） -->
    <div v-if="!isCollapsed && hasChildren && level < maxLevel" class="childrenArea">
      <NodeItem
        v-for="(child, idx) in node.children"
        :key="child._id || idx"
        :node="child"
        :level="level + 1"
        :maxLevel="maxLevel"
        :themeTextColor="themeTextColor"
        @change="$emit('change')"
        @addChild="$emit('addChild', $event)"
      />
    </div>

    <!-- 新建子节点输入框 -->
    <div
      v-if="isAddingChild"
      class="addChildRow"
      :style="{ paddingLeft: (level + 1) * 18 + 8 + 'px' }"
    >
      <input
        ref="addChildInput"
        v-model="addChildText"
        class="addChildInput"
        placeholder="输入名称，回车确认"
        @keyup.enter="confirmAddChild"
        @keyup.esc="cancelAddChild"
        @blur="confirmAddChild"
        @click.stop
      />
    </div>
  </div>
</template>

<script>
// 去 HTML 标签，同时去掉常见任务清单前缀（[ ] [x] ✓ ✕ 等）
function cleanText(html) {
  if (!html) return ''
  let text = html
  if (/<[^>]+>/.test(html)) {
    const div = document.createElement('div')
    div.innerHTML = html
    text = div.textContent || div.innerText || ''
  }
  text = text.replace(/^\s*(\[[\s\-xX✓✕]*\]|\[x\]|\[ \]|✓|✕|☑|☐)\s*/u, '')
  return text.trim()
}

let _idCnt = Date.now()
function genId() { return 'ni_' + (++_idCnt).toString(36) }

export default {
  name: 'NodeItem',
  props: {
    node: { type: Object, required: true },
    level: { type: Number, default: 0 },
    // 问题3：最多20级
    maxLevel: { type: Number, default: 19 },
    // 问题6：主题文字色
    themeTextColor: { type: String, default: '#333333' }
  },
  data() {
    return {
      isCollapsed: false,
      isEditing: false,
      editText: '',
      isAddingChild: false,
      addChildText: ''
    }
  },
  computed: {
    hasChildren() {
      return !!(this.node.children && this.node.children.length > 0)
    },
    displayText() {
      return cleanText(this.node.data.text)
    },
    // 问题5：特殊内容标记
    contentTags() {
      const d = this.node.data
      const tags = []
      if (d.image) tags.push('【图片】')
      if (d.hyperlink) tags.push('【链接】')
      if (d.icon && d.icon.length > 0) tags.push('【图标】')
      if (d.note) tags.push('【备注】')
      if (d.generalization) tags.push('【概要】')
      if (d.formula) tags.push('【公式】')
      return tags.join(' ')
    }
  },
  methods: {
    toggleCollapse() {
      if (this.hasChildren) this.isCollapsed = !this.isCollapsed
    },

    toggleCheck() {
      const v = !this.node.data.checked
      this.$set(this.node.data, 'checked', v)
      this.cascadeDown(this.node, v)
      this.$emit('change')
    },

    cascadeDown(node, v) {
      if (!node.children) return
      node.children.forEach(c => {
        this.$set(c.data, 'checked', v)
        this.cascadeDown(c, v)
      })
    },

    startEdit() {
      this.editText = this.displayText
      this.isEditing = true
      this.$nextTick(() => { this.$refs.editInput && this.$refs.editInput.focus() })
    },

    finishEdit() {
      const t = this.editText.trim()
      if (t) {
        this.$set(this.node.data, 'text', t)
        this.$emit('change')
      }
      this.isEditing = false
    },

    cancelEdit() { this.isEditing = false },

    startAddChild() {
      this.addChildText = ''
      this.isAddingChild = true
      this.$nextTick(() => { this.$refs.addChildInput && this.$refs.addChildInput.focus() })
    },

    confirmAddChild() {
      const t = this.addChildText.trim()
      if (t) {
        if (!this.node.children) this.$set(this.node, 'children', [])
        this.node.children.push({ _id: genId(), data: { text: t, checked: false }, children: [] })
        this.isCollapsed = false
        this.$emit('change')
      }
      this.isAddingChild = false
      this.addChildText = ''
    },

    cancelAddChild() {
      this.isAddingChild = false
      this.addChildText = ''
    }
  }
}
</script>

<style lang="less" scoped>
.nodeItemWrap { width: 100%; }

.nodeRow {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  min-height: 32px;
  padding-top: 2px;
  padding-bottom: 2px;
  padding-right: 6px;
  border-bottom: 1px solid rgba(0,0,0,0.04);
  cursor: default;
  transition: background 0.12s;

  &:hover {
    background: rgba(64,158,255,0.05);
    .addBtn { opacity: 1; }
  }

  &.rowChecked { background: rgba(103,194,58,0.04); }
}

.collapseBtn {
  flex-shrink: 0;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
}

.triangle {
  font-size: 9px;
  color: #888;
  display: inline-block;
  transition: transform 0.2s;
  &.collapsed { transform: rotate(-90deg); }
}

.dot { font-size: 16px; color: #ccc; line-height: 1; }

.nodeTextArea {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  margin: 0 4px;
  overflow: hidden;
}

.nodeText {
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;
  cursor: text;
  width: 100%;

  &.doneText {
    text-decoration: line-through;
    color: #bbb !important;
  }
}

/* 问题5：特殊内容标记样式 */
.contentTags {
  font-size: 11px;
  color: #409eff;
  margin-left: 4px;
  opacity: 0.8;
  font-weight: normal;
}

.nodeEditInput {
  width: 100%;
  border: 1px solid #409eff;
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 13px;
  outline: none;
  background: rgba(255,255,255,0.9);
  color: #333;
}

.addBtn {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #ccc;
  cursor: pointer;
  border-radius: 3px;
  opacity: 0;
  transition: all 0.15s;

  &:hover { color: #409eff; background: rgba(64,158,255,0.1); opacity: 1 !important; }
}

.cbWrap {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: auto;
}

.cb {
  width: 16px;
  height: 16px;
  border: 1.5px solid #ccc;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  transition: all 0.15s;
  flex-shrink: 0;

  &:hover { border-color: #409eff; }
  &.cbChecked { background: #67c23a; border-color: #67c23a; }
}

.childrenArea { width: 100%; }

.addChildRow {
  padding-top: 3px;
  padding-bottom: 3px;
  padding-right: 6px;
  background: rgba(64,158,255,0.03);
}

.addChildInput {
  width: 100%;
  border: 1px solid #409eff;
  border-radius: 3px;
  padding: 3px 6px;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
  color: #333;
  background: rgba(255,255,255,0.9);
}
</style>
