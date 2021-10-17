import { useRef, useEffect } from 'react'
import axios from 'axios'

export default function TransformResponse() {
  const useravatarRef = useRef<HTMLImageElement | null>(null)
  const usernameRef = useRef<HTMLDivElement | null>(null)
  const createdRef = useRef<HTMLSpanElement | null>(null)
  const updatedRef = useRef<HTMLSpanElement | null>(null)
  useEffect(() => {
    const ISO_8601 = /(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})Z/;
    function formatDate(d: Date) {
      return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
    }
    debugger
    // 这里注意不要修改到defaults上面的transformResponse，concat不会有副作用
    const config = {
      transformResponse: axios.defaults.transformResponse!.concat(function (data, headers) {
        Object.keys(data).forEach(function (k) {
          if (ISO_8601.test(data[k])) {
            data[k] = new Date(Date.parse(data[k]));
          }
        });
        return data;
      })
    }
    axios.get<{ avatar_url: string; name: string; created_at: Date; updated_at: Date }>('https://api.github.com/users/mzabriskie', config)
      .then(function (res) {
        useravatarRef.current!.src = res.data.avatar_url;
        usernameRef.current!.innerHTML = res.data.name;
        createdRef.current!.innerHTML = formatDate(res.data.created_at);
        updatedRef.current!.innerHTML = formatDate(res.data.updated_at);
      })
  }, [])
  return (
    <div className='container'>
      <h1>transformResponse</h1>

      <div className="row">
        <img id="useravatar" src="" className="col-md-1" ref={useravatarRef} />
        <div className="col-md-3">
          <strong id="username" ref={usernameRef} /><br />
          Created: <span id="created" ref={createdRef} /><br />
          Updated: <span id="updated" ref={updatedRef} />
        </div>
      </div>
    </div>
  )
}