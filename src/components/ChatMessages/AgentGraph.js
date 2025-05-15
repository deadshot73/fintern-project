import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function AgentGraph({ chartData }) {
  if (!chartData || !chartData.data) {
    return <div className="text-muted p-3">No chart data available</div>;
  }

  return (
    <div className="p-2 me-auto bg-white border rounded">
      <h5 className="text-center">{chartData.title}</h5>
      <LineChart width={500} height={300} data={chartData.data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" label={{ value: chartData.x_axis_label, position: 'insideBottom', offset: -5 }} />
        <YAxis label={{ value: chartData.y_axis_label, angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" name={chartData.y_axis_label} stroke="#8884d8" />
      </LineChart>
    </div>
  );
}
