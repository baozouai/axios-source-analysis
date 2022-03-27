
import ReactDOM from 'react-dom'
import axios from 'axios'
axios.defaults.baseURL = 'http://localhost:4000/'
import './index.css'
import App from './App'

import { BrowserRouter } from 'react-router-dom'

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('root')
)
