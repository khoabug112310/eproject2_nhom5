// Frontend - Common UI Components
// Button, Modal, Table, Form, etc.

export const Button = ({ children, onClick, type = 'button', ...props }) => (
  <button type={type} onClick={onClick} {...props}>
    {children}
  </button>
);

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export const Table = ({ columns, data, onRowClick }) => (
  <table>
    <thead>
      <tr>
        {columns.map((col) => (
          <th key={col}>{col}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {data.map((row, idx) => (
        <tr key={idx} onClick={() => onRowClick?.(row)}>
          {columns.map((col) => (
            <td key={col}>{row[col]}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);
