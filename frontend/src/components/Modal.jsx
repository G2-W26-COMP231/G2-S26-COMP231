/**
 * Reusable confirm/cancel modal, used all over the app for anything
 * destructive (deleting a group, removing a member, etc). Clicking the
 * dark overlay counts as cancel, but clicking inside the box itself
 * doesn't (that's what the stopPropagation is for).
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.description
 * @param {string} props.confirmLabel - text on the confirm button
 * @param {Function} props.onConfirm
 * @param {Function} props.onCancel
 * @param {boolean} props.busy - disables both buttons and shows "Working..." while true
 */
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