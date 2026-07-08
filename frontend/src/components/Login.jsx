import React, { useState } from 'react'
import { loginStyles } from '../assets/dummyStyles'
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const Login = ({onLogin, API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"}) => {
  const [email, setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [showPassword, setShowPassword]=useState(false);
  const [rememberMe, setRememberMe]=useState(false);
  const [error, setError]=useState("");
  const [isLoading, setIsLoading]=useState(false);
  const navigate=useNavigate();

  const fetchProfile=async(token)=>{
    if(!token) return null;
    const res=await axios.get(`${API_URL}/api/user/me`, {
      headers: {Authorization: `Bearer ${token}`},
    });
    return res.data.user || res.data;
  };

  const persistAuth = (profile, token)=> {
      const storage = rememberMe ? localStorage : sessionStorage;
      try{
        if(token) storage.setItem("token",token);
        if(profile) storage.setItem("user",JSON.stringify(profile));
      }
      catch(err)
      {
          console.error("storage error", err);
      }
  };

  const handleSubmit = async(e) => {
      e.preventDefault();
      setIsLoading(true);
      setError("");

      try{
        const res=await axios.post(
          `${API_URL}/api/user/login`,
          {email, password},
          {headers: {"Content-Type": "application/json"}},
        );
        const data=res.data || {};
        const token = data.token || null;

        let profile = data.user ?? null;
        if(!profile) 
        {
            const copy={...data};
            delete copy.token;
            delete copy.user;

            if(Object.keys(copy).length)
            {
                profile=copy;
            }
        }

        if(!profile && token)
        {
            try
            {
                profile=await fetchProfile(token);
            }
            catch(err)
            {
                  console.warn("could not fetch profile after login token",err);
                  profile={ email };
            }
        } 
        if(!profile) profile={ email };
        persistAuth(profile, token);

        if(typeof onLogin === "function")
        {
            try
            {
                onLogin(profile, rememberMe, token);
            }
            catch(callerr)
            {
                console.warn("onlogin threw: ", callerr);
                navigate("/");
            }
        }
        else
        {
            navigate("/");
        }
        setPassword("");
      }
      catch (err) {
        console.error("Login error:", err?.response || err);
        const serverMsg =
          err.response?.data?.message ||
          (err.response?.data ? JSON.stringify(err.response.data) : null) ||
          err.message ||
          "Login failed";
        setError(serverMsg);
      }
      finally
      {
        setIsLoading(false);
      }
  }

  return (
    <div className={loginStyles.pageContainer}>
        <div className={loginStyles.cardContainer}>
            <div className={loginStyles.header}>
                  <div className={loginStyles.avatar}>
                      <User className='w-10 h-10 text-white'/>
                  </div> 
                  <h1 className={loginStyles.headerTitle}>Welcome back</h1>
                  <p className={loginStyles.headerSubtitle}>
                  sign in to your expense tracker account
                  </p>
            </div>
            <div className={loginStyles.formContainer}>
              {error && (
                <div className={loginStyles.errorContainer}>
                  <div className={loginStyles.errorIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className={loginStyles.errorText}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className={loginStyles.label}>
                      Email address
                    </label>
                    <div className={loginStyles.inputContainer}>
                      <div className={loginStyles.inputIcon}>
                          <Mail className="w-5 h-5"/>
                      </div>
                      <input type="email" 
                      id="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className={loginStyles.input} 
                      placeholder="your@example.com" 
                      required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className={loginStyles.label}>
                      Password
                    </label>
                    <div className={loginStyles.inputContainer}>
                      <div className={loginStyles.inputIcon}>
                          <Lock className="w-5 h-5"/>
                      </div>
                      <input type={showPassword ? "text" : "password"} 
                      id="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className={loginStyles.paswordinput} 
                      placeholder="******" 
                      required
                      />
                      <button type="button" onClick={()=>setShowPassword(!showPassword)}
                          className={loginStyles.passwordToggle}>
                            {showPassword ? (
                                  <EyeOff className="w-5 h-5"/>
                            ) : (
                                <Eye className="w-5 h-5"/>
                            )}
                      </button>
                    </div>
                  </div>

                  <div className={loginStyles.checkboxContainer}>
                    <label className={loginStyles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        checked={rememberMe} 
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className={loginStyles.checkbox}
                      />
                      <span>Remember me</span>
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className={loginStyles.submitButton}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
              </form>
              <div className={loginStyles.footerText}>
                Don't have an account? 
                <Link to="/register" className={loginStyles.footerLink}>
                  Sign Up
                </Link>
              </div>
            </div>
        </div>
    </div>
  )
}

export default Login;