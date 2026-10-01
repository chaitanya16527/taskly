import Modal from "./Modal";

export default function ConfirmModal({ title, message, confirmLabel = "Delete", onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="muted">{message}</p>
      <p className="muted small">This action cannot be undone.</p>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} autoFocus>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
