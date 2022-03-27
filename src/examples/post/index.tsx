import { useRef } from 'react'
import axios from 'axios'
export default function Post() {
  const dataRef = useRef<HTMLTextAreaElement | null>(null)
  const outputRef = useRef<HTMLDivElement | null>(null)
  return (
    <>
      <h1>axios.post</h1>

        <div className="form-group">
          <div>JSON</div>
          <textarea className="form-control" rows={5} ref={dataRef} />
        </div>
        <button id="post" type="button" className="btn btn-primary" onClick={() => {
        debugger
        axios.post<string>('post', JSON.parse(dataRef.current?.value!))
          .then(function (res) {
            outputRef.current!.className = 'container';
            outputRef.current!.innerHTML = res.data;
          })
          .catch(function (err) {
            outputRef.current!.className = 'container text-danger';
            outputRef.current!.innerHTML = err.message;
          });
      }}>POST</button>


      <div id="output" className="container" ref={outputRef} />
    </>
  )
}