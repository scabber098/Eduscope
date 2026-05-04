// === FILE: client/src/components/ProtectedRoute.jsx ===
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function ProtectedRoute({ role, children }) {
  const { user, isAuthed } = useAuth();
  if (!isAuthed) return <Navigate to="/auth" replace/>;
  if (role && user?.role !== role) return <Navigate to={user?.role === 'faculty' ? '/faculty' : '/student'} replace/>;
  return children;
}
