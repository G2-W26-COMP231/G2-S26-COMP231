// components/Modal.jsx
// Reusable confirmation modal, matching the "Remove member?" / "Leave
// group?" / "Delete group?" style confirmation dialogs across the mockups.
export default function Modal({ title, description, confirmLabel, onConfirm, onCancel, busy }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="modal-actions">
          <button className="secondary" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
