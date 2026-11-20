import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import * as branchesApi from '@/api/branchesApi';
import * as tenantsApi from '@/api/tenantsApi';
import * as usersApi from '@/api/usersApi';
import type { BranchResponse, Role, TenantResponse, UserResponse } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { getAssignableRoles, ROLE_LABELS } from '@/auth/roles';

type FormMode = 'create' | 'edit';

type UserFormState = {
  name: string;
  userName: string;
  password: string;
  role: Role;
  isActive: boolean;
  tenantId: string;
  branchId: string;
};

const BRANCH_ROLES: readonly Role[] = ['Manager', 'Waiter', 'Kitchen', 'Cashier'];

function needsBranch(role: Role): boolean {
  return BRANCH_ROLES.includes(role);
}

const emptyForm = (defaultRole: Role): UserFormState => ({
  name: '',
  userName: '',
  password: '',
  role: defaultRole,
  isActive: true,
  tenantId: '',
  branchId: '',
});

export function UsersPage() {
  const { getAccessToken, role, tenantId, branchId, userId } = useAuth();
  const assignableRoles = useMemo(() => getAssignableRoles(role), [role]);
  const defaultRole = assignableRoles.includes('Waiter')
    ? 'Waiter'
    : (assignableRoles[0] ?? 'Waiter');

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);

  const [mode, setMode] = useState<FormMode | null>(null);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [form, setForm] = useState<UserFormState>(() => emptyForm(defaultRole));

  const showTenant =
    mode === 'create' && role === 'PlatformAdmin' && form.role !== 'PlatformAdmin';
  const showBranch = mode === 'create' && needsBranch(form.role);
  const branchTenantId = role === 'PlatformAdmin' ? form.tenantId : tenantId;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const list = await usersApi.listUsers(
        token,
        role === 'PlatformAdmin' ? tenantId : undefined,
      );
      setUsers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, role, tenantId]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!showTenant) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const token = await getAccessToken();
        const list = await tenantsApi.listTenants(token);
        if (!cancelled) {
          setTenants(list.filter((item) => item.isActive));
        }
      } catch (err) {
        if (!cancelled) {
          setFormError(err instanceof Error ? err.message : 'İşletmeler yüklenemedi');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showTenant, getAccessToken]);

  useEffect(() => {
    if (!showBranch || !branchTenantId) {
      setBranches([]);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const token = await getAccessToken();
        const list = await branchesApi.listBranches(
          token,
          role === 'PlatformAdmin' ? branchTenantId : undefined,
        );
        if (cancelled) {
          return;
        }

        const active = list.filter((item) => item.isActive);
        setBranches(
          role === 'Manager' && branchId
            ? active.filter((item) => item.id === branchId)
            : active,
        );
      } catch (err) {
        if (!cancelled) {
          setFormError(err instanceof Error ? err.message : 'Şubeler yüklenemedi');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showBranch, branchTenantId, role, branchId, getAccessToken]);

  function openCreate() {
    setMode('create');
    setEditingUser(null);
    setFormError(null);
    setForm({
      ...emptyForm(defaultRole),
      branchId: role === 'Manager' ? (branchId ?? '') : '',
    });
  }

  function openEdit(user: UserResponse) {
    setMode('edit');
    setEditingUser(user);
    setFormError(null);
    setForm({
      name: user.name,
      userName: user.userName,
      password: '',
      role: user.role,
      isActive: user.isActive,
      tenantId: user.tenantId ?? '',
      branchId: '',
    });
  }

  function closeForm() {
    setMode(null);
    setEditingUser(null);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const token = await getAccessToken();

      if (mode === 'create') {
        const selectedTenantId = showTenant ? form.tenantId : '';
        const selectedBranchId = showBranch
          ? role === 'Manager'
            ? (branchId ?? '')
            : form.branchId
          : '';

        if (showTenant && !selectedTenantId) {
          throw new Error('İşletme seç.');
        }

        if (showBranch && !selectedBranchId) {
          throw new Error('Şube seç.');
        }

        await usersApi.createUser(token, {
          name: form.name.trim(),
          userName: form.userName.trim(),
          password: form.password,
          role: form.role,
          tenantId: selectedTenantId || undefined,
          branchId: selectedBranchId || undefined,
        });
      } else if (mode === 'edit' && editingUser) {
        await usersApi.updateUser(token, editingUser.id, {
          name: form.name.trim(),
          isActive: form.isActive,
          role: form.role,
          password: form.password.trim() ? form.password : null,
        });
      }

      closeForm();
      await loadUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: UserResponse) {
    if (user.id === userId) {
      setError('Kendi hesabını silemezsin.');
      return;
    }

    const confirmed = window.confirm(
      `"${user.name}" kullanıcısını silmek istediğine emin misin?`,
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    try {
      const token = await getAccessToken();
      await usersApi.deleteUser(token, user.id);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silme başarısız');
    }
  }

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h1>Kullanıcılar</h1>
          <p className="muted">Şube kullanıcılarını yönet</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          Yeni kullanıcı
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <p className="muted">Yükleniyor...</p>
      ) : users.length === 0 ? (
        <p className="muted">Henüz kullanıcı yok.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ad</th>
                <th>Kullanıcı adı</th>
                <th>Rol</th>
                <th>Durum</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.userName}</td>
                  <td>{ROLE_LABELS[user.role]}</td>
                  <td>
                    <span
                      className={`status-pill${user.isActive ? ' is-active' : ''}`}
                    >
                      {user.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button
                      className="btn"
                      type="button"
                      onClick={() => openEdit(user)}
                    >
                      Düzenle
                    </button>
                    <button
                      className="btn"
                      type="button"
                      disabled={user.id === userId}
                      onClick={() => void handleDelete(user)}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mode ? (
        <div className="modal-backdrop" role="presentation" onClick={closeForm}>
          <div
            className="card card-wide modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="user-form-title">
              {mode === 'create' ? 'Yeni kullanıcı' : 'Kullanıcıyı düzenle'}
            </h2>

            <form className="form" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="user-name">Ad</label>
                <input
                  id="user-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              {mode === 'create' ? (
                <div className="field">
                  <label htmlFor="user-username">Kullanıcı adı</label>
                  <input
                    id="user-username"
                    value={form.userName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, userName: e.target.value }))
                    }
                    required
                    autoComplete="off"
                  />
                </div>
              ) : (
                <div className="field">
                  <label>Kullanıcı adı</label>
                  <input value={form.userName} disabled />
                </div>
              )}

              <div className="field">
                <label htmlFor="user-role">Rol</label>
                <select
                  id="user-role"
                  value={form.role}
                  onChange={(e) => {
                    const nextRole = e.target.value as Role;
                    setForm((prev) => ({
                      ...prev,
                      role: nextRole,
                      tenantId: nextRole === 'PlatformAdmin' ? '' : prev.tenantId,
                      branchId: needsBranch(nextRole)
                        ? role === 'Manager'
                          ? (branchId ?? '')
                          : prev.branchId
                        : '',
                    }));
                  }}
                >
                  {(assignableRoles.includes(form.role)
                    ? assignableRoles
                    : [form.role, ...assignableRoles]
                  ).map((item) => (
                    <option key={item} value={item}>
                      {ROLE_LABELS[item] ?? item}
                    </option>
                  ))}
                </select>
              </div>

              {showTenant ? (
                <div className="field">
                  <label htmlFor="user-tenant">İşletme</label>
                  <select
                    id="user-tenant"
                    value={form.tenantId}
                    required
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        tenantId: e.target.value,
                        branchId: '',
                      }))
                    }
                  >
                    <option value="">İşletme seç</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {showBranch ? (
                <div className="field">
                  <label htmlFor="user-branch">Şube</label>
                  <select
                    id="user-branch"
                    value={role === 'Manager' ? (branchId ?? '') : form.branchId}
                    required
                    disabled={role === 'Manager' || (showTenant && !form.tenantId)}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, branchId: e.target.value }))
                    }
                  >
                    <option value="">
                      {showTenant && !form.tenantId ? 'Önce işletme seç' : 'Şube seç'}
                    </option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="field">
                <label htmlFor="user-password">
                  {mode === 'create' ? 'Şifre' : 'Yeni şifre (opsiyonel)'}
                </label>
                <input
                  id="user-password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  required={mode === 'create'}
                  autoComplete="new-password"
                />
              </div>

              {mode === 'edit' ? (
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                  />
                  Aktif
                </label>
              ) : null}

              {formError ? <p className="error">{formError}</p> : null}

              <div className="actions">
                <button className="btn" type="button" onClick={closeForm}>
                  Vazgeç
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
