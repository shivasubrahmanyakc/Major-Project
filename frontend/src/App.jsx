import './index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPage     from './pages/UploadPage';
import ProcessingPage from './pages/ProcessingPage';
import ResultPage     from './pages/ResultPage';
import AboutPage      from './pages/AboutPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"           element={<UploadPage />} />
        <Route path="/processing" element={<ProcessingPage />} />
        <Route path="/result"     element={<ResultPage />} />
        <Route path="/about"      element={<AboutPage />} />
      </Routes>
    </Router>
  );
}

export default App;