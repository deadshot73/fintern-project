export default function UserMessage({ text }) {
    return (
      <div className="bg-primary text-white p-2 rounded text-end ms-auto" style={{ maxWidth: '75%' }}>
        {text}
      </div>
    );
  }
  