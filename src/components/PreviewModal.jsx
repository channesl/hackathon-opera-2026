import { useRef } from 'react';

export default function PreviewModal({ text, onClose, from, to }) {
  const textareaRef = useRef(null);

  const handleSave = () => {
    const content = textareaRef.current?.value ?? text;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-${from.replace(/\s+/g, '-')}-to-${to.replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handlePrint = () => {
    const content = textareaRef.current?.value ?? text;
    const win = window.open('', '_blank', 'width=600,height=700');
    win.document.write(`<!DOCTYPE html><html><head><title>Route Instructions</title>
      <style>body{font-family:monospace;font-size:14px;line-height:1.7;padding:32px;color:#111}
      pre{white-space:pre-wrap}</style></head>
      <body><pre>${content.replace(/</g, '&lt;')}</pre></body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="preview-backdrop" onClick={handleBackdropClick}>
      <div className="preview-modal">
        <div className="preview-modal-header">
          <h2>📄 Route Instructions Preview</h2>
          <button className="preview-close" onClick={onClose}>✕</button>
        </div>
        <div className="preview-body">
          <textarea
            ref={textareaRef}
            className="preview-text"
            defaultValue={text}
            spellCheck={false}
          />
        </div>
        <div className="preview-modal-footer">
          <button className="btn-preview-print" onClick={handlePrint}>🖨 Print</button>
          <button className="btn-preview-save" onClick={handleSave}>⬇ Save .txt</button>
        </div>
      </div>
    </div>
  );
}
