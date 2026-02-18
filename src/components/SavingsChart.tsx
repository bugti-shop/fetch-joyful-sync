import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SavingsChartProps {
  data: Array<{ name: string; saved: number; withdrawn: number }>;
  darkMode: boolean;
}

const SavingsChart = ({ data, darkMode }: SavingsChartProps) => {
  const textColor = darkMode ? '#e5e7eb' : '#1f2937';
  const gridColor = darkMode ? '#374151' : '#e5e7eb';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Savings Trend
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" stroke={textColor} fontSize={12} />
            <YAxis stroke={textColor} fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${gridColor}`,
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="saved" 
              stroke="#4cb673" 
              strokeWidth={3}
              dot={{ fill: '#4cb673', r: 5 }}
              activeDot={{ r: 7 }}
              name="Saved"
            />
            <Line 
              type="monotone" 
              dataKey="withdrawn" 
              stroke="#ef4444" 
              strokeWidth={3}
              dot={{ fill: '#ef4444', r: 5 }}
              activeDot={{ r: 7 }}
              name="Withdrawn"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Jar Comparison
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" stroke={textColor} fontSize={12} />
            <YAxis stroke={textColor} fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${gridColor}`,
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="saved" fill="#4cb673" radius={[8, 8, 0, 0]} name="Saved" />
            <Bar dataKey="withdrawn" fill="#ef4444" radius={[8, 8, 0, 0]} name="Withdrawn" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SavingsChart;
