import { useState, useEffect } from 'react'
import axios from 'axios'
import { Canceler } from '../../axios/type'
import { Link, useParams, useSearchParams } from 'react-router-dom';
interface State { avatar_url?: string; name?: string }

const CancelToken = axios.CancelToken
debugger
const source = CancelToken.source()

/**
 * 取消请求有两种方式：
 * - CancelToken.source.cancel('xxx')
 * - new AbortController().signal.abort
 * 
 * 以上两种无论请求是否成功响应，都会拦截掉axios.then,会被catch中捕捉到
 */
export default function CancelRequest() {
  const [{ avatar_url, name }, setstate] = useState<State>({})
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') || '1'
  console.log(type);
  useEffect(() => {
    debugger
    // 1.第一种取消请求的
    /**
     * - 对于CancelToken来说取消请求的两个方式
     * 1. source.token.reason = new axios.Cancel('取消请求xxx')
     * 2. source.cancel('取消请求')
     *  */

    /** ---------- cancelToken------------------------------------- */
    if (type === '1') {
      axios.get<State>('https://api.github.com/users/mzabriskie', {
        cancelToken: source.token,
      })
        .then(function (user) {
          console.log(user);
          setstate({
            avatar_url: user.data.avatar_url,
            name: user.data.name
          })
        }).catch(function (error) {
          if (axios.isCancel(error)) {
            // 对于source.token.reason = new axios.Cancel('取消请求xxx')，这里的message就是【Cancel：取消请求xxx】
            // 对于source.cancel('取消请求')，这里的message就是【取消请求】
            console.log('第一种 Request canceled', error.message);
          } else {
            // 处理错误
          }
        });
      source.token.reason = new axios.Cancel('取消请求xxx')

      source.cancel('取消请求')
    } else if (type === '2') {
      /** ---------- cancelToken------------------------------------- */

      // 2.第二种取消请求的，本质和第一种相同，只是第一种封装了逻辑
      // controller.abort()
      let cancel!: Canceler
      axios.get<State>('https://api.github.com/users/mzabriskie', {
        // signal,
        cancelToken: new CancelToken(function executor(c) {
          // executor 函数接收一个 cancel 函数作为参数
          cancel = c;
        })
      })
        .then(function (user) {
          console.log(user);
          setstate({
            avatar_url: user.data.avatar_url,
            name: user.data.name
          })
        }).catch(function (error) {
          if (axios.isCancel(error)) {
            console.log('第二种 Request canceled', error.message); // Request canceled www
          } else {
            // 处理错误
          }
        });
      cancel('www')
    } else {
      // 3.第三种取消请求的
      /** ---------- signal------------------------------------- */
      /**
       * - 对应AbortController来说取消请求的两个方式
       *  */
      const controller = new AbortController()
      const { signal } = controller
      controller.abort()
      axios.get<State>('https://api.github.com/users/mzabriskie', {
        signal,
      })
        .then(function (user) {
          console.log(user);
          setstate({
            avatar_url: user.data.avatar_url,
            name: user.data.name
          })
        }).catch(function (error) {
          if (axios.isCancel(error)) {
            console.log('第三种 Request canceled', error.message);
          } else {
            // 处理错误
          }
        });
      // 这里abort后会把signal.aboarted设为true，其是个readonly，故需要通过controller.abort()来设置
      controller.abort()
      /** ---------- signal------------------------------------- */
    }

  }, [type])
  return (
    <>
      {['1', '2', '3'].filter(item =>  item !== type).map(item => (
        <div key={item}>
          <Link to={`?type=${item}`}>点击第{item}种取消请求的方法</Link>
        </div>
      ))}
      <h1>AMD</h1>
      <div>
        <h3>User</h3>
        <div className="row">
          <img id="useravatar" src={avatar_url} className="col-md-1" />
          <div className="col-md-3">
            <strong id="username">{name}</strong>
          </div>
        </div>
      </div>
    </>
  )
}