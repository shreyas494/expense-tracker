import React, { useEffect } from 'react'
import { navbarStyles } from '../assets/dummyStyles'
import img1 from '../assets/logo.png'
import { useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import { ChevronDown, Sun, Moon } from 'lucide-react';
import { User } from 'lucide-react';
import { LogOut } from 'lucide-react';
import axios from 'axios';


const BASE_URL = 'http://localhost:4000/api'

const Navbar = ({user: propUser, onLogout, theme, toggleTheme}) => {
    const navigate = useNavigate();
    const menuRef = useRef();
    const [menuOpen, setMenuOpen] = useState(false);

 
    const [user, setUser] = useState(propUser || {
        name: "",
        email: "",
    });

    useEffect(() => {
        if (propUser) {
            setUser(propUser);
        }
    }, [propUser]);

    //to fetch the user data from server
    useEffect(() =>{
        const fetchUserData = async () => {
            try{
                    const token = localStorage.getItem("token");
                    if(!token) return;

                    const response = await axios.get(`${BASE_URL}/user/me`,{
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    const userData = response.data.user || response.data;
                    setUser(userData);
            }catch(error)
            {
                console.error("failed to load profile",error);
            }
        };
        if(!propUser){
            fetchUserData();
        }
    }, [propUser]);

    const toggleMenu = () => {
        setMenuOpen((prev) => !prev);
    }

    const handleLogout = () => {
        setMenuOpen(false);
        localStorage.removeItem("token");
        onLogout?.();
        navigate("/login");
    };


    // closes menu if clicked outside the box 
     useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <header className={navbarStyles.header}>
        <div className={navbarStyles.container}>
            {/* logo */}
            <div onClick={() => navigate("/")} 
            className={navbarStyles.logoContainer}>
                <div className={navbarStyles.logoImage}>
                    <img src={img1} alt="logo" className={navbarStyles.logo}/>


                </div>

                <span className={navbarStyles.logoText}>Expense Tracker</span>

            
            </div>

            {/* if the user is present */}
            {user && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer flex items-center justify-center"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-700" />}
                  </button>

                  <div className={navbarStyles.userContainer} ref={menuRef}>
                <button onClick={toggleMenu} className={navbarStyles.userButton}>
                <div className="flex items-center gap-3">
                  <div className="relative"> 
                        <div className={navbarStyles.userAvatar}>
                            {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className={navbarStyles.statusIndicator}>
                        </div>
                  </div>

                  <div className={navbarStyles.userTextContainer}>
                    <p className={navbarStyles.userName}>{user?.name || "User"}</p>
                    <p className={navbarStyles.userEmail}>{user?.email || "user@expensetracker.com"}</p>
                  </div>
                </div>

                <ChevronDown className={navbarStyles.chevronIcon(menuOpen)}/>
                </button>
                {/* dropdown menu */}
                {menuOpen && (
                    <div className={navbarStyles.dropdownMenu}>
                        <div className={navbarStyles.dropdownHeader}>
                                <div className="flex items-center gap-3">
                                        <div className={navbarStyles.dropdownAvatar}>
                                            {user?.name?.[0]?.toUpperCase() || "U"}
                                        </div>

                                        <div>
                                            <div className={navbarStyles.dropdownName}>
                                                {user?.name || "User"}

                                            </div>
                                            <div className={navbarStyles.dropdownEmail}>
                                                {user?.email || "user@expensetracker.com"}
                                            </div>
                                        </div>
    
                                </div>
                        </div>
                        <div className={navbarStyles.menuItemContainer}>
                            <button onClick={() => {
                                setMenuOpen(false);
                                navigate("/profile");
                            }} className={navbarStyles.menuItem}>
                                <User className=" w-4 h-4"/>
                                <span>my profile</span>
                            </button>

                        </div>
                        <div className={navbarStyles.menuItemBorder}>
                        <button onClick={handleLogout} className={navbarStyles.logoutButton}>
                            <LogOut className=' w-4 h-4'/>
                            <span>Log Out</span>

                        </button>

                        </div>
                    </div>
                )}


                
                </div>
                </div>
            )}
        </div>

    </header>
  )
}

export default Navbar