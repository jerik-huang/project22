import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import App from './App.jsx'
import { antdTheme } from './styles/theme'
import './styles/global.css'

// 设置 dayjs 为中文(影响日期组件的展示)
dayjs.locale('zh-cn')

/**
 * 应用入口。
 *
 * 嵌套层级(由外到内):
 *   ConfigProvider   —— 注入中文语言包与主题令牌(antdTheme)
 *   AntdApp          —— antd v5 的全局上下文,提供 message/notification/modal 的运行时实例
 *   BrowserRouter    —— 启用 React Router 的 history 模式路由
 *   App              —— 路由配置
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      <AntdApp>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>,
)
