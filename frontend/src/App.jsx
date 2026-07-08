import React, {useState, useEffect} from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import IncomePage from './pages/IncomePage'
import ExpensePage from './pages/ExpensePage'
import ProfilePage from './pages/ProfilePage'
import BorrowLendPage from './pages/BorrowLendPage'
import ChallengesPage from './pages/ChallengesPage'
import { useNavigate } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'

const App = () => {
  const [user,setUser] = useState(null);
  const [token,setToken] = useState(null);
  const navigate  = useNavigate();

  // Restore auth from storage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
      const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedToken) setToken(storedToken);
    } catch (err) {
      console.error("Failed to restore auth session:", err);
    }
  }, []);

  // Restore theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // to save the token 
  const persistAuth = (userObj, tokenStr, remember = false) => {
    try {
      if (remember) {
        if (userObj) localStorage.setItem("user", JSON.stringify(userObj));
        if (tokenStr) localStorage.setItem("token", tokenStr);
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
      } else {
        if (userObj) sessionStorage.setItem("user", JSON.stringify(userObj));
        if (tokenStr) sessionStorage.setItem("token", tokenStr);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
      setUser(userObj || null);
      setToken(tokenStr || null);
    } catch (err) {
      console.error("persistAuth error:", err);
    }
  };

  const clearAuth=()=>{
    try{
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    }
    catch(err){
      console.error("clearAuth error:",err);
    }
    setUser(null);
    setToken(null);
  }

  const handleLogout=()=>{
    clearAuth();
    navigate("/login");
  };

  const handleLogin=(userData, remember = false, tokenFromApi = null) => {
    persistAuth(userData, tokenFromApi, remember);
    navigate("/");
  };

  const handleRegister=(userData, tokenFromApi = null) => {
    persistAuth(userData, tokenFromApi, true);
    navigate("/");
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
    storage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <>
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} /> } />
      <Route path="/register" element={<Register onRegister={handleRegister} /> } />
      <Route element={<Layout user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />}> 
          <Route path="/" element={<Dashboard/>} />
          <Route path="/income" element={<IncomePage/>} />
          <Route path="/expense" element={<ExpensePage/>} />
          <Route path="/borrow-lend" element={<BorrowLendPage/>} />
          <Route path="/challenges" element={<ChallengesPage/>} />
          <Route path="/profile" element={<ProfilePage/>} />
      </Route>
    </Routes>
    </>
  );
};

export default App