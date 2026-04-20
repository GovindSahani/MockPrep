import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const HistoryPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get('/sessions');
        setSessions(res.data);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  return (
    <div className="app-wrapper flex-col">
      <Navbar />
      <div className="container" style={{ flex: 1, padding: '40px 24px' }}>
        <h1 className="page-title" style={{ marginBottom: '8px' }}>Interview History</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Review all your past mock interviews to track improvement.</p>
        
        {loading ? (
          <p>Loading history...</p>
        ) : sessions.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No history available yet.</p>
          </div>
        ) : (
          <table className="responsive-table glass-panel">
            <thead>
              <tr>
                <th>Date</th>
                <th>Role</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s._id}>
                  <td data-label="Date" style={{ color: 'var(--text-secondary)' }}>{new Date(s.startedAt).toLocaleDateString()}</td>
                  <td data-label="Role" style={{ textTransform: 'capitalize' }}>{s.role}</td>
                  <td data-label="Difficulty">{s.difficulty}</td>
                  <td data-label="Status" style={{ color: s.status === 'completed' ? 'var(--success)' : 'var(--warning)' }}>{s.status}</td>
                  <td data-label="Action">
                    {s.status === 'completed' ? (
                      <Link to={`/results/${s._id}`} style={{ color: 'var(--primary-color)' }}>View Results</Link>
                    ) : (
                      <Link to={`/interview/${s._id}`} style={{ color: 'var(--warning)' }}>Resume</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
