export default function AgentTable({ data }) {
    return (
      <div className="me-auto" style={{ maxWidth: '90%' }}>
        <table className="table table-bordered table-sm">
          <thead>
            <tr>
              {Object.keys(data[0] || {}).map((key, idx) => (
                <th key={idx}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {Object.values(row).map((val, i) => (
                  <td key={i}>{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  