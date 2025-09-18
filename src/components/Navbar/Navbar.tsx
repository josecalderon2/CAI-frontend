import { Link } from 'react-router-dom';
import logo from '../../../public/logoCai.png';

export default function Navbar() {
  return (
    <nav
      className="navbar"
      style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
    >
      <Link to="/">
        <img
          src={logo}
          alt="Logo"
          style={{ height: '72px', marginRight: '1rem' }}
        />
      </Link>
      <Link to="/" style={{ marginRight: '1rem' }}>
        Home
      </Link>
      <Link to="/example">Ejemplo</Link>
      {/* Agrega aquí más enlaces según crezcas el proyecto */}
    </nav>
  );
}
