import { useState, useEffect } from 'react'
import axios from 'axios'

export default function All() {

  const [{ useravatar, username, orgs }, setState] = useState<{ useravatar?: string; username?: string, orgs: { avatar_url: string; login: string }[] }>({ orgs: [] })
  useEffect(() => {
    axios.all([
      // Promise.all([
      axios.get<{ avatar_url: string, name:string }>('https://api.github.com/users/mzabriskie'),
      axios.get<{ avatar_url: string; login: string }[]>('https://api.github.com/users/mzabriskie/orgs')
    ]).then(([user, orgs])=> {
      console.log(user);
      const { avatar_url, name } = user.data
      setState({
        useravatar: avatar_url,
        username: name,
        orgs: orgs.data,
      })
    });
  }, [])

  return (
    <>
      <h1>axios.all</h1>

      <div>
        <h3>User</h3>
        <div className="row">
          <img id="useravatar" src={useravatar} className="col-md-1" />
          <div className="col-md-3">
            <strong id="username">{username}</strong>
          </div>
        </div>
        <hr />
        <h3>Orgs</h3>
        <ul id="orgs" className="list-unstyled">
          {
            orgs.map(function (org) {
              return (
                <li key={org.avatar_url} className="row">
                  <img src={org.avatar_url} className="col-md-1" />
                  <div className="col-md-3">
                    <strong>{org.login}</strong>
                  </div> +
                </li>
              )
            })
          }
        </ul>
      </div>
    </>
  )
}