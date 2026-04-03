<template>
  <div class="homeContainer">
    <!-- 全屏背景图层 -->
    <div
      v-if="bgImage"
      class="bgFullScreen"
      :style="{
        backgroundImage: `url(${bgImage})`,
        backgroundPositionX: bgPosX + '%',
        backgroundPositionY: bgPosY + '%',
        opacity: bgOpacity / 100
      }"
    ></div>

    <!-- 顶部标题栏 -->
    <div class="homeHeader" :style="{ background: currentTheme.headerBg }">
      <div class="headerLeft">
        <img
          src="@/assets/img/logo.png"
          alt=""
          class="logoImg"
          onerror="this.style.display='none'"
        />
        <span class="headerTitle" :style="{ color: currentTheme.text }">目标清单</span>
      </div>

      <div class="headerRight">
        <!-- 总完成度 -->
        <div class="progressPill">
          <span class="progressLabel">总完成度</span>
          <span class="progressValue" :style="{ color: totalProgressColor }">
            {{ totalProgressPercent }}%
          </span>
        </div>

        <!-- 主题按钮 -->
        <button class="headerBtn" @click="showThemePanel = !showThemePanel">
          <span>🎨</span>
          <span>主题</span>
        </button>

        <!-- 背景按钮 -->
        <button class="headerBtn" @click="showBgPanel = !showBgPanel">
          <span>🖼️</span>
          <span>背景</span>
        </button>
      </div>
    </div>

    <!-- 卡片网格 -->
    <div class="cardGrid">
      <ChecklistCard
        v-for="file in fileList"
        :key="file.id"
        :file="file"
        :data="getCardData(file.id)"
        :themeCardBg="currentTheme.cardBg"
        :cardOpacity="cardOpacity"
        :themeTextColor="currentTheme.text"
        @change="onCardChange"
        @delete="deleteChecklist"
        @rename="renameChecklist"
      />

      <!-- 新建清单卡片 -->
      <div class="newCard" @click="createChecklist">
        <div class="newCardInner">
          <div class="newCardPlus">+</div>
          <div class="newCardText">新建清单</div>
        </div>
      </div>
    </div>

    <!-- ============ 主题面板 ============ -->
    <div v-if="showThemePanel" class="floatPanel themeFloatPanel" @click.stop>
      <div class="panelHead">
        <span>🎨 选择主题</span>
        <span class="closeX" @click="showThemePanel = false">✕</span>
      </div>

      <div class="themeGrid">
        <div
          v-for="t in presetThemes"
          :key="t.id"
          class="themeCell"
          :class="{ themeActive: currentThemeId === t.id }"
          :style="{ background: t.bg }"
          @click="applyTheme(t)"
        >
          <div class="themeMiniCard" :style="{ background: t.cardBg }">
            <div class="miniLine" :style="{ background: t.accent, width: '70%' }"></div>
            <div class="miniLine" :style="{ background: t.accent + '60', width: '45%' }"></div>
          </div>
          <div class="themeCellName" :style="{ color: t.text }">{{ t.name }}</div>
          <span v-if="currentThemeId === t.id" class="themeActiveDot">✓</span>
        </div>
      </div>

      <div class="dividerLine"></div>

      <div class="customColorRow">
        <span class="customColorLabel">自定义主色</span>
        <el-color-picker
          v-model="customAccentColor"
          size="small"
          @change="onCustomColorChange"
        ></el-color-picker>
        <span class="customColorTip">选后自动应用</span>
      </div>

      <!-- 问题1：卡片透明度滑块 -->
      <div class="dividerLine"></div>
      <div class="opacitySection">
        <div class="opacityLabel">卡片透明度 {{ cardOpacity }}%</div>
        <el-slider
          v-model="cardOpacity"
          :min="10"
          :max="100"
          :step="5"
          @input="saveCardOpacity"
          style="margin: 4px 0 0;"
        ></el-slider>
      </div>
    </div>

    <!-- ============ 背景面板 ============ -->
    <div v-if="showBgPanel" class="floatPanel bgFloatPanel" @click.stop>
      <div class="panelHead">
        <span>🖼️ 自定义背景</span>
        <span class="closeX" @click="showBgPanel = false">✕</span>
      </div>

      <!-- 上传/更换图片 -->
      <input
        ref="bgInput"
        type="file"
        accept="image/*"
        style="display:none"
        @change="onBgFile"
      />
      <div class="bgUploadBtn" @click="$refs.bgInput.click()">
        <span v-if="bgImage">🔄 更换图片</span>
        <span v-else>📁 选择图片</span>
      </div>

      <!-- 有图片时显示裁剪控制 -->
      <template v-if="bgImage">
        <!-- 图片框选预览区域 -->
        <div class="cropSection">
          <div class="cropLabel">框选显示区域（拖动红框选择背景区域）</div>
          <div
            class="cropCanvas"
            ref="cropCanvas"
            @mousedown="onCropStart"
            @mousemove="onCropMove"
            @mouseup="onCropEnd"
          >
            <img :src="bgImage" class="cropBaseImg" ref="cropImg" @load="initCropView" />
            <!-- 暗色遮罩 -->
            <div class="cropMask"></div>
            <!-- 选择框 -->
            <div
              class="cropBox"
              :style="{
                left: cropRect.x + 'px',
                top: cropRect.y + 'px',
                width: cropRect.w + 'px',
                height: cropRect.h + 'px'
              }"
            ></div>
          </div>

          <div class="cropActions">
            <el-button size="mini" @click="setCropToScreen">📐 适配屏幕比例</el-button>
            <el-button size="mini" @click="setCropFull">🔲 全图</el-button>
          </div>
        </div>

        <!-- 透明度 -->
        <div class="sliderRow">
          <span class="sliderLabel">透明度 {{ bgOpacity }}%</span>
          <el-slider
            v-model="bgOpacity"
            :min="0" :max="100" :step="5"
            @input="saveBg"
            style="flex:1; margin: 0 10px;"
          ></el-slider>
        </div>

        <!-- 移除背景 -->
        <div class="removeBgBtn" @click="removeBg">✕ 移除背景图片</div>
      </template>
    </div>

    <!-- 点击外部关闭面板 -->
    <div
      v-if="showThemePanel || showBgPanel"
      class="panelBackdrop"
      @click="showThemePanel = false; showBgPanel = false"
    ></div>
  </div>
