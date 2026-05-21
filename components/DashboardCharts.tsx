"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

export function FranchiseEarningsChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground flex items-center justify-center h-[300px]">No earnings data available.</div>;
  }

  const chartData = data.slice(0, 5); // top 5

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis dataKey="name" stroke="#888" tick={{fill: '#888', fontSize: 12}} />
          <YAxis stroke="#888" tick={{fill: '#888', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
          <Tooltip 
            cursor={{fill: '#222'}}
            contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
            formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, 'Earnings']}
          />
          <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.earnings >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PhaseDistributionChart({ data }: { data: {name: string, value: number, color: string}[] }) {
  if (!data || data.reduce((a, b) => a + b.value, 0) === 0) {
    return <div className="text-sm text-muted-foreground flex items-center justify-center h-[200px]">No phase data available.</div>;
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
