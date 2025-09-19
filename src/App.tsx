import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import EncryptedSvgImg from './EncryptedSvgImg'

type Meta = {
  name: string,
  path: string
}

function App() {
  const [count, setCount] = useState(0)
  const [meta, setMeta] = useState<Meta[]>([])

  useEffect(() => {
    fetch('/static/iconLibrary/meta.json')
      .then(res => res.json())
      .then(data => setMeta(data))
      .catch(err => console.error('Error loading JSON:', err));
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <div className='icon-list'>
      {
        meta.map((data, index) => {
          // ToDo:暗号化の時に透かしを入れる
          // ToDO：PNGで表示する
          return (
            <EncryptedSvgImg key={index} src={data.path} width={100} height={100} />
          )
        })
      }        
      </div>

    </>
  )
}

export default App
