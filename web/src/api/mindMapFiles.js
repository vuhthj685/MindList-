/**
 * 多文件管理 API
 * 支持创建、删除、读取多个思维导图文件（清单）
 */

const FILE_LIST_KEY = 'MIND_MAP_FILE_LIST'
const FILE_DATA_PREFIX = 'MIND_MAP_FILE_DATA_'
const LEGACY_DATA_KEY = 'SIMPLE_MIND_MAP_DATA'

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

// 新文件的默认数据
const getDefaultData = (name = '新建清单') => {
  return {
    root: {
      data: { text: name, checked: false },
      children: []
    },
    layout: 'logicalStructure',
    theme: { template: 'classic4', config: {} },
    view: null
  }
}

// 获取文件列表
export const getFileList = () => {
  try {
    const list = localStorage.getItem(FILE_LIST_KEY)
    return list ? JSON.parse(list) : []
  } catch (e) {
    return []
  }
}

// 保存文件列表
export const saveFileList = (list) => {
  try {
    localStorage.setItem(FILE_LIST_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('saveFileList error:', e)
  }
}

// 获取指定文件的数据
export const getFileData = (id) => {
  try {
    const data = localStorage.getItem(FILE_DATA_PREFIX + id)
    return data ? JSON.parse(data) : null
  } catch (e) {
    return null
  }
}

// 保存指定文件的数据
export const saveFileData = (id, data) => {
  try {
    localStorage.setItem(FILE_DATA_PREFIX + id, JSON.stringify(data))
    // 更新文件列表中的 updatedAt
    const list = getFileList()
    const file = list.find(f => f.id === id)
    if (file) {
      file.updatedAt = new Date().toISOString()
      saveFileList(list)
    }
  } catch (e) {
    console.error('saveFileData error:', e)
  }
}

// 创建新文件
export const createFile = (name = '新建清单') => {
  const id = generateId()
  const now = new Date().toISOString()
  const file = { id, name, createdAt: now, updatedAt: now }
  const data = getDefaultData(name)
  const list = getFileList()
  list.unshift(file)
  saveFileList(list)
  saveFileData(id, data)
  return { file, data }
}

// 删除文件
export const deleteFile = (id) => {
  const list = getFileList().filter(f => f.id !== id)
  saveFileList(list)
  try {
    localStorage.removeItem(FILE_DATA_PREFIX + id)
  } catch (e) { /* ignore */ }
}

// 重命名文件
export const renameFile = (id, name) => {
  const list = getFileList()
  const file = list.find(f => f.id === id)
  if (file) {
    file.name = name
    file.updatedAt = new Date().toISOString()
    saveFileList(list)
  }
}

// 为节点树中的所有节点加上 checked 字段（如果没有的话）
const ensureCheckedField = (node) => {
  if (node && node.data) {
    if (node.data.checked === undefined) {
      node.data.checked = false
    }
  }
  if (node && node.children) {
    node.children.forEach(child => ensureCheckedField(child))
  }
}

// 初始化：迁移旧数据 或 创建第一个默认文件
export const initializeFiles = () => {
  let list = getFileList()
  if (list.length === 0) {
    // 尝试迁移旧数据
    try {
      const legacyData = localStorage.getItem(LEGACY_DATA_KEY)
      if (legacyData) {
        const parsed = JSON.parse(legacyData)
        // 确保所有节点有 checked 字段
        if (parsed.root) ensureCheckedField(parsed.root)
        const id = generateId()
        const now = new Date().toISOString()
        const name = parsed.root?.data?.text || '我的清单'
        list = [{ id, name, createdAt: now, updatedAt: now }]
        saveFileList(list)
        saveFileData(id, parsed)
        return list
      }
    } catch (e) { /* ignore */ }
    // 创建第一个默认文件
    const { file } = createFile('我的第一个清单')
    return [file]
  }
  return list
}

// 统计节点树中所有节点（不含根节点）的数量和已完成数量
export const countNodes = (rootNode) => {
  let total = 0
  let checked = 0
  const traverse = (node, isRoot = false) => {
    if (!isRoot) {
      total++
      if (node.data && node.data.checked) checked++
    }
    if (node.children) {
      node.children.forEach(child => traverse(child, false))
    }
  }
  traverse(rootNode, true)
  return { total, checked }
}