</template>

<script>
import ChecklistCard from './components/ChecklistCard.vue'
import {
  initializeFiles,
  getFileData,
  saveFileData,
  createFile,
  deleteFile,
  renameFile,
  countNodes
} from '@/api/mindMapFiles'

const PRESET_THEMES = [
  { id: 'default', name: '默认白', bg: '#f5f7fa', headerBg: '#ffffff', cardBg: '#ffffff', text: '#1a1a1a', subText: '#999', accent: '#409eff', newCardBorder: '#d0d7e0' },
  { id: 'dark',    name: '暗夜黑', bg: '#1a1d21', headerBg: '#22262b', cardBg: '#2c3035', text: '#e0e0e0', subText: '#888', accent: '#5b9cf6', newCardBorder: '#3a3f45' },
  { id: 'green',   name: '清新绿', bg: '#e8f5e9', headerBg: '#c8e6c9', cardBg: '#f1f9f1', text: '#1b5e20', subText: '#558b2f', accent: '#43a047', newCardBorder: '#a5d6a7' },
  { id: 'blue',    name: '天空蓝', bg: '#e3f0fc', headerBg: '#bbdefb', cardBg: '#f0f7ff', text: '#0d47a1', subText: '#1565c0', accent: '#2196f3', newCardBorder: '#90caf9' },
  { id: 'orange',  name: '温暖橙', bg: '#fff3e0', headerBg: '#ffe0b2', cardBg: '#fffaf4', text: '#bf360c', subText: '#e65100', accent: '#f57c00', newCardBorder: '#ffcc80' },
  { id: 'lavender',name: '薰衣草', bg: '#ede7f6', headerBg: '#d1c4e9', cardBg: '#faf7ff', text: '#4a148c', subText: '#6a1b9a', accent: '#7c4dff', newCardBorder: '#ce93d8' }
]

const LS_THEME  = 'MIND_MAP_HOME_THEME'
const LS_BG     = 'MIND_MAP_HOME_BG'
const LS_BG_OP  = 'MIND_MAP_HOME_BG_OP'
const LS_BG_POS = 'MIND_MAP_HOME_BG_POS'

