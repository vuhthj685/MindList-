<template>
  <div class="nodeCheckbox" @click.stop="toggleCheck">
    <div 
      class="checkbox" 
      :class="{ checked: isChecked, indeterminate: isIndeterminate }"
      :style="checkboxStyle"
    >
      <svg v-if="isChecked" width="100%" height="100%" viewBox="0 0 14 14">
        <path d="M 2,7 L 5.5,10.5 L 12,3.5" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span v-else-if="isIndeterminate" class="indeterminate">—</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NodeCheckbox',
  props: {
    node: {
      type: Object,
      required: true
    },
    mindMap: {
      type: Object,
      default: null
    }
  },
  computed: {
    isChecked() {
      return !!this.node.nodeData.data.checked
    },
    isIndeterminate() {
      const children = this.node.children || []
      if (children.length === 0) return false
      
      let checkedCount = 0
      children.forEach(child => {
        if (child.nodeData.data.checked) checkedCount++
      })
      
      const total = children.length
      return checkedCount > 0 && checkedCount < total
    },
    checkboxStyle() {
      const fontSize = this.node.getStyle('fontSize', false) || 14
      const size = Math.round(fontSize * 1.1)
      
      return {
        width: size + 'px',
        height: size + 'px',
        borderRadius: Math.max(2, Math.round(size * 0.2)) + 'px',
        fontSize: Math.max(10, Math.round(size * 0.6)) + 'px',
        borderWidth: '2px'
      }
    }
  },
  methods: {
    toggleCheck() {
      const newChecked = !this.node.nodeData.data.checked
      
      this.$set(this.node.nodeData.data, 'checked', newChecked)
      this.checkAllChildren(this.node, newChecked)
      this.updateParentCheck(this.node)
      
      this.$bus.$emit('checklist_sync_from_mindmap')
      
      try {
        if (this.mindMap) {
          const fullData = this.mindMap.getData(true)
          this.$bus.$emit('write_local_file', fullData)
          this.mindMap.emit('data_change', this.mindMap.getData())
        }
      } catch (e) {
        console.error(e)
      }
    },
    
    checkAllChildren(nodeInst, checked) {
      if (nodeInst.nodeData) {
        this.$set(nodeInst.nodeData.data, 'checked', checked)
      }
      if (nodeInst.children) {
        nodeInst.children.forEach(child => this.checkAllChildren(child, checked))
      }
    },
    
    updateParentCheck(nodeInst) {
      const parent = nodeInst.parent
      if (!parent || !parent.nodeData) return
      
      const children = parent.children || []
      if (children.length === 0) return
      
      const allChecked = children.every(child => child.nodeData.data.checked)
      const wasChecked = !!parent.nodeData.data.checked
      
      if (allChecked !== wasChecked) {
        this.$set(parent.nodeData.data, 'checked', allChecked)
        this.updateParentCheck(parent)
      }
    }
  }
}
</script>

<style lang="less" scoped>
/* 
  外层容器：宽高由 foreignObject 决定（100%），通过 flex 居中方框
  paddingLeft 由外部（Edit.vue 中的 totalWidth 计算）控制，这里不再单独设置 margin 
*/
.nodeCheckbox {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;     /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
}

.checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #888;
  background: rgba(255, 255, 255, 0.95);
  box-sizing: border-box;
  transition: all 0.15s;
  flex-shrink: 0;
  
  &:hover {
    border-color: #409eff;
    box-shadow: 0 1px 6px rgba(64, 158, 255, 0.4);
  }
  
  &.checked {
    background: #67c23a;
    border-color: #67c23a;
  }
  
  &.indeterminate {
    background: #e6a23c;
    border-color: #e6a23c;
  }
}

.indeterminate {
  color: white;
  font-weight: bold;
  line-height: 1;
}
</style>
