
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { AnalyticsData } from '../types';
import { AnalyticsIcon } from './icons';

interface AnalyticsDashboardProps {
  data: AnalyticsData | null;
}

const COLORS = ['#0ea5e9', '#6366f1', '#ec4899', '#f97316'];

// Custom shape for the active sector in a PieChart (not currently used but kept for reference).
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill} className="text-lg font-bold">
        {payload.name}
      </text>
       <text x={cx} y={cy} dy={12} textAnchor="middle" fill="#94a3b8" className="text-sm">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};

/**
 * A component that visualizes the analytics data using charts and lists.
 */
const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  // Display a placeholder if data is not yet available.
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <AnalyticsIcon />
        <p className="mt-4 text-center">Analytics data is being processed or is unavailable.</p>
      </div>
    );
  }

  // --- Data Transformation for Charting ---

  // Prepare observation data for the BarChart, ensuring values are numbers.
  const observationData = data.keyObservations?.map(obs => ({
      name: obs.name,
      value: typeof obs.value === 'string' ? parseFloat(obs.value) : obs.value,
      unit: obs.unit
  })).filter(obs => !isNaN(obs.value));

  // Extract demographic information for display.
  const demographics = [
      { name: 'Gender', value: data.patientInfo?.gender || 'N/A' },
      { name: 'Age', value: data.patientInfo?.age || 'N/A' },
      { name: 'Marital Status', value: data.patientInfo?.maritalStatus || 'N/A' },
  ];

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2">
      <h3 className="text-xl font-semibold text-slate-200">Patient Analytics</h3>
      
      {/* Demographics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {demographics.map((item, index) => (
          <div key={index} className="bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm text-slate-400">{item.name}</p>
            <p className="text-lg font-semibold">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Key Observations Bar Chart */}
      {observationData && observationData.length > 0 && (
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <h4 className="text-md font-semibold mb-4">Key Observations</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={observationData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#cbd5e1' }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8' }} />
              <Bar dataKey="value" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Conditions and Medications Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.conditions && data.conditions.length > 0 && (
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <h4 className="text-md font-semibold mb-2">Conditions</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              {data.conditions.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}
        {data.medications && data.medications.length > 0 && (
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <h4 className="text-md font-semibold mb-2">Medications</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              {data.medications.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