export default {
  name: 'HomePage',
  components: { ChecklistCard },
  data() {
    return {
      fileList: [],
      fileDataCache: {},
      // 主题
      presetThemes: [...PRESET_THEMES],
      currentThemeId: 'default',
      customAccentColor: '#409eff',
      showThemePanel: false,
      // 问题1：卡片透明度
      cardOpacity: 100,
      // 背景
      bgImage: '',
      bgOpacity: 30,
      bgPosX: 50,
      bgPosY: 50,
      showBgPanel: false,
      // 裁剪框
      cropRect: { x: 0, y: 0, w: 200, h: 120 },
      cropDragging: false,
      cropStart: null
    }
  },
  computed: {
    currentTheme() {
      return this.presetThemes.find(t => t.id === this.currentThemeId) || PRESET_THEMES[0]
    },
    totalProgressPercent() {
      let total = 0, checked = 0
      this.fileList.forEach(f => {
        const d = this.fileDataCache[f.id]
        if (d && d.root) {
          const s = countNodes(d.root)
          total += s.total
          checked += s.checked
        }
      })
      return total === 0 ? 0 : Math.round((checked / total) * 100)
    },
    totalProgressColor() {
      const p = this.totalProgressPercent
      return p === 100 ? '#67c23a' : p >= 60 ? '#e6a23c' : this.currentTheme.accent
    }
  },
  created() {
    this.loadFiles()
    this.loadTheme()
    this.loadBg()
    this.loadCardOpacity()
    // 监听思维导图修改事件，同步更新清单
    this.$bus.$on('checklist_sync_from_mindmap', this.onMindMapChanged)
  },
  activated() { this.loadFiles() },
  beforeDestroy() {
    this.$bus.$off('checklist_sync_from_mindmap', this.onMindMapChanged)
  },
  methods: {
    // ─── 数据 ──────────────────────────────────────────────────
    loadFiles() {
      const list = initializeFiles()
      this.fileList = list
      list.forEach(f => {
        const d = getFileData(f.id)
        if (d) this.$set(this.fileDataCache, f.id, d)
      })
    },
    getCardData(id) { return this.fileDataCache[id] || null },

    async createChecklist() {
      try {
        const { value: name } = await this.$prompt('请输入清单名称', '新建清单', {
          confirmButtonText: '创建', cancelButtonText: '取消',
          inputValue: '新建清单',
          inputValidator: v => (v && v.trim() ? true : '名称不能为空')
        })
        if (name && name.trim()) {
          const { file, data } = createFile(name.trim())
          this.fileList.push(file)
          this.$set(this.fileDataCache, file.id, data)
          this.$message.success('清单已创建！点击卡片右上角图标进入思维导图编辑')
        }
      } catch (e) { /* 取消 */ }
    },

    deleteChecklist(id) {
      deleteFile(id)
      this.fileList = this.fileList.filter(f => f.id !== id)
      this.$delete(this.fileDataCache, id)
      this.$message.success('已删除')
    },

    renameChecklist(id, name) {
      renameFile(id, name)
      const f = this.fileList.find(f => f.id === id)
      if (f) f.name = name
      const d = this.fileDataCache[id]
      if (d && d.root) {
        this.$set(d.root, 'data', { ...d.root.data, text: name })
        saveFileData(id, d)
        this.$set(this.fileDataCache, id, { ...d })
      }
    },

    onMindMapChanged() {
      // 思维导图修改后，重新加载清单数据
      this.loadFiles()
    },

    onCardChange(id, data) {
      saveFileData(id, data)
      this.$set(this.fileDataCache, id, { ...data })
      // 通知思维导图页面数据已更改
      this.$bus.$emit('mindmap_sync_from_checklist', id)
    },

    // ─── 主题 ──────────────────────────────────────────────────
    loadTheme() {
      try {
        const s = localStorage.getItem(LS_THEME)
        if (s) {
          const t = JSON.parse(s)
          if (t.id === 'custom') this.presetThemes = [...PRESET_THEMES, t]
          this.currentThemeId = t.id
          this.customAccentColor = t.accent || '#409eff'
        }
      } catch (e) { /* ignore */ }
    },

    applyTheme(t) {
      this.currentThemeId = t.id
      this.customAccentColor = t.accent
      localStorage.setItem(LS_THEME, JSON.stringify(t))
      // 同步 body 背景
      document.body.style.background = t.bg
    },

    onCustomColorChange(color) {
      if (!color) return
      const t = {
        id: 'custom', name: '自定义',
        bg: color + '18', headerBg: color + '28', cardBg: '#ffffff',
        text: '#1a1a1a', subText: '#888888', accent: color,
        newCardBorder: color + '60'
      }
      const idx = this.presetThemes.findIndex(x => x.id === 'custom')
      if (idx >= 0) this.presetThemes.splice(idx, 1, t)
      else this.presetThemes.push(t)
      this.applyTheme(t)
    },

    // 卡片透明度
    loadCardOpacity() {
      const v = localStorage.getItem('MIND_MAP_CARD_OPACITY')
      this.cardOpacity = v !== null ? parseInt(v) : 100
    },

    saveCardOpacity() {
      localStorage.setItem('MIND_MAP_CARD_OPACITY', String(this.cardOpacity))
    },

    // ─── 背景 ──────────────────────────────────────────────────
    loadBg() {
      try {
        this.bgImage = localStorage.getItem(LS_BG) || ''
        const op = localStorage.getItem(LS_BG_OP)
        this.bgOpacity = op !== null ? parseInt(op) : 30
        const pos = localStorage.getItem(LS_BG_POS)
        if (pos) {
          const p = JSON.parse(pos)
          this.bgPosX = p.x || 50
          this.bgPosY = p.y || 50
          this.cropRect = p.crop || this.cropRect
        }
      } catch (e) { /* ignore */ }
    },

    onBgFile(e) {
      const file = e.target.files && e.target.files[0]
      if (!file) return
      const r = new FileReader()
      r.onload = ev => {
        this.bgImage = ev.target.result
        this.saveBg()
        this.$nextTick(() => this.initCropView())
      }
      r.readAsDataURL(file)
      e.target.value = ''
    },

    saveBg() {
      try {
        if (this.bgImage) localStorage.setItem(LS_BG, this.bgImage)
        localStorage.setItem(LS_BG_OP, String(this.bgOpacity))
        localStorage.setItem(LS_BG_POS, JSON.stringify({
          x: this.bgPosX, y: this.bgPosY, crop: this.cropRect
        }))
      } catch (e) { /* ignore */ }
    },

    removeBg() {
      this.bgImage = ''
      localStorage.removeItem(LS_BG)
    },

    // 初始化裁剪框视图（图片加载后）
    initCropView() {
      const canvas = this.$refs.cropCanvas
      const img = this.$refs.cropImg
      if (!canvas || !img) return
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      // 默认框选：按屏幕比例居中
      const aspect = window.innerWidth / window.innerHeight
      const bw = Math.min(W, H * aspect)
      const bh = bw / aspect
      this.cropRect = {
        x: (W - bw) / 2,
        y: (H - bh) / 2,
        w: bw,
        h: bh
      }
      this.applyCropToBackground()
    },

    // 框选适配屏幕比例
    setCropToScreen() {
      const canvas = this.$refs.cropCanvas
      if (!canvas) return
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      const aspect = window.innerWidth / window.innerHeight
      const bw = Math.min(W, H * aspect)
      const bh = bw / aspect
      this.cropRect = { x: (W - bw) / 2, y: (H - bh) / 2, w: bw, h: bh }
      this.applyCropToBackground()
    },

    // 框选全图
    setCropFull() {
      const canvas = this.$refs.cropCanvas
      if (!canvas) return
      this.cropRect = { x: 0, y: 0, w: canvas.offsetWidth, h: canvas.offsetHeight }
      this.applyCropToBackground()
    },

    // 将框选区域转换为 background-position
    applyCropToBackground() {
      const canvas = this.$refs.cropCanvas
      if (!canvas) return
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      const { x, y, w, h } = this.cropRect
      // 框选中心点转为百分比
      this.bgPosX = Math.round(((x + w / 2) / W) * 100)
      this.bgPosY = Math.round(((y + h / 2) / H) * 100)
      this.saveBg()
    },

    // 拖拽裁剪框
    onCropStart(e) {
      this.cropDragging = true
      this.cropStart = { mx: e.offsetX, my: e.offsetY, rect: { ...this.cropRect } }
    },

    onCropMove(e) {
      if (!this.cropDragging || !this.cropStart) return
      const canvas = this.$refs.cropCanvas
      if (!canvas) return
      const dx = e.offsetX - this.cropStart.mx
      const dy = e.offsetY - this.cropStart.my
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      const r = this.cropStart.rect
      // 新位置，限制在画布内
      let nx = Math.max(0, Math.min(W - r.w, r.x + dx))
      let ny = Math.max(0, Math.min(H - r.h, r.y + dy))
      this.cropRect = { x: nx, y: ny, w: r.w, h: r.h }
    },

    onCropEnd() {
      if (this.cropDragging) {
        this.cropDragging = false
        this.applyCropToBackground()
      }
    }
  }
}
</script>

