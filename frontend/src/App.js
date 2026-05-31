import React, { useState, useEffect } from "react";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const COLORS = ["blue", "red", "orange", "yellow", "green", "purple", "pink"];
const COLOR_HEX = {
  blue: "#579bfc", red: "#ff4f4f", orange: "#ff9800",
  yellow: "#ffd600", green: "#00c875", purple: "#a25ddc", pink: "#ff5ac4",
};

const EMPTY_STATES = {
  all:       { emoji: "🎉", title: "All clear!", sub: "Add a task above to get started." },
  active:    { emoji: "✅", title: "Nothing left to do!", sub: "You've completed everything." },
  completed: { emoji: "📭", title: "No completed tasks yet", sub: "Finish something and it'll show up here." },
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState("blue");

  const [filter, setFilter] = useState("all");
  const [showCompleted, setShowCompleted] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // ── Fetch ──
  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    try {
      const res = await fetch(`${API_URL}/api/todos`);
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      // store color in local state since DB doesn't have it
      setTodos(data.map(t => ({ ...t, color: t.color || "blue" })));
      setError(null);
    } catch (e) {
      setError("Can't reach the server. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  // ── Add ──
  async function addTodo() {
    if (!title.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: desc.trim() }),
      });
      if (!res.ok) throw new Error();
      const newTodo = await res.json();
      setTodos(prev => [{ ...newTodo, color }, ...prev]);
      setTitle("");
      setDesc("");
      setColor("blue");
    } catch {
      setError("Failed to add task.");
    }
  }

  // ── Toggle ──
  async function toggleTodo(todo) {
    try {
      const res = await fetch(`${API_URL}/api/todos/${todo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setTodos(prev => prev.map(t => t.id === todo.id ? { ...updated, color: t.color } : t));
    } catch {
      setError("Failed to update task.");
    }
  }

  // ── Delete ──
  async function deleteTodo(id) {
    try {
      await fetch(`${API_URL}/api/todos/${id}`, { method: "DELETE" });
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch {
      setError("Failed to delete task.");
    }
  }

  // ── Edit ──
  function startEdit(todo) {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDesc(todo.description || "");
  }

  async function saveEdit(id) {
    if (!editTitle.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), description: editDesc.trim() }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setTodos(prev => prev.map(t => t.id === id ? { ...updated, color: t.color } : t));
      setEditingId(null);
    } catch {
      setError("Failed to save edit.");
    }
  }

  // ── Derived ──
  const active = todos.filter(t => !t.completed);
  const completed = todos.filter(t => t.completed);

  const filtered =
    filter === "active" ? active :
    filter === "completed" ? completed :
    todos;

  const activeFiltered = filtered.filter(t => !t.completed);
  const completedFiltered = filtered.filter(t => t.completed);

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-dot" />
          My Todos
        </div>
        <div className="stats-pill">
          <span>{completed.length}</span> / {todos.length} done
        </div>
      </header>

      <main className="main">
        {/* Error */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}>✕</button>
          </div>
        )}

        {/* Add card */}
        <div className="add-card">
          <div className="add-row">
            <div className="color-picker">
              {COLORS.map(c => (
                <div
                  key={c}
                  className={`color-dot${color === c ? " selected" : ""}`}
                  style={{ background: COLOR_HEX[c] }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>
          <div className="add-row">
            <input
              className="add-input"
              placeholder="What needs to be done?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTodo()}
            />
            <button className="add-btn" onClick={addTodo} disabled={!title.trim()}>
              + Add
            </button>
          </div>
          <textarea
            className="desc-input"
            placeholder="Add a description (optional)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows={1}
          />
        </div>

        {/* Filters */}
        <div className="filters">
          {["all", "active", "completed"].map(f => (
            <button
              key={f}
              className={`filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="filter-count">
                {f === "all" ? todos.length : f === "active" ? active.length : completed.length}
              </span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading">
            <div className="spinner" />
            Loading your tasks…
          </div>
        )}

        {/* List */}
        {!loading && (
          <>
            {/* Active todos */}
            {activeFiltered.length > 0 && (
              <>
                {filter === "all" && <div className="section-label">To Do · {activeFiltered.length}</div>}
                <div className="todo-list">
                  {activeFiltered.map(todo => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      editing={editingId === todo.id}
                      editTitle={editTitle}
                      editDesc={editDesc}
                      setEditTitle={setEditTitle}
                      setEditDesc={setEditDesc}
                      onToggle={() => toggleTodo(todo)}
                      onEdit={() => startEdit(todo)}
                      onSave={() => saveEdit(todo.id)}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => deleteTodo(todo.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Completed todos */}
            {completedFiltered.length > 0 && filter !== "active" && (
              <div className="completed-section">
                <button className="completed-toggle" onClick={() => setShowCompleted(s => !s)}>
                  {showCompleted ? "▾" : "▸"} Completed · {completedFiltered.length}
                </button>
                {showCompleted && (
                  <div className="todo-list">
                    {completedFiltered.map(todo => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        editing={editingId === todo.id}
                        editTitle={editTitle}
                        editDesc={editDesc}
                        setEditTitle={setEditTitle}
                        setEditDesc={setEditDesc}
                        onToggle={() => toggleTodo(todo)}
                        onEdit={() => startEdit(todo)}
                        onSave={() => saveEdit(todo.id)}
                        onCancel={() => setEditingId(null)}
                        onDelete={() => deleteTodo(todo.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="empty">
                <span className="empty-emoji">{EMPTY_STATES[filter].emoji}</span>
                <div className="empty-title">{EMPTY_STATES[filter].title}</div>
                <div className="empty-sub">{EMPTY_STATES[filter].sub}</div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

function TodoItem({ todo, editing, editTitle, editDesc, setEditTitle, setEditDesc, onToggle, onEdit, onSave, onCancel, onDelete }) {
  return (
    <div className={`todo-item${todo.completed ? " completed" : ""}`} data-color={todo.color || "blue"}>
      <div className={`checkbox${todo.completed ? " checked" : ""}`} onClick={onToggle} />

      <div className="todo-content">
        {editing ? (
          <>
            <input
              className="edit-input"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
              autoFocus
            />
            <input
              className="edit-desc-input"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              placeholder="Description (optional)"
              onKeyDown={e => { if (e.key === "Escape") onCancel(); }}
            />
            <div className="edit-actions">
              <button className="btn-save" onClick={onSave}>Save</button>
              <button className="btn-cancel" onClick={onCancel}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className="todo-title">{todo.title}</div>
            {todo.description && <div className="todo-desc">{todo.description}</div>}
            <div className="todo-meta">{formatDate(todo.created_at)}</div>
          </>
        )}
      </div>

      {!editing && (
        <div className="item-actions">
          <button className="icon-btn" onClick={onEdit} title="Edit">✏️</button>
          <button className="icon-btn delete" onClick={onDelete} title="Delete">🗑️</button>
        </div>
      )}
    </div>
  );
}