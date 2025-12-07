import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function AgentGraph({ chartData }) {
  console.log('📈 AgentGraph received chartData:', chartData);
  
  if (!chartData || !chartData.data) {
    console.log('❌ AgentGraph: No chart data available');
    return <div className="text-muted p-3">No chart data available</div>;
  }

  if (!Array.isArray(chartData.data) || chartData.data.length === 0) {
    console.log('❌ AgentGraph: Empty or invalid data array');
    return <div className="text-muted p-3">No data points available for the chart</div>;
  }

  // Get all data keys except 'name' (which is used for x-axis)
  const dataKeys = Object.keys(chartData.data[0]).filter(key => key !== 'name');
  console.log('📈 Data keys found:', dataKeys);

  // Define colors for different lines
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  return (
    <div className="p-2 me-auto bg-white border rounded">
      <h5 className="text-center">{chartData.title}</h5>
      <LineChart width={500} height={300} data={chartData.data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" label={{ value: chartData.x_axis_label, position: 'insideBottom', offset: -5 }} />
        <YAxis label={{ value: chartData.y_axis_label, angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        {dataKeys.map((key, index) => (
          <Line 
            key={key}
            type="monotone" 
            dataKey={key} 
            name={key}
            stroke={colors[index % colors.length]} 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </div>
  );
}
