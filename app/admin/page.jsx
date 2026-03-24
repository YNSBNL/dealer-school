"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const { isAdmin, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const authReady = !authLoading && profile !== null;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", display_name: "" });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Impossible de charger les utilisateurs");
      const data = await res.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }
    fetchUsers();
  }, [authReady, isAdmin, router, fetchUsers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la creation");
      setFormData({ email: "", password: "", display_name: "" });
      setShowForm(false);
      await fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la suppression");
      setDeleteConfirm(null);
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!authReady) {
    return (
      <AppShell>
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
          Chargement...
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) return null;

  return (
    <AppShell secondaryNavTitle="Administration">
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Gestion des utilisateurs
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: "0.5rem 1rem",
              background: "var(--accent-primary, #6366f1)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            {showForm ? "Annuler" : "+ Ajouter un utilisateur"}
          </button>
        </div>

        {error && (
          <div style={{
            padding: "0.75rem 1rem",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8,
            color: "#ef4444",
            marginBottom: "1rem",
            fontSize: "0.875rem",
          }}>
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleCreate}
            style={{
              padding: "1.25rem",
              background: "var(--surface-secondary, #1e1e2e)",
              border: "1px solid var(--border-primary, #333)",
              borderRadius: 12,
              marginBottom: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Nouvel utilisateur
            </h3>
            <input
              type="text"
              placeholder="Nom d'affichage"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              style={inputStyle}
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Mot de passe (min 8 caracteres)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              style={inputStyle}
            />
            {formError && (
              <div style={{ color: "#ef4444", fontSize: "0.8125rem" }}>{formError}</div>
            )}
            <button
              type="submit"
              disabled={formLoading}
              style={{
                padding: "0.5rem 1rem",
                background: "var(--accent-primary, #6366f1)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: formLoading ? "wait" : "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
                alignSelf: "flex-start",
                opacity: formLoading ? 0.7 : 1,
              }}
            >
              {formLoading ? "Creation..." : "Creer le compte"}
            </button>
          </form>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
            Chargement des utilisateurs...
          </div>
        ) : (
          <div style={{
            background: "var(--surface-secondary, #1e1e2e)",
            border: "1px solid var(--border-primary, #333)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-primary, #333)" }}>
                  <th style={thStyle}>Nom</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Niveau</th>
                  <th style={thStyle}>Inscrit le</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border-primary, #333)" }}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                        {u.display_name || "-"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: "var(--text-secondary)" }}>{u.email}</span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: "0.125rem 0.5rem",
                          borderRadius: 4,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: u.role === "admin" ? "rgba(234,179,8,0.15)" : "rgba(99,102,241,0.1)",
                          color: u.role === "admin" ? "#eab308" : "var(--accent-primary, #6366f1)",
                        }}
                      >
                        {u.role === "admin" ? "Admin" : "Utilisateur"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: "var(--text-secondary)" }}>
                        Lv.{u.level || 1} ({u.rank || "Bronze"})
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: "var(--text-secondary)" }}>{formatDate(u.created_at)}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      {u.role !== "admin" && (
                        <>
                          {deleteConfirm === u.id ? (
                            <span style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                              <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>Confirmer ?</span>
                              <button
                                onClick={() => handleDelete(u.id)}
                                style={dangerBtnStyle}
                              >
                                Oui
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                style={cancelBtnStyle}
                              >
                                Non
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(u.id)}
                              style={deleteBtnStyle}
                            >
                              Supprimer
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{
              padding: "0.75rem 1rem",
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
              borderTop: "1px solid var(--border-primary, #333)",
            }}>
              {users.length} utilisateur{users.length > 1 ? "s" : ""} au total
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

const inputStyle = {
  padding: "0.5rem 0.75rem",
  background: "var(--surface-primary, #121220)",
  border: "1px solid var(--border-primary, #333)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: "0.875rem",
  outline: "none",
};

const thStyle = {
  padding: "0.75rem 1rem",
  textAlign: "left",
  fontWeight: 600,
  color: "var(--text-secondary)",
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle = {
  padding: "0.75rem 1rem",
};

const deleteBtnStyle = {
  padding: "0.25rem 0.5rem",
  background: "rgba(239,68,68,0.1)",
  color: "#ef4444",
  border: "1px solid rgba(239,68,68,0.2)",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: "0.75rem",
  fontWeight: 500,
};

const dangerBtnStyle = {
  padding: "0.2rem 0.4rem",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: "0.75rem",
  fontWeight: 600,
};

const cancelBtnStyle = {
  padding: "0.2rem 0.4rem",
  background: "var(--surface-primary, #121220)",
  color: "var(--text-secondary)",
  border: "1px solid var(--border-primary, #333)",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: "0.75rem",
};
