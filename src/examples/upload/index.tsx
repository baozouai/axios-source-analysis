import {  useRef } from "react"
import axios from "axios";



export default function Upload() {
  
  const outputRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const onUpload = () => {
    const data = new FormData();
    data.append('foo', 'bar');
    data.append('file', fileRef.current!.files![0]);

    const output = outputRef.current!
    axios.put<string>('upload', data, {onDownloadProgress: (progressEvent) => {
      const percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total )
    }})
      .then(function (res) {
        output.className = 'container';
        output.innerHTML = res.data;
      })
      .catch(function (err) {
        output.className = 'container text-danger';
        output.innerHTML = err.message;
      });
  }
  return (
    <>
    <h1>file upload</h1>
    <form role="form" className="form" onSubmit={() =>  false}>
      <div className="form-group">
        <label htmlFor="file">File</label>
        <input id="file" ref={fileRef} type="file" className="form-control"/>
      </div>
      <button id="upload" type="button" className="btn btn-primary" onClick={onUpload}>Upload</button>
    </form>
    <div ref={outputRef} className="container"/>
    </>
  )
}