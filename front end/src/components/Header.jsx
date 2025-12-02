import { NavLink, useNavigate } from 'react-router-dom';
import '../css/navbar.css';

const Header = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const { username } = userInfo;
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('friday_token');
    localStorage.removeItem('userInfo');
    navigate('/');
    window.location.reload();
  };

  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="header-left">
          <h1>Hospitality Admin</h1>
          <p className="header-subtitle">Hospi & PR Team Portal</p>
        </div>

        <div className="header-right">
          <nav className="nav-inner" aria-label="Main navigation">
            <NavLink to="/" end className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
            <NavLink to="/allocation" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              Allocation
            </NavLink>
          </nav>

          <div className="user-info">
            <span className="user-icon">👤</span>
            <span className="username">{username}</span>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6M10.6667 11.3333L14 8M14 8L10.6667 4.66667M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
