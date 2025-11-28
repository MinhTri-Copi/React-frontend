import './App.scss';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import Nav from './components/Navigation/Nav';
import Login from './page/auth/Login';
import Register from './page/auth/Register';
import CandidateHome from './page/candidate/CandidateHome';
import CompanyList from './page/candidate/CompanyList';
import MyRecords from './page/candidate/MyRecords';
import JobList from './page/candidate/JobList';
import JobDetail from './page/candidate/JobDetail';
import MyApplications from './page/candidate/MyApplications';
import TestTaking from './page/candidate/TestTaking';
import HrDashboard from './page/hr/HrDashboard';

function App() {
  return (
    <Router>
      <div className="App">
        {/* <Nav /> */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Candidate Routes */}
          <Route path="/candidate" element={<CandidateHome />} />
          <Route path="/candidate/jobs" element={<JobList />} />
          <Route path="/candidate/jobs/:id" element={<JobDetail />} />
          <Route path="/candidate/companies" element={<CompanyList />} />
          <Route path="/candidate/my-records" element={<MyRecords />} />
          <Route path="/candidate/my-applications" element={<MyApplications />} />
          <Route path="/candidate/tests/:submissionId" element={<TestTaking />} />
          <Route path="/candidate/profile" element={<div>Profile Page</div>} />
          <Route path="/candidate/settings" element={<div>Settings Page</div>} />
          
          {/* Other Routes */}
          <Route path="/admin" element={<div>Admin Dashboard</div>} />
          <Route path="/hr" element={<HrDashboard />} />
          <Route path="/hr/tests" element={<HrDashboard />} />
          <Route path="/hr/test-submissions" element={<HrDashboard />} />
          <Route path="/hr/candidates" element={<HrDashboard />} />
          <Route path="/hr/company-profile" element={<HrDashboard />} />
          <Route path="/" element={<Login />} />
          <Route path="*" element={<div>Access Denied</div>} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App;
