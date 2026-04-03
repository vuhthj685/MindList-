const path = require('path')
const isDev = process.env.NODE_ENV === 'development'
const isLibrary = process.env.NODE_ENV === 'library'
const isElectron = process.env.IS_ELECTRON === 'true'

const WebpackDynamicPublicPathPlugin = require('webpack-dynamic-public-path')

// 根据构建目标决定 publicPath
function getPublicPath() {
  if (isDev) return ''
  if (isElectron) return './' // Electron 使用相对路径加载本地文件
  if (process.env.GITHUB_PAGES) return './' // GitHub Pages 也使用相对路径
  return './dist' // 原有的本地部署路径
}

module.exports = {
  publicPath: getPublicPath(),
  outputDir: '../dist',
  lintOnSave: false,
  productionSourceMap: false,
  filenameHashing: false,
  transpileDependencies: ['yjs', 'lib0', 'quill'],
  chainWebpack: config => {
    // 移除 preload 插件
    config.plugins.delete('preload')
    // 移除 prefetch 插件
    config.plugins.delete('prefetch')
    // 支持运行时设置public path（非 Electron、非 GitHub Pages 时才启用）
    if (!isDev && !isElectron && !process.env.GITHUB_PAGES) {
      config
        .plugin('dynamicPublicPathPlugin')
        .use(WebpackDynamicPublicPathPlugin, [
          { externalPublicPath: 'window.externalPublicPath' }
        ])
    }
    // 给插入html页面内的js和css添加hash参数
    if (!isLibrary) {
      config.plugin('html').tap(args => {
        args[0].hash = true
        return args
      })
    }
  },
  configureWebpack: {
    resolve: {
      modules: [
        'node_modules',
        path.resolve(__dirname, 'node_modules')
      ],
      alias: {
        '@': path.resolve(__dirname, './src/'),
        'simple-mind-map': path.resolve(__dirname, '../simple-mind-map/')
      }
    }
  },
  devServer: {
    proxy: {
      '^/api/v3/': {
        target: 'http://ark.cn-beijing.volces.com',
        changeOrigin: true
      }
    }
  }
}
