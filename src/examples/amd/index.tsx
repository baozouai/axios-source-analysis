import { useState, useEffect } from 'react'
import axios from 'axios'
interface State {avatar_url?: string; name?: string}

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