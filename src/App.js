import './App.scss';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import Nav from './components/Navigation/Nav';
import Login from './components/UserLogin.js/Login';
function App() {
  return (
    <Router>
      <div className="App">
        {/* <Nav /> */}
        <Routes>
          <Route path="/news" element={<div>News</div>} />
          <Route path="/about" element={<div>Abouts</div>} />
          <Route path="/contact" element={<div>Contact</div>} />
          <Route path="/home" element={<div>Homea</div>} />
          <Route path = "*" element={<div>Access Define</div>} /> 
          <Route path = "/login" element={<div><Login/></div>} /> 

        </Routes>
        
      </div>
    </Router>
  );
}

export default App;
