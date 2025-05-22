import { Loader2 } from 'lucide-react';
import '../styles/Loading.css'; // if needed for styling

export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="assign-page">
      <div className="assign-card" style={{ textAlign: 'center' }}>
        <Loader2 className="spinner" />
        <p>{message}</p>
      </div>
    </div>
  );
}
