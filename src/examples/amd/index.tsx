import { useState, useEffect } from 'react'
import axios from 'axios'
interface State {avatar_url?: string; name?: string}
console.log(axios.getUri({
  baseURL: "https://www.baidu.com/",
  url: "/user/NLRX",
  params: {
    idClient: 1,
    idTest: 2,
    testString: "thisIsATest"
  }
}))
// 注意请求拦截器会从后往前执行，而响应拦截器则相反，是按照use的顺序
axios.interceptors.request.use(function (config) {
  debugger
  // Do something before request is sent
  return config;
}, function (error) {
  // Do something with request error
  return Promise.reject(error);
});
// 这个比上面的先进入
axios.interceptors.request.use(function (config) {
  debugger
  // Do something before request is sent
  return config;
}, function (error) {
  // Do something with request error
  return Promise.reject(error);
});
// Add a response interceptor
axios.interceptors.response.use(function (response) {
  debugger
  // Any status code that lie within the range of 2xx cause this function to trigger
  // Do something with response data
  return response;
}, function (error) {
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error
  return Promise.reject(error);
});
axios.interceptors.response.use(function (response) {
  debugger
  // Any status code that lie within the range of 2xx cause this function to trigger
  // Do something with response data
  return response;
}, function (error) {
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error
  return Promise.reject(error);
});
export default function Amd() {
  const [{avatar_url, name}, setstate] = useState<State>({})
  useEffect(() => {
    axios.get<State>('https://api.github.com/users/mzabriskie')
          .then(function (user) {
            console.log(user);
            setstate({
              avatar_url: user.data.avatar_url,
              name: user.data.name
            })
          });
  }, [])
  return (
    <>
      <h1>AMD</h1>
      <div>
        <h3>User</h3>
        <div className="row">
          <img id="useravatar" src={avatar_url} className="col-md-1"/>
          <div className="col-md-3">
            <strong id="username">{name}</strong>
          </div>
        </div>
      </div>
    </>
  )
}