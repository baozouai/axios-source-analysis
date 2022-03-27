import './App.css'
import All from '@/examples/all'
import CancelRequest from './examples/cancel-request'
import Get from './examples/get'
import Interceptors from './examples/interceptors'
import Post from './examples/post'
import TransformResponse from './examples/transform-response'
import Upload from './examples/upload'
import { Link } from 'react-router-dom'
import { Routes, Route, Outlet } from 'react-router'

const routeConfigs = [
  {
    path: 'all',
    Element: All,
  },
  {
    path: 'cancel-request',
    Element: CancelRequest,
  },
  {
    path: 'interceptors',
    Element: Interceptors,
  },
  {
    path: 'get',
    Element: Get,
  },
  {
    path: 'post',
    Element: Post,
  },
  {
    path: 'transform-response',
    Element: TransformResponse,
  },
  {
    path: 'upload',
    Element: Upload,
  },
]
function Layout() {
  debugger
  return (
    <>
     <p>主页面</p>
      <ul>
        {
          routeConfigs.map(({ path }) => {
            if (path === '*') return null
            return (
              <li key={path}>
                <Link to={`/${path}`}>{path}</Link>
              </li>
            )
          })
        }
      </ul>
      <hr />
      <Outlet />
    </>
  )
}
function App() {
  debugger
  return (
    <Routes>
      {/* 注意，这里不是LayoutRoute，因为LayoutRoute只允许element和children,而这里有path */}
      <Route path='/' element={<Layout />}>
        {
          routeConfigs.map(({ path, Element }) => <Route key={path} path={`${path}${path === '*' ? '': '/*'}`} element={<Element />} />)
        }
      </Route>
    </Routes>
  )
}

export default App