<style lang="less" scoped>
/* ══════════════════════════════════════════
   整体容器
══════════════════════════════════════════ */
.homeContainer {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  position: relative;
  overflow-y: auto;
}

/* ── 全屏背景图 ─────────────────────────── */
.bgFullScreen {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  background-size: cover;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 0;
}

/* ══════════════════════════════════════════
   顶部标题栏（水平 flex）
══════════════════════════════════════════ */
.homeHeader {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 60px;
  padding: 0 32px;
  background: #fff;
  border-bottom: 1px solid rgba(0,0,0,0.07);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  /* 关键：水平布局 */
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.headerLeft {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.logoImg {
  width: 28px;
  height: 28px;
  object-fit: contain;
  flex-shrink: 0;
}

.headerTitle {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  white-space: nowrap;
}

.headerRight {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* 完成度胶囊 */
.progressPill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.06);
  white-space: nowrap;
}
.progressLabel { font-size: 12px; color: #999; }
.progressValue { font-size: 14px; font-weight: 700; }

/* 问题2：功能按钮始终高亮（固定白色背景，不随主题变色） */
.headerBtn {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.2);
  background: rgba(255,255,255,0.92);  /* 固定白底，始终可见 */
  backdrop-filter: blur(8px);
  cursor: pointer;
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  transition: all 0.15s;
  font-weight: 500;

  &:hover {
    background: #409eff;
    border-color: #409eff;
    color: #fff;
  }
}

/* ══════════════════════════════════════════
   卡片网格
══════════════════════════════════════════ */
.cardGrid {
  padding: 28px 32px 40px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  align-content: start;
  position: relative;
  z-index: 1;
}

/* 新建清单卡片 */
.newCard {
  border-radius: 12px;
  border: 2px dashed #d0d7e0;
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(255,255,255,0.3);
  transition: all 0.2s;

  &:hover {
    border-color: #409eff;
    background: rgba(255,255,255,0.5);
    transform: translateY(-2px);

    .newCardPlus, .newCardText { color: #409eff; }
  }
}

.newCardInner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.newCardPlus {
  font-size: 44px;
  font-weight: 200;
  color: #ccc;
  line-height: 1;
}

.newCardText {
  font-size: 14px;
  color: #bbb;
  font-weight: 500;
}

/* ══════════════════════════════════════════
   浮动面板（主题/背景）
══════════════════════════════════════════ */
.panelBackdrop {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  z-index: 99;
}

.floatPanel {
  position: fixed;
  top: 68px;
  right: 16px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.15);
  border: 1px solid rgba(0,0,0,0.08);
  z-index: 100;
  padding: 16px;
}

.themeFloatPanel { width: 340px; }
.bgFloatPanel { width: 320px; right: 100px; }

.panelHead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.closeX {
  cursor: pointer;
  color: #aaa;
  padding: 2px 6px;
  border-radius: 4px;

  &:hover { background: #f5f5f5; color: #666; }
}

/* 主题网格 */
.themeGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.themeCell {
  border-radius: 10px;
  padding: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  position: relative;
  transition: all 0.2s;

  &:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.12); }
  &.themeActive { border-color: #409eff; }
}

.themeMiniCard {
  border-radius: 6px;
  height: 40px;
  padding: 8px;
  margin-bottom: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.miniLine {
  height: 3px;
  border-radius: 2px;
}

.themeCellName {
  font-size: 11px;
  text-align: center;
  font-weight: 500;
}

.themeActiveDot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  background: #409eff;
  border-radius: 50%;
  color: #fff;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dividerLine {
  height: 1px;
  background: #f0f0f0;
  margin: 10px 0;
}

.customColorRow {
  display: flex;
  align-items: center;
  gap: 10px;
}

.customColorLabel { font-size: 13px; color: #666; }
.customColorTip { font-size: 12px; color: #aaa; }

/* 卡片透明度区域 */
.opacitySection { padding-top: 2px; }
.opacityLabel { font-size: 12px; color: #666; margin-bottom: 2px; }

/* 背景面板 */
.bgUploadBtn {
  padding: 10px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  font-size: 13px;
  color: #888;
  margin-bottom: 12px;
  transition: border-color 0.15s;

  &:hover { border-color: #409eff; color: #409eff; }
}

.cropSection { margin-bottom: 12px; }
.cropLabel { font-size: 12px; color: #888; margin-bottom: 6px; }

.cropCanvas {
  position: relative;
  width: 100%;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
  cursor: crosshair;
  background: #f0f0f0;
}

.cropBaseImg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.cropMask {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  pointer-events: none;
}

.cropBox {
  position: absolute;
  border: 2px solid #ff4444;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.5);
  cursor: move;
  pointer-events: none;
}

.cropActions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.sliderRow {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.sliderLabel { font-size: 12px; color: #666; white-space: nowrap; min-width: 80px; }

.removeBgBtn {
  text-align: center;
  padding: 6px;
  color: #f56c6c;
  cursor: pointer;
  font-size: 13px;
  border-radius: 6px;

  &:hover { background: #fff5f5; }
}
</style>
