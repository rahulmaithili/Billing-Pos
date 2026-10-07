function UsersView({ user, role }) {
      const [showModal, setShowModal] = useState(false);
      const [editingId, setEditingId] = useState(null);
      const [reloadKey, setReloadKey] = useState(0);
      const [load, setLoad] = useState('');
      const tableInstanceRef = useRef(null);

      const { loading, data, err } = useFetch(() => fbGetUsers(), [reloadKey]);
      const [viewUser, setViewUser] = useState(null);
      const users = useMemo(() => (data && data.success ? data.data : []), [data]);
      const reload = () => setReloadKey(k => k + 1);
      const byId = useMemo(() => users.reduce((m, u) => (m[u.id] = u, m), {}), [users]);
      const adminCount = useMemo(() => users.filter(u => u.role === 'Admin').length, [users]);
      const openEdit = useCallback((id) => { setEditingId(id); setShowModal(true); }, []);

      useEffect(() => {
        if (err || (data && !data.success)) Swal.fire({ icon: 'error', title: 'Error', text: (data && data.message) || 'Failed to load users' });
      }, [err, data]);

      useEffect(() => {
        if (loading) return;
        let table = tableInstanceRef.current;
        if (table) {
          table.clear().rows.add(users).draw(false);
        } else {
          table = $('#usersTable').DataTable({
            data: users,
            columnDefs: [{ targets: '_all', defaultContent: '' }], // tolerate rows missing newer fields - no "unknown parameter" warning
            columns: [
              { data: 'name', title: 'Name', render: (d, t) => t === 'display' ? esc(d) : d },
              { data: 'email', title: 'Email', render: (d, t) => t === 'display' ? esc(d) : d },
              { data: 'role', title: 'Role', render: (d, t) => t === 'display' ? '<span class="role-badge ' + (d === 'Admin' ? 'role-admin' : 'role-emp') + '">' + esc(d) + '</span>' : d },
              { data: null, title: 'Actions', orderable: false, render: () => `<button class="action-icon" data-action="view" title="View"><i class="fas fa-eye"></i></button><button class="action-icon edit-icon" data-action="edit" title="Edit"><i class="fas fa-edit"></i></button><button class="action-icon delete-icon" data-action="delete" title="Delete"><i class="fas fa-trash"></i></button>` }
            ],
            pageLength: 10,
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, 'All']],
            responsive: true,
            dom: 'Blfrtip',
            buttons: [
              { extend: 'csv', text: '<i class="fas fa-file-csv"></i> CSV', exportOptions: { columns: ':not(:last-child)' } },
              { extend: 'pdf', text: '<i class="fas fa-file-pdf"></i> PDF', exportOptions: { columns: ':not(:last-child)' } },
              { extend: 'print', text: '<i class="fas fa-print"></i> Print', exportOptions: { columns: ':not(:last-child)' } }
            ],
            order: [[0, 'asc']]
          });
          tableInstanceRef.current = table;
        }
        $('#usersTable').off('click', '.action-icon').on('click', '.action-icon', function () {
          const id = table.row($(this).parents('tr')).data().id;
          const act = $(this).data('action');
          if (act === 'view') setViewUser(byId[id]);
          else if (act === 'edit') openEdit(id);
          else handleDelete(byId[id]);
        });
      }, [loading, users]);

      useEffect(() => () => {
        if (tableInstanceRef.current) { try { tableInstanceRef.current.destroy(); tableInstanceRef.current = null; } catch (e) { } }
      }, []);

      const handleSave = async (formData) => {
        setLoad(editingId ? 'Updating user...' : 'Saving user...');
        const result = editingId ? await fbUpdateUser(editingId, formData, user) : await fbAddUser(formData, user);
        setLoad('');
        if (result.success) {
          setShowModal(false); setEditingId(null);
          Swal.fire({ icon: 'success', title: 'Success!', text: result.message, timer: 2000, showConfirmButton: false });
          reload();
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: result.message });
        }
      };

      const handleDelete = (u) => {
        if (u.id === user.id || u.email === user.email) return Swal.fire({ icon: 'warning', title: 'Not Allowed', text: 'You cannot delete your own account while logged in.' });
        if (u.role === 'Admin' && adminCount <= 1) return Swal.fire({ icon: 'warning', title: 'Not Allowed', text: 'At least one Admin account must remain.' });
        Swal.fire({ icon: 'warning', title: 'Delete?', text: 'This cannot be undone', showCancelButton: true, confirmButtonColor: '#ea4335', confirmButtonText: 'Delete' }).then(async (result) => {
          if (!result.isConfirmed) return;
          setLoad('Deleting user...');
          const r = await fbDeleteUser(u.id, u.name, user);
          setLoad('');
          if (r.success) { Swal.fire({ icon: 'success', text: r.message, timer: 2000, showConfirmButton: false }); reload(); }
          else Swal.fire({ icon: 'error', title: 'Error', text: r.message });
        });
      };

      return (
        <div className="data-section">
          {load && <TopLoadingBar />}
          <div className="section-header">
            <h2><i className="fas fa-users-cog"></i> Users</h2>
            <div style={{ display: 'flex', gap: '10px' }}><RefreshBtn onClick={reload} /><button className="btn btn-success" onClick={() => { setEditingId(null); setShowModal(true); }}><i className="fas fa-plus"></i> Add User</button></div>
          </div>
          {loading && <TableSkeleton rows={5} columns={4} />}
          <div style={{ display: loading ? 'none' : 'block' }}>
            <table id="usersTable" className="display" style={{ width: '100%' }}></table>
          </div>
          {viewUser && <UserHubModal account={viewUser} onClose={() => setViewUser(null)} />}
          {showModal && <UserModal editUser={byId[editingId]} onClose={() => { setShowModal(false); setEditingId(null); }} onSave={handleSave} />}
        </div>
      );
    }

    // --- About View ---
