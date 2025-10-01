import React from 'react';
interface StatisticsCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  bgColor: string;
}
const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  change,
  isPositive,
  icon,
  bgColor
}) => {
  return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-semibold text-gray-800">{value}</h3>
        </div>
        <div className={`p-2 rounded-full ${bgColor}`}>{icon}</div>
      </div>
      <div className="mt-3">
        <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
        <span className="text-xs text-gray-500 ml-1">vs last week</span>
      </div>
    </div>;
};
export default StatisticsCard;