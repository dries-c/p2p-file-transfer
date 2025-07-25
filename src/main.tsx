//import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Route, Routes} from 'react-router'
import DownloadPage from './routes/download.tsx'
import UploadPage from './routes/upload.tsx'

createRoot(document.getElementById('root')!).render(
  //<StrictMode>
  <BrowserRouter>
    <Routes>
      <Route index element={<UploadPage />} />
      <Route path="download" element={<DownloadPage />} />
    </Routes>
  </BrowserRouter>,
  //</StrictMode>,
)
