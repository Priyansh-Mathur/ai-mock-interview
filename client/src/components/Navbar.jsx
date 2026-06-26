import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <Link className="brand" to="/">AI Mock Interview</Link>
      <nav>
        {user ? (
          <>
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/reports">Reports</NavLink>
            <span className="user-chip">{user.name}</span>
            <button className="nav-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Signup</NavLink>
          </>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
