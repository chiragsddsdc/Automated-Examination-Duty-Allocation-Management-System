// src/pages/admin/Notifications.js
import { useState, useEffect } from 'react';
import { notifications as api } from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminNotifications() {
  const [data, setData] = useState({ notifications: [], unread_count: 0 });

  const load = () => api.get().then(res => {
    const result = res.data || {};
    setData({
      notifications: result.notifications || [],
      unread_count: result.unread_count || 0
    });
  }).catch(() => setData({ notifications: [], unread_count: 0 }));

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    await api.markAll();
    toast.success('All marked as read');
    load();
  };

  const markOne = async (id) => {
    await api.markRead(id);
    load();
  };

  return (
    <>
      <div className="page-header">
        <h2>Notifications</h2>
        <p>{data.unread_count} unread notification{data.unread_count !== 1 ? 's' : ''}</p>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">All Notifications</h3>
            {data.unread_count > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={markAll}>Mark All Read</button>
            )}
          </div>
          {data.notifications.length === 0 ? (
            <div className="empty-state"><div className="icon">🔔</div><p>No notifications yet</p></div>
          ) : data.notifications.map(n => (
            <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`} onClick={() => !n.is_read && markOne(n.id)}>
              {!n.is_read && <div className="notif-dot"></div>}
              <div style={{flex:1, marginLeft: n.is_read ? '22px' : '0'}}>
                <div className="notif-title">{n.title}</div>
                <div className="notif-msg">{n.message}</div>
                <div className="notif-time">{new Date(n.created_at).toLocaleString('en-IN')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
