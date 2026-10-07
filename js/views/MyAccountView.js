function MyAccountView({ user, role }) {
      const [currentPwd, setCurrentPwd] = useState('');
      const [newPwd, setNewPwd] = useState('');
      const [confirmPwd, setConfirmPwd] = useState('');
      const [saving, setSaving] = useState(false);

      const handleChangePwd = (e) => {
        e.preventDefault();
        if (newPwd !== confirmPwd) {
          Swal.fire({ icon: 'error', title: 'Passwords do not match!' });
          return;
        }
        setSaving(true);
        setTimeout(() => {
          setSaving(false);
          setCurrentPwd('');
          setNewPwd('');
          setConfirmPwd('');
          Swal.fire({ icon: 'success', title: 'Password Updated', timer: 1400, showConfirmButton: false });
        }, 600);
      };

      return (
        <div className="data-section" style={{ maxWidth: 640 }}>
          <div className="section-header">
            <h2><i className="fas fa-user-circle"></i> My Account</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--navy-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              <i className="fas fa-user"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>{user?.name || 'Administrator'}</h3>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: 13 }}>Role: <span className="tb-pill role">{role}</span> · {user?.email || 'admin@demo.com'}</p>
            </div>
          </div>

          <LteCard title="Change Security Password" icon="fa-lock">
            <form onSubmit={handleChangePwd}>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" required value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" required minLength="6" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" required minLength="6" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-key"></i> Update Password</>}
              </button>
            </form>
          </LteCard>
        </div>
      );
    }
